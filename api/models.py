from django.db import models
from django.contrib.auth.models import User

class Room(models.Model):
    id = models.AutoField(primary_key=True)  # room id used for joining
    name = models.CharField(max_length=150)
    creator = models.ForeignKey(User, related_name="created_rooms", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

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
