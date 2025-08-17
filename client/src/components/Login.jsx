import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    first_name: "",
  });
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        await login({ username: form.username, password: form.password });
      } else {
        await signup({
          username: form.username,
          password: form.password,
          email: form.email,
          first_name: form.first_name,
        });
      }
      navigate("/dashboard");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Welcome Back 👋" : "Create Your Account"}
        </h2>



        <form onSubmit={onSubmit} className="space-y-4">
                  <input
          className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
          placeholder="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value })
          }
          required
        />

        {mode === "signup" && (
          <>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
            <input
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
              placeholder="Full Name"
              value={form.first_name}
              onChange={(e) =>
                setForm({ ...form, first_name: e.target.value })
              }
              required
            />
          </>
        )}

        <input
          type="password"
          className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          required
        />

          {err && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {err}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            {mode === "login" ? "Login" : "Create Account"}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            {mode === "login"
              ? "Switch to Sign Up"
              : "Switch to Login"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
