import { useState } from "react";
import { Link } from "react-router-dom";

const empty = { full_name:"", email:"", phone:"", county:"", institution:"", course:"", graduation_year:"",
  aedt_status:"", employment_status:"", industry:"", interests:[], monthly_pledge:"", consent:false, honeypot:"" };
const presets = ["500", "1000", "2000"];
const kes = (n) => "KES " + Number(n).toLocaleString("en-KE");

export default function Membership() {
  const [f, setF] = useState(empty);
  const [other, setOther] = useState(false);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy:false, ok:"", fail:"" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (v) => setF({ ...f, interests: f.interests.includes(v) ? f.interests.filter(x => x !== v) : [...f.interests, v] });
  const Err = ({ k }) => errors[k] ? <span className="err" role="alert">{errors[k]}</span> : null;

  async function submit(e) {
    e.preventDefault();
    setState({ busy:true, ok:"", fail:"" }); setErrors({});
    try {
      const body = { ...f, monthly_pledge: parseInt(f.monthly_pledge, 10) || 0 };
      const r = await fetch("/api/members", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.ok) {
        setState({ busy:false, ok: d.message || "Application received.", fail:"" });
        setF(empty); setOther(false);
        window.scrollTo({ top: document.getElementById("join").offsetTop - 80, behavior: "smooth" });
      } else {
        setErrors(d.errors || {});
        setState({ busy:false, ok:"", fail:"Please fix the highlighted fields." });
      }
    } catch { setState({ busy:false, ok:"", fail:"Could not reach the server. Check your connection and try again." }); }
  }

  return (
    <>
      <section className="pagehead" style={{ backgroundImage: "url(/images/gathering-1.jpg)" }}>
        <div className="wrap">
          <h1>Join the Association</h1>
          <p>Membership is voluntary and open to AEDT beneficiaries and graduates.</p>
        </div>
      </section>

      <section className="wrap page">
        <div className="ticket bordered" aria-label="Membership contributions">
          <div><b>KES 500</b><span>registration, paid once</span></div>
          <div><b>You choose</b><span>monthly contribution</span></div>
        </div>
        <p style={{ marginTop: "1.4rem" }}>The registration fee is the same for everyone. Each month you give what you are able to, and you pick your amount on the form below. The constitution will confirm final eligibility and approval rules.</p>
        <h2>Your responsibilities</h2>
        <ul>
          <li>Pay the KES 500 registration fee once, and your chosen monthly contribution on time.</li>
          <li>Take part in programmes, and mentor or volunteer where you can.</li>
          <li>Keep other members' information private.</li>
        </ul>
      </section>

      <section className="section sand" id="join">
        <div className="wrap">
          <h2>Membership form</h2>
          {state.ok && (
            <div className="notice ok" role="status">
              <p>{state.ok}</p>
              <Link className="btn green" to="/contribute#record">Pay the KES 500 registration fee</Link>
            </div>
          )}
          {state.fail && <div className="notice bad" role="alert">{state.fail}</div>}
          <form className="form" onSubmit={submit} noValidate>
            <label>Full name *<input value={f.full_name} onChange={set("full_name")} autoComplete="name" required /><Err k="full_name" /></label>
            <div className="grid2">
              <label>Email *<input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /><Err k="email" /></label>
              <label>Phone *<input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="0712 345 678" required /><Err k="phone" /></label>
            </div>
            <div className="grid2">
              <label>County or town<input value={f.county} onChange={set("county")} /></label>
              <label>Your AEDT status *
                <select value={f.aedt_status} onChange={set("aedt_status")} required>
                  <option value="">Choose one</option>
                  <option value="current">Current beneficiary</option><option value="graduate">Graduate</option>
                  <option value="former">Former beneficiary</option><option value="other">Other</option>
                </select><Err k="aedt_status" />
              </label>
            </div>
            <div className="grid2">
              <label>Institution<input value={f.institution} onChange={set("institution")} /></label>
              <label>Course or qualification<input value={f.course} onChange={set("course")} /></label>
            </div>
            <div className="grid2">
              <label>Graduation year<input inputMode="numeric" maxLength={4} value={f.graduation_year} onChange={set("graduation_year")} /></label>
              <label>Employment status
                <select value={f.employment_status} onChange={set("employment_status")}>
                  <option value="">Choose one</option><option>Student</option><option>Employed</option><option>Self-employed</option><option>Seeking work</option>
                </select>
              </label>
            </div>
            <label>Industry or skills<input value={f.industry} onChange={set("industry")} /></label>

            <fieldset className="pledge"><legend>My monthly contribution *</legend>
              <p className="hint">Choose what you can give each month. The KES 500 registration fee is paid once, separately.</p>
              <div className="picks">
                {presets.map((v) => (
                  <label key={v} className="pick">
                    <input type="radio" name="pledge" checked={!other && f.monthly_pledge === v}
                      onChange={() => { setOther(false); setF({ ...f, monthly_pledge: v }); }} />
                    <span>{kes(v)}</span>
                  </label>
                ))}
                <label className="pick">
                  <input type="radio" name="pledge" checked={other}
                    onChange={() => { setOther(true); setF({ ...f, monthly_pledge: "" }); }} />
                  <span>Other amount</span>
                </label>
              </div>
              {other && (
                <label className="other">Amount per month (KES)
                  <input type="number" inputMode="numeric" min="100" step="50" value={f.monthly_pledge} onChange={set("monthly_pledge")} placeholder="e.g. 750" />
                </label>
              )}
              <Err k="monthly_pledge" />
            </fieldset>

            <fieldset><legend>I would like to help with</legend>
              <div className="checks">
                {["mentorship","training","volunteering","fundraising"].map(v => (
                  <label key={v} className="check"><input type="checkbox" checked={f.interests.includes(v)} onChange={() => toggle(v)} />{v[0].toUpperCase()+v.slice(1)}</label>
                ))}
              </div>
            </fieldset>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.honeypot} onChange={set("honeypot")} name="website" />
            <label className="check">
              <input type="checkbox" checked={f.consent} onChange={e => setF({ ...f, consent: e.target.checked })} />
              <span>I am joining willingly and agree to the <Link to="/privacy" target="_blank">privacy statement</Link>. I understand the KES 500 registration fee, and I will pay the monthly contribution I chose above. *</span>
            </label>
            <Err k="consent" />
            <div><button className="btn green" disabled={state.busy}>{state.busy ? "Sending…" : "Submit application"}</button></div>
          </form>
        </div>
      </section>
    </>
  );
}