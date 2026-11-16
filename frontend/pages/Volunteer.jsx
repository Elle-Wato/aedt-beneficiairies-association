import { useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, TreePine, Users, Check, Clock, ArrowRight } from "lucide-react";
import PageHero from "../components/PageHero.jsx";
import Reveal from "../components/Reveal.jsx";
import { api } from "../data/live.jsx";

const roles = [
  ["mentor", HeartHandshake, "Mentor", "Guide students and members"],
  ["volunteer", TreePine, "Volunteer", "Join community activities"],
  ["both", Users, "Both", "Mentor and volunteer"],
];
// EDIT HERE: the choices people see on the form (keep them identical to the lists in app.py)
const mentorAreas = ["Career guidance", "Study skills and exams", "Leadership and personal growth", "Business and entrepreneurship", "Digital skills and technology", "University and scholarship applications"];
const volunteerAreas = ["Tree planting and clean-ups", "Children's home visits", "Mosque and community clean-ups", "Fundraising", "Event organising", "Photography and social media"];

const empty = { full_name: "", email: "", phone: "", role: "", is_member: "", location: "", profession: "", organisation: "",
  mentor_areas: [], volunteer_areas: [], availability: "", experience: "", consent: false, honeypot: "" };

export default function Volunteer() {
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy: false, ok: "", fail: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k, v) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });
  const Err = ({ k }) => (errors[k] ? <span className="err" role="alert">{errors[k]}</span> : null);
  const wantsMentor = f.role === "mentor" || f.role === "both";
  const wantsVolunteer = f.role === "volunteer" || f.role === "both";

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, ok: "", fail: "" }); setErrors({});
    try {
      const r = await fetch(api("/api/volunteers"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json();
      if (d.ok) { setState({ busy: false, ok: d.message, fail: "" }); setF(empty); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }
      else { setErrors(d.errors || {}); setState({ busy: false, ok: "", fail: "Please fix the highlighted fields." }); }
    } catch { setState({ busy: false, ok: "", fail: "Could not reach the server. Check your connection and try again." }); }
  }

  return (
    <div className="px" data-own-motion>
      <PageHero kicker="Get involved" title="Mentor or volunteer with us." hl="volunteer with us."
        text="Give your time and skills. You do not need to be a paying member to sign up." image="/images/volunteers-info-desk.jpg">
        <div className="px-hero-actions">
          <a className="btn" href="#signup" onClick={(e) => { e.preventDefault(); document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" }); }}>Sign up now <ArrowRight size={17} /></a>
          <Link className="btn ghost" to="/programmes#mentorship">How mentorship works</Link>
        </div>
      </PageHero>

      <section className="section">
        <div className="wrap">
          <Reveal className="px-head center">
            <span className="eyebrow">Ways to help</span>
            <h2>Share what you know. Give where you can.</h2>
          </Reveal>
          <div className="px-steps">
            {[
              [HeartHandshake, "Mentor", `Guide students on ${mentorAreas.slice(0, 3).join(", ").toLowerCase()} and more.`],
              [TreePine, "Volunteer", `Help with ${volunteerAreas.slice(0, 3).join(", ").toLowerCase()} and more.`],
              [Clock, "On your time", "A few hours a month, weekends, evenings, or whenever suits you."],
            ].map(([Icon, t, d], k) => (
              <Reveal key={t} delay={k * 100}>
                <div className="px-step">
                  <span className="px-step-n"><Icon size={20} /></span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section tinted" id="signup">
        <div className="wrap px-formgrid">
          <div className="px-formcard">
            <h2>Sign up</h2>
            <p className="px-sub">Tell us how you would like to help. Fields marked * are required.</p>
            {state.ok && <div className="notice ok" role="status">{state.ok}</div>}
            {state.fail && <div className="notice bad" role="alert">{state.fail}</div>}

            <form className="form" onSubmit={submit} noValidate>
              <fieldset><legend>How would you like to help? *</legend>
                <div className="roles">
                  {roles.map(([v, Icon, title, text]) => (
                    <label key={v} className="role">
                      <input type="radio" name="role" checked={f.role === v} onChange={() => setF({ ...f, role: v })} />
                      <span className="card"><Icon size={28} /><b>{title}</b><small>{text}</small></span>
                    </label>
                  ))}
                </div>
                <Err k="role" />
              </fieldset>

              <h3 className="px-group"><span>1</span> Your details</h3>
              <label>Full name *<input value={f.full_name} onChange={set("full_name")} autoComplete="name" /><Err k="full_name" /></label>
              <div className="grid2">
                <label>Email *<input type="email" value={f.email} onChange={set("email")} autoComplete="email" /><Err k="email" /></label>
                <label>Phone *<input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="0712 345 678" /><Err k="phone" /></label>
              </div>
              <div className="grid2">
                <label>Where are you based?<input value={f.location} onChange={set("location")} placeholder="Town or county" /></label>
                <label>Are you a member of the Association?
                  <select value={f.is_member} onChange={set("is_member")}>
                    <option value="">Choose one</option><option value="yes">Yes</option><option value="applying">I am applying</option><option value="no">Not yet</option>
                  </select>
                </label>
              </div>
              <div className="grid2">
                <label>Profession or field<input value={f.profession} onChange={set("profession")} placeholder="e.g. Accountant, Teacher" /></label>
                <label>Organisation<input value={f.organisation} onChange={set("organisation")} /></label>
              </div>

              {(wantsMentor || wantsVolunteer) && <h3 className="px-group"><span>2</span> Where you can help</h3>}
              {wantsMentor && (
                <fieldset className="sub"><legend>I can mentor in *</legend>
                  <div className="picks">
                    {mentorAreas.map((a) => (
                      <label key={a} className="pick"><input type="checkbox" checked={f.mentor_areas.includes(a)} onChange={() => toggle("mentor_areas", a)} /><span>{a}</span></label>
                    ))}
                  </div>
                  <Err k="mentor_areas" />
                </fieldset>
              )}
              {wantsVolunteer && (
                <fieldset className="sub"><legend>I can help with *</legend>
                  <div className="picks">
                    {volunteerAreas.map((a) => (
                      <label key={a} className="pick"><input type="checkbox" checked={f.volunteer_areas.includes(a)} onChange={() => toggle("volunteer_areas", a)} /><span>{a}</span></label>
                    ))}
                  </div>
                  <Err k="volunteer_areas" />
                </fieldset>
              )}

              <h3 className="px-group"><span>{wantsMentor || wantsVolunteer ? 3 : 2}</span> Time and experience</h3>
              <label>How much time can you give?
                <select value={f.availability} onChange={set("availability")}>
                  <option value="">Choose one</option>
                  <option>A few hours a month</option><option>Weekends</option><option>Weekday evenings</option><option>Flexible</option>
                </select>
              </label>
              <label>Tell us a little about your experience
                <textarea rows={4} maxLength={800} value={f.experience} onChange={set("experience")} placeholder="Optional. Past mentoring, volunteering or skills you can share." />
              </label>

              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.honeypot} onChange={set("honeypot")} name="website" />
              <label className="check">
                <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
                <span>I agree that the Association may store these details and contact me about mentoring and volunteering, as explained in the <Link to="/privacy" target="_blank">privacy statement</Link>. *</span>
              </label>
              <Err k="consent" />
              <div><button className="btn green" disabled={state.busy}>{state.busy ? "Sending…" : <>Add me to the list <ArrowRight size={17} /></>}</button></div>
            </form>
          </div>

          <aside className="px-side">
            <div className="px-sidecard dark">
              <h3>Good to know</h3>
              <ul className="px-list" style={{ color: "#fff" }}>
                {["You do not need to be a paying member.", "Pick the areas and time that suit you.", "We will contact you about mentoring and volunteering opportunities."].map((t) => (
                  <li key={t} style={{ color: "#fff" }}><Check size={18} style={{ color: "var(--gold)" }} /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="px-sidecard">
              <h3>Want to give money too?</h3>
              <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>Members' contributions pay school fees and meals for students.</p>
              <Link className="btn line" to="/membership#join">Become a member</Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
