from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware
from .serializers import SignupSerializer, RoomSerializer, MembershipSerializer, GeoFenceSerializer, MeetingPointSerializer
from .models import Room, Membership, GeoFence, MeetingPoint, Movement
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Custom token view: attaches user info to response
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # add custom claims if needed
        token["username"] = user.username
        return token

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Add username to response
            username = request.data.get('username')
            response.data['username'] = username
        return response

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({"detail":"User created"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Create room
@api_view(["POST"])
def create_room(request):
    name = request.data.get("name")
    if not name:
        return Response({"error":"name is required"}, status=status.HTTP_400_BAD_REQUEST)
    room = Room.objects.create(name=name, creator=request.user)
    # auto-join creator
    Membership.objects.create(user=request.user, room=room)
    return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

# Join room by id
@api_view(["POST"])
def join_room(request):
    room_id = request.data.get("room_id")
    if not room_id:
        return Response({"error":"room_id required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room not found"}, status=status.HTTP_404_NOT_FOUND)
    membership, created = Membership.objects.get_or_create(user=request.user, room=room)
    return Response({"joined": created, "room": RoomSerializer(room).data})

# List user's rooms
@api_view(["POST"])
def list_rooms(request):
    memberships = Membership.objects.filter(user=request.user).select_related("room")
    rooms = [RoomSerializer(m.room).data for m in memberships]
    return Response({"rooms": rooms})

# Bootstrap endpoint (simple)
@api_view(["POST"])
def bootstrap_room(request):
    """
    Example endpoint used by Node server to validate or initialize namespace.
    This can return room meta or simple ok.
    """
    room_id = request.data.get("room_id")
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room not found"}, status=404)
    data = {"ok": True, "room": RoomSerializer(room).data}
    # include geofence and latest active meeting if present
    fence = getattr(room, "geofence", None)
    if fence:
        data["geofence"] = GeoFenceSerializer(fence).data
    meeting = room.meetings.filter(active=True).first()
    if meeting:
        data["meeting"] = MeetingPointSerializer(meeting).data
    return Response(data)


# ------------------------------
# Geofence Endpoints (Admin only)
# ------------------------------
@api_view(["POST"])
def set_geofence(request):
    room_id = request.data.get("room_id")
    center_lat = request.data.get("center_lat")
    center_lng = request.data.get("center_lng")
    radius_m = request.data.get("radius_m")

    if not all([room_id, center_lat, center_lng, radius_m]):
        return Response({"error": "room_id, center_lat, center_lng, radius_m required"}, status=400)
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room not found"}, status=404)
    # only creator can set
    if request.user != room.creator:
        return Response({"error":"forbidden"}, status=403)

    fence, _ = GeoFence.objects.update_or_create(
        room=room,
        defaults={
            "center_lat": float(center_lat),
            "center_lng": float(center_lng),
            "radius_m": int(radius_m),
            "created_by": request.user,
        },
    )
    return Response(GeoFenceSerializer(fence).data)


@api_view(["POST"])
def get_geofence(request):
    room_id = request.data.get("room_id")
    if not room_id:
        return Response({"error": "room_id required"}, status=400)
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room not found"}, status=404)
    fence = getattr(room, "geofence", None)
    if not fence:
        return Response({"geofence": None})
    return Response({"geofence": GeoFenceSerializer(fence).data})


# ------------------------------------
# Meeting Point Endpoints (Admin only)
# ------------------------------------
@api_view(["POST"])
def set_meeting_point(request):
    room_id = request.data.get("room_id")
    place_name = request.data.get("place_name")
    lat = request.data.get("lat")
    lng = request.data.get("lng")
    reach_by_raw = request.data.get("reach_by")  # ISO

    if not all([room_id, place_name, lat, lng, reach_by_raw]):
        return Response({"error":"room_id, place_name, lat, lng, reach_by required"}, status=400)
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room not found"}, status=404)
    if request.user != room.creator:
        return Response({"error":"forbidden"}, status=403)

    dt = parse_datetime(reach_by_raw)
    if dt is None:
        return Response({"error":"invalid reach_by datetime"}, status=400)
    if dt.tzinfo is None:
        dt = make_aware(dt)

    # deactivate previous active
    room.meetings.filter(active=True).update(active=False)
    meeting = MeetingPoint.objects.create(
        room=room,
        place_name=place_name,
        lat=float(lat),
        lng=float(lng),
        reach_by=dt,
        created_by=request.user,
        active=True,
    )
    return Response(MeetingPointSerializer(meeting).data, status=201)


@api_view(["POST"])
def get_meeting_point(request):
    room_id = request.data.get("room_id")
    if not room_id:
        return Response({"error":"room_id required"}, status=400)
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response({"error":"room not found"}, status=404)
    meeting = room.meetings.filter(active=True).first()
    if not meeting:
        return Response({"meeting": None})
    return Response({"meeting": MeetingPointSerializer(meeting).data})


# ------------------------------------
# Movement logging (called by Node)
# ------------------------------------
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def record_movement(request):
    """
    Called by Node socket server on each location-update.
    Expects: user_id, room_id, latitude, longitude
    """
    user_id = request.data.get("user_id")
    room_id = request.data.get("room_id")
    latitude = request.data.get("latitude")
    longitude = request.data.get("longitude")
    if not all([user_id, room_id, latitude, longitude]):
        return Response({"error":"user_id, room_id, latitude, longitude required"}, status=400)
    try:
        user = User.objects.get(id=user_id)
        room = Room.objects.get(id=room_id)
    except (User.DoesNotExist, Room.DoesNotExist):
        return Response({"error":"user or room not found"}, status=404)
    Movement.objects.create(
        user=user,
        room=room,
        latitude=float(latitude),
        longitude=float(longitude),
    )
    return Response({"ok": True})
