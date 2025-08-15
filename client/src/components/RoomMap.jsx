import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import { NODE_WS } from "../api";
import { useAuth } from "../AuthContext";

// Simple color palette for users (self red)
const OTHER_COLORS = ["#2b8a3e", "#1c7ed6", "#5f3dc4", "#e67700", "#0b7285", "#862e9c"]; // green, blue, violet, orange, teal, purple

export default function RoomMap() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  const markersRef = useRef(new Map()); // username -> marker
  const colorRef = useRef(new Map());   // username -> color
  const [userCount, setUserCount] = useState(1);
  const [liveCount, setLiveCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Init Leaflet map full-screen
    if (!mapRef.current) {
      const map = L.map("map", { zoomControl: true, attributionControl: true });
      mapRef.current = map;
      map.setView([23.0225, 72.5714], 13); // default Ahmedabad
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
    }

    // Connect Socket.IO and join the room
    const socket = io(NODE_WS, { 
      transports: ["websocket"],
      forceNew: true
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { token, roomId: Number(roomId) });
    });

    socket.on("error", (e) => {
      alert(e?.message || "Socket error");
      navigate("/dashboard");
    });

    socket.on("existing-users", (arr) => {
      // Assign colors to existing users (if any)
      arr.forEach((u, idx) => {
        if (!colorRef.current.has(u.username)) {
          colorRef.current.set(u.username, OTHER_COLORS[idx % OTHER_COLORS.length]);
        }
      });
      setUsers(arr);
    });

    socket.on("user-joined", ({ username }) => {
      if (!colorRef.current.has(username)) {
        const idx = colorRef.current.size % OTHER_COLORS.length;
        colorRef.current.set(username, OTHER_COLORS[idx]);
      }
    });

    socket.on("user-location", ({ username, lat, lng }) => {
      upsertMarker(username, lat, lng, false);
    });

    socket.on("user-left", ({ username }) => {
      const marker = markersRef.current.get(username);
      if (marker) {
        marker.remove();
        markersRef.current.delete(username);
      }
    });

    socket.on("user-count", (count) => setUserCount(count));

    socket.on("live-count", (count) => setLiveCount(count));

    socket.on("users-list", (usersList) => setUsers(usersList));

    // Start location sharing if enabled
    if (isSharing && navigator.geolocation) {
      startLocationSharing();
    }

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId: Number(roomId) });
        socketRef.current.disconnect();
      }
      // Keep map instance (route unmount destroys element)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token, isSharing]);

  function startLocationSharing() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        upsertMarker("_me", latitude, longitude, true);
        console.log("Sending location update:", latitude, longitude);
        socketRef.current?.emit("location-update", { roomId: Number(roomId), lat: latitude, lng: longitude });
      },
      (err) => {
        console.warn("Geolocation error", err);
        if (err.code === 3) {
          console.log("Timeout - continuing to try...");
          // Don't disable sharing on timeout, just log it
        } else {
          setIsSharing(false);
        }
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 60000 }
    );
  }

  function toggleLocationSharing() {
    if (isSharing) {
      // Stop sharing
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Remove own marker
      const marker = markersRef.current.get("_me");
      if (marker) {
        marker.remove();
        markersRef.current.delete("_me");
      }
      socketRef.current?.emit("stop-sharing", { roomId: Number(roomId) });
      setIsSharing(false);
    } else {
      // Start sharing
      setIsSharing(true);
      startLocationSharing();
    }
  }

  function upsertMarker(username, lat, lng, isSelf) {
    const map = mapRef.current;
    if (!map) return;

    // Color selection
    let color = isSelf ? "#d00000" : colorRef.current.get(username);
    if (!color && !isSelf) {
      const idx = colorRef.current.size % OTHER_COLORS.length;
      color = OTHER_COLORS[idx];
      colorRef.current.set(username, color);
    }

    let marker = markersRef.current.get(username);
    if (!marker) {
      marker = L.circleMarker([lat, lng], { radius: 8, color, weight: 2, fillOpacity: 0.8 });
      marker.addTo(map).bindPopup(isSelf ? "You" : username);
      markersRef.current.set(username, marker);
    } else {
      marker.setLatLng([lat, lng]);
    }

    if (isSelf) {
      map.setView([lat, lng], Math.max(map.getZoom(), 13), { animate: true });
    }
  }

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", padding: "8px 12px", borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
        <strong>Room {roomId}</strong><br/>
        Users: {userCount} | Live: {liveCount}<br/>
        <button onClick={toggleLocationSharing} style={{ marginRight: 8, background: isSharing ? "#dc3545" : "#28a745", color: "white", border: "none", padding: "4px 8px", borderRadius: 4 }}>
          {isSharing ? "Stop Sharing" : "Share Location"}
        </button>
        <button onClick={() => navigate("/dashboard")}>Back</button>
      </div>
      
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, background: "rgba(255,255,255,0.9)", padding: "8px 12px", borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.15)", minWidth: 150 }}>
        <strong>Users ({userCount})</strong>
        <div style={{ marginTop: 8, fontSize: 14 }}>
          {users.map((user, idx) => (
            <div key={user.username} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: user.isLive ? "#28a745" : "#6c757d", marginRight: 6 }}></div>
              {user.username}
            </div>
          ))}
        </div>
      </div>
      
      <div id="map" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

