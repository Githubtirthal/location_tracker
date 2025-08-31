from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re
from .models import Room, Membership, Movement, GeoFence, MeetingPoint

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "confirm_password", "first_name")

    def validate_email(self, value):
        """Validate email format and uniqueness"""
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Please enter a valid email address.")
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        
        return value

    def validate_username(self, value):
        """Validate username format and uniqueness"""
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores.")
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        
        return value

    def validate_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        
        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        
        return value

    def validate(self, data):
        """Validate that passwords match"""
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        user = User(
            username=validated_data["username"], 
            email=validated_data["email"]
        )
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


class MovementSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    room = RoomSerializer(read_only=True)

    class Meta:
        model = Movement
        fields = ("id", "user", "room", "latitude", "longitude", "created_at")


class GeoFenceSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = GeoFence
        fields = ("room", "center_lat", "center_lng", "radius_m", "created_by", "created_at")


class MeetingPointSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = MeetingPoint
        fields = ("id", "room", "place_name", "lat", "lng", "reach_by", "created_by", "active", "created_at")
