import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function FieldTeamsDemo() {
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
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Field Teams Demo
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            See how construction crews, delivery teams, and field service workers stay coordinated
          </p>
        </div>



        {/* Process Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <span className="text-sky-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Create Team Room</h3>
                  <p className="text-slate-600">Project manager creates a room for the construction site or service area and invites team members.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <span className="text-sky-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Real-time Tracking</h3>
                  <p className="text-slate-600">Field workers share their location while on-site. Supervisors can see everyone's position on the map.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <span className="text-sky-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Coordinate Tasks</h3>
                  <p className="text-slate-600">Set meeting points, create geofences for work zones, and ensure team safety with location alerts.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <span className="text-sky-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Emergency Response</h3>
                  <p className="text-slate-600">Quickly locate nearest hospitals, coordinate emergency response, and ensure worker safety.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Daily Use Cases</h2>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🏗️ Construction Sites
                </h3>
                <p className="text-slate-600">Track workers across large construction sites, ensure safety compliance, and coordinate between different teams working on various sections.</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🚚 Delivery Teams
                </h3>
                <p className="text-slate-600">Monitor delivery routes, optimize dispatch decisions, and provide real-time updates to customers about delivery status.</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🔧 Field Service
                </h3>
                <p className="text-slate-600">Dispatch nearest technicians to service calls, track job progress, and ensure efficient resource allocation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            {isAuthed ? "Go to Dashboard" : "Start Your Field Team Demo"}
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}