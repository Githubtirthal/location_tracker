from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .serializers import SignupSerializer, RoomSerializer, MembershipSerializer
from .models import Room, Membership
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
    return Response({"ok": True, "room": RoomSerializer(room).data})
