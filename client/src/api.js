export const DJANGO_BASE = process.env.NODE_ENV === 'production' 
  ? "https://your-django-app.onrender.com/api"
  : "http://127.0.0.1:8000/api";

export const NODE_WS = process.env.NODE_ENV === 'production'
  ? "https://your-node-app.onrender.com"
  : "http://127.0.0.1:5000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${DJANGO_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  signup: (payload) => request("/signup", { method: "POST", body: payload }),
  login: (payload) => request("/login", { method: "POST", body: payload }),
  createRoom: (token, name) => request("/rooms", { method: "POST", body: { name }, token }),
  joinRoom: (token, room_id) => request("/rooms/join", { method: "POST", body: { room_id }, token }),
  listRooms: (token) => request("/rooms/list", { method: "POST", token }),
  bootstrap: (token, room_id) => request("/rooms/bootstrap", { method: "POST", body: { room_id }, token }),
};