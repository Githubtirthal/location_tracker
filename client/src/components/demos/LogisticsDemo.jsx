import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function LogisticsDemo() {
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
            Logistics & Delivery Demo
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto">
            Track delivery vehicles, optimize routes, and provide real-time updates
          </p>
        </div>



        {/* Process Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Create Delivery Room</h3>
                  <p className="text-slate-600">Dispatch manager creates a room for the delivery zone and adds all drivers and delivery personnel.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Route Optimization</h3>
                  <p className="text-slate-600">Track delivery vehicles in real-time, optimize routes based on traffic, and dispatch nearest drivers to new orders.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Customer Updates</h3>
                  <p className="text-slate-600">Provide accurate delivery ETAs, track package progress, and notify customers of any delays automatically.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Performance Analytics</h3>
                  <p className="text-slate-600">Monitor delivery times, track driver performance, and optimize operations based on real-time data.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Daily Use Cases</h2>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  📦 Package Delivery
                </h3>
                <p className="text-slate-600">Track delivery drivers, optimize routes for multiple stops, and provide customers with accurate delivery windows.</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🍕 Food Delivery
                </h3>
                <p className="text-slate-600">Monitor delivery drivers, ensure food arrives hot and fresh, and manage multiple restaurant locations efficiently.</p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🚛 Fleet Management
                </h3>
                <p className="text-slate-600">Track commercial vehicles, monitor fuel efficiency, and ensure compliance with delivery schedules and regulations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            {isAuthed ? "Go to Dashboard" : "Start Your Logistics Demo"}
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}