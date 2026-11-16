import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { sfetch, setToken } from "./client.js";
import { Field, useToast } from "./ui.jsx";
import PasswordForm from "./PasswordForm.jsx";

export default function Settings({ me, reloadMe }) {
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const admin = me.role === "admin";
  useEffect(() => { sfetch("/settings").then((d) => setStats(d.stats)).catch((e) => toast(e.message, "bad")); }, [toast]);
  const put = (i, k, v) => setStats(stats.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  async function save() {
    setBusy(true);
    try { setStats((await sfetch("/settings", { method: "PUT", body: { stats } })).stats); toast("Homepage figures saved"); }
    catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }
  async function everywhere() {
    try { await sfetch("/me/logout-all", { method: "POST" }); setToken(null); reloadMe(); } catch (e) { toast(e.message, "bad"); }
  }
  return (
    <div className="sd-grid2">
      <section className="sd-card">
        <h2>Homepage figures</h2>
        <p className="sd-muted">The key numbers under the homepage banner. Only publish figures AEDT has approved.{!admin && " Only admins can change these."}</p>
        {!stats ? <p className="sd-muted">Loading...</p> : (
          <div className="sd-stack">
            {stats.map((s, i) => (
              <div className="sd-statrow" key={i}>
                <Field label="Before"><input value={s.prefix} onChange={(e) => put(i, "prefix", e.target.value)} placeholder="KES " disabled={!admin} /></Field>
                <Field label="Number"><input inputMode="numeric" value={s.value} onChange={(e) => put(i, "value", e.target.value)} disabled={!admin} /></Field>
                <Field label="After"><input value={s.suffix} onChange={(e) => put(i, "suffix", e.target.value)} placeholder="+" disabled={!admin} /></Field>
                <Field label="Label"><input value={s.label} onChange={(e) => put(i, "label", e.target.value)} disabled={!admin} /></Field>
                {admin && <button className="sd-icon" onClick={() => setStats(stats.filter((_, j) => j !== i))} aria-label="Remove figure"><Trash2 size={16} /></button>}
              </div>))}
            {admin && <div className="sd-row">
              {stats.length < 6 && <button className="sd-btn ghost" onClick={() => setStats([...stats, { prefix: "", value: 0, suffix: "", label: "" }])}><Plus size={16} /> Add figure</button>}
              <button className="sd-btn primary" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save figures"}</button>
            </div>}
          </div>)}
      </section>
      <section className="sd-card">
        <h2>My account</h2>
        <p className="sd-muted">{me.name} · {me.email} · {me.role}</p>
        <h3 className="sd-sub">Change password</h3>
        <PasswordForm onDone={(d) => { setToken(d.token); toast("Password changed"); reloadMe(); }} />
        <h3 className="sd-sub">Lost a device?</h3>
        <p className="sd-muted">Sign out of the dashboard on every browser and phone, including this one.</p>
        <button className="sd-btn ghost" onClick={everywhere}>Sign out everywhere</button>
      </section>
    </div>
  );
}
