import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Archive } from "lucide-react";
import { sfetch, download } from "./client.js";
import { useToast } from "./ui.jsx";

const ABOUT = {
  members: "Everyone in the register: contact details, monthly pledge, paid to date, balance, months behind, last payment.",
  monthly: "One row per member and one column per month, showing what each member paid. Best for tracking monthly collections.",
  applications: "Every membership form submitted on the website, with the member number once approved.",
  mentors: "People who signed up to mentor (including 'both'), with their mentoring areas and availability.",
  volunteers: "People who signed up to volunteer (including 'both'), with their volunteering areas.",
  internships: "Internship and attachment applications: institution, course, fields, CV link and status.",
  messages: "Messages sent through the Contact page.",
  contributions: "Every payment recorded: date, month, amount, type, member, campaign, channel and transaction code.",
  changelog: "Every change made in the dashboard, with who made it and when (admins only).",
};

export default function Downloads() {
  const [items, setItems] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [busy, setBusy] = useState("");
  const toast = useToast();
  useEffect(() => { sfetch("/export/").then((d) => setItems(d.items)).catch((e) => toast(e.message, "bad")); }, [toast]);
  async function get(key) {
    setBusy(key);
    const qs = key === "monthly" || key === "all" ? `?year=${year}` : "";
    try { await download(`/export/${key}${qs}`, key === "all" ? "aedt-data.zip" : `aedt-${key}.csv`); }
    catch (e) { toast(e.message, "bad"); } finally { setBusy(""); }
  }
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  return (
    <div className="sd-stack">
      <section className="sd-card sd-all">
        <div><h2><Archive size={20} /> Everything in one file</h2>
          <p className="sd-muted">A zip with every table below as a CSV. Opens in Excel or Google Sheets. Good for analysis and as a monthly backup.</p></div>
        <button className="sd-btn primary" onClick={() => get("all")} disabled={busy === "all"}><Download size={16} /> {busy === "all" ? "Preparing..." : "Download all (.zip)"}</button>
      </section>
      <div className="sd-downloads">
        {!items ? <p className="sd-muted">Loading...</p> : items.map((it) => (
          <section key={it.key} className="sd-card sd-dl-card">
            <div className="sd-dl-head"><FileSpreadsheet size={22} /><div><h2>{it.label}</h2><small>{it.rows} row{it.rows === 1 ? "" : "s"}</small></div></div>
            <p className="sd-muted">{ABOUT[it.key]}</p>
            <div className="sd-row">
              {it.key === "monthly" && <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">{years.map((y) => <option key={y}>{y}</option>)}</select>}
              <button className="sd-btn ghost" onClick={() => get(it.key)} disabled={busy === it.key}><Download size={16} /> {busy === it.key ? "Preparing..." : "Download CSV"}</button>
            </div>
          </section>))}
      </div>
      <p className="sd-small sd-muted">These files contain personal data. Keep them on Association devices or drives only, do not forward them, and delete old copies you no longer need. Every download is recorded in the change log.</p>
    </div>
  );
}
