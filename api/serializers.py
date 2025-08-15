from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Room, Membership

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ("username", "email", "password", "first_name")

    def create(self, validated_data):
        user = User(username=validated_data["username"], email=validated_data.get("email",""))
        user.first_name = validated_data.get("first_name", "")
        user.set_password(validated_data["password"])
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name")

class RoomSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    class Meta:
        model = Room
        fields = ("id", "name", "creator", "created_at")

class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    class Meta:
        model = Membership
        fields = ("id", "user", "room", "joined_at")
