from django.contrib import admin
from django.urls import path, include
from api import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/signup", views.signup, name="signup"),
    path("api/login", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/rooms", views.create_room, name="create_room"),
    path("api/rooms/join", views.join_room, name="join_room"),
    path("api/rooms/list", views.list_rooms, name="list_rooms"),
    path("api/rooms/bootstrap", views.bootstrap_room, name="bootstrap_room"),
]
