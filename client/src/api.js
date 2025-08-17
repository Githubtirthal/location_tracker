export const DJANGO_BASE = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_DJANGO_URL || "https://location-tracker-4zk7.onrender.com/api"
  : "http://127.0.0.1:8000/api";

export const NODE_WS = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_NODE_URL || "https://node-server-yp9l.onrender.com"
  : "http://127.0.0.1:5000";

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
};