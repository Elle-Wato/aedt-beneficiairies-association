import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Wallet, CalendarHeart, Check, ShieldCheck, ArrowRight } from "lucide-react";
import PageHero from "../components/PageHero.jsx";
import Reveal from "../components/Reveal.jsx";

const empty = { full_name:"", email:"", phone:"", county:"", institution:"", course:"", graduation_year:"",
  aedt_status:"", employment_status:"", industry:"", interests:[], monthly_pledge:"", consent:false, honeypot:"" };
const presets = ["500", "1000", "2000"];
const kes = (n) => "KES " + Number(n).toLocaleString("en-KE");
const interestList = ["mentorship", "training", "volunteering", "fundraising"];
const cap = (v) => v[0].toUpperCase() + v.slice(1);

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

  const pledge = parseInt(f.monthly_pledge, 10);

  return (
    <div className="px" data-own-motion>
      <PageHero kicker="Membership" title="Join the Association." hl="Association."
        text="Membership is voluntary and open to AEDT beneficiaries and graduates." image="/images/iftar-dinner.jpg">
        <div className="px-ticket" aria-label="Membership contributions">
          <div><b>KES 500</b><span>registration, paid once</span></div>
          <div><b>You choose</b><span>monthly contribution</span></div>
        </div>
      </PageHero>

      <section className="section">
        <div className="wrap">
          <Reveal className="px-head center">
            <span className="eyebrow">How joining works</span>
            <h2>Three simple steps.</h2>
          </Reveal>
          <div className="px-steps">
            {[
              [ClipboardList, "Fill in the form", "Tell us about yourself and choose your monthly contribution.", "#join", "Go to the form"],
              [Wallet, "Pay the registration", "Pay the one-time KES 500 registration fee by M-Pesa.", "/contribute", "How to pay"],
              [CalendarHeart, "Give each month", "Give the amount you chose, and take part where you can.", "/programmes", "Our programmes"],
            ].map(([Icon, t, d, to, go], k) => (
              <Reveal key={t} delay={k * 100}>
                <div className="px-step">
                  <span className="px-step-n">{k + 1}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                  {to.startsWith("#")
                    ? <a href={to} onClick={(e) => { e.preventDefault(); document.getElementById("join")?.scrollIntoView({ behavior: "smooth" }); }}>{go} <ArrowRight size={15} /></a>
                    : <Link to={to}>{go} <ArrowRight size={15} /></Link>}
                </div>
              </Reveal>
            ))}
          </div>

          <div className="px-resp">
            <Reveal>
              <span className="eyebrow">Good to know</span>
              <h2>Fair for everyone.</h2>
              <p className="lede">The registration fee is the same for everyone. Each month you give what you are able to, and you pick your amount on the form below. The constitution will confirm final eligibility and approval rules.</p>
            </Reveal>
            <Reveal className="px-sidecard" delay={120}>
              <h3><ShieldCheck size={20} style={{ verticalAlign: "-4px", marginRight: 6, color: "var(--green)" }} />Your responsibilities</h3>
              <ul className="px-list">
                <li><Check size={18} /> Pay the KES 500 registration fee once, and your chosen monthly contribution on time.</li>
                <li><Check size={18} /> Take part in programmes, and mentor or volunteer where you can.</li>
                <li><Check size={18} /> Keep other members' information private.</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section tinted" id="join">
        <div className="wrap px-formgrid">
          <div className="px-formcard">
            <h2>Membership form</h2>
            <p className="px-sub">It takes about three minutes. Fields marked * are required.</p>
            {state.ok && (
              <div className="notice ok" role="status">
                <p>{state.ok}</p>
                <Link className="btn green" to="/contribute#record">Pay the KES 500 registration fee</Link>
              </div>
            )}
            {state.fail && <div className="notice bad" role="alert">{state.fail}</div>}
            <form className="form" onSubmit={submit} noValidate>
              <h3 className="px-group"><span>1</span> About you</h3>
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

              <h3 className="px-group"><span>2</span> Studies and work</h3>
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

              <h3 className="px-group"><span>3</span> Your contribution</h3>
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

              <h3 className="px-group"><span>4</span> Getting involved</h3>
              <fieldset><legend>I would like to help with</legend>
                <div className="picks">
                  {interestList.map(v => (
                    <label key={v} className="pick"><input type="checkbox" checked={f.interests.includes(v)} onChange={() => toggle(v)} /><span>{cap(v)}</span></label>
                  ))}
                </div>
              </fieldset>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.honeypot} onChange={set("honeypot")} name="website" />
              <label className="check">
                <input type="checkbox" checked={f.consent} onChange={e => setF({ ...f, consent: e.target.checked })} />
                <span>I am joining willingly and agree to the <Link to="/privacy" target="_blank">privacy statement</Link>. I understand the KES 500 registration fee, and I will pay the monthly contribution I chose above. *</span>
              </label>
              <Err k="consent" />
              <div><button className="btn green" disabled={state.busy}>{state.busy ? "Sending…" : <>Submit application <ArrowRight size={17} /></>}</button></div>
            </form>
          </div>

          <aside className="px-side" aria-label="Your membership summary">
            <div className="px-sidecard dark">
              <h3>Your membership</h3>
              <div className="px-sum"><span>Registration</span><b>KES 500</b></div>
              <div className="px-sum"><span>Monthly contribution</span>{pledge >= 1 ? <b>{kes(pledge)}</b> : <b className="muted">Choose on the form</b>}</div>
              {f.interests.length > 0 && <div className="px-chips">{f.interests.map((i) => <i key={i}>{cap(i)}</i>)}</div>}
            </div>
            <div className="px-sidecard">
              <h3>What you are part of</h3>
              <ul className="px-list">
                <li><Check size={18} /> School fees for needy students</li>
                <li><Check size={18} /> Meal support for students</li>
                <li><Check size={18} /> Mentorship and skills development</li>
                <li><Check size={18} /> Community service</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
