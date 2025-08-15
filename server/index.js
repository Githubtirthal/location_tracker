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
// null here because Django signs with its own secret — we'll just verify signature via decoding
// In prod, better to call Django to validate token instead of local verify

// ----------------------
// IN-MEMORY STORAGE
// ----------------------
let roomUsers = {}; // { roomId: { socketId: { username, lat, lng, isLive } } }

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
    } catch (err) {
      socket.emit("error", { message: "Room not found" });
      socket.disconnect();
      return;
    }

    // Join namespace/room
    const namespace = `/room-${roomId}`;
    console.log(`Socket ${socket.id} joining namespace: ${namespace}`);
    socket.join(namespace);

    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    roomUsers[roomId][socket.id] = {
      username: userData.username,
      lat: null,
      lng: null,
      isLive: false
    };

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

  socket.on("location-update", ({ roomId, lat, lng }) => {
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
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Node server running on http://localhost:${PORT}`);
});
