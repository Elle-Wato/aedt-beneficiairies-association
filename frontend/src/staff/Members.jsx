import { useCallback, useEffect, useState } from "react";
import { Plus, Upload, Download, Search, Wallet, Phone, MessageCircle, Mail } from "lucide-react";
import { sfetch, download, kes, when } from "./client.js";
import { Drawer, Field, Pager, Confirm, Empty, useToast } from "./ui.jsx";
import { GiftForm } from "./Contributions.jsx";

const blank = () => ({ full_name: "", email: "", phone: "", county: "", institution: "", aedt_status: "", monthly_pledge: 500, joined_on: new Date().toISOString().slice(0, 10), status: "active", notes: "", member_no: "" });
const TEMPLATE = "name,phone,email,monthly_pledge,joined_on,member_no,county,institution\nAmina Yusuf,0722111222,amina@example.com,1000,2026-01-10,,Garissa,University of Nairobi\n";

export default function Members({ me }) {
  const [f, setF] = useState({ q: "", status: "active", view: "", sort: "name" });
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const [open, setOpen] = useState(null);       // member id or "new"
  const [importing, setImporting] = useState(false);
  const toast = useToast();
  const load = useCallback(() => {
    const qs = new URLSearchParams({ q: f.q, status: f.status, sort: f.sort, page, ...(f.view ? { [f.view]: 1 } : {}) });
    sfetch("/members?" + qs).then(setD).catch((e) => toast(e.message, "bad"));
  }, [f, page, toast]);
  useEffect(() => { const t = setTimeout(load, f.q ? 300 : 0); return () => clearTimeout(t); }, [load, f.q]);
  const set = (k) => (e) => { setPage(1); setF({ ...f, [k]: e.target.value }); };
  const s = d?.summary;
  const rate = s && s.committed_monthly ? Math.round((s.collected_this_month / s.committed_monthly) * 100) : 0;
  const month = new Date().toLocaleDateString("en-GB", { month: "long" });

  return (
    <div className="sd-stack">
      {s && (
        <div className="sd-cards">
          <div className="sd-card sd-stat"><small>Active members</small><b>{s.active}</b><span>{s.total} in the register</span></div>
          <div className="sd-card sd-stat"><small>Committed every month</small><b>{kes(s.committed_monthly)}</b><span>sum of active members' pledges</span></div>
          <div className="sd-card sd-stat"><small>Collected in {month}</small><b>{kes(s.collected_this_month)}</b>
            <span className="sd-bar sm"><i style={{ width: Math.min(100, rate) + "%" }} /></span><span>{rate}% of commitments · {s.paid_this_month_count} members paid</span></div>
          <button className="sd-card sd-stat warn" onClick={() => { setPage(1); setF({ ...f, view: "behind", status: "active", sort: "behind" }); }}>
            <small>Behind on pledges</small><b>{s.behind}</b><span>{kes(s.arrears)} outstanding · {s.registration_unpaid} haven't paid registration</span></button>
        </div>)}
      <div className="sd-toolbar">
        <div className="sd-search"><Search size={16} /><input placeholder="Search name, member no., phone or email" value={f.q} onChange={set("q")} /></div>
        <select value={f.view} onChange={set("view")} aria-label="Show">
          <option value="">Everyone</option><option value="behind">Behind on pledges</option><option value="unpaid_reg">Registration not paid</option>
        </select>
        <select value={f.status} onChange={set("status")} aria-label="Status">
          <option value="">Any status</option><option value="active">Active</option><option value="paused">Paused</option><option value="left">Left</option>
        </select>
        <select value={f.sort} onChange={set("sort")} aria-label="Sort">
          <option value="name">Sort by name</option><option value="behind">Most behind first</option><option value="pledge">Highest pledge first</option><option value="joined">Newest first</option>
        </select>
      </div>
      <div className="sd-row sd-wrap">
        <button className="sd-btn primary" onClick={() => setOpen("new")}><Plus size={16} /> Add member</button>
        <button className="sd-btn ghost" onClick={() => setImporting(true)}><Upload size={16} /> Import existing list</button>
        <button className="sd-btn ghost" onClick={() => download("/export/members", "aedt-members.csv").catch((e) => toast(e.message, "bad"))}><Download size={16} /> Download register (CSV)</button>
      </div>
      {!d ? <p className="sd-muted">Loading...</p> : !d.items.length ? <Empty>No members match. Approve membership applications from the Inbox, add members here, or import your existing list.</Empty> : (
        <div className="sd-table-wrap"><table className="sd-table">
          <thead><tr><th>Member</th><th>Pledge / month</th><th className="sd-hide-m">Paid to date</th><th>Balance</th><th className="sd-hide-m">This month</th><th className="sd-hide-m">Last paid</th></tr></thead>
          <tbody>{d.items.map((m) => (
            <tr key={m.id} onClick={() => setOpen(m.id)} className={m.status !== "active" ? "void" : ""}>
              <td><b>{m.full_name}</b><small>{m.member_no} · {m.phone || m.email || "no contact"}{m.status !== "active" ? ` · ${m.status}` : ""}{!m.registration_paid && m.status === "active" ? " · registration unpaid" : ""}</small></td>
              <td><b>{kes(m.monthly_pledge)}</b></td>
              <td className="sd-hide-m">{kes(m.paid)}<small>of {kes(m.expected)} expected ({m.months_due} mo.)</small></td>
              <td><span className={"sd-bal " + (m.balance < 0 ? "neg" : "pos")}>{m.balance < 0 ? "-" : m.balance > 0 ? "+" : ""}{kes(Math.abs(m.balance))}</span>
                {m.months_behind > 0 && <small>{m.months_behind} month{m.months_behind > 1 ? "s" : ""} behind</small>}</td>
              <td className="sd-hide-m">{m.paid_this_month ? <span className="sd-pill s-paid">{kes(m.paid_this_month)}</span> : <span className="sd-muted">-</span>}</td>
              <td className="sd-hide-m"><small>{m.last_payment ? when(m.last_payment) : "Never"}</small></td>
            </tr>))}
          </tbody></table></div>)}
      {d && <Pager page={d.page} total={d.total} per={d.per_page} onPage={setPage} />}
      {open && <MemberDrawer id={open === "new" ? null : open} me={me} onClose={() => setOpen(null)} onChanged={load}
        onCreated={(id) => { setOpen(id); load(); }} />}
      {importing && <ImportMembers onClose={() => setImporting(false)} onDone={() => { setImporting(false); load(); }} />}
    </div>
  );
}

function MemberDrawer({ id, me, onClose, onChanged, onCreated }) {
  const [m, setM] = useState(id ? null : blank());
  const [pays, setPays] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pay, setPay] = useState(null);
  const toast = useToast();
  const load = useCallback(() => {
    if (id) sfetch(`/members/${id}`).then((d) => { setM(d.item); setPays(d.payments); }).catch((e) => toast(e.message, "bad"));
  }, [id, toast]);
  useEffect(load, [load]);
  if (!m) return <Drawer title="Member" onClose={onClose}><p className="sd-muted">Loading...</p></Drawer>;
  const set = (k) => (e) => setM({ ...m, [k]: e.target.value });
  async function save() {
    setBusy(true); setErrors({});
    try {
      if (id) { const r = await sfetch(`/members/${id}`, { method: "PUT", body: m }); setM(r.item); toast("Saved"); onChanged(); }
      else { const r = await sfetch("/members", { method: "POST", body: m }); toast(`${r.item.full_name} added as ${r.item.member_no}`); onCreated(r.item.id); }
    } catch (e) { setErrors(e.errors || {}); toast(e.message, "bad"); } finally { setBusy(false); }
  }
  async function remove() {
    try { await sfetch(`/members/${id}`, { method: "DELETE" }); toast("Member removed"); onChanged(); onClose(); } catch (e) { toast(e.message, "bad"); }
  }
  const wa = (m.phone || "").replace(/\D/g, "");
  const reminder = encodeURIComponent(`Hello ${m.full_name?.split(" ")[0] || ""}, this is a friendly reminder from the AEDT Beneficiaries Association about your monthly contribution of KES ${Number(m.monthly_pledge || 0).toLocaleString("en-US")}. Pay Bill 630640, account 937937#fees. Thank you for giving back!`);
  return (
    <Drawer title={id ? `${m.full_name} · ${m.member_no}` : "Add member"} onClose={onClose} wide
      footer={<>
        <button className="sd-btn primary" onClick={save} disabled={busy}>{busy ? "Saving..." : id ? "Save changes" : "Add member"}</button>
        <button className="sd-btn ghost" onClick={onClose}>Close</button>
        {id && me.role === "admin" && <span className="sd-push"><Confirm text="Remove from the register?" onYes={remove}>Remove</Confirm></span>}
      </>}>
      {id && (
        <>
          <div className="sd-money four">
            <div><small>Pledge per month</small><b>{kes(m.monthly_pledge)}</b></div>
            <div><small>Paid to date</small><b>{kes(m.paid)}</b></div>
            <div><small>Expected since joining</small><b>{kes(m.expected)}</b></div>
            <div className={m.balance < 0 ? "neg" : "pos"}><small>Balance</small><b>{m.balance < 0 ? "-" : ""}{kes(Math.abs(m.balance))}</b></div>
          </div>
          <div className="sd-row sd-wrap">
            <button className="sd-btn" onClick={() => setPay("monthly")}><Wallet size={16} /> Record monthly payment</button>
            {!m.registration_paid && <button className="sd-btn ghost" onClick={() => setPay("registration")}>Record KES 500 registration</button>}
            {wa && <a className="sd-btn ghost" href={`https://wa.me/${wa}?text=${reminder}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} /> WhatsApp reminder</a>}
            {m.phone && <a className="sd-btn ghost" href={`tel:${m.phone}`}><Phone size={16} /> Call</a>}
            {m.email && <a className="sd-btn ghost" href={`mailto:${m.email}`}><Mail size={16} /> Email</a>}
          </div>
        </>)}
      <div className="sd-form">
        <h3 className="sd-form-sec">Details</h3>
        <Field label="Full name" error={errors.full_name}><input value={m.full_name} onChange={set("full_name")} /></Field>
        <Field label="Member number" error={errors.member_no} hint={id ? "" : "Leave empty to number automatically (AEDT-0001...)."}><input value={m.member_no || ""} onChange={set("member_no")} /></Field>
        <Field label="Phone" error={errors.phone}><input value={m.phone} onChange={set("phone")} placeholder="0712 345 678" /></Field>
        <Field label="Email" error={errors.email}><input type="email" value={m.email} onChange={set("email")} /></Field>
        <Field label="County"><input value={m.county} onChange={set("county")} /></Field>
        <Field label="Institution"><input value={m.institution} onChange={set("institution")} /></Field>
        <Field label="AEDT status"><select value={m.aedt_status} onChange={set("aedt_status")}><option value="">Not given</option><option value="current">Current beneficiary</option><option value="graduate">Graduate</option><option value="former">Former beneficiary</option><option value="other">Other</option></select></Field>
        <Field label="Membership status" hint="Paused and left members are not counted as behind."><select value={m.status} onChange={set("status")}><option value="active">Active</option><option value="paused">Paused</option><option value="left">Left</option></select></Field>
        <h3 className="sd-form-sec">Monthly commitment</h3>
        <Field label="Pledge per month (KES)" error={errors.monthly_pledge}><input inputMode="numeric" value={m.monthly_pledge} onChange={set("monthly_pledge")} /></Field>
        <Field label="Joined on" error={errors.joined_on} hint="Pledges are expected from this month onwards."><input type="date" value={m.joined_on} onChange={set("joined_on")} /></Field>
        <Field label="Notes (staff only)" full><textarea rows={3} value={m.notes} onChange={set("notes")} /></Field>
      </div>
      {id && (
        <section className="sd-card sd-gifts">
          <h3>Payment history</h3>
          {!pays.length ? <p className="sd-muted">No payments recorded yet.</p> : (
            <ul className="sd-list">{pays.map((p) => (
              <li key={p.id}><span className="sd-li"><span><b>{kes(p.amount)}</b><small>{({ monthly: "Monthly contribution", registration: "Registration fee", donation: "Donation" })[p.kind]} · {when(p.received_on)} · {p.reference || "no code"}</small></span>
                {p.status !== "confirmed" && <span className="sd-tag">{p.status}</span>}</span></li>))}
            </ul>)}
        </section>)}
      {pay && <GiftForm g={{ amount: pay === "registration" ? 500 : m.monthly_pledge, kind: pay, member: { id: m.id, name: m.full_name, member_no: m.member_no }, member_id: m.id, campaign_slug: "", reference: "", donor_name: m.full_name, phone: m.phone, channel: "mpesa", received_on: new Date().toISOString().slice(0, 10), status: "confirmed", account_ref: pay === "registration" ? "" : "937937#fees", note: "" }}
        camps={[]} me={me} onClose={() => setPay(null)} onDone={() => { setPay(null); load(); onChanged(); }} />}
    </Drawer>
  );
}

function ImportMembers({ onClose, onDone }) {
  const [text, setText] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function run() {
    setBusy(true);
    try { setRes(await sfetch("/members/import", { method: "POST", body: { csv: text } })); } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }
  return (
    <Drawer title="Import your existing members list" onClose={res ? onDone : onClose} wide
      footer={res ? <button className="sd-btn primary" onClick={onDone}>Done</button> : <>
        <button className="sd-btn primary" onClick={run} disabled={busy || !text.trim()}>{busy ? "Importing..." : "Import"}</button>
        <button className="sd-btn ghost" onClick={onClose}>Cancel</button></>}>
      {res ? (
        <div className="sd-stack">
          <p className="sd-alert ok">{res.added} member(s) added. {res.skipped} skipped because their phone or email is already in the register.</p>
          {res.problems.length > 0 && <ul className="sd-problems">{res.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
        </div>
      ) : (
        <div className="sd-stack">
          <p className="sd-muted">Save your spreadsheet as CSV (in Excel: File, Save As, CSV UTF-8). The first row must be the column names. Only <b>name</b> is required; <b>monthly_pledge</b> and <b>joined_on</b> (YYYY-MM-DD) make the balances correct. Leave member_no empty to number them automatically.</p>
          <pre className="sd-code">{TEMPLATE}</pre>
          <div className="sd-row sd-wrap">
            <label className="sd-btn ghost"><Upload size={16} /> Choose CSV file<input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0]?.text().then(setText)} /></label>
            <button className="sd-btn ghost" onClick={() => setText(TEMPLATE)}>Start from the template</button>
          </div>
          <Field label="Or paste CSV here" full><textarea rows={10} className="sd-mono" value={text} onChange={(e) => setText(e.target.value)} /></Field>
        </div>)}
    </Drawer>
  );
}
