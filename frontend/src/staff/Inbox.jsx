import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, Search, Mail, Phone, MessageCircle, Repeat, UserCheck } from "lucide-react";
import { sfetch, download, when } from "./client.js";
import { Drawer, Field, Pager, StatusPill, Confirm, Empty, useToast } from "./ui.jsx";

const TABS = [["member", "Membership"], ["volunteer", "Mentors and volunteers"], ["contact", "Messages"], ["placement", "Internships"]];
const NICE = {
  full_name: "Full name", name: "Name", email: "Email", phone: "Phone", county: "County", institution: "Institution",
  course: "Course", graduation_year: "Graduation year", aedt_status: "AEDT status", employment_status: "Employment",
  industry: "Industry", interests: "Interests", monthly_pledge: "Monthly pledge (KES)", role: "Wants to", is_member: "Member?",
  location: "Location", profession: "Profession", organisation: "Organisation", mentor_areas: "Mentoring areas",
  volunteer_areas: "Volunteering areas", availability: "Availability", experience: "Experience", subject: "Subject",
  message: "Message", year_of_study: "Year of study", placement_type: "Placement type", fields: "Fields",
  start_month: "Can start", duration: "Duration", cv_link: "CV link", opportunity: "Applied for listing", consent: "Agreed to privacy notice",
};

export default function Inbox({ me, meta }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(loc.search || "");
  const type = TABS.some((t) => t[0] === params.get("type")) ? params.get("type") : "member";
  const status = params.get("status") || "";
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const [open, setOpen] = useState(null);
  const toast = useToast();
  const setParams = (t, s) => navigate(`/staff/inbox?type=${t}${s ? "&status=" + s : ""}`);

  const load = useCallback(async () => {
    try {
      setD(await sfetch(`/submissions?type=${type}&status=${status}&q=${encodeURIComponent(q)}&page=${page}`));
    } catch (e) { toast(e.message, "bad"); }
  }, [type, status, q, page, toast]);
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);
  useEffect(() => setPage(1), [type, status, q]);

  const statuses = meta?.statuses?.[type] || [];
  const saveItem = (item) => { setD((x) => ({ ...x, items: x.items.map((i) => (i.id === item.id ? item : i)) })); setOpen(item); };

  return (
    <div className="sd-stack">
      <div className="sd-tabs" role="tablist">
        {TABS.map(([t, label]) => <button key={t} role="tab" aria-selected={t === type} className={t === type ? "on" : ""} onClick={() => setParams(t, "")}>{label}</button>)}
      </div>
      <div className="sd-toolbar">
        <div className="sd-search"><Search size={16} /><input placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={status} onChange={(e) => setParams(type, e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="sd-btn ghost" onClick={() => download(`/submissions/export?type=${type}`, `aedt-${type}.csv`).catch((e) => toast(e.message, "bad"))}><Download size={16} /> Export CSV</button>
      </div>
      {!d ? <p className="sd-muted">Loading...</p> : !d.items.length ? <Empty>No submissions here{status ? ` with status "${status}"` : ""}.</Empty> : (
        <div className="sd-table-wrap">
          <table className="sd-table">
            <thead><tr><th>Name</th><th className="sd-hide-m">Contact</th><th className="sd-hide-m">Details</th><th>Status</th><th className="sd-hide-m">Received</th></tr></thead>
            <tbody>{d.items.map((it) => (
              <tr key={it.id} onClick={() => setOpen(it)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(it)}>
                <td><b>{it.name}</b>{it.data._repeat && <span className="sd-tag warn" title="This email has submitted this form before"><Repeat size={12} /> repeat</span>}<small className="sd-only-m">{when(it.created_at)}</small></td>
                <td className="sd-hide-m"><small>{it.email}<br />{it.phone}</small></td>
                <td className="sd-hide-m"><small>{summary(type, it.data)}</small></td>
                <td><StatusPill s={it.status} /></td>
                <td className="sd-hide-m"><small>{when(it.created_at)}</small></td>
              </tr>))}
            </tbody>
          </table>
        </div>)}
      {d && <Pager page={d.page} total={d.total} per={d.per_page} onPage={setPage} />}
      {open && <Detail item={open} statuses={statuses} me={me} onClose={() => setOpen(null)} onSaved={saveItem}
        onDeleted={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function summary(type, x) {
  if (type === "member") return [x.aedt_status, x.institution, x.monthly_pledge ? `KES ${x.monthly_pledge}/month` : ""].filter(Boolean).join(" · ");
  if (type === "volunteer") return [x.role, x.location, x.availability].filter(Boolean).join(" · ");
  if (type === "contact") return x.subject || (x.message || "").slice(0, 70);
  return [x.placement_type, (x.fields || []).join(", "), x.institution].filter(Boolean).join(" · ");
}

function Detail({ item, statuses, me, onClose, onSaved, onDeleted }) {
  const [notes, setNotes] = useState(item.notes || "");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const d = item.data;
  const wa = (item.phone || "").replace(/\D/g, "");
  async function save(patch) {
    setBusy(true);
    try { const r = await sfetch(`/submissions/${item.id}`, { method: "PATCH", body: patch }); onSaved(r.item); toast("Saved"); }
    catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }
  async function remove() {
    try { await sfetch(`/submissions/${item.id}`, { method: "DELETE" }); toast("Deleted"); onDeleted(); }
    catch (e) { toast(e.message, "bad"); }
  }
  return (
    <Drawer title={item.name} onClose={onClose}
      footer={me.role === "admin" && <Confirm text="Delete this submission for good?" onYes={remove}>Delete</Confirm>}>
      <div className="sd-row sd-wrap">
        <a className="sd-btn sm" href={`mailto:${item.email}`}><Mail size={15} /> Email</a>
        {item.phone && <a className="sd-btn sm ghost" href={`tel:${item.phone}`}><Phone size={15} /> Call</a>}
        {wa && <a className="sd-btn sm ghost" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={15} /> WhatsApp</a>}
      </div>
      {item.type === "member" && <AddToRegister item={item} onSaved={onSaved} />}
      <Field label="Status">
        <div className="sd-statuses">{statuses.map((s) => (
          <button key={s} type="button" disabled={busy} className={"sd-pill s-" + s + (item.status === s ? " on" : "")} onClick={() => save({ status: s })}>{s}</button>))}
        </div>
      </Field>
      <dl className="sd-dl">
        {Object.entries(d).filter(([k]) => !k.startsWith("_") && k !== "honeypot").map(([k, v]) => (
          <div key={k}><dt>{NICE[k] || k}</dt><dd>{
            k === "cv_link" && v ? <a href={v} target="_blank" rel="noopener noreferrer">{v}</a>
              : Array.isArray(v) ? (v.join(", ") || "-") : typeof v === "boolean" ? (v ? "Yes" : "No") : (String(v) || "-")
          }</dd></div>))}
        <div><dt>Received</dt><dd>{when(item.created_at)}</dd></div>
        {item.updated_by && <div><dt>Last updated</dt><dd>{when(item.updated_at)} by {item.updated_by}</dd></div>}
      </dl>
      <Field label="Staff notes" hint="Only staff can see these.">
        <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Called on 12 Nov, will pay registration on Friday." />
      </Field>
      <button className="sd-btn" disabled={busy || notes === (item.notes || "")} onClick={() => save({ notes })}>Save notes</button>
    </Drawer>
  );
}

function AddToRegister({ item, onSaved }) {
  const [state, setState] = useState("");
  const toast = useToast();
  async function add() {
    setState("busy");
    try {
      const r = await sfetch(`/members/from-application/${item.id}`, { method: "POST" });
      toast(`${r.item.full_name} added to the register as ${r.item.member_no}`);
      setState("done");
      onSaved({ ...item, status: item.status === "new" || item.status === "contacted" ? "approved" : item.status });
    } catch (e) { toast(e.message, "bad"); setState("err:" + e.message); }
  }
  if (state === "done") return <p className="sd-alert ok">Added to the members register. Record their payments under Members.</p>;
  return (
    <div className="sd-callout">
      <div><b>Approve as a member</b><small>Adds {item.name} to the members register with a {item.data.monthly_pledge ? `KES ${Number(item.data.monthly_pledge).toLocaleString("en-US")} monthly pledge` : "monthly pledge"}, so you can track their payments.</small>
        {state.startsWith("err:") && <small className="sd-err">{state.slice(4)}</small>}</div>
      <button className="sd-btn" onClick={add} disabled={state === "busy"}><UserCheck size={16} /> {state === "busy" ? "Adding..." : "Add to register"}</button>
    </div>
  );
}
