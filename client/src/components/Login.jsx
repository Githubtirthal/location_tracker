import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";

export default function Login() {
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirm_password: "",
    email: "",
    first_name: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    setErrors({});
    setGeneralError("");
  }, [mode]);

  const validateField = (name, value) => {
    switch (name) {
      case "username":
        if (value.length < 3) return "Username must be at least 3 characters long";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores";
        break;
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
        break;
      case "password":
        if (value.length < 8) return "Password must be at least 8 characters long";
        if (!/(?=.*[a-z])/.test(value)) return "Password must contain at least one lowercase letter";
        if (!/(?=.*[A-Z])/.test(value)) return "Password must contain at least one uppercase letter";
        if (!/(?=.*\d)/.test(value)) return "Password must contain at least one number";
        break;
      case "confirm_password":
        if (mode === "signup" && value !== form.password) return "Passwords do not match";
        break;
      case "first_name":
        if (mode === "signup" && !value.trim()) return "Full name is required";
        break;
    }
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    const fieldError = validateField(name, value);
    if (fieldError) {
      setErrors({ ...errors, [name]: fieldError });
    } else {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (mode === "login") {
      if (!form.username) newErrors.username = "Username is required";
      if (!form.password) newErrors.password = "Password is required";
    } else {
      if (!form.username) newErrors.username = "Username is required";
      if (!form.email) newErrors.email = "Email is required";
      if (!form.password) newErrors.password = "Password is required";
      if (!form.confirm_password) newErrors.confirm_password = "Please confirm your password";
      if (!form.first_name) newErrors.first_name = "Full name is required";

      Object.keys(form).forEach(field => {
        const error = validateField(field, form[field]);
        if (error) newErrors[field] = error;
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    try {
      if (mode === "login") {
        await login({ username: form.username, password: form.password });
      } else {
        await signup({
          username: form.username,
          password: form.password,
          confirm_password: form.confirm_password,
          email: form.email,
          first_name: form.first_name,
        });
      }
      navigate("/dashboard");
    } catch (error) {
      setGeneralError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {mode === "login" ? "Welcome Back 👋" : "Create Your Account"}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              name="username"
              type="text"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200 ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Username"
              value={form.username}
              onChange={handleInputChange}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.username}
              </p>
            )}
          </div>

          {mode === "signup" && (
            <>
              {/* Email Field */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Email"
                  value={form.email}
                  onChange={handleInputChange}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Full Name Field */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="first_name"
                  type="text"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200 ${
                    errors.first_name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Full Name"
                  value={form.first_name}
                  onChange={handleInputChange}
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.first_name}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Password Field */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Password"
              value={form.password}
              onChange={handleInputChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          {mode === "signup" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200 ${
                  errors.confirm_password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Confirm Password"
                value={form.confirm_password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.confirm_password}
                </p>
              )}
            </div>
          )}

          {/* General Error */}
          {generalError && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {generalError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {mode === "login" ? "Signing In..." : "Creating Account..."}
              </div>
            ) : (
              mode === "login" ? "Sign In" : "Create Account"
            )}
          </button>

          {/* Switch Mode Button */}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            {mode === "login"
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
