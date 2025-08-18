// Read from Vite env at build time; fallback to localhost for dev
const ENV_DJANGO = import.meta?.env?.VITE_DJANGO_BASE;
const ENV_WS = import.meta?.env?.VITE_NODE_WS;
export const DJANGO_BASE = ENV_DJANGO || (typeof window !== 'undefined' && window.__DJANGO_BASE__) || "http://127.0.0.1:8000/api";
export const NODE_WS = ENV_WS || (typeof window !== 'undefined' && window.__NODE_WS__) || "http://127.0.0.1:5000";

console.log('Environment:', process.env.NODE_ENV);
console.log('DJANGO_BASE:', DJANGO_BASE);
console.log('NODE_WS:', NODE_WS);

async function request(path, { method = "GET", body, token } = {}) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      // Sanitize token to prevent HTTP response splitting
      const sanitizedToken = token.replace(/[\r\n]/g, '');
      headers["Authorization"] = `Bearer ${sanitizedToken}`;
    }
    
    const res = await fetch(`${DJANGO_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error: Please check your connection');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Invalid response format from server');
    }
    throw error;
  }
}

export const api = {
  signup: (payload) => request("/signup", { method: "POST", body: payload }),
  login: (payload) => request("/login", { method: "POST", body: payload }),
  createRoom: (token, name) => request("/rooms", { method: "POST", body: { name }, token }),
  joinRoom: (token, room_id) => request("/rooms/join", { method: "POST", body: { room_id }, token }),
  listRooms: (token) => request("/rooms/list", { method: "POST", token }),
  bootstrap: (token, room_id) => request("/rooms/bootstrap", { method: "POST", body: { room_id }, token }),
  // Geofence
  setGeofence: (token, { room_id, center_lat, center_lng, radius_m }) =>
    request("/geofence/set", { method: "POST", token, body: { room_id, center_lat, center_lng, radius_m } }),
  getGeofence: (token, room_id) =>
    request("/geofence/get", { method: "POST", token, body: { room_id } }),
  // Meeting
  setMeeting: (token, { room_id, place_name, lat, lng, reach_by }) =>
    request("/meeting/set", { method: "POST", token, body: { room_id, place_name, lat, lng, reach_by } }),
  getMeeting: (token, room_id) =>
    request("/meeting/get", { method: "POST", token, body: { room_id } }),
};