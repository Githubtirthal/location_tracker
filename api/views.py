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
import math
from datetime import timedelta
from django.utils import timezone
import json
import requests
from django.conf import settings

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
        try:
            user = serializer.save()
            return Response({"detail": "User created successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": "Failed to create user. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Format validation errors for better user experience
    errors = {}
    for field, field_errors in serializer.errors.items():
        if isinstance(field_errors, list):
            errors[field] = field_errors[0] if field_errors else "This field is required."
        else:
            errors[field] = str(field_errors)
    
    return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def google_auth(request):
    """Handle Google OAuth authentication"""
    try:
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({"error": "Access token is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the token with Google
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if google_response.status_code != 200:
            return Response({"error": "Invalid Google access token"}, status=status.HTTP_400_BAD_REQUEST)
        
        google_user_data = google_response.json()
        email = google_user_data.get('email')
        google_id = google_user_data.get('id')
        name = google_user_data.get('name', '')
        given_name = google_user_data.get('given_name', '')
        family_name = google_user_data.get('family_name', '')
        
        if not email:
            return Response({"error": "Email not provided by Google"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=given_name or name,
                last_name=family_name,
                password=None  # No password for OAuth users
            )
        
        # Generate JWT token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        return Response({
            'access': str(access_token),
            'refresh': str(refresh),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'is_new_user': user.date_joined.date() == timezone.now().date()
        })
        
    except requests.RequestException:
        return Response({"error": "Failed to verify Google token"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({"error": "Authentication failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


# ------------------------------------
# Traffic prediction from Movement history
# ------------------------------------
def _haversine_meters(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _point_to_segment_distance_m(p_lat, p_lng, a_lat, a_lng, b_lat, b_lng):
    # Approximate: project to local meters using haversine for legs
    # Convert to a simple 2D plane by using meters relative to A
    ax = 0.0
    ay = 0.0
    bx = _haversine_meters(a_lat, a_lng, a_lat, b_lng) * (1 if b_lng > a_lng else -1)
    by = _haversine_meters(a_lat, a_lng, b_lat, a_lng) * (1 if b_lat > a_lat else -1)
    px = _haversine_meters(a_lat, a_lng, a_lat, p_lng) * (1 if p_lng > a_lng else -1)
    py = _haversine_meters(a_lat, a_lng, p_lat, a_lng) * (1 if p_lat > a_lat else -1)
    abx = bx - ax
    aby = by - ay
    apx = px - ax
    apy = py - ay
    ab_len2 = abx * abx + aby * aby
    if ab_len2 == 0:
        # A and B are the same point
        return math.hypot(apx, apy)
    t = max(0.0, min(1.0, (apx * abx + apy * aby) / ab_len2))
    cx = ax + t * abx
    cy = ay + t * aby
    return math.hypot(px - cx, py - cy)


@api_view(["POST"])
def predict_traffic(request):
    """
    Estimate traffic density along a path using historical Movement points.

    Request body:
    {
      "scope": "room" | "global" | "rooms" (default: "room"),
      "room_id": number (required if scope=="room"),
      "room_ids": [number, ...] (required if scope=="rooms"),
      "path": [{"lat": float, "lng": float}, ...],  # ordered polyline
      "radius_m": optional int (default 50),
      "window_minutes": optional int (default 60)
    }

    Returns per-node density and an overall index.
    """
    scope = (request.data.get("scope") or "room").lower()
    room_id = request.data.get("room_id")
    room_ids = request.data.get("room_ids") or []
    path = request.data.get("path") or []
    radius_m = int(request.data.get("radius_m") or 50)
    window_minutes = int(request.data.get("window_minutes") or 60)

    if not path or len(path) < 2:
        return Response({"error": "path (>=2 points) required"}, status=400)
    if scope == "room" and not room_id:
        return Response({"error": "room_id required for scope=room"}, status=400)
    if scope == "rooms" and (not isinstance(room_ids, list) or not room_ids):
        return Response({"error": "room_ids (list) required for scope=rooms"}, status=400)
    if scope == "room":
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"error": "room not found"}, status=404)

    window_end = timezone.now()
    window_start = window_end - timedelta(minutes=window_minutes)

    # Validate and normalize path points
    cleaned_path = []
    for idx, p in enumerate(path):
        try:
            lat = float(p.get("lat"))
            lng = float(p.get("lng"))
            if not (math.isfinite(lat) and math.isfinite(lng)):
                raise ValueError("non-finite")
            cleaned_path.append({"lat": lat, "lng": lng})
        except Exception:
            return Response({"error": f"invalid path point at index {idx}"}, status=400)

    # Optional: coerce room_ids to ints for safety
    if scope == "rooms":
        try:
            room_ids = [int(rid) for rid in room_ids]
        except Exception:
            return Response({"error": "room_ids must be integers"}, status=400)

    # Bounding box prefilter to limit scan area (approximate meters->degrees)
    lats = [p["lat"] for p in cleaned_path]
    lngs = [p["lng"] for p in cleaned_path]
    lat_min, lat_max = min(lats), max(lats)
    lng_min, lng_max = min(lngs), max(lngs)
    mean_lat = (lat_min + lat_max) / 2.0
    meters_per_deg_lat = 111000.0
    meters_per_deg_lng = max(1e-6, 111000.0 * max(0.1, math.cos(math.radians(mean_lat))))
    dlat = radius_m / meters_per_deg_lat
    dlng = radius_m / meters_per_deg_lng

    movements_qs = Movement.objects.filter(created_at__gte=window_start)
    # Scope filters
    if scope == "room":
        movements_qs = movements_qs.filter(room=room)
    elif scope == "rooms":
        movements_qs = movements_qs.filter(room_id__in=room_ids)
    # Spatial prefilter
    movements_qs = movements_qs.filter(
        latitude__gte=lat_min - dlat,
        latitude__lte=lat_max + dlat,
        longitude__gte=lng_min - dlng,
        longitude__lte=lng_max + dlng,
    ).only("latitude", "longitude", "created_at")

    # Precompute segments
    segments = []  # [(a_lat,a_lng,b_lat,b_lng)]
    for i in range(len(cleaned_path) - 1):
        a = cleaned_path[i]
        b = cleaned_path[i + 1]
        if a is None or b is None:
            continue
        segments.append((a["lat"], a["lng"], b["lat"], b["lng"]))

    # Initialize scores per node
    node_scores = [0.0 for _ in range(len(cleaned_path))]
    decay_half_life_min = max(10, window_minutes // 4)  # simple time decay
    decay_lambda = math.log(2) / decay_half_life_min

    total_considered = 0
    for m in movements_qs.iterator():
        total_considered += 1
        # recency weight (minutes ago)
        minutes_ago = max(0.0, (window_end - m.created_at).total_seconds() / 60.0)
        time_weight = math.exp(-decay_lambda * minutes_ago)

        # Distance to closest segment
        min_dist = float("inf")
        min_seg_index = -1
        for idx, (a_lat, a_lng, b_lat, b_lng) in enumerate(segments):
            d = _point_to_segment_distance_m(m.latitude, m.longitude, a_lat, a_lng, b_lat, b_lng)
            if d < min_dist:
                min_dist = d
                min_seg_index = idx

        if min_dist <= radius_m and min_seg_index >= 0:
            # Distribute score to the segment endpoints
            contribution = (1.0 - (min_dist / radius_m)) * time_weight
            node_scores[min_seg_index] += contribution
            node_scores[min_seg_index + 1] += contribution

    # Normalize to 0..100 scale for convenience
    max_score = max(node_scores) if node_scores else 0.0
    scale = 100.0 / max_score if max_score > 0 else 0.0
    node_indices = [round(s * scale, 2) for s in node_scores]
    overall_index = round(sum(node_indices) / len(node_indices), 2) if node_indices else 0.0

    return Response({
        "ok": True,
        "room_id": room_id,
        "window_minutes": window_minutes,
        "radius_m": radius_m,
        "counted_movements": total_considered,
        "overall_index": overall_index,
        "node_indices": node_indices,
    })
