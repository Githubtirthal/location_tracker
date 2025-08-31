import React from "react";
import Navbar from "../Navbar";

export default function FieldTeams() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Field Teams</h1>
        <p className="mt-3 text-slate-600">Coordinate crews with live GPS, geofences, and task status.</p>
        <ul className="mt-6 list-disc pl-5 text-slate-700 space-y-2">
          <li>Live team map with presence and last-updated timestamps</li>
          <li>Geofence alerts when members leave assigned zones</li>
          <li>Shift check-in/out with activity trails</li>
        </ul>
      </main>
    </>
  );
}



















