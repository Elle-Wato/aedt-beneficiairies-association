import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, FileText, Handshake, Rocket, MapPin, Clock, CalendarDays, Building2, Check, ArrowRight, Search, Mail } from "lucide-react";
import PageHero from "../components/PageHero.jsx";
import Reveal from "../components/Reveal.jsx";
import { openOpportunities, fields } from "../data/opportunities.js";
import { longDate } from "../data/content.js";
import { site } from "../data/site.js";

const empty = { full_name: "", email: "", phone: "", aedt_status: "", institution: "", course: "", year_of_study: "",
  placement_type: "", fields: [], location: "", start_month: "", duration: "", cv_link: "", message: "",
  opportunity: "", consent: false, honeypot: "" };
const types = ["Internship", "Attachment", "Graduate job", "Either"];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function Opportunities() {
  const list = useMemo(() => openOpportunities(), []);
  const tabs = useMemo(() => ["All", ...new Set(list.map((o) => o.type))], [list]);
  const [tab, setTab] = useState("All");
  const shown = list.filter((o) => tab === "All" || o.type === tab);

  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ busy: false, ok: "", fail: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (v) => setF({ ...f, fields: f.fields.includes(v) ? f.fields.filter((x) => x !== v) : [...f.fields, v] });
  const Err = ({ k }) => (errors[k] ? <span className="err" role="alert">{errors[k]}</span> : null);
  const chosen = list.find((o) => o.id === f.opportunity);

  const applyFor = (o) => {
    const t = o.type === "Internship" || o.type === "Attachment" || o.type === "Graduate job" ? o.type : "Either";
    setF((x) => ({ ...x, opportunity: o.id, placement_type: t, fields: o.field && fields.includes(o.field) && !x.fields.includes(o.field) ? [...x.fields, o.field] : x.fields }));
    scrollTo("apply");
  };

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, ok: "", fail: "" }); setErrors({});
    try {
      const r = await fetch("/api/placements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json();
      if (d.ok) { setState({ busy: false, ok: d.message || "Application received. We will be in touch.", fail: "" }); setF(empty); scrollTo("apply"); }
      else { setErrors(d.errors || {}); setState({ busy: false, ok: "", fail: "Please fix the highlighted fields." }); }
    } catch { setState({ busy: false, ok: "", fail: "Could not reach the server. Check your connection and try again." }); }
  }

  return (
    <div className="px" data-own-motion>
      <PageHero kicker="Internships and attachments" title="Find your placement. We will help open the door." hl="We will help open the door."
        text="Apply with us for an internship, industrial attachment or first job. We connect students and graduates with our partner companies and organisations."
        image="/images/group-discussion.jpg">
        <div className="px-hero-actions">
          <a className="btn" href="#apply" onClick={(e) => { e.preventDefault(); scrollTo("apply"); }}>Apply now <ArrowRight size={17} /></a>
          <a className="btn ghost" href="#openings" onClick={(e) => { e.preventDefault(); scrollTo("openings"); }}>See open placements</a>
        </div>
      </PageHero>

      <section className="section">
        <div className="wrap">
          <Reveal className="px-head center">
            <span className="eyebrow">How it works</span>
            <h2>From application to your first day.</h2>
          </Reveal>
          <div className="op-steps">
            {[
              [FileText, "Apply", "Tell us what you study, the kind of placement you need and when you can start."],
              [Search, "We match", "We look at your profile against openings from our partners."],
              [Handshake, "We introduce you", "When there is a good fit, we connect you with the organisation."],
              [Rocket, "You start", "You interview with them directly and begin your placement."],
            ].map(([Icon, t, d], k) => (
              <Reveal key={t} delay={k * 90}>
                <div className="px-step">
                  <span className="px-step-n"><Icon size={20} /></span>
                  <small className="op-stepno">Step {k + 1}</small>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section tinted" id="openings">
        <div className="wrap">
          <div className="op-listhead">
            <div>
              <span className="eyebrow">Open placements</span>
              <h2>Opportunities from our partners.</h2>
            </div>
            {list.length > 0 && (
              <div className="chips" role="group" aria-label="Filter placements">
                {tabs.map((t) => <button key={t} className="chip" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
              </div>
            )}
          </div>

          {shown.length === 0 ? (
            <Reveal className="op-empty">
              <span><Briefcase size={28} /></span>
              <div>
                <h3>No open listings right now</h3>
                <p>New placements come in from partners throughout the year. Send a general application and we will match you when something suitable opens up.</p>
              </div>
              <a className="btn green" href="#apply" onClick={(e) => { e.preventDefault(); scrollTo("apply"); }}>Send a general application</a>
            </Reveal>
          ) : (
            <div className="op-grid">
              {shown.map((o, k) => (
                <Reveal key={o.id} delay={(k % 3) * 80}>
                  <article className="op-card">
                    <div className="op-card-top">
                      <span className={"op-type t-" + o.type.toLowerCase().replace(/\s+/g, "-")}>{o.type}</span>
                      {o.deadline && <small><CalendarDays size={14} /> Apply by {longDate(o.deadline)}</small>}
                    </div>
                    <h3>{o.title}</h3>
                    <p className="op-org"><Building2 size={16} /> {o.org}</p>
                    {o.summary && <p className="op-sum">{o.summary}</p>}
                    <ul className="op-meta">
                      {o.field && <li><Briefcase size={15} /> {o.field}</li>}
                      {o.location && <li><MapPin size={15} /> {o.location}</li>}
                      {o.duration && <li><Clock size={15} /> {o.duration}</li>}
                    </ul>
                    <button className="btn line" onClick={() => applyFor(o)}>Apply through us <ArrowRight size={16} /></button>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section" id="apply">
        <div className="wrap px-formgrid">
          <div className="px-formcard">
            <h2>Placement application</h2>
            <p className="px-sub">Fields marked * are required. It takes about four minutes.</p>
            {state.ok && <div className="notice ok" role="status">{state.ok}</div>}
            {state.fail && <div className="notice bad" role="alert">{state.fail}</div>}
            {chosen && (
              <div className="op-chosen">
                <span>Applying for</span>
                <b>{chosen.title} · {chosen.org}</b>
                <button type="button" onClick={() => setF({ ...f, opportunity: "" })}>Make it a general application</button>
              </div>
            )}

            <form className="form" onSubmit={submit} noValidate>
              <h3 className="px-group"><span>1</span> About you</h3>
              <label>Full name *<input value={f.full_name} onChange={set("full_name")} autoComplete="name" /><Err k="full_name" /></label>
              <div className="grid2">
                <label>Email *<input type="email" value={f.email} onChange={set("email")} autoComplete="email" /><Err k="email" /></label>
                <label>Phone *<input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="0712 345 678" /><Err k="phone" /></label>
              </div>
              <label>Your AEDT status *
                <select value={f.aedt_status} onChange={set("aedt_status")}>
                  <option value="">Choose one</option>
                  <option value="current">Current beneficiary</option><option value="graduate">Graduate</option>
                  <option value="former">Former beneficiary</option><option value="other">Other</option>
                </select><Err k="aedt_status" />
              </label>

              <h3 className="px-group"><span>2</span> Your studies</h3>
              <div className="grid2">
                <label>Institution *<input value={f.institution} onChange={set("institution")} /><Err k="institution" /></label>
                <label>Course *<input value={f.course} onChange={set("course")} placeholder="e.g. BCom Accounting" /><Err k="course" /></label>
              </div>
              <label>Year of study
                <select value={f.year_of_study} onChange={set("year_of_study")}>
                  <option value="">Choose one</option>
                  <option>First year</option><option>Second year</option><option>Third year</option><option>Fourth year</option>
                  <option>Fifth year or above</option><option>Graduated</option>
                </select>
              </label>

              <h3 className="px-group"><span>3</span> The placement you need</h3>
              <fieldset><legend>Type of placement *</legend>
                <div className="picks">
                  {types.map((t) => (
                    <label key={t} className="pick"><input type="radio" name="ptype" checked={f.placement_type === t} onChange={() => setF({ ...f, placement_type: t })} /><span>{t}</span></label>
                  ))}
                </div>
                <Err k="placement_type" />
              </fieldset>
              <fieldset><legend>Fields you are interested in *</legend>
                <div className="picks">
                  {fields.map((a) => (
                    <label key={a} className="pick"><input type="checkbox" checked={f.fields.includes(a)} onChange={() => toggle(a)} /><span>{a}</span></label>
                  ))}
                </div>
                <Err k="fields" />
              </fieldset>
              <div className="grid2">
                <label>Preferred location<input value={f.location} onChange={set("location")} placeholder="e.g. Nairobi, Mombasa, anywhere" /></label>
                <label>When can you start?<input type="month" value={f.start_month} onChange={set("start_month")} /></label>
              </div>
              <label>How long?
                <select value={f.duration} onChange={set("duration")}>
                  <option value="">Choose one</option>
                  <option>Up to 1 month</option><option>2 to 3 months</option><option>4 to 6 months</option><option>More than 6 months</option>
                </select>
              </label>

              <h3 className="px-group"><span>4</span> Your CV</h3>
              <label>Link to your CV
                <input type="url" value={f.cv_link} onChange={set("cv_link")} placeholder="Google Drive, Dropbox or LinkedIn link" />
                <small className="op-hint">Upload your CV to Google Drive, set sharing to "Anyone with the link", and paste the link here.</small>
                <Err k="cv_link" />
              </label>
              <label>Anything else we should know?
                <textarea rows={4} maxLength={800} value={f.message} onChange={set("message")} placeholder="Optional. Skills, projects, or the kind of organisation you would like to work with." />
              </label>

              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.honeypot} onChange={set("honeypot")} name="website" />
              <label className="check">
                <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
                <span>I agree that the Association may store these details and share my profile and CV with partner organisations for placement purposes, as explained in the <Link to="/privacy" target="_blank">privacy statement</Link>. *</span>
              </label>
              <Err k="consent" />
              <div><button className="btn green" disabled={state.busy}>{state.busy ? "Sending…" : <>Submit application <ArrowRight size={17} /></>}</button></div>
            </form>
          </div>

          <aside className="px-side">
            <div className="px-sidecard dark">
              <h3>Before you apply</h3>
              <ul className="px-list">
                {["Have an up-to-date CV ready to share as a link.", "Choose the fields that really match your course.", "Check your email and phone often so you do not miss an introduction."].map((t) => (
                  <li key={t} style={{ color: "#fff" }}><Check size={18} style={{ color: "var(--gold)" }} /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="px-sidecard">
              <h3>Need help with your CV?</h3>
              <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>Our skills programme covers CV writing and interview preparation.</p>
              <Link className="btn line" to="/programmes#skills">Skills development</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="op-partners">
        <div className="wrap op-partners-in">
          <Reveal>
            <span className="eyebrow light">For companies and organisations</span>
            <h2>Offer a placement. Grow future talent.</h2>
            <p>Host an intern or attachment student from our community of AEDT beneficiaries and graduates. Tell us what you need and we will send you suitable candidates.</p>
            <ul className="op-why">
              <li><Check size={18} /> Motivated students and graduates across many fields</li>
              <li><Check size={18} /> We shortlist and introduce candidates to you</li>
              <li><Check size={18} /> Be part of a community that gives back</li>
            </ul>
            <div className="px-hero-actions">
              <Link className="btn" to="/contact">Partner with us <ArrowRight size={17} /></Link>
              <a className="btn ghost" href={`mailto:${site.email}?subject=${encodeURIComponent("Offering an internship or attachment placement")}`}><Mail size={16} /> Email us</a>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
