import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import { NODE_WS, api } from "../api";
import { useAuth } from "../AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import SmartSearch from "./SmartSearch";

// Simple color palette for users (self red)
const OTHER_COLORS = ["#2b8a3e", "#1c7ed6", "#5f3dc4", "#e67700", "#0b7285", "#862e9c"]; // green, blue, violet, orange, teal, purple

export default function RoomMap() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  const markersRef = useRef(new Map()); // username -> marker
  const colorRef = useRef(new Map());   // username -> color
  const [userCount, setUserCount] = useState(1);
  const [liveCount, setLiveCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [users, setUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ totalDistance: 0, avgSpeed: 25, lastUpdate: new Date() });
  const [pathModal, setPathModal] = useState({ show: false, targetLat: null, targetLng: null });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [hospitalList, setHospitalList] = useState({ show: false, hospitals: [] });
  const pathLayerRef = useRef(null);
  const geofenceLayerRef = useRef(null);
  const meetingMarkerRef = useRef(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [geofence, setGeofence] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [meeting, setMeeting] = useState(null);

  const [gfRadius, setGfRadius] = useState(300);
  const [gfCenter, setGfCenter] = useState(null);

  const [meetingForm, setMeetingForm] = useState({ show: false, lat: null, lng: null, place_name: "", reach_by: "" });

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
      const map = L.map("map", { zoomControl: false, attributionControl: true });
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

      // No persistent click handler here; we attach a one-time handler when picking meeting
    }

    // Connect Socket.IO and join the room
    const socket = io(NODE_WS, { 
      transports: ["websocket"],
      forceNew: true
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { token, roomId: roomId });
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

    // Server state events
    socket.on("geofence-updated", (fence) => {
      setGeofence(fence || null);
      renderGeofence(fence || null);
    });

    socket.on("geofence-alert", (payload) => {
      const text = `${payload.username} left geofence by ${payload.outside_by_m} m`;
      setAlerts((prev) => [{ id: Date.now() + Math.random(), text }, ...prev].slice(0, 20));
    });

    socket.on("meeting-announced", (m) => {
      setMeeting(m || null);
      renderMeeting(m || null);
      if (m) {
        const text = `Meeting set at ${m.place_name} by ${m.created_by || 'Admin'} • reach by ${new Date(m.reach_by).toLocaleString()}`;
        setAlerts((prev) => [{ id: Date.now() + Math.random(), text }, ...prev].slice(0, 20));
      } else {
        const text = `Meeting point has been deleted`;
        setAlerts((prev) => [{ id: Date.now() + Math.random(), text }, ...prev].slice(0, 20));
      }
    });

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

  // Determine admin and initial state
  useEffect(() => {
    async function bootstrap() {
      if (!token) return;
      try {
        const data = await api.bootstrap(token, roomId);
        const creatorUsername = data?.room?.creator?.username;
        setIsAdmin(!!user?.username && creatorUsername === user.username);
        if (data?.geofence) {
          setGeofence(data.geofence);
          renderGeofence(data.geofence);
        }
        if (data?.meeting) {
          setMeeting(data.meeting);
          renderMeeting(data.meeting);
        }
      } catch (e) {
        // ignore
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token, user?.username]);

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
        socketRef.current?.emit("location-update", { roomId: roomId, lat: latitude, lng: longitude });
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

  function renderGeofence(fence) {
    const map = mapRef.current;
    if (!map) return;
    if (geofenceLayerRef.current) {
      map.removeLayer(geofenceLayerRef.current);
      geofenceLayerRef.current = null;
    }
    if (!fence) return;
    geofenceLayerRef.current = L.circle([fence.center_lat, fence.center_lng], {
      radius: Number(fence.radius_m),
      color: '#0ea5e9',
      fillColor: '#38bdf8',
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(map);
  }

  function renderMeeting(m) {
    const map = mapRef.current;
    if (!map) return;
    if (meetingMarkerRef.current) {
      map.removeLayer(meetingMarkerRef.current);
      meetingMarkerRef.current = null;
    }
    if (!m) return;
    meetingMarkerRef.current = L.marker([m.lat, m.lng]).addTo(map).bindPopup(`📍 ${m.place_name}`).openPopup();
  }

  async function saveGeofence() {
    try {
      const map = mapRef.current;
      const center = gfCenter || (map ? map.getCenter() : null);
      if (!center) return alert('Set center first');
      const payload = {
        room_id: roomId,
        center_lat: center.lat,
        center_lng: center.lng,
        radius_m: Number(gfRadius) || 200,
      };
      const fence = await api.setGeofence(token, payload);
      setGeofence(fence);
      renderGeofence(fence);
      socketRef.current?.emit('update-geofence', { roomId: roomId, geofence: fence });
      alert('Geofence updated');
    } catch (e) {
      alert('Failed to set geofence');
    }
  }

  function startPickMeeting() {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    const prevCursor = container.style.cursor;
    container.style.cursor = 'crosshair';
    map.once('click', (e) => {
      container.style.cursor = prevCursor || '';
      const { lat, lng } = e.latlng;
      setMeetingForm({ show: true, lat, lng, place_name: "", reach_by: "" });
    });
    alert('Click on the map to choose meeting point');
  }

  function startPickGeofenceCenter() {
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    const prevCursor = container.style.cursor;
    container.style.cursor = 'crosshair';
    map.once('click', (e) => {
      container.style.cursor = prevCursor || '';
      const { lat, lng } = e.latlng;
      setGfCenter({ lat, lng });
    });
    alert('Click on the map to set geofence center');
  }

  async function deleteMeeting() {
    try {
      await api.deleteMeeting(token, roomId);
      setMeeting(null);
      renderMeeting(null);
      socketRef.current?.emit('announce-meeting', { roomId: roomId, meeting: null });
      const text = `Meeting point deleted by ${user?.username}`;
      setAlerts((prev) => [{ id: Date.now() + Math.random(), text }, ...prev].slice(0, 20));
    } catch (e) {
      alert('Failed to delete meeting');
    }
  }

  async function submitMeeting() {
    try {
      const { lat, lng, place_name, reach_by } = meetingForm;
      if (!lat || !lng || !place_name || !reach_by) return;
      const meetingRes = await api.setMeeting(token, {
        room_id: roomId,
        place_name,
        lat,
        lng,
        reach_by: new Date(reach_by).toISOString(),
      });
      setMeeting(meetingRes);
      renderMeeting(meetingRes);
      socketRef.current?.emit('announce-meeting', { roomId: roomId, meeting: meetingRes });
      setMeetingForm({ show: false, lat: null, lng: null, place_name: "", reach_by: "" });
    } catch (e) {
      alert('Failed to set meeting');
    }
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
      socketRef.current?.emit("stop-sharing", { roomId: roomId });
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

  // Simple search - no suggestions, just direct search
  async function searchAndNavigate() {
    if (!searchQuery.trim()) return;
    
    // Clear old path first
    if (pathLayerRef.current) {
      mapRef.current.removeLayer(pathLayerRef.current);
      pathLayerRef.current = null;
    }
    
    try {
      // Search worldwide without location restrictions
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Take the first result (most relevant)
        const result = data[0];
        console.log('Found result:', result.display_name);
        
        // Navigate to the result
        await navigateToLocation(result);
        setSearchQuery('');
      } else {
        alert('No results found for "' + searchQuery + '"');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed: ' + error.message);
    }
  }

  function handleSearchInputChange(e) {
    const value = e.target.value;
    setSearchQuery(value);
    // No suggestions - just update the query
  }

  async function findNearestHospitals() {
    if (!currentLocation) {
      alert('Please enable location sharing first');
      return;
    }

    try {
      // Search for hospital amenities using Overpass API
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:5000,${currentLocation.lat},${currentLocation.lng});
          way["amenity"="hospital"](around:5000,${currentLocation.lat},${currentLocation.lng});
          relation["amenity"="hospital"](around:5000,${currentLocation.lat},${currentLocation.lng});
        );
        out center;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
      });
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        // Process all hospitals with distances
        const hospitals = data.elements.map(hospital => {
          const lat = hospital.lat || hospital.center?.lat;
          const lon = hospital.lon || hospital.center?.lon;
          if (lat && lon) {
            const distance = calculateDistance(currentLocation.lat, currentLocation.lng, lat, lon);
            return {
              ...hospital,
              lat,
              lon,
              distance,
              name: hospital.tags?.name || 'Unnamed Hospital'
            };
          }
          return null;
        }).filter(h => h !== null).sort((a, b) => a.distance - b.distance).slice(0, 10);
        
        setHospitalList({ show: true, hospitals });
      } else {
        alert('No hospitals found nearby');
      }
    } catch (error) {
      alert('Failed to find hospitals');
    }
  }

  async function navigateToHospital(hospital) {
    // Clear old path first
    if (pathLayerRef.current) {
      mapRef.current.removeLayer(pathLayerRef.current);
      pathLayerRef.current = null;
    }
    
    await showDirectPathTo(hospital.lat, hospital.lon);
    
    // Update marker popup to show it's a hospital
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && Math.abs(layer.getLatLng().lat - hospital.lat) < 0.001) {
        layer.bindPopup(`🏥 ${hospital.name} (${hospital.distance.toFixed(1)} km)`).openPopup();
      }
    });
    
    setHospitalList({ show: false, hospitals: [] });
  }

  async function navigateToLocation(result) {
    // Clear old path first
    if (pathLayerRef.current) {
      mapRef.current.removeLayer(pathLayerRef.current);
      pathLayerRef.current = null;
    }
    
    let targetLat = parseFloat(result.lat);
    let targetLng = parseFloat(result.lon);
    
    // If we have current location and it's a road/way, find nearest point
    if (currentLocation && result.osm_type === 'way') {
      try {
        // Get detailed geometry of the road
        const detailResponse = await fetch(`https://nominatim.openstreetmap.org/details?osmtype=W&osmid=${result.osm_id}&format=json&polygon_geojson=1`);
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
    
    console.log('Navigating to:', result.display_name);
    
    // Show path directly
    await showDirectPathTo(targetLat, targetLng);
    setSearchQuery('');
  }



  async function searchAndNavigate() {
    if (!searchQuery.trim()) return;
    
    // Clear old path first
    if (pathLayerRef.current) {
      mapRef.current.removeLayer(pathLayerRef.current);
      pathLayerRef.current = null;
    }
    
    try {
      // Search worldwide without location restrictions
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        // Take the first result (most relevant)
        const result = data[0];
        console.log('Found result:', result.display_name);
        
        // Navigate to the result
        await navigateToLocation(result);
        setShowSuggestions(false);
        setSearchSuggestions([]);
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
      {/* Left Menu Toggle */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-[1002] bg-white shadow-lg rounded-lg p-3 border border-slate-200"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Right Menu Toggle */}
      {!rightSidebarOpen && (
        <button
          onClick={() => setRightSidebarOpen(true)}
          className="fixed top-4 right-4 z-[1002] bg-white shadow-lg rounded-lg p-3 border border-slate-200"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-[1001] border-r border-slate-200 flex flex-col"
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
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
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

              {/* Alerts */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">Alerts</h3>
                  {alerts.length > 0 && (
                    <button
                      onClick={() => setAlerts([])}
                      className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {alerts.length === 0 ? (
                  <div className="text-sm text-slate-500">No alerts</div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {alerts.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-red-50 p-2 rounded text-sm">
                        <span className="text-red-600 flex-1">⚠️ {a.text}</span>
                        <button
                          onClick={() => setAlerts(prev => prev.filter(alert => alert.id !== a.id))}
                          className="text-red-400 hover:text-red-600 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                      navigator.clipboard.writeText(roomId);
                      alert('Room ID copied!');
                    }}
                    className="w-full py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    🔗 Copy Room ID
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Sidebar - Tools */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-[1001] border-l border-slate-200 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl font-bold">Tools</h1>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-red-100 text-sm">Emergency & Navigation Tools</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {isAdmin && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Geofence</h3>
                  <div className="space-y-3">
                    <button onClick={startPickGeofenceCenter} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                      📍 Pick Center on Map
                    </button>
                    {gfCenter && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                        Center: {gfCenter.lat.toFixed(4)}, {gfCenter.lng.toFixed(4)}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-slate-600 mb-1">Radius (km)</label>
                      <input type="number" step="0.1" placeholder="Radius in km" value={gfRadius / 1000} onChange={(e) => setGfRadius(parseFloat(e.target.value) * 1000 || 300)} className="border rounded px-2 py-2 text-sm w-full" />
                    </div>
                    <button onClick={saveGeofence} className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium">Save Geofence</button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Meeting Point</h3>
                <div className="space-y-3">
                  <button onClick={startPickMeeting} className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">📍 Pick Meeting Point</button>
                  {meeting && (
                    <div className="bg-emerald-50 p-3 rounded">
                      <div className="text-sm font-medium text-emerald-900">{meeting.place_name}</div>
                      <div className="text-xs text-emerald-700">Reach by: {new Date(meeting.reach_by).toLocaleString()}</div>
                      <button onClick={deleteMeeting} className="mt-2 text-xs text-red-600 hover:text-red-800">🗑️ Delete Meeting</button>
                    </div>
                  )}
                </div>
              </div>
              {/* Emergency Tools */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  Emergency Services
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={findNearestHospitals}
                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Find Nearest Hospitals
                  </button>
                </div>
                <div className="mt-3 text-xs text-red-600 text-center">
                  🚨 For life-threatening emergencies, call 108
                </div>
              </div>

              {/* Navigation Tools */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Navigation Tools</h3>
                {meeting ? (
                  <div className="space-y-2 text-sm text-slate-700">
                    <div>Meeting: <b>{meeting.place_name}</b></div>
                    <div>Reach by: {new Date(meeting.reach_by).toLocaleString()}</div>
                    {currentLocation && (
                      <button onClick={() => showDirectPathTo(meeting.lat, meeting.lng)} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Show ETA & Route</button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-600">No active meeting</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <div className="w-full h-full">
        <div id="map" className="w-full h-full" />
      </div>



             {/* Search Box - Google-like responsive */}
       <div className="absolute top-4 left-16 right-16 md:left-20 md:right-20 lg:left-1/4 lg:right-1/4 z-[1000]">
         <div className="relative">
           <div className="bg-white rounded-full shadow-lg border border-slate-200 flex items-center px-4 py-2">
             <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
             <input
               type="text"
               value={searchQuery}
               onChange={handleSearchInputChange}
               onKeyPress={(e) => e.key === 'Enter' && searchAndNavigate()}
               onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
               onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
               placeholder="Search places..."
               className="flex-1 outline-none text-sm bg-transparent"
             />
             {searchQuery && (
               <button
                 onClick={() => {
                   setSearchQuery('');
                   setSearchSuggestions([]);
                   setShowSuggestions(false);
                 }}
                 className="ml-2 p-1 hover:bg-slate-100 rounded-full"
               >
                 <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             )}
           </div>
           
           {/* Search Suggestions Dropdown */}
           {showSuggestions && searchSuggestions.length > 0 && (
             <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-[1001]">
               {searchSuggestions.map((suggestion, index) => (
                 <div
                   key={index}
                   onClick={() => selectSuggestion(suggestion)}
                   className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                 >
                   <div className="flex items-center">
                     <div className="text-slate-400 mr-3">
                       {suggestion.type === 'amenity' ? '🏢' : 
                        suggestion.type === 'place' ? '📍' : 
                        suggestion.type === 'highway' ? '🛣️' : '📍'}
                     </div>
                     <div className="flex-1">
                       <div className="font-medium text-slate-900">{suggestion.name}</div>
                       <div className="text-xs text-slate-500 truncate">{suggestion.display_name}</div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       </div>



      {/* Quick Stats Overlay */}
      <div className="absolute top-16 left-4 z-40 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/20">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-slate-600">Live</span>
          </div>
          <div className="text-slate-600">
            {liveCount}/{userCount} online
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="bg-white rounded-lg p-2 shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          title="Zoom in"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="bg-white rounded-lg p-2 shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          title="Zoom out"
        >
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
      </div>

      {/* Hospital List Modal */}
      {hospitalList.show && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">🏥 Nearby Hospitals</h3>
              <button
                onClick={() => setHospitalList({ show: false, hospitals: [] })}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-96">
              {hospitalList.hospitals.map((hospital, index) => (
                <div
                  key={hospital.id || index}
                  onClick={() => navigateToHospital(hospital)}
                  className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 mb-1">{hospital.name}</h4>
                      <p className="text-sm text-slate-600">
                        📍 {hospital.distance.toFixed(1)} km away
                      </p>
                      {hospital.tags?.phone && (
                        <p className="text-xs text-slate-500 mt-1">
                          📞 {hospital.tags.phone}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg">🏥</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {Math.round(hospital.distance * 60 / 40)} min
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {hospitalList.hospitals.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <div className="text-4xl mb-2">🏥</div>
                  <p>No hospitals found nearby</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



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

      {/* Meeting Form Modal */}
      {meetingForm.show && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Set Meeting Point</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Place name" value={meetingForm.place_name} onChange={(e) => setMeetingForm({ ...meetingForm, place_name: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              <input type="datetime-local" value={meetingForm.reach_by} onChange={(e) => setMeetingForm({ ...meetingForm, reach_by: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={submitMeeting} className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Save</button>
                <button onClick={() => setMeetingForm({ show: false, lat: null, lng: null, place_name: "", reach_by: "" })} className="flex-1 py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

