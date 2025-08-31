import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [joinId, setJoinId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const data = await api.listRooms(token);
      setRooms(data.rooms || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setError("");
    if (!newRoom.trim()) return;
    try {
      const room = await api.createRoom(token, newRoom.trim());
      setNewRoom("");
      await loadRooms();
      navigate(`/room/${room.id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleJoin = async () => {
    setError("");
    if (!joinId.trim()) return;
    
    try {
      await api.joinRoom(token, joinId.trim());
      setJoinId("");
      await loadRooms();
      navigate(`/room/${joinId.trim()}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const createdRooms = useMemo(() => 
    rooms.filter((r) => r.creator.username === user?.username), 
    [rooms, user?.username]
  );
  const joinedRooms = useMemo(() => 
    rooms.filter((r) => r.creator.username !== user?.username), 
    [rooms, user?.username]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.username}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Rooms</p>
                <p className="text-2xl font-bold text-slate-900">{rooms.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xl">🏢</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Created by You</p>
                <p className="text-2xl font-bold text-slate-900">{createdRooms.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">🛠</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Joined Rooms</p>
                <p className="text-2xl font-bold text-slate-900">{joinedRooms.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-xl">🤝</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Room Creation & Join */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-lg rounded-xl p-6 border border-slate-200"
          >
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-green-600">➕</span>
              Create Room
            </h3>
            <input
              className="w-full border rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-green-400 outline-none transition-all duration-200"
              placeholder="Enter room name..."
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="w-full py-3   bg-red-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-semibold"
            >
              Create Room
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white shadow-lg rounded-xl p-6 border border-slate-200"
          >
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="text-blue-600">🔗</span>
              Join Room
            </h3>
            <input
              className="w-full border rounded-lg px-4 py-2 mb-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
              placeholder="Enter room ID..."
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 font-semibold"
            >
              Join Room
            </button>
          </motion.div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6"
          >
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {/* Room Lists */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-green-600">🛠</span>
              Created by You
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Loading rooms...</p>
                </div>
              ) : createdRooms.length > 0 ? (
                createdRooms.map((r, index) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all duration-200 group"
                    onClick={() => navigate(`/room/${r.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-green-600 transition-colors">{r.name}</h4>
                        <p className="text-sm text-slate-500">ID: {r.id}</p>
                      </div>
                      <span className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-slate-200">
                  <span className="text-4xl mb-2 block">🏢</span>
                  <p className="text-slate-500">No rooms created yet</p>
                  <p className="text-sm text-slate-400">Create your first room to get started</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-blue-600">🤝</span>
              Joined Rooms
            </h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Loading rooms...</p>
                </div>
              ) : joinedRooms.length > 0 ? (
                joinedRooms.map((r, index) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all duration-200 group"
                    onClick={() => navigate(`/room/${r.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{r.name}</h4>
                        <p className="text-sm text-slate-500">ID: {r.id} • by {r.creator.username}</p>
                      </div>
                      <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-lg border border-slate-200">
                  <span className="text-4xl mb-2 block">🤝</span>
                  <p className="text-slate-500">No joined rooms yet</p>
                  <p className="text-sm text-slate-400">Join a room to collaborate with others</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
