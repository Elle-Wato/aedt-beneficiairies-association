import { useCallback, useEffect, useState } from "react";
import { Plus, Upload, Download, Search, Pencil } from "lucide-react";
import { sfetch, download, kes, when } from "./client.js";
import { Drawer, Field, Pager, Confirm, Empty, useToast } from "./ui.jsx";
import MemberPicker from "./MemberPicker.jsx";

const KINDS = { donation: "Donation", monthly: "Monthly contribution", registration: "Registration fee" };

const blank = () => ({ kind: "donation", member: null, amount: "", campaign_slug: "", reference: "", donor_name: "", phone: "", channel: "mpesa", received_on: new Date().toISOString().slice(0, 10), status: "confirmed", account_ref: "", note: "" });
const TEMPLATE = "date,amount,reference,name,phone,campaign,account,channel,type,member,note\n2026-11-16,3000,SKA1B2C3D4,Amina H.,,,937937#meals,mpesa,donation,,\n2026-11-16,1000,SKA9Z8Y7X6,Ali Hassan,0711000111,,937937#fees,mpesa,monthly,AEDT-0001,\n";

export default function Contributions({ me }) {
  const [camps, setCamps] = useState([]);
  const [filter, setFilter] = useState({ campaign: "", status: "", q: "", kind: "" });
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const [edit, setEdit] = useState(null);
  const [importing, setImporting] = useState(false);
  const toast = useToast();
  useEffect(() => { sfetch("/content/campaign").then((r) => setCamps(r.items)).catch(() => {}); }, []);
  const load = useCallback(() => {
    const qs = new URLSearchParams({ ...filter, page }).toString();
    sfetch("/contributions?" + qs).then(setD).catch((e) => toast(e.message, "bad"));
  }, [filter, page, toast]);
  useEffect(() => { const t = setTimeout(load, filter.q ? 300 : 0); return () => clearTimeout(t); }, [load, filter.q]);
  const title = (slug) => camps.find((c) => c.slug === slug)?.data.title || slug || "General fund";

  return (
    <div className="sd-stack">
      <p className="sd-muted">Record M-Pesa, bank and cash contributions. Confirmed contributions update campaign progress on the website automatically. Check each payment against your M-Pesa or bank statement before recording it.</p>
      <div className="sd-toolbar">
        <div className="sd-search"><Search size={16} /><input placeholder="Search name, code or phone" value={filter.q} onChange={(e) => { setPage(1); setFilter({ ...filter, q: e.target.value }); }} /></div>
        <select value={filter.campaign} onChange={(e) => { setPage(1); setFilter({ ...filter, campaign: e.target.value }); }} aria-label="Campaign">
          <option value="">All campaigns</option>{camps.map((c) => <option key={c.slug} value={c.slug}>{c.data.title}</option>)}
        </select>
        <select value={filter.kind} onChange={(e) => { setPage(1); setFilter({ ...filter, kind: e.target.value }); }} aria-label="Type">
          <option value="">All types</option>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filter.status} onChange={(e) => { setPage(1); setFilter({ ...filter, status: e.target.value }); }} aria-label="Status">
          <option value="">Any status</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="void">Void</option>
        </select>
      </div>
      <div className="sd-row sd-wrap">
        <button className="sd-btn primary" onClick={() => setEdit(blank())}><Plus size={16} /> Record contribution</button>
        <button className="sd-btn ghost" onClick={() => setImporting(true)}><Upload size={16} /> Import from CSV</button>
        <button className="sd-btn ghost" onClick={() => download("/contributions/export", "aedt-contributions.csv").catch((e) => toast(e.message, "bad"))}><Download size={16} /> Export CSV</button>
        {d && <span className="sd-push sd-total">Confirmed in this view: <b>{kes(d.sum)}</b></span>}
      </div>
      {!d ? <p className="sd-muted">Loading...</p> : !d.items.length ? <Empty>No contributions recorded{filter.campaign || filter.status || filter.q ? " that match these filters" : " yet"}.</Empty> : (
        <div className="sd-table-wrap"><table className="sd-table">
          <thead><tr><th>Date</th><th>Amount</th><th>From</th><th className="sd-hide-m">For</th><th className="sd-hide-m">Code</th><th className="sd-hide-m">Status</th><th /></tr></thead>
          <tbody>{d.items.map((g) => (
            <tr key={g.id} className={g.status === "void" ? "void" : ""} onClick={() => setEdit(g)}>
              <td><small>{when(g.received_on)}</small></td><td><b>{kes(g.amount)}</b></td>
              <td>{g.member ? <>{g.member.name}<small>{g.member.member_no}</small></> : g.donor_name || <span className="sd-muted">Anonymous</span>}<small className="sd-only-m">{g.kind === "donation" ? title(g.campaign_slug) : KINDS[g.kind]}</small></td>
              <td className="sd-hide-m"><small>{g.kind === "donation" ? title(g.campaign_slug) : <span className={"sd-tag " + (g.kind === "monthly" ? "mon" : "")}>{KINDS[g.kind]}</span>}</small></td>
              <td className="sd-hide-m"><small className="sd-mono">{g.reference || "-"}</small></td>
              <td className="sd-hide-m"><span className={"sd-pill s-" + g.status}>{g.status}</span></td>
              <td><Pencil size={15} aria-label="Edit" /></td>
            </tr>))}
          </tbody></table></div>)}
      {d && <Pager page={d.page} total={d.total} per={d.per_page} onPage={setPage} />}
      {edit && <GiftForm g={edit} camps={camps} me={me} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
      {importing && <Import onClose={() => setImporting(false)} onDone={() => { setImporting(false); load(); }} />}
    </div>
  );
}

export function GiftForm({ g, camps, me, onClose, onDone }) {
  const [f, setF] = useState({ kind: "donation", ...g, campaign_slug: g.campaign_slug || "", member: g.member || null });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function save(e) {
    e?.preventDefault(); setBusy(true); setErrors({});
    try {
      const body = { ...f, member_id: f.member?.id || null };
      delete body.member;
      if (g.id) await sfetch(`/contributions/${g.id}`, { method: "PUT", body });
      else await sfetch("/contributions", { method: "POST", body });
      toast(g.id ? "Contribution updated" : `${kes(f.amount)} recorded`); onDone();
    } catch (err) { setErrors(err.errors || {}); toast(err.message, "bad"); }
    finally { setBusy(false); }
  }
  async function remove() {
    try { await sfetch(`/contributions/${g.id}`, { method: "DELETE" }); toast("Deleted"); onDone(); } catch (err) { toast(err.message, "bad"); }
  }
  const pick = (slug) => { const c = camps.find((x) => x.slug === slug); setF({ ...f, campaign_slug: slug, account_ref: f.account_ref || c?.data.mpesaRef || "" }); };
  return (
    <Drawer title={g.id ? "Edit contribution" : "Record a contribution"} onClose={onClose}
      footer={<>
        <button className="sd-btn primary" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save"}</button>
        <button className="sd-btn ghost" onClick={onClose}>Cancel</button>
        {g.id && me.role === "admin" && <span className="sd-push"><Confirm text="Delete for good?" onYes={remove}>Delete</Confirm></span>}
      </>}>
      <form className="sd-form" onSubmit={save}>
        <Field label="Amount (KES)" error={errors.amount}><input inputMode="numeric" value={f.amount} onChange={set("amount")} required autoFocus /></Field>
        <Field label="Date received" error={errors.received_on}><input type="date" value={f.received_on} onChange={set("received_on")} /></Field>
        <Field label="What is this payment?" full>
          <div className="sd-seg" role="radiogroup">{Object.entries(KINDS).map(([k, v]) => (
            <button type="button" key={k} role="radio" aria-checked={f.kind === k} className={f.kind === k ? "on" : ""}
              onClick={() => setF({ ...f, kind: k, amount: k === "registration" && !f.amount ? 500 : f.amount, account_ref: k === "monthly" && !f.account_ref ? "937937#fees" : f.account_ref })}>{v}</button>))}
          </div>
        </Field>
        {f.kind === "donation" ? (
          <Field label="Campaign" error={errors.campaign_slug} full>
            <select value={f.campaign_slug} onChange={(e) => pick(e.target.value)}>
              <option value="">General fund (no campaign)</option>{camps.map((c) => <option key={c.slug} value={c.slug}>{c.data.title}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label={f.kind === "donation" ? "Member (optional, if a member gave this)" : "Member"} error={errors.member_id} full>
          <MemberPicker value={f.member} onChange={(m) => setF({ ...f, member: m, donor_name: m ? m.name : f.donor_name, amount: m && f.kind === "monthly" && !f.amount ? m.pledge : f.amount })} />
        </Field>
        <Field label="How it was paid"><select value={f.channel} onChange={set("channel")}><option value="mpesa">M-Pesa</option><option value="bank">Bank transfer</option><option value="cash">Cash</option><option value="other">Other</option></select></Field>
        <Field label="Transaction code" error={errors.reference} hint="M-Pesa code or bank reference. Stops the same payment being recorded twice."><input value={f.reference || ""} onChange={set("reference")} className="sd-mono" placeholder="SKA1B2C3D4" /></Field>
        <Field label="Name of giver" hint="Leave empty for anonymous."><input value={f.donor_name} onChange={set("donor_name")} /></Field>
        <Field label="Phone (staff only)"><input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Account number used"><input value={f.account_ref} onChange={set("account_ref")} placeholder="937937#meals" /></Field>
        <Field label="Status" hint="Only confirmed money counts towards targets."><select value={f.status} onChange={set("status")}><option value="confirmed">Confirmed</option><option value="pending">Pending (not yet on statement)</option><option value="void">Void (mistake or reversed)</option></select></Field>
        <Field label="Note" full><input value={f.note} onChange={set("note")} /></Field>
        {g.id && <p className="sd-small sd-muted full">Recorded {when(g.created_at)} by {g.created_by || g.source}.</p>}
      </form>
    </Drawer>
  );
}

function Import({ onClose, onDone }) {
  const [text, setText] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const file = (e) => { const f = e.target.files?.[0]; if (f) f.text().then(setText); };
  async function run() {
    setBusy(true);
    try { const r = await sfetch("/contributions/import", { method: "POST", body: { csv: text } }); setRes(r); toast(`${r.added} added`); }
    catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  }
  return (
    <Drawer title="Import contributions" onClose={res ? onDone : onClose} wide
      footer={res ? <button className="sd-btn primary" onClick={onDone}>Done</button> : <>
        <button className="sd-btn primary" onClick={run} disabled={busy || !text.trim()}>{busy ? "Importing..." : "Import"}</button>
        <button className="sd-btn ghost" onClick={onClose}>Cancel</button></>}>
      {res ? (
        <div className="sd-stack">
          <p className="sd-alert ok">{res.added} contribution(s) added. {res.skipped} skipped because the transaction code was already recorded.</p>
          {res.problems.length > 0 && <><p><b>Rows that need fixing:</b></p><ul className="sd-problems">{res.problems.map((p) => <li key={p}>{p}</li>)}</ul></>}
        </div>
      ) : (
        <div className="sd-stack">
          <p className="sd-muted">Use this to add many payments at once, for example from an M-Pesa or bank statement you have checked. The first row must be the column names below. Leave <b>campaign</b> empty and fill <b>account</b> (e.g. 937937#meals) to match each payment to the campaign with that account number. For members' monthly contributions set <b>type</b> to <b>monthly</b> (or <b>registration</b>) and put their member number, phone or email in <b>member</b>. Rows with a code that is already recorded are skipped.</p>
          <pre className="sd-code">{TEMPLATE}</pre>
          <div className="sd-row sd-wrap">
            <label className="sd-btn ghost"><Upload size={16} /> Choose CSV file<input type="file" accept=".csv,text/csv" hidden onChange={file} /></label>
            <button className="sd-btn ghost" onClick={() => setText(TEMPLATE)}>Start from the template</button>
          </div>
          <Field label="Or paste CSV here" full><textarea rows={10} className="sd-mono" value={text} onChange={(e) => setText(e.target.value)} /></Field>
        </div>
      )}
    </Drawer>
  );
}
