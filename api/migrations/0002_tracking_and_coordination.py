from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Movement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("latitude", models.FloatField()),
                ("longitude", models.FloatField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("room", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="movements", to="api.room")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="movements", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="GeoFence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("center_lat", models.FloatField()),
                ("center_lng", models.FloatField()),
                ("radius_m", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="geofences_created", to=settings.AUTH_USER_MODEL)),
                ("room", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="geofence", to="api.room")),
            ],
        ),
        migrations.CreateModel(
            name="MeetingPoint",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("place_name", models.CharField(max_length=255)),
                ("lat", models.FloatField()),
                ("lng", models.FloatField()),
                ("reach_by", models.DateTimeField()),
                ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="meetings_created", to=settings.AUTH_USER_MODEL)),
                ("room", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="meetings", to="api.room")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="movement",
            index=models.Index(fields=["room", "created_at"], name="api_movemen_room_id_6a6a2a_idx"),
        ),
        migrations.AddIndex(
            model_name="movement",
            index=models.Index(fields=["user", "created_at"], name="api_movemen_user_id_8a0bd4_idx"),
        ),
    ]


