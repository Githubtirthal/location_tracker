import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error);
      localStorage.removeItem("user");
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async ({ username, password }) => {
    setLoading(true);
    try {
      if (!username?.trim()) {
        throw new Error('Please enter your username.');
      }
      if (!password?.trim()) {
        throw new Error('Please enter your password.');
      }
      
      const data = await api.login({ username: username.trim(), password });
      
      if (!data?.access) {
        throw new Error('Login failed. Please try again.');
      }
      
      const access = data.access;
      setToken(access);
      localStorage.setItem("token", access);
      
      const u = { 
        username: data?.username || username.trim(),
        email: data?.email,
        first_name: data?.first_name
      };
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
      return u;
    } catch (error) {
      // Clear any partial auth state on error
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ username, email, first_name, password, confirm_password }) => {
    setLoading(true);
    try {
      if (!username?.trim()) {
        throw new Error('Please enter a username.');
      }
      if (!email?.trim()) {
        throw new Error('Please enter your email address.');
      }
      if (!first_name?.trim()) {
        throw new Error('Please enter your full name.');
      }
      if (!password) {
        throw new Error('Please enter a password.');
      }
      if (!confirm_password) {
        throw new Error('Please confirm your password.');
      }
      if (password !== confirm_password) {
        throw new Error('Passwords do not match.');
      }
      
      await api.signup({ 
        username: username.trim(), 
        email: email.trim(), 
        first_name: first_name.trim(), 
        password, 
        confirm_password 
      });
      
      return login({ username: username.trim(), password });
    } catch (error) {
      // Clear any partial auth state on error
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (accessToken) => {
    setLoading(true);
    try {
      if (!accessToken) {
        throw new Error('Google authentication failed. Please try again.');
      }
      
      const data = await api.googleAuth(accessToken);
      
      if (!data?.access) {
        throw new Error('Google authentication failed. Please try again.');
      }
      
      const access = data.access;
      setToken(access);
      localStorage.setItem("token", access);
      
      const u = { 
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        isNewUser: data.is_new_user
      };
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
      return u;
    } catch (error) {
      // Clear any partial auth state on error
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = { 
    token, 
    user, 
    login, 
    signup, 
    googleLogin,
    logout, 
    isAuthed: !!token,
    loading 
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
