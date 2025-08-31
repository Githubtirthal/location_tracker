import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';



function Globe3D() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <div className="relative w-full max-w-lg">
        {/* Network Connection World Map */}
        <div 
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 shadow-2xl cursor-crosshair transition-all duration-500 hover:shadow-3xl hover:scale-105"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            transform: isHovered ? `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.1}deg) rotateY(${(mousePosition.x - 50) * 0.1}deg)` : 'none'
          }}
        >
          <img 
            src="https://cdn.vectorstock.com/i/500p/97/87/global-network-connection-world-map-point-vector-51609787.jpg"
            alt="Global Network Connection World Map"
            className="w-full h-auto object-contain transition-all duration-300"
            style={{
              filter: isHovered ? 'brightness(1.4) contrast(1.2) saturate(1.4) hue-rotate(10deg)' : 'brightness(1.2) contrast(1.1) saturate(1.2)',
              transform: isHovered ? `scale(1.05) translate(${(mousePosition.x - 50) * 0.02}px, ${(mousePosition.y - 50) * 0.02}px)` : 'scale(1)'
            }}
          />
          
          {/* Dynamic cursor spotlight */}
          {isHovered && (
            <div 
              className="absolute pointer-events-none transition-all duration-200"
              style={{
                left: `${mousePosition.x}%`,
                top: `${mousePosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-20 h-20 bg-gradient-radial from-cyan-400/30 via-blue-400/20 to-transparent rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-12 h-12 bg-gradient-radial from-white/20 to-transparent rounded-full animate-ping"></div>
            </div>
          )}
          
          {/* Animated overlay effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-indigo-900/20 pointer-events-none"></div>
          
          {/* Interactive connection points */}
          <div 
            className="absolute top-1/3 left-1/4 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 transition-all duration-300"
            style={{
              animation: isHovered ? 'pulse 0.5s infinite' : 'pulse 2s infinite',
              transform: isHovered ? 'scale(1.5)' : 'scale(1)'
            }}
          ></div>
          <div 
            className="absolute top-1/2 right-1/3 w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50 transition-all duration-300 animation-delay-500"
            style={{
              animation: isHovered ? 'pulse 0.7s infinite' : 'pulse 2s infinite',
              transform: isHovered ? 'scale(1.8)' : 'scale(1)'
            }}
          ></div>
          <div 
            className="absolute bottom-1/3 left-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50 transition-all duration-300 animation-delay-1000"
            style={{
              animation: isHovered ? 'pulse 0.6s infinite' : 'pulse 2s infinite',
              transform: isHovered ? 'scale(1.6)' : 'scale(1)'
            }}
          ></div>
          <div 
            className="absolute top-2/3 right-1/4 w-2 h-2 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50 transition-all duration-300 animation-delay-1500"
            style={{
              animation: isHovered ? 'pulse 0.8s infinite' : 'pulse 2s infinite',
              transform: isHovered ? 'scale(1.7)' : 'scale(1)'
            }}
          ></div>
          
          {/* Dynamic connection lines */}
          {isHovered && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path 
                d={`M ${mousePosition.x * 0.01 * containerRef.current?.offsetWidth || 0} ${mousePosition.y * 0.01 * containerRef.current?.offsetHeight || 0} Q 200 100 300 150`}
                stroke="url(#connectionGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          )}
        </div>
        
        {/* Floating connection indicators */}
        <div className={`absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg transition-all duration-300 ${isHovered ? 'animate-bounce scale-110' : 'animate-pulse'}`}>
          🌍 Live
        </div>
        <div className={`absolute -bottom-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-lg transition-all duration-300 ${isHovered ? 'animate-spin scale-110' : 'animate-pulse'}`}>
          📡 Connected
        </div>
      </div>
    </div>
  );
}

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


      {/* Map */}
      <MapContainer 
        center={scenarios[activeScenario].center} 
        zoom={16} 
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        {teamMembers.map(member => (
          <Marker 
            key={member.id} 
            position={member.position}
          />
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
    <div className="min-h-screen bg-white text-slate-900">
      <section id="home" className="relative isolate pt-12">
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
                    MapMates
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                    Track Everything In Real-Time
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
                      {isAuthed ? "Get Started Now" : "Start Tracking"}
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
                  <div className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
                    <Globe3D />
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
                    <Link to={solution.title === "Field Teams" ? "/demo/field-teams" : solution.title === "Event Management" ? "/demo/event-management" : "/demo/logistics"} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                      Learn More
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



    </div>
  );
}


