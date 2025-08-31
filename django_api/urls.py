from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from api import views
from rest_framework_simplejwt.views import TokenRefreshView

def api_root(request):
    return JsonResponse({"message": "Location Tracker API is running"})

urlpatterns = [
    path("", api_root, name="root"),
    path("api/", api_root, name="api_root"),
    path("admin/", admin.site.urls),
    path("api/signup", views.signup, name="signup"),
    path("api/login", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/google-auth", views.google_auth, name="google_auth"),
    path("api/token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/rooms", views.create_room, name="create_room"),
    path("api/rooms/join", views.join_room, name="join_room"),
    path("api/rooms/list", views.list_rooms, name="list_rooms"),
    path("api/rooms/bootstrap", views.bootstrap_room, name="bootstrap_room"),
    # geofence
    path("api/geofence/set", views.set_geofence, name="set_geofence"),
    path("api/geofence/get", views.get_geofence, name="get_geofence"),
    # meeting point
    path("api/meeting/set", views.set_meeting_point, name="set_meeting_point"),
    path("api/meeting/get", views.get_meeting_point, name="get_meeting_point"),
    # movements
    path("api/movement/record", views.record_movement, name="record_movement"),
    # analytics
    path("api/traffic/predict", views.predict_traffic, name="predict_traffic"),
]
