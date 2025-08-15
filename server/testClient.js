const { io } = require("socket.io-client");
const token = "<JWT_ACCESS_TOKEN_FROM_DJANGO>";
const roomId = 1;

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server");
  socket.emit("join-room", { token, roomId });
  socket.emit("location-update", { roomId, lat: 23.03, lng: 72.58 });
});

socket.on("user-joined", (data) => console.log("User joined:", data));
socket.on("existing-users", (data) => console.log("Existing users:", data));
socket.on("user-location", (data) => console.log("User location:", data));
socket.on("user-left", (data) => console.log("User left:", data));
socket.on("user-count", (count) => console.log("User count:", count));
