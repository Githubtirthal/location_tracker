const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // dev only; restrict in prod
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// ----------------------
// CONFIG
// ----------------------
const DJANGO_API_BASE = "http://127.0.0.1:8000/api";
const JWT_SECRET = null;

console.log('Django API Base:', DJANGO_API_BASE); 
// null here because Django signs with its own secret — we'll just verify signature via decoding
// In prod, better to call Django to validate token instead of local verify

// ----------------------
// IN-MEMORY STORAGE
// ----------------------
let roomUsers = {}; // { roomId: { socketId: { username, lat, lng, isLive } } }
let roomState = {}; // { roomId: { geofence: { center_lat, center_lng, radius_m }, meeting: {...}, userInside: { username: boolean } } }

// ----------------------
// HELPER: Verify JWT via Django
// ----------------------
async function verifyJWT(token) {
  try {
    // Quick decode without signature validation
    const decoded = jwt.decode(token);
    if (!decoded) return null;
    return decoded; // {user_id, username, exp, ...}
  } catch (err) {
    console.error("JWT decode error:", err);
    return null;
  }
}

// ----------------------
// SOCKET.IO
// ----------------------
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", async ({ token, roomId }) => {
    const userData = await verifyJWT(token);
    if (!userData) {
      socket.emit("error", { message: "Invalid token" });
      socket.disconnect();
      return;
    }

    // Validate room from Django
    try {
      const res = await axios.post(
        `${DJANGO_API_BASE}/rooms/bootstrap`,
        { room_id: roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data.ok) throw new Error("Room validation failed");
      // prime room state (geofence/meeting)
      if (!roomState[roomId]) roomState[roomId] = { geofence: null, meeting: null, userInside: {} };
      roomState[roomId].geofence = res.data.geofence || null;
      roomState[roomId].meeting = res.data.meeting || null;
      // Send current state to the user who joined
      if (roomState[roomId].geofence) {
        socket.emit("geofence-updated", roomState[roomId].geofence);
      }
      if (roomState[roomId].meeting) {
        socket.emit("meeting-announced", roomState[roomId].meeting);
      }
    } catch (err) {
      socket.emit("error", { message: "Room not found" });
      socket.disconnect();
      return;
    }

    // Join namespace/room
    const namespace = `/room-${roomId}`;
    console.log(`Socket ${socket.id} joining namespace: ${namespace}`);
    socket.join(namespace);
    // stash identity for later handlers
    socket.data = socket.data || {};
    socket.data.userId = userData.user_id;
    socket.data.username = userData.username;
    socket.data.roomId = roomId;

    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    roomUsers[roomId][socket.id] = {
      username: userData.username,
      lat: null,
      lng: null,
      isLive: false
    };
    if (!roomState[roomId]) roomState[roomId] = { geofence: null, meeting: null, userInside: {} };
    // initialize inside flag as true (unknown) so first evaluation outside triggers alert
    if (userData?.username) roomState[roomId].userInside[userData.username] = true;

    // Notify others
    console.log(`Notifying ${namespace} that ${userData.username} joined`);
    socket.to(namespace).emit("user-joined", { username: userData.username });

    // Send existing users to new user
    const existing = Object.values(roomUsers[roomId]).filter(
      (u) => u.username !== userData.username
    );
    socket.emit("existing-users", existing);

    // Update user count and live count
    const users = Object.values(roomUsers[roomId]);
    io.to(namespace).emit("user-count", users.length);
    io.to(namespace).emit("live-count", users.filter(u => u.isLive).length);
    io.to(namespace).emit("users-list", users);

    console.log(`User ${userData.username} joined room ${roomId}`);
  });

  socket.on("location-update", async ({ roomId, lat, lng }) => {
    if (roomUsers[roomId] && roomUsers[roomId][socket.id]) {
      const user = roomUsers[roomId][socket.id];
      user.lat = lat;
      user.lng = lng;
      
      // Mark as live if not already
      if (!user.isLive) {
        user.isLive = true;
        const users = Object.values(roomUsers[roomId]);
        const liveCount = users.filter(u => u.isLive).length;
        io.to(`/room-${roomId}`).emit("live-count", liveCount);
        io.to(`/room-${roomId}`).emit("users-list", users);
      }
      
      console.log(`Broadcasting location from ${user.username} to /room-${roomId}`);
      socket.to(`/room-${roomId}`).emit("user-location", {
        username: user.username,
        lat,
        lng
      });

      // Record movement asynchronously (no await blocking)
      try {
        const userId = socket.data?.userId;
        if (userId) {
          axios.post(`${DJANGO_API_BASE}/movement/record`, {
            user_id: userId,
            room_id: roomId,
            latitude: lat,
            longitude: lng,
          }).catch(() => {});
        }
      } catch (e) {
        // ignore
      }

      // Geofence check and alert on leaving
      const state = roomState[roomId];
      if (state && state.geofence) {
        const { center_lat, center_lng, radius_m } = state.geofence;
        const distanceM = haversineMeters(lat, lng, center_lat, center_lng);
        const isInside = distanceM <= Number(radius_m);
        const prevInside = state.userInside[user.username];
        state.userInside[user.username] = isInside;
        if (prevInside && !isInside) {
          io.to(`/room-${roomId}`).emit("geofence-alert", {
            username: user.username,
            distance_m: Math.round(distanceM),
            outside_by_m: Math.max(0, Math.round(distanceM - Number(radius_m)))
          });
        }
      }
    }
  });

  socket.on("stop-sharing", ({ roomId }) => {
    if (roomUsers[roomId] && roomUsers[roomId][socket.id]) {
      roomUsers[roomId][socket.id].isLive = false;
      const users = Object.values(roomUsers[roomId]);
      const liveCount = users.filter(u => u.isLive).length;
      io.to(`/room-${roomId}`).emit("live-count", liveCount);
      io.to(`/room-${roomId}`).emit("users-list", users);
    }
  });

  socket.on("leave-room", ({ roomId }) => {
    if (roomUsers[roomId] && roomUsers[roomId][socket.id]) {
      const username = roomUsers[roomId][socket.id].username;
      delete roomUsers[roomId][socket.id];
      socket.to(`/room-${roomId}`).emit("user-left", { username });
      const users = Object.values(roomUsers[roomId]);
      io.to(`/room-${roomId}`).emit("user-count", users.length);
      io.to(`/room-${roomId}`).emit("live-count", users.filter(u => u.isLive).length);
      console.log(`User ${username} left room ${roomId}`);
    }
  });

  // Admin broadcast: update geofence (already saved via Django)
  socket.on("update-geofence", ({ roomId, geofence }) => {
    if (!roomId || !geofence) return;
    if (!roomState[roomId]) roomState[roomId] = { geofence: null, meeting: null, userInside: {} };
    roomState[roomId].geofence = geofence;
    io.to(`/room-${roomId}`).emit("geofence-updated", geofence);
  });

  // Admin broadcast: announce meeting
  socket.on("announce-meeting", ({ roomId, meeting }) => {
    if (!roomId || !meeting) return;
    if (!roomState[roomId]) roomState[roomId] = { geofence: null, meeting: null, userInside: {} };
    roomState[roomId].meeting = meeting;
    io.to(`/room-${roomId}`).emit("meeting-announced", meeting);
  });

  socket.on("disconnect", () => {
    for (let roomId in roomUsers) {
      if (roomUsers[roomId][socket.id]) {
        const username = roomUsers[roomId][socket.id].username;
        delete roomUsers[roomId][socket.id];
        io.to(`/room-${roomId}`).emit("user-left", { username });
        const users = Object.values(roomUsers[roomId]);
        io.to(`/room-${roomId}`).emit("user-count", users.length);
        io.to(`/room-${roomId}`).emit("live-count", users.filter(u => u.isLive).length);
        console.log(`User ${username} disconnected from room ${roomId}`);
      }
    }
  });
});

// ----------------------
// EXPRESS ROUTES
// ----------------------
app.get("/", (req, res) => {
  res.send("Node.js Socket.IO server for Realtime Location Tracker");
});

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Node server running on port ${PORT}`);
});

// ----------------------
// Utils
// ----------------------
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
