import React, { useEffect, useRef, useState } from "react";

/**
 * SmartSearch.jsx
 * A compact React search component that provides:
 *  - instant, debounced suggestions
 *  - importance + proximity scoring (pushes important/nearby places first)
 *  - keyboard navigation (arrow keys + Enter)
 *  - caching + aborting inflight requests
 *  - lightweight styling (Tailwind-ready)
 *
 * Usage:
 * <SmartSearch
 *    currentLocation={currentLocation} // { lat, lng } or null
 *    onSelect={(place) => { ... }}
 *    placeholder="Search places..."
 *    nominatimEmail="your@email.com" // optional but recommended for Nominatim policy
 * />
 *
 * onSelect receives: { lat, lon, display_name, type, class, distanceKm }
 * Notes:
 *  - This component uses Nominatim (OpenStreetMap). For production/high-volume use,
 *    consider a paid places API (Mapbox/Google) or your own search index.
 *  - Debounce default = 300ms, reduces unnecessary requests.
 */

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 min

// Priority boosts for well-known POI types (adjust to taste)
const TYPE_BOOST = {
  hospital: 40,
  pharmacy: 25,
  restaurant: 20,
  cafe: 15,
  supermarket: 30,
  marketplace: 20,
  bank: 15,
  atm: 15,
  school: 10,
  university: 15,
  bus_station: 30,
  train_station: 40,
  airport: 60,
  hotel: 10,
  parking: 10,
};

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

export default function SmartSearch({ currentLocation = null, onSelect = () => {}, placeholder = "Search places...", nominatimEmail = null }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const cacheRef = useRef(new Map()); // queryKey -> { ts, results }
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShow(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentLocation]);

  async function doSearch(q) {
    const bboxBias = currentLocation
      ? `${currentLocation.lng - 0.1},${currentLocation.lat - 0.1},${currentLocation.lng + 0.1},${currentLocation.lat + 0.1}`
      : null;

    const cacheKey = `${q}::${bboxBias ?? "global"}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      setSuggestions(cached.results);
      setShow(true);
      return;
    }

    // Abort previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);

    try {
      // Build Nominatim query. We use addressdetails + extratags + limit
      let url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&extratags=1&limit=15&q=${encodeURIComponent(q)}`;
      if (bboxBias) url += `&viewbox=${encodeURIComponent(bboxBias)}&bounded=0`;
      if (nominatimEmail) url += `&email=${encodeURIComponent(nominatimEmail)}`;

      const res = await fetch(url, { signal: abortRef.current.signal, headers: { "Accept-Language": "en" } });
      if (!res.ok) throw new Error("Places search failed");
      const data = await res.json();

      // Score + sort
      const enriched = (data || []).map((r) => {
        const place = {
          display_name: r.display_name,
          name: r.name || (r.display_name || "").split(",")[0],
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          type: r.type,
          class: r.class,
          importance: typeof r.importance === "number" ? r.importance : parseFloat(r.importance) || 0,
          extratags: r.extratags || {},
          address: r.address || {},
        };

        const distKm = currentLocation ? haversineKm({ lat: currentLocation.lat, lng: currentLocation.lng }, { lat: place.lat, lng: place.lon }) : Infinity;
        place.distanceKm = distKm;

        const typeBoost = TYPE_BOOST[place.type] || TYPE_BOOST[place.class] || 0;

        // score: higher is better
        // importance typically 0..1 so scale it
        const score = (place.importance * 120) - distKm * 6 + typeBoost;
        place._score = Math.round(score * 100) / 100;

        return place;
      });

      enriched.sort((a, b) => b._score - a._score);

      cacheRef.current.set(cacheKey, { ts: Date.now(), results: enriched });
      setSuggestions(enriched);
      setShow(true);
      setActiveIndex(-1);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setSuggestions([]);
      setShow(true);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (!show) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        chooseSuggestion(suggestions[activeIndex]);
      } else if (suggestions.length > 0) {
        chooseSuggestion(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShow(false);
      setActiveIndex(-1);
    }
  }

  function chooseSuggestion(s) {
    setQuery(s.name || s.display_name);
    setShow(false);
    setSuggestions([]);
    setActiveIndex(-1);
    onSelect({
      ...s,
      lat: s.lat,
      lon: s.lon,
    });
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      <div className="bg-white rounded-full shadow-lg border border-slate-200 flex items-center px-4 py-2">
        <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          aria-label="Search places"
          type="text"
          className="flex-1 outline-none text-sm bg-transparent"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          onFocus={() => query.trim().length >= MIN_CHARS && setShow(true)}
          onKeyDown={handleKeyDown}
        />

        {query && (
          <button
            aria-label="Clear"
            onClick={() => { setQuery(""); setSuggestions([]); setShow(false); }}
            className="ml-2 p-1 hover:bg-slate-100 rounded-full"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="ml-2 w-6 h-6 flex items-center justify-center">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="#94a3b8" strokeDasharray="60" strokeLinecap="round" fill="none"></circle>
            </svg>
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {show && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 max-h-72 overflow-y-auto z-[1200]">
          {suggestions.length === 0 && !loading && (
            <div className="p-3 text-sm text-slate-500">No places found</div>
          )}

          {suggestions.map((s, idx) => (
            <div
              key={`${s.lat}-${s.lon}-${idx}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(-1)}
              onClick={() => chooseSuggestion(s)}
              className={`px-4 py-3 cursor-pointer border-b last:border-b-0 flex items-start gap-3 hover:bg-slate-50 ${idx === activeIndex ? 'bg-slate-100' : ''}`}
            >
              <div className="w-8 text-center mt-1 text-slate-600">
                {/* simple emoji/icon selection */}
                {s.type === 'hospital' ? '🏥' : s.type === 'restaurant' ? '🍽️' : s.type === 'cafe' ? '☕' : s.type === 'supermarket' ? '🛒' : s.type === 'bus_station' || s.type === 'train_station' ? '🚉' : s.type === 'airport' ? '✈️' : '📍'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900 text-sm truncate">{s.name}</div>
                  <div className="text-xs text-slate-500 ml-2">{s._score}</div>
                </div>
                <div className="text-xs text-slate-500 truncate">{s.display_name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {isFinite(s.distanceKm) ? `${s.distanceKm.toFixed(1)} km` : ''} {s.extratags?.wikidata ? ' • popular' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
