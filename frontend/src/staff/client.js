// Talks to the back end for the staff dashboard. The sign-in token is kept in sessionStorage,
// so closing the browser signs the person out.
import { api, API_BASE } from "../data/live.jsx";

const KEY = "aedt_staff_token";
let onExpired = () => {};
export const setExpiredHandler = (fn) => { onExpired = fn; };
export const getToken = () => { try { return sessionStorage.getItem(KEY); } catch { return null; } };
export const setToken = (t) => { try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY); } catch { /* blocked */ } };

export class ApiError extends Error {
  constructor(message, errors = {}, status = 0) { super(message); this.errors = errors; this.status = status; }
}

export async function sfetch(path, { method = "GET", body, raw = false, form } = {}) {
  const headers = {};
  const t = getToken();
  if (t) headers.Authorization = "Bearer " + t;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let r;
  try {
    r = await fetch(api("/api/staff" + path), { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.");
  }
  if (r.status === 401 && path !== "/login") { setToken(null); onExpired(); throw new ApiError("Please sign in again.", {}, 401); }
  if (raw) { if (!r.ok) throw new ApiError("Download failed.", {}, r.status); return r; }
  let d = {};
  try { d = await r.json(); } catch { /* not JSON */ }
  if (!r.ok || d.ok === false) throw new ApiError(d.error || "Something went wrong.", d.errors || {}, r.status);
  return d;
}

export async function download(path, filename) {
  const r = await sfetch(path, { raw: true });
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const mediaUrl = (src) => (src && src.startsWith("/uploads/") ? API_BASE + src : src);
export const kes = (n) => "KES " + Number(n || 0).toLocaleString("en-US");
export const when = (iso) => {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    (iso.length > 10 ? " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");
};
