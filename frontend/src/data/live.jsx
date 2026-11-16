// Live website content from the back end (edited in the staff dashboard at /staff).
//
// The site first shows the last copy it downloaded (or the built-in files in this folder), then
// swaps in fresh data from /api/public/content. If the back end cannot be reached, the
// built-in files are used, so the site never goes blank.
//
// VITE_API_URL: leave empty when the API is on the same domain as the site (e.g. /api is
// proxied). If the API lives elsewhere, set it in .env, e.g. VITE_API_URL=https://api.example.org
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { campaigns as staticCampaigns } from "./campaigns.js";
import { updates as staticUpdates, events as staticEvents, photos as staticPhotos } from "./content.js";
import { opportunities as staticOpportunities } from "./opportunities.js";

export const API_BASE = ((import.meta.env && import.meta.env.VITE_API_URL) || "").replace(/\/$/, "");
export const api = (path) => API_BASE + path;

const CACHE_KEY = "aedt_live_v1";
const today = () => new Date().toISOString().slice(0, 10);

// images uploaded in the dashboard are served by the API server
function withMedia(value) {
  if (typeof value === "string") return value.startsWith("/uploads/") ? API_BASE + value : value;
  if (Array.isArray(value)) return value.map(withMedia);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withMedia(v)]));
  return value;
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; } catch { return null; }
}

const Ctx = createContext(null);

export function LiveDataProvider({ children }) {
  const [data, setData] = useState(readCache);
  useEffect(() => {
    let alive = true;
    const load = () => fetch(api("/api/public/content"), { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d || !Array.isArray(d.campaigns)) return;
        setData(d);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
      })
      .catch(() => {});
    load();
    const t = setInterval(load, 5 * 60 * 1000);      // refresh open pages every 5 minutes
    return () => { alive = false; clearInterval(t); };
  }, []);
  const value = useMemo(() => {
    const d = data ? withMedia(data) : null;
    const now = today();
    return {
      live: !!d,
      campaigns: d?.campaigns ?? staticCampaigns,
      updates: [...(d?.updates ?? staticUpdates)].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
      events: (d?.events ?? staticEvents).filter((e) => !e.date || e.date >= now).sort((a, b) => a.date.localeCompare(b.date)),
      photos: d?.photos ?? staticPhotos,
      opportunities: (d?.opportunities ?? staticOpportunities).filter((o) => !o.deadline || o.deadline >= now),
      stats: d?.stats ?? null,
    };
  }, [data]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLive() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLive must be used inside <LiveDataProvider>");
  return v;
}

export const featuredOf = (list) => list.find((c) => c.featured) || list[0];
