import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Megaphone, CalendarDays, Share2, Check, ArrowRight, UserPlus, Wallet, HeartHandshake, Link2, GraduationCap, RefreshCw, Users, Target, BookOpen } from "lucide-react";
import { campaigns, statusLabel, featuredCampaign } from "../data/campaigns.js";
import { longDate } from "../data/content.js";
import "../styles/campaigns.css";

const FILTERS = [["all", "All"], ["live", "Live now"], ["upcoming", "Coming up"], ["completed", "Completed"]];

const kes = (n) => "KES " + Number(n).toLocaleString("en-US");
const when = (c) => {
  if (!c.start && !c.end) return "Date to be confirmed";
  if (c.start && c.end) return `${longDate(c.start)} – ${longDate(c.end)}`;
  return c.start ? `From ${longDate(c.start)}` : `Until ${longDate(c.end)}`;
};

function Reveal({ delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`cp-rv ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</div>;
}

function useSeen() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}

// Raised / target / percentage / remaining. size="lg" for the big student panel.
export function Progress({ c, size = "sm" }) {
  const [ref, seen] = useSeen();
  if (c.goal == null || c.raised == null) return null;
  const raised = Math.max(0, Number(c.raised));
  const goal = Math.max(1, Number(c.goal));
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const left = Math.max(0, goal - raised);
  const done = raised >= goal;
  return (
    <div ref={ref} className={`cp-prog ${size} ${done ? "done" : ""}`} aria-label={`${kes(raised)} raised of ${kes(goal)}, ${pct}%`}>
      {size === "lg" && (
        <div className="cp-prog-top">
          <div><b className="cp-raised">{kes(raised)}</b><span>raised of {kes(goal)} target</span></div>
          <span className="cp-pct">{pct}%</span>
        </div>
      )}
      <div className="cp-prog-bar">
        <i style={{ width: seen ? `${pct}%` : "0%" }} />
        {size === "lg" && [25, 50, 75].map((m) => <em key={m} style={{ left: `${m}%` }} className={pct >= m ? "hit" : ""} />)}
      </div>
      {size === "lg" ? (
        <div className="cp-prog-stats">
          <div><Target size={16} /><span>Target</span><b>{kes(goal)}</b></div>
          <div><Wallet size={16} /><span>Raised</span><b>{kes(raised)}</b></div>
          <div className={done ? "ok" : ""}><GraduationCap size={16} /><span>{done ? "Status" : "Still needed"}</span><b>{done ? "Fully funded" : kes(left)}</b></div>
          {c.supporters != null && <div><Users size={16} /><span>Supporters</span><b>{c.supporters}</b></div>}
        </div>
      ) : (
        <div className="cp-prog-txt">
          <span><b>{kes(raised)}</b> of {kes(goal)}</span>
          <span className="cp-prog-pct">{pct}%</span>
          <span className="cp-prog-left">{done ? "Fully funded" : `${kes(left)} to go`}</span>
        </div>
      )}
    </div>
  );
}

function Revolving() {
  const steps = [
    [Wallet, "You give", "Your contribution goes into the study fund."],
    [BookOpen, "She studies", "The fund pays her fees, semester by semester."],
    [RefreshCw, "It revolves", "As it is repaid, the same money is used again."],
    [Users, "Next student", "When she completes, it supports another student."],
  ];
  return (
    <div className="cp-rev">
      <h3><RefreshCw size={18} /> How your money keeps working</h3>
      <ol>
        {steps.map(([Icon, t, d], k) => (
          <li key={t}><span><Icon size={18} /></span><b>{t}</b><small>{d}</small>{k < steps.length - 1 && <i aria-hidden="true" />}</li>
        ))}
      </ol>
    </div>
  );
}

function StudentCampaign({ c }) {
  const st = c.student || {};
  const who = [st.course, st.institution].filter(Boolean).join(" · ");
  return (
    <article className="cp-stu" id={c.slug}>
      <div className="cp-stu-media">
        <img src={c.image} alt="" loading="lazy" />
        <span className={`cp-status ${c.status}`}><i />{statusLabel[c.status]}</span>
      </div>
      <div className="cp-stu-body">
        <span className="cp-cat">{c.category}</span>
        <h3>{c.title}</h3>
        {(st.name || who) && <p className="cp-stu-who"><GraduationCap size={16} /> {[st.name, who].filter(Boolean).join(", ")}</p>}
        <p className="cp-stu-sum">{c.summary}</p>
        <Progress c={c} size="lg" />
        {c.body.map((p) => <p key={p.slice(0, 24)} className="cp-stu-p">{p}</p>)}
        {c.revolving && <Revolving />}
        {c.mpesaRef && <p className="cp-stu-ref">M-Pesa account reference for this campaign: <b>{c.mpesaRef}</b></p>}
        <div className="cp-actions">
          <Link className="btn" to={c.cta[1]}>{c.cta[0]} <ArrowRight size={18} /></Link>
          <ShareButtons c={c} />
        </div>
      </div>
    </article>
  );
}

function ShareButtons({ c }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/campaigns#${c.slug}`;
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: c.title, text: c.summary, url: url() }); } catch { /* cancelled */ }
      return;
    }
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const wa = () => `https://wa.me/?text=${encodeURIComponent(`${c.title}: ${c.summary} ${url()}`)}`;
  return (
    <div className="cp-share">
      <button type="button" className="cp-sbtn" onClick={share}>
        {copied ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> Share</>}
      </button>
      <a className="cp-sbtn wa" href="#" onClick={(e) => { e.preventDefault(); window.open(wa(), "_blank", "noopener"); }}>
        <Link2 size={16} /> WhatsApp
      </a>
    </div>
  );
}

export default function Campaigns() {
  const [filter, setFilter] = useState("all");
  const fc = featuredCampaign();
  const students = useMemo(() => campaigns.filter((c) => c.kind === "student" && c !== fc), [fc]);
  const others = useMemo(() => campaigns.filter((c) => c !== fc && c.kind !== "student"), [fc]);
  const list = useMemo(() => others.filter((c) => filter === "all" || c.status === filter), [filter, others]);
  const counts = useMemo(() => {
    const o = { all: others.length };
    others.forEach((c) => { o[c.status] = (o[c.status] || 0) + 1; });
    return o;
  }, [others]);

  useEffect(() => {   // open a shared link (#slug) at the right card
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, []);

  return (
    <div className="cp" data-own-motion>
      <section className="cp-hero">
        <div className="cp-hero-bg" style={{ backgroundImage: `url(${fc?.image || "/images/gathering-1.jpg"})` }} />
        <div className="wrap cp-hero-in">
          <span className="cp-kicker"><Megaphone size={15} /> Campaigns</span>
          <h1>Causes we are rallying <span>behind.</span></h1>
          <p>Every campaign is a way for beneficiaries and friends of AEDT to connect, empower and give back. Pick one, share it, and be part of someone else's success story.</p>
        </div>
      </section>

      {fc && (
        <section className="cp-feat" id={fc.slug}>
          <div className="wrap">
            <Reveal className="cp-feat-card">
              <div className="cp-feat-media">
                {fc.video
                  ? <video controls playsInline preload="none" poster={fc.poster} aria-label={`${fc.title} campaign film`}><source src={fc.video} type="video/mp4" /></video>
                  : <img src={fc.image} alt="" />}
              </div>
              <div className="cp-feat-copy">
               <div>
                <div className="cp-meta">
                  <span className={`cp-status ${fc.status}`}><i />{statusLabel[fc.status]}</span>
                  <span className="cp-cat">{fc.category}</span>
                </div>
                <h2>{fc.title}</h2>
                <p className="cp-lede">{fc.summary}</p>
                {fc.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
               </div>
               <div className="cp-feat-side">
                <Progress c={fc} />
                <h3 className="cp-asks-h">How you can help</h3>
                <ul className="cp-asks">{fc.asks.map((a) => <li key={a}><Check size={17} /> {a}</li>)}</ul>
                <div className="cp-actions">
                  <Link className="btn" to={fc.cta[1]}>{fc.cta[0]} <ArrowRight size={18} /></Link>
                  <ShareButtons c={fc} />
                </div>
                <small className="cp-when"><CalendarDays size={15} /> {when(fc)}</small>
               </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {students.length > 0 && (
        <section className="section cp-stusec">
          <div className="wrap">
            <div className="cp-listhead">
              <div>
                <span className="eyebrow">Sponsor a student</span>
                <h2>Help a student start, and keep the money working.</h2>
              </div>
            </div>
            <div className="cp-stulist">
              {students.map((c) => <Reveal key={c.slug}><StudentCampaign c={c} /></Reveal>)}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap">
          <div className="cp-listhead">
            <div>
              <span className="eyebrow">All campaigns</span>
              <h2>Find a cause to support.</h2>
            </div>
            <div className="cp-filters" role="tablist" aria-label="Filter campaigns">
              {FILTERS.map(([k, label]) => (
                <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
                  {label} <span>{counts[k] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {list.length === 0
            ? <p className="cp-empty">No campaigns here yet. Check back soon.</p>
            : (
              <div className="cp-grid">
                {list.map((c, k) => (
                  <Reveal key={c.slug} delay={k * 90}>
                    <article className="cp-card" id={c.slug}>
                      <div className="cp-card-img">
                        <img src={c.image} alt="" loading="lazy" />
                        <span className={`cp-status ${c.status}`}><i />{statusLabel[c.status]}</span>
                      </div>
                      <div className="cp-card-body">
                        <span className="cp-cat">{c.category}</span>
                        <h3>{c.title}</h3>
                        <p>{c.summary}</p>
                        <Progress c={c} />
                        <small className="cp-when"><CalendarDays size={15} /> {when(c)}</small>
                        <div className="cp-card-foot">
                          <Link className="cp-go" to={c.cta[1]}>{c.cta[0]} <ArrowRight size={16} /></Link>
                          <ShareButtons c={c} />
                        </div>
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            )}
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap">
          <div className="cp-listhead center">
            <div>
              <span className="eyebrow">Ways to support</span>
              <h2>Every campaign runs on members like you.</h2>
            </div>
          </div>
          <div className="cp-ways">
            {[
              [UserPlus, "Become a member", "Register for KES 500 and choose a monthly contribution.", "/membership#join"],
              [Wallet, "Contribute", "Give by M-Pesa to the campaign or programme of your choice.", "/contribute"],
              [HeartHandshake, "Give your time", "Mentor students or volunteer at community activities.", "/volunteer"],
            ].map(([Icon, t, d, to], k) => (
              <Reveal key={t} delay={k * 100}>
                <Link to={to} className="cp-way">
                  <span><Icon size={24} /></span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                  <b>Get started <ArrowRight size={16} /></b>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cp-band">
        <div className="wrap cp-band-in">
          <div>
            <h2>Have an idea for a campaign?</h2>
            <p>Members can propose a cause, a fundraiser or a community activity. Tell us about it.</p>
          </div>
          <Link className="btn" to="/contact">Propose a campaign <ArrowRight size={18} /></Link>
        </div>
      </section>
    </div>
  );
}
