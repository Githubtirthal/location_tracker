import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import RoomMap from "./components/RoomMap";
import Landing from "./components/Landing";
import AboutUs from "./components/AboutUs";
import ContactUs from "./components/ContactUs";
import FieldTeamsDemo from "./components/demos/FieldTeamsDemo";
import EventManagementDemo from "./components/demos/EventManagementDemo";
import LogisticsDemo from "./components/demos/LogisticsDemo";
import SolutionFieldTeams from "./components/solutions/FieldTeams";
import SolutionEventManagement from "./components/solutions/EventManagement";
import SolutionLogistics from "./components/solutions/LogisticsDelivery";
// Removed GoogleOAuthProvider import

function ProtectedRoute({ children }) {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/about" element={<Layout><AboutUs /></Layout>} />
          <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
          <Route path="/demo/field-teams" element={<Layout><FieldTeamsDemo /></Layout>} />
          <Route path="/demo/event-management" element={<Layout><EventManagementDemo /></Layout>} />
          <Route path="/demo/logistics" element={<Layout><LogisticsDemo /></Layout>} />
          <Route path="/solutions/field-teams" element={<Layout><SolutionFieldTeams /></Layout>} />
          <Route path="/solutions/event-management" element={<Layout><SolutionEventManagement /></Layout>} />
          <Route path="/solutions/logistics-delivery" element={<Layout><SolutionLogistics /></Layout>} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Layout>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <RoomMap />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}