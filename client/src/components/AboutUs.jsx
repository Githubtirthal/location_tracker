import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AboutUs() {
  const { isAuthed } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthed) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            About Us
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            We're building the future of real-time location tracking for teams and organizations worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              At MapMates, we believe that seamless coordination and real-time visibility are essential for modern teams. Our platform empowers organizations to track, monitor, and coordinate their workforce with precision and ease.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Whether you're managing field teams, coordinating events, or optimizing logistics, our solution provides the tools you need to stay connected and make informed decisions in real-time.
            </p>
          </div>
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Innovation First</h3>
              <p className="text-slate-600">
                Cutting-edge technology meets intuitive design to deliver exceptional user experiences.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { icon: "🎯", title: "Precision", desc: "GPS accuracy within 3 meters for reliable tracking" },
            { icon: "⚡", title: "Speed", desc: "Sub-second updates for real-time coordination" },
            { icon: "🔒", title: "Security", desc: "End-to-end encryption for data protection" }
          ].map((value) => (
            <div key={value.title} className="text-center p-6 rounded-xl bg-white shadow-sm border border-slate-200">
              <div className="text-4xl mb-4">{value.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
              <p className="text-slate-600">{value.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-xl text-sky-100 mb-8 max-w-2xl mx-auto">
            Be part of the revolution in real-time location tracking. Start your journey with us today.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            {isAuthed ? "Go to Dashboard" : "Get Started Now"}
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}