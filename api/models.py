from django.db import models
from django.contrib.auth.models import User
import secrets
import string

class Room(models.Model):
    id = models.CharField(primary_key=True, max_length=8, editable=False)
    name = models.CharField(max_length=150)
    creator = models.ForeignKey(User, related_name="created_rooms", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id:
            characters = string.ascii_uppercase + string.digits
            while True:
                room_id = ''.join(secrets.choice(characters) for _ in range(8))
                if not Room.objects.filter(id=room_id).exists():
                    self.id = room_id
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.id})"

class Membership(models.Model):
    user = models.ForeignKey(User, related_name="memberships", on_delete=models.CASCADE)
    room = models.ForeignKey(Room, related_name="memberships", on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "room")

    def __str__(self):
        return f"{self.user.username} in {self.room.name}"


class Movement(models.Model):
    """
    Stores each user location update for analytics.
    """
    user = models.ForeignKey(User, related_name="movements", on_delete=models.CASCADE)
    room = models.ForeignKey(Room, related_name="movements", on_delete=models.CASCADE)
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["room", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} @ ({self.latitude:.5f},{self.longitude:.5f}) in {self.room_id}"


class GeoFence(models.Model):
    """
    Simple circular geofence per room, set by admin/creator.
    """
    room = models.OneToOneField(Room, related_name="geofence", on_delete=models.CASCADE)
    center_lat = models.FloatField()
    center_lng = models.FloatField()
    radius_m = models.PositiveIntegerField()
    created_by = models.ForeignKey(User, related_name="geofences_created", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Fence r{self.room_id} @ ({self.center_lat:.5f},{self.center_lng:.5f}) r={self.radius_m}m"


class MeetingPoint(models.Model):
    """
    A meeting point announcement for a room, with optional active flag.
    """
    room = models.ForeignKey(Room, related_name="meetings", on_delete=models.CASCADE)
    place_name = models.CharField(max_length=255)
    lat = models.FloatField()
    lng = models.FloatField()
    reach_by = models.DateTimeField()
    created_by = models.ForeignKey(User, related_name="meetings_created", on_delete=models.CASCADE)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Meeting at {self.place_name} (r{self.room_id}) by {self.created_by_id}"