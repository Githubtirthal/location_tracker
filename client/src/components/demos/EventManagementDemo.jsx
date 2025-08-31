import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function EventManagementDemo() {
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
            Event Management Demo
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            Coordinate staff and volunteers during events, festivals, and conferences
          </p>
        </div>



        {/* Process Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Setup Event Room</h3>
                  <p className="text-slate-600">Event organizer creates a room for the venue and invites all staff members and volunteers.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Live Staff Tracking</h3>
                  <p className="text-slate-600">Track security, volunteers, and staff across the venue. See who's at each station or area in real-time.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Venue Mapping</h3>
                  <p className="text-slate-600">Set meeting points for briefings, create zones for different activities, and manage crowd flow.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Emergency Coordination</h3>
                  <p className="text-slate-600">Quickly coordinate emergency response, locate nearest medical facilities, and ensure attendee safety.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Daily Use Cases</h2>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🎪 Festivals & Concerts
                </h3>
                <p className="text-slate-600">Coordinate security teams, manage vendor locations, and ensure smooth operations across large outdoor venues.</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🏢 Corporate Events
                </h3>
                <p className="text-slate-600">Track event staff, coordinate setup teams, and manage logistics for conferences and corporate gatherings.</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🎓 Educational Events
                </h3>
                <p className="text-slate-600">Manage volunteers during graduation ceremonies, track staff during campus events, and coordinate emergency response.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            {isAuthed ? "Go to Dashboard" : "Start Your Event Demo"}
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}