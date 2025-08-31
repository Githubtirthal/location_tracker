// Read from Vite env at build time; fallback to localhost for dev
const ENV_DJANGO = import.meta?.env?.VITE_DJANGO_BASE;
const ENV_WS = import.meta?.env?.VITE_NODE_WS;
const IS_PROD = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;
const DEFAULT_PROD_DJANGO = "https://location-tracker-4zk7.onrender.com/api";
const DEFAULT_PROD_WS = "https://node-server-yp9l.onrender.com";

export const DJANGO_BASE =
  ENV_DJANGO ||
  (IS_PROD ? DEFAULT_PROD_DJANGO : (typeof window !== 'undefined' && window.__DJANGO_BASE__) || "http://127.0.0.1:8000/api");

export const NODE_WS =
  ENV_WS ||
  (IS_PROD ? DEFAULT_PROD_WS : (typeof window !== 'undefined' && window.__NODE_WS__) || "http://127.0.0.1:5000");

console.log('Environment:', process.env.NODE_ENV);
console.log('DJANGO_BASE:', DJANGO_BASE);
console.log('NODE_WS:', NODE_WS);

function getErrorMessage(error, path, status) {
  // Authentication specific errors
  if (path.includes('/login')) {
    if (status === 401 || status === 403) return 'Invalid username or password. Please try again.';
    if (status === 429) return 'Too many login attempts. Please wait a few minutes and try again.';
    if (status >= 500) return 'Login service is temporarily unavailable. Please try again later.';
  }
  
  if (path.includes('/signup')) {
    if (status === 400) {
      if (error.includes('username') || error.includes('Username')) return 'Username is already taken. Please choose a different one.';
      if (error.includes('email') || error.includes('Email')) return 'Email is already registered. Please use a different email or try logging in.';
      if (error.includes('password')) return 'Password does not meet requirements. Please check and try again.';
      return 'Please check your information and try again.';
    }
    if (status === 429) return 'Too many signup attempts. Please wait a few minutes and try again.';
    if (status >= 500) return 'Registration service is temporarily unavailable. Please try again later.';
  }
  
  // General errors
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'Server is temporarily unavailable. Please try again later.';
  
  return 'Something went wrong. Please try again.';
}

async function request(path, { method = "GET", body, token } = {}) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) {
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
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: text || `HTTP ${res.status}` };
      }
      
      const errorMessage = errorData.error || errorData.errors || errorData.detail || text;
      const userFriendlyMessage = getErrorMessage(errorMessage, path, res.status);
      throw new Error(userFriendlyMessage);
    }
    
    return await res.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to connect to server. Please check your internet connection and try again.');
    }
    if (error instanceof SyntaxError) {
      throw new Error('Server response error. Please try again later.');
    }
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

export const api = {
  signup: (payload) => request("/signup", { method: "POST", body: payload }),
  login: (payload) => request("/login", { method: "POST", body: payload }),
  googleAuth: (accessToken) => request("/google-auth", { method: "POST", body: { access_token: accessToken } }),
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
  // Traffic prediction
  predictTraffic: (token, payload) =>
    request("/traffic/predict", { method: "POST", token, body: payload }),
  // Meeting delete
  deleteMeeting: (token, room_id) =>
    request("/meeting/delete", { method: "POST", token, body: { room_id } }),
};