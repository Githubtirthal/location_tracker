import React, { useState } from "react";
import Navbar from "../Navbar";
import { api } from "../../api";
import { useAuth } from "../../AuthContext";

export default function LogisticsDelivery() {
  const { token } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(0);

  async function runDemo() {
    setLoading(true); setError(0);
    try {
      const payload = {
        scope: "global",
        path: [
          { lat: 37.7749, lng: -122.4194 },
          { lat: 37.7760, lng: -122.4183 }
        ],
        radius_m: 80,
        window_minutes: 120,
      };
      const res = await api.predictTraffic(token, payload);
      setResult(res);
    } catch (e) {
      setError(1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Logistics & Delivery</h1>
        <p className="mt-3 text-slate-600">Predict traffic intensity along your route from recent activity.</p>

        <div className="mt-6 rounded-xl border border-slate-200 p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-900 font-semibold">Traffic Analysis Demo</div>
              <div className="text-slate-500 text-sm">Global scope, 2-point sample route (adjust in code)</div>
            </div>
            <button onClick={runDemo} disabled={loading}
              className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Analyzing..." : "Run Demo"}
            </button>
          </div>

          {error ? (
            <div className="mt-4 text-red-600 text-sm">Failed to fetch prediction. Ensure backend is running and you are logged in.</div>
          ) : null}

          {result && (
            <div className="mt-4">
              <div className="text-slate-700 text-sm">Overall Index</div>
              <div className="text-3xl font-bold text-slate-900">{result.overall_index}</div>
              <div className="mt-3 text-slate-700 text-sm">Node Intensities</div>
              <div className="mt-1 text-slate-900 font-mono text-sm">{JSON.stringify(result.node_indices)}</div>
              <div className="mt-2 text-slate-500 text-xs">Counted points: {result.counted_movements}</div>
            </div>
          )}
        </div>

        <ul className="mt-8 list-disc pl-5 text-slate-700 space-y-2">
          <li>Color-code routes by predicted intensity for dispatch decisions</li>
          <li>Alert if intensity crosses threshold near delivery time</li>
          <li>Use global or multi-room scope to reflect city-wide conditions</li>
        </ul>
      </main>
    </>
  );
}



















