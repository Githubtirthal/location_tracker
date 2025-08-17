import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import { NODE_WS } from "../api";
import { useAuth } from "../AuthContext";
import { motion, AnimatePresence } from "framer-motion";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ totalDistance: 0, avgSpeed: 25, lastUpdate: new Date() });
  const [pathModal, setPathModal] = useState({ show: false, targetLat: null, targetLng: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pathLayerRef = useRef(null);

  // Simulate real-time stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        totalDistance: prev.totalDistance + Math.random() * 0.1,
        avgSpeed: 20 + Math.random() * 15,
        lastUpdate: new Date()
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Init Leaflet map full-screen
    if (!mapRef.current) {
      const map = L.map("map", { zoomControl: true, attributionControl: true });
      mapRef.current = map;
      map.setView([23.0225, 72.5714], 13); // default Ahmedabad
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // Add double-click event listener
      map.on('dblclick', (e) => {
        // Clear old path first
        if (pathLayerRef.current) {
          map.removeLayer(pathLayerRef.current);
          pathLayerRef.current = null;
        }
        const { lat, lng } = e.latlng;
        setPathModal({ show: true, targetLat: lat, targetLng: lng });
      });
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
        setCurrentLocation({ lat: latitude, lng: longitude });
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

  async function showDirectPathTo(targetLat, targetLng) {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Remove existing path
    if (pathLayerRef.current) {
      map.removeLayer(pathLayerRef.current);
    }

    if (!currentLocation) {
      // Just show destination and zoom to it
      L.marker([targetLat, targetLng])
        .addTo(map)
        .bindPopup('Destination')
        .openPopup();
      map.setView([targetLat, targetLng], 15);
      return;
    }

    const distance = calculateDistance(currentLocation.lat, currentLocation.lng, targetLat, targetLng);

    try {
      // Get shortest route from OSRM
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${currentLocation.lng},${currentLocation.lat};${targetLng},${targetLat}?overview=full&geometries=geojson&alternatives=true`);
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        // Use the first route (shortest by default)
        const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const routeDistance = (data.routes[0].distance / 1000).toFixed(1); // Convert to km
        const routeDuration = Math.round(data.routes[0].duration / 60); // Convert to minutes
        
        pathLayerRef.current = L.polyline(coords, {
          color: '#10b981',
          weight: 5,
          opacity: 0.8
        }).addTo(map);
        
        map.fitBounds(pathLayerRef.current.getBounds(), { padding: [20, 20] });
        
        // Add destination marker with route info
        L.marker([targetLat, targetLng])
          .addTo(map)
          .bindPopup(`Destination<br>${routeDistance} km • ${routeDuration} min`)
          .openPopup();
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      // Fallback to straight line
      const pathCoords = [[currentLocation.lat, currentLocation.lng], [targetLat, targetLng]];
      pathLayerRef.current = L.polyline(pathCoords, {
        color: '#ef4444',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 5'
      }).addTo(map);
      map.fitBounds(pathLayerRef.current.getBounds(), { padding: [20, 20] });
      
      L.marker([targetLat, targetLng])
        .addTo(map)
        .bindPopup(`Destination (${distance.toFixed(1)} km)`)
        .openPopup();
    }
  }

  async function showDirectPath() {
    await showDirectPathTo(pathModal.targetLat, pathModal.targetLng);
    setPathModal({ show: false, targetLat: null, targetLng: null });
  }

  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async function searchAndNavigate() {
    if (!searchQuery.trim()) return;
    
    // Clear old path first
    if (pathLayerRef.current) {
      mapRef.current.removeLayer(pathLayerRef.current);
      pathLayerRef.current = null;
    }
    
    try {
      // First search for places
      let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' ahmedabad gujarat india')}&limit=5`);
      let data = await response.json();
      
      // If no places found, search for roads
      if (!data || data.length === 0) {
        response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' road ahmedabad gujarat india')}&limit=5`);
        data = await response.json();
      }
      
      console.log('Search results:', data);
      
      if (data && data.length > 0) {
        let closestResult = data[0];
        let targetLat = parseFloat(closestResult.lat);
        let targetLng = parseFloat(closestResult.lon);
        
        // If we have current location and it's a road/way, find nearest point
        if (currentLocation && closestResult.osm_type === 'way') {
          try {
            // Get detailed geometry of the road
            const detailResponse = await fetch(`https://nominatim.openstreetmap.org/details?osmtype=W&osmid=${closestResult.osm_id}&format=json&polygon_geojson=1`);
            const detailData = await detailResponse.json();
            
            if (detailData.geometry && detailData.geometry.coordinates) {
              let minDistance = Infinity;
              let nearestPoint = null;
              
              // Find closest point on the road geometry
              detailData.geometry.coordinates.forEach(coord => {
                const distance = calculateDistance(currentLocation.lat, currentLocation.lng, coord[1], coord[0]);
                if (distance < minDistance) {
                  minDistance = distance;
                  nearestPoint = { lat: coord[1], lng: coord[0] };
                }
              });
              
              if (nearestPoint) {
                targetLat = nearestPoint.lat;
                targetLng = nearestPoint.lng;
              }
            }
          } catch (error) {
            console.log('Could not get road geometry, using center point');
          }
        }
        
        if (isNaN(targetLat) || isNaN(targetLng)) {
          alert('Invalid location data');
          return;
        }
        
        console.log('Navigating to nearest point:', targetLat, targetLng);
        
        // Show path directly without modal
        await showDirectPathTo(targetLat, targetLng);
        setSearchQuery('');
        console.log('Found location:', closestResult.display_name);
      } else {
        alert('No results found for "' + searchQuery + '"');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed: ' + error.message);
    }
  }

  return (
    <div className="relative w-full h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="absolute left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 border-r border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold">Room {roomId}</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sky-100 text-sm">Real-time location tracking</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 h-full overflow-y-auto pb-20">
              {/* Live Stats */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{userCount}</div>
                    <div className="text-xs text-slate-600">Total Users</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{liveCount}</div>
                    <div className="text-xs text-slate-600">Live Users</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 text-center">
                  Last update: {stats.lastUpdate.toLocaleTimeString()}
                </div>
              </div>

              {/* Location Sharing */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Location Sharing</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-600">Share my location</span>
                  <div className={`w-2 h-2 rounded-full ${isSharing ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                </div>
                <button
                  onClick={toggleLocationSharing}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    isSharing
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  }`}
                >
                  {isSharing ? "🛑 Stop Sharing" : "📍 Start Sharing"}
                </button>
              </div>

              {/* Team Members */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Team Members ({userCount})</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {users.map((user, index) => {
                    const color = colorRef.current.get(user.username) || OTHER_COLORS[index % OTHER_COLORS.length];
                    return (
                      <div key={user.username} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="relative">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                            style={{ backgroundColor: color }}
                          >
                            {user.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                            user.isLive ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{user.username}</div>
                          <div className="text-xs text-slate-500">
                            {user.isLive ? 'Online' : 'Offline'} • {Math.floor(Math.random() * 5) + 1}m ago
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          user.isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.isLive ? 'Live' : 'Away'}
                        </div>
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <div className="text-4xl mb-2">👥</div>
                      <p className="text-sm">No users in this room yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    🏠 Back to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Room link copied!');
                    }}
                    className="w-full py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    🔗 Copy Room Link
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div className={`transition-all duration-300 h-full ${
        sidebarOpen ? 'ml-80' : 'ml-0'
      }`}>
        <div id="map" className="w-full h-full" />
      </div>

      {/* Toggle Sidebar Button */}
      {!sidebarOpen && (
        <motion.button
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => setSidebarOpen(true)}
          className="absolute top-20 left-4 z-[1000] bg-white shadow-lg rounded-xl p-3 hover:shadow-xl transition-all duration-300 border border-slate-200 group"
        >
          <svg className="w-6 h-6 text-slate-600 group-hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>
      )}

      {/* Search Box */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1001] bg-white rounded-xl p-4 shadow-2xl border border-slate-200 min-w-80">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchAndNavigate()}
            placeholder="Search places to navigate... (e.g. narod for naroda)"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchAndNavigate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go
          </button>
        </div>
      </div>

      {/* Quick Stats Overlay */}
      <div className="absolute top-20 right-4 z-40 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-slate-600">Live</span>
          </div>
          <div className="text-slate-600">
            {liveCount}/{userCount} users online
          </div>
        </div>
      </div>

      {/* Path Options Modal */}
      {pathModal.show && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Path Options</h3>
            <p className="text-sm text-slate-600 mb-6">
              Choose how to navigate to the selected location:
            </p>
            <div className="space-y-3">
              <button
                onClick={showDirectPath}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                📍 Show Direct Path
              </button>
              <button
                onClick={() => setPathModal({ show: false, targetLat: null, targetLng: null })}
                className="w-full py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

