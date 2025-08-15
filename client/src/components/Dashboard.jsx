import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function Dashboard() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await api.listRooms(token);
      setRooms(data.rooms || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setError("");
    if (!newRoom.trim()) return;
    try {
      const room = await api.createRoom(token, newRoom.trim());
      setNewRoom("");
      await load();
      navigate(`/room/${room.id}`); // go directly to the room
    } catch (e) {
      setError(e.message);
    }
  };

  const handleJoin = async () => {
    setError("");
    if (!joinId.trim()) return;
    try {
      await api.joinRoom(token, Number(joinId));
      setJoinId("");
      await load();
      navigate(`/room/${Number(joinId)}`);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </div>

      <p>Select a room to open its map in a full-screen route.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <h3>Create Room</h3>
          <input placeholder="Room name" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} />
          <button onClick={handleCreate}>Create</button>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
          <h3>Join Room</h3>
          <input placeholder="Room ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} />
          <button onClick={handleJoin}>Join</button>
        </div>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3>Created by You</h3>
          <ul style={{ padding: 0, listStyle: "none" }}>
            {rooms.filter(r => r.creator.username === user?.username).map((r) => (
              <li key={r.id} style={{ marginBottom: 8 }}>
                <button onClick={() => navigate(`/room/${r.id}`)} style={{ padding: "8px 12px", borderRadius: 6, background: "#e8f5e8" }}>
                  {r.name} (ID: {r.id})
                </button>
              </li>
            ))}
            {rooms.filter(r => r.creator.username === user?.username).length === 0 && <li>No rooms created yet.</li>}
          </ul>
        </div>
        <div>
          <h3>Joined Rooms</h3>
          <ul style={{ padding: 0, listStyle: "none" }}>
            {rooms.filter(r => r.creator.username !== user?.username).map((r) => (
              <li key={r.id} style={{ marginBottom: 8 }}>
                <button onClick={() => navigate(`/room/${r.id}`)} style={{ padding: "8px 12px", borderRadius: 6, background: "#f0f8ff" }}>
                  {r.name} (ID: {r.id}) - by {r.creator.username}
                </button>
              </li>
            ))}
            {rooms.filter(r => r.creator.username !== user?.username).length === 0 && <li>No joined rooms yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}