import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Navbar from "./Navbar";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Create colored markers
const createColoredIcon = (color) => {
  const colors = {
    blue: '#3b82f6',
    green: '#10b981', 
    purple: '#8b5cf6',
    red: '#ef4444',
    orange: '#f97316'
  };
  
  return L.divIcon({
    html: `
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path fill="${colors[color] || colors.red}" stroke="#fff" stroke-width="2" 
              d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z"/>
        <circle fill="#fff" cx="12.5" cy="12.5" r="4"/>
      </svg>
    `,
    className: 'colored-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41]
  });
};



function useReveal() {
  const elementsRef = useRef([]);
  useEffect(() => {
    const elements = elementsRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-6");
            entry.target.classList.add("opacity-100", "translate-y-0");
          }
        });
      },
      { threshold: 0.15 }
    );
    elements.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return elementsRef;
}

// Interactive Map Demo Component
function InteractiveMapDemo() {
  const [activeScenario, setActiveScenario] = useState('delivery');
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Alex Driver', position: [48.8566, 2.3522], color: 'blue', role: 'Delivery', speed: 45 },
    { id: 2, name: 'Sarah Dispatcher', position: [48.8584, 2.3545], color: 'green', role: 'Control', speed: 0 },
    { id: 3, name: 'Mike Support', position: [48.8548, 2.3499], color: 'purple', role: 'Support', speed: 30 }
  ]);
  const [stats, setStats] = useState({ distance: 0, tasks: 0, avgSpeed: 35 });

  const scenarios = {
    delivery: { name: '🚚 Delivery Tracking', center: [48.8566, 2.3522] },
    security: { name: '🛡️ Security Patrol', center: [48.8584, 2.3545] },
    construction: { name: '🏗️ Site Monitoring', center: [48.8548, 2.3499] }
  };

  // Simulate real-time movement
  useEffect(() => {
    if (!simulationRunning) return;
    
    const interval = setInterval(() => {
      setTeamMembers(prev => prev.map(member => ({
        ...member,
        position: [
          member.position[0] + (Math.random() - 0.5) * 0.001,
          member.position[1] + (Math.random() - 0.5) * 0.001
        ]
      })));
      
      setStats(prev => ({
        distance: prev.distance + Math.random() * 0.5,
        tasks: prev.tasks + (Math.random() > 0.9 ? 1 : 0),
        avgSpeed: 30 + Math.random() * 20
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationRunning]);

  return (
    <div className="relative">
      {/* Scenario Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 w-32">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">Live Demo</h3>
        <div className="space-y-2 mb-4">
          {Object.entries(scenarios).map(([key, scenario]) => (
            <button
              key={key}
              onClick={() => setActiveScenario(key)}
              className={`w-full text-center px-2 py-1 rounded text-xs transition-all ${
                activeScenario === key 
                  ? 'bg-sky-100 text-sky-700 font-medium' 
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSimulationRunning(!simulationRunning)}
          className={`w-full px-2 py-1 rounded text-xs font-medium transition-all ${
            simulationRunning 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {simulationRunning ? '⏸️ Pause' : '▶️ Play'}
        </button>
      </div>

      {/* Live Stats */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
        <h4 className="font-semibold text-slate-900 mb-3">Live Stats</h4>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Distance:</span>
            <span className="font-medium">{stats.distance.toFixed(1)} km</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tasks:</span>
            <span className="font-medium">{stats.tasks}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Avg Speed:</span>
            <span className="font-medium">{stats.avgSpeed.toFixed(0)} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${simulationRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-500">
              {simulationRunning ? 'Live Updates' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Team List */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
        <h4 className="font-semibold text-slate-900 mb-3">Team Members</h4>
        <div className="space-y-2">
          {teamMembers.map(member => (
            <div key={member.id} className="flex items-center gap-3">
              <div 
                className="h-3 w-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: member.color }}
              />
              <div>
                <div className="text-sm font-medium text-slate-900">{member.name}</div>
                <div className="text-xs text-slate-500">{member.role} • {member.speed} km/h</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapContainer 
        center={scenarios[activeScenario].center} 
        zoom={16} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        {teamMembers.map(member => (
          <Marker 
            key={member.id} 
            position={member.position}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-slate-900">{member.name}</div>
                <div className="text-sm text-slate-600">{member.role}</div>
                <div className="text-xs text-slate-500 mt-1">
                  Speed: {member.speed} km/h
                </div>
                <div className="text-xs text-slate-500">
                  Last update: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Connection lines between team members */}
        <Polyline 
          positions={teamMembers.map(m => m.position)}
          color="#3b82f6"
          weight={2}
          opacity={0.6}
          dashArray="5, 10"
        />
      </MapContainer>
    </div>
  );
}

export default function Landing() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();
  const revealRefs = useReveal();

  const attachRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const handleGetStarted = () => {
    if (isAuthed) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-slate-900">
        <section id="home" className="relative isolate pt-28">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 to-white" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 py-16 md:grid-cols-2">
              <div ref={attachRevealRef} className="transform opacity-0 translate-y-6 transition-all duration-700">
                <div className="mb-6">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-100 to-indigo-100 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-inset ring-sky-200">
                    🚀 Real-time Location Tracking
                  </span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                    Track Everything
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    In Real-Time
                  </span>
                </h1>
                <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                  Create rooms, share locations, and track team members with precision. 
                  <br className="hidden sm:block" />
                  Built for teams who need to stay connected and coordinated.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                  <button 
                    onClick={handleGetStarted}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                  >
                    <span className="relative z-10">
                      {isAuthed ? "Go to Dashboard" : "Start Tracking Now"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-700 to-indigo-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </button>
                  <a 
                    href="#features" 
                    className="group flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-slate-700 ring-2 ring-slate-200 transition-all duration-300 hover:bg-slate-50 hover:ring-slate-300 hover:scale-105"
                  >
                    Explore Features
                    <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
              <div ref={attachRevealRef} className="transform opacity-0 translate-y-6 transition-all duration-700 delay-150">
                <div className="relative">
                  <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-tr from-sky-100 to-indigo-100 blur-2xl" />
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
                    <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-200 via-white to-indigo-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Leaflet Map Demo */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div ref={attachRevealRef} className="transform opacity-0 translate-y-6 transition-all duration-700 text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Live Tracking Demo
              </h2>
              <p className="mt-4 max-w-3xl mx-auto text-xl text-slate-600">
                Watch real-time location tracking in action. Switch scenarios and see live updates.
              </p>
            </div>
            
            <div ref={attachRevealRef} className="transform opacity-0 translate-y-6 transition-all duration-700 delay-200">
              <div className="relative p-2 rounded-3xl bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600 shadow-2xl">
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-inner">
                  <div className="aspect-[16/9] w-full relative overflow-hidden rounded-2xl">
                    <InteractiveMapDemo />
                    
                    {/* Call to Action Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-8 text-center">
                      <button 
                        onClick={handleGetStarted}
                        className="group relative overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 border border-white/20"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          🚀 Start Your Own Room
                          <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            
            {/* Feature Highlights */}
            <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-4">
              {[
                { icon: "⚡", title: "Real-time Updates", desc: "Sub-second location updates" },
                { icon: "🎯", title: "Precision Tracking", desc: "GPS accuracy within 3 meters" },
                { icon: "🔒", title: "Secure & Private", desc: "End-to-end encrypted data" },
                { icon: "🌍", title: "Global Coverage", desc: "Works worldwide with GPS" }
              ].map((item, idx) => (
                <div key={item.title} ref={attachRevealRef} className={`transform opacity-0 translate-y-6 transition-all duration-700 delay-${(idx + 3) * 100} text-center`}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div ref={attachRevealRef} className="transform opacity-0 translate-y-6 transition-all duration-700 text-center">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-slate-600">
            Everything you need to track, monitor, and coordinate your team in real-time
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Real-time Maps",
              desc: "Interactive maps with live location updates. See where everyone is at any moment with precision tracking.",
              icon: "🗺️",
              gradient: "from-emerald-500 to-teal-600"
            },
            {
              title: "Room Management",
              desc: "Create and manage tracking rooms. Invite team members and control access with ease.",
              icon: "🏠",
              gradient: "from-blue-500 to-indigo-600"
            },
            {
              title: "Live Location Sharing",
              desc: "Share your location in real-time with team members. Toggle sharing on/off as needed.",
              icon: "📍",
              gradient: "from-purple-500 to-pink-600"
            },
            {
              title: "Team Coordination",
              desc: "Keep your team connected and coordinated. Perfect for field work, events, and logistics.",
              icon: "👥",
              gradient: "from-orange-500 to-red-600"
            }
          ].map((feature, idx) => (
            <div key={feature.title} ref={attachRevealRef} className={`transform opacity-0 translate-y-6 transition-all duration-700 delay-${(idx + 1) * 100}`}>
              <div className="group h-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2">
                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">{feature.title}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{feature.desc}</p>
                <div className={`mt-6 h-1 w-0 bg-gradient-to-r ${feature.gradient} rounded-full transition-all duration-500 group-hover:w-full`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="solutions" className="bg-gradient-to-br from-slate-50 to-slate-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div ref={attachRevealRef} className="transform opacity-0 translate-y-6 transition-all duration-700 text-center">
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Perfect for Every Use Case
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-xl text-slate-600">
              Whether you're coordinating field teams, managing events, or tracking assets
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { 
                title: "Field Teams", 
                desc: "Perfect for construction crews, delivery teams, and field service workers who need to stay coordinated across job sites.",
                icon: "🚚",
                features: ["GPS Tracking", "Team Coordination", "Real-time Updates"]
              },
              { 
                title: "Event Management", 
                desc: "Coordinate staff and volunteers during events, festivals, and conferences. Keep everyone connected and informed.",
                icon: "🎉",
                features: ["Staff Coordination", "Venue Mapping", "Emergency Response"]
              },
              { 
                title: "Logistics & Delivery", 
                desc: "Track delivery vehicles, optimize routes, and provide real-time updates to customers and dispatch teams.",
                icon: "📦",
                features: ["Route Optimization", "Delivery Tracking", "Customer Updates"]
              },
            ].map((solution, idx) => (
              <div key={solution.title} ref={attachRevealRef} className={`transform opacity-0 translate-y-6 transition-all duration-700 delay-${(idx + 1) * 150}`}>
                <div className="group h-full rounded-2xl border border-white bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-3">
                  <div className="mb-6 text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-indigo-100 text-4xl group-hover:scale-110 transition-transform duration-300">
                      {solution.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 text-center group-hover:text-sky-700 transition-colors">{solution.title}</h3>
                  <p className="mt-4 text-slate-600 leading-relaxed text-center">{solution.desc}</p>
                  <div className="mt-6 space-y-2">
                    {solution.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" />
                        <span className="text-sm font-medium text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 text-center">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                      Learn More
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      <footer className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <a href="#home" className="flex items-center gap-3 group">
                <span className="inline-block h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 transition-transform group-hover:scale-110" />
                <span className="text-xl font-bold tracking-tight">Realtime Tracker</span>
              </a>
              <p className="mt-4 text-slate-300 leading-relaxed">
                The most powerful real-time location tracking platform for teams and organizations.
              </p>
              <div className="mt-6 flex space-x-4">
                {[
                  { name: 'Twitter', icon: '🐦', href: '#' },
                  { name: 'GitHub', icon: '🐙', href: '#' },
                  { name: 'LinkedIn', icon: '💼', href: '#' },
                  { name: 'Discord', icon: '💬', href: '#' }
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-lg transition-all duration-300 hover:bg-slate-700 hover:scale-110"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold">Product</h3>
              <ul className="mt-4 space-y-3">
                {['Features', 'Solutions', 'Dashboard', 'API Docs'].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-slate-300 transition-colors hover:text-white hover:underline">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold">Company</h3>
              <ul className="mt-4 space-y-3">
                {['About Us', 'Careers', 'Blog', 'Press Kit'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-300 transition-colors hover:text-white hover:underline">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold">Get in Touch</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sky-400">📧</span>
                  <a href="mailto:hello@realtimetracker.com" className="text-slate-300 transition-colors hover:text-white">
                    hello@realtimetracker.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sky-400">📞</span>
                  <a href="tel:+1234567890" className="text-slate-300 transition-colors hover:text-white">
                    +1 (234) 567-890
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sky-400">📍</span>
                  <span className="text-slate-300">
                    San Francisco, CA
                  </span>
                </div>
              </div>
              
              {/* Newsletter */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-slate-200">Stay Updated</h4>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:scale-105">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 border-t border-slate-800 pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} Realtime Tracker Inc. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-slate-400">
                <a href="#" className="transition-colors hover:text-white">Privacy Policy</a>
                <a href="#" className="transition-colors hover:text-white">Terms of Service</a>
                <a href="#" className="transition-colors hover:text-white">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </main>
    </>
  );
}


