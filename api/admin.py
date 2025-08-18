from django.contrib import admin
from .models import Room, Membership, Movement, GeoFence, MeetingPoint

admin.site.register(Room)
admin.site.register(Membership)
admin.site.register(Movement)
admin.site.register(GeoFence)
admin.site.register(MeetingPoint)
