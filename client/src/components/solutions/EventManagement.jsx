import React from "react";
import Navbar from "../Navbar";

export default function EventManagement() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Event Management</h1>
        <p className="mt-3 text-slate-600">Coordinate staff and volunteers across venues in real-time.</p>
        <ul className="mt-6 list-disc pl-5 text-slate-700 space-y-2">
          <li>Zone-based staffing with heatmap of staff density</li>
          <li>Broadcast announcements (meeting points, safety notices)</li>
          <li>Emergency mode to locate nearest responders</li>
        </ul>
      </main>
    </>
  );
}



















