import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({ username: "", password: "", email: "", first_name: "" });
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        await login({ username: form.username, password: form.password });
      } else {
        await signup({ username: form.username, password: form.password, email: form.email, first_name: form.first_name });
      }
      navigate("/dashboard");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 24, border: "1px solid #eee", borderRadius: 12 }}>
      <h2 style={{ marginTop: 0 }}>{mode === "login" ? "Login" : "Sign Up"}</h2>
      {mode === "login" && (
        <div style={{ background: "#f0f8ff", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          <strong>Test Credentials:</strong><br/>
          Username: testuser<br/>
          Password: testpass123
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          {mode === "signup" && (
            <>
              <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input placeholder="Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </>
          )}
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {err && <div style={{ color: "crimson" }}>{err}</div>}
          <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            Switch to {mode === "login" ? "Sign Up" : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}
