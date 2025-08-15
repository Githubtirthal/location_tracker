import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async ({ username, password }) => {
    const data = await api.login({ username, password });
    const access = data.access;
    // Optionally decode token to extract username
    setToken(access);
    localStorage.setItem("token", access);
    // Store lightweight user object (username from token claims if present)
    const u = { username: data?.username || username };
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
    return u;
  };

  const signup = async ({ username, email, first_name, password }) => {
    await api.signup({ username, email, first_name, password });
    return login({ username, password });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = { token, user, login, signup, logout, isAuthed: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
