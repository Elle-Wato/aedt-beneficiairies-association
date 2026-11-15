import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus, Wallet, HeartHandshake, GraduationCap, Utensils, Wrench, TreePine,
  ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Check, Megaphone, Sparkles,
} from "lucide-react";
import { updates, upcoming, longDate, platformOf, safeUrl } from "../data/content.js";
import { Upcoming } from "../components/NewsBits.jsx";
import { featuredCampaign, campaigns } from "../data/campaigns.js";
import "../styles/home.css";

// EDIT HERE: the rotating hero slides. a and b are [button text, link]. hl is the part of the
// title shown in gold.
const slides = [
  { img: "/images/mentorship-hall.jpg", pos: "50% 40%", tag: "Beneficiaries giving back",
    title: "Helping each other through school, and beyond.", hl: "and beyond.",
    text: "We are AEDT beneficiaries who pay fees for needy students, mentor each other and build skills that lead to work.",
    a: ["Become a member", "/membership#join"], b: ["See our programmes", "/programmes"],
    note: "Join for KES 500, then give what you can each month." },
  { img: "/images/mentorship-tree.jpg", pos: "50% 45%", tag: "Mentorship",
    title: "Mentors who come back to guide the next student.", hl: "the next student.",
    text: "Graduates and professionals visit schools and sit with students to talk about studies, careers and life.",
    a: ["Mentor or volunteer", "/volunteer"], b: ["How mentorship works", "/programmes"] },
  { img: "/images/girls-session.jpg", pos: "50% 50%", tag: "Fees and meals",
    title: "School fees and daily meals, paid by members like you.", hl: "members like you.",
    text: "Contributions keep needy students in class and make sure they can eat while they study.",
    a: ["Contribute", "/contribute"], b: ["Join the Association", "/membership#join"] },
];
const SLIDE_MS = 7000;

const routes = [
  [UserPlus, "Join us", "Become a member", "Register for KES 500 and choose your monthly contribution.", "/membership#join", "Become a member"],
  [Wallet, "Give", "Contribute", "Pay your registration, monthly contribution or a gift by M-Pesa.", "/contribute", "Make a contribution"],
  [HeartHandshake, "Give your time", "Mentor or volunteer", "Share your skills with students, or join community activities.", "/volunteer", "Sign up"],
  [GraduationCap, "Find out more", "Our programmes", "Fee support, meals, mentorship, skills and community service.", "/programmes", "View programmes"],
];

// Approved AEDT figures (launch brief). Update here if AEDT publishes new numbers.
const stats = [
  ["4,500+", "beneficiaries supported by AEDT"],
  ["1,200+", "AEDT graduates"],
  ["5", "Association programmes"],
  ["KES 500", "one-time registration"],
];

const progs = [
  [GraduationCap, "/images/partner-cheque.jpg", "50% 40%", "Fee support", "Keeps needy students in class when money runs out."],
  [Utensils, "/images/meal-support.jpg", "50% 50%", "Meal support", "Meal vouchers so students can eat and focus."],
  [HeartHandshake, "/images/mentorship-tree.jpg", "50% 45%", "Mentorship", "Graduates guiding students on studies and careers."],
  [Wrench, "/images/mentorship-hall.jpg", "50% 50%", "Skills development", "Digital skills, CVs, interviews and business."],
  [TreePine, "/images/community-service.jpg", "50% 50%", "Community service", "Children's homes, tree planting and clean-ups."],
];

const steps = [
  ["Register", "Pay the one-time KES 500 registration by M-Pesa and join the community.", "/membership#join"],
  ["Give monthly", "Choose a monthly contribution you can keep up. Every amount counts.", "/contribute"],
  ["Make it count", "Together, contributions become school fees, meals and mentorship for students.", "/programmes"],
];

/* ---------- small helpers ---------- */
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useInView(once = true) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); if (once) io.disconnect(); }
    }, { threshold: 0.18 });
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return [ref, seen];
}

function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const [ref, seen] = useInView();
  return (
    <Tag ref={ref} className={`h-rv ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

function CountUp({ value }) {
  const m = String(value).match(/^(\D*)([\d,]+)(.*)$/);
  const [ref, seen] = useInView();
  const target = m ? Number(m[2].replace(/,/g, "")) : 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen || !m) return;
    if (reduced()) { setN(target); return; }
    let raf; const t0 = performance.now(); const dur = 1400;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return <b ref={ref}>{value}</b>;
  return <b ref={ref}>{m[1]}{n.toLocaleString("en-US")}<em>{m[3]}</em></b>;
}

function Title({ text, hl }) {
  if (!hl || !text.includes(hl)) return text;
  const i = text.indexOf(hl);
  return <>{text.slice(0, i)}<span className="h-gold">{hl}</span>{text.slice(i + hl.length)}</>;
}

/* ---------- hero ---------- */
function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const next = upcoming()[0];
  const still = paused || reduced();

  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), SLIDE_MS);
    return () => clearTimeout(t);
  }, [still, n, i]);

  return (
    <section className="h-hero" aria-roledescription="carousel" aria-label="Featured">
      <h1 className="sr">AEDT Beneficiaries Association</h1>
      {slides.map((s, k) => {
        const on = k === i;
        return (
          <div key={s.title} className={"h-slide" + (on ? " on" : "")} aria-hidden={!on}>
            <div className="h-bg" style={{ backgroundImage: `url(${s.img})`, backgroundPosition: s.pos }} />
            <div className="wrap h-copy">
              <span className="h-tag"><Sparkles size={14} /> {s.tag}</span>
              <h2 className="h-title"><Title text={s.title} hl={s.hl} /></h2>
              <p className="h-text">{s.text}</p>
              <div className="actions">
                <Link className="btn" to={s.a[1]} tabIndex={on ? 0 : -1}>{s.a[0]} <ArrowRight size={18} /></Link>
                <Link className="btn ghost" to={s.b[1]} tabIndex={on ? 0 : -1}>{s.b[0]}</Link>
              </div>
              {s.note && <p className="h-note"><Check size={16} /> {s.note}</p>}
            </div>
          </div>
        );
      })}

      <div className="h-bar">
        <div className="wrap h-barin">
          <div className="h-dots" role="tablist" aria-label="Choose slide">
            {slides.map((s, k) => (
              <button key={s.title} role="tab" aria-selected={k === i} aria-label={`Slide ${k + 1}: ${s.tag}`}
                className={"h-dot" + (k === i ? " on" : "") + (still ? " still" : "")} onClick={() => setI(k)}>
                <span className="h-dot-label">{String(k + 1).padStart(2, "0")} <small>{s.tag}</small></span>
                <span className="h-prog"><i key={k === i ? `on-${i}` : "off"} style={{ animationDuration: `${SLIDE_MS}ms` }} /></span>
              </button>
            ))}
          </div>
          <div className="h-ctrl">
            <button aria-label="Previous slide" onClick={() => setI((i - 1 + n) % n)}><ChevronLeft size={18} /></button>
            <button aria-label="Next slide" onClick={() => setI((i + 1) % n)}><ChevronRight size={18} /></button>
            <button aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}>
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
          <div className="h-live">
            {next
              ? <Link to="/news"><b>Next</b> {longDate(next.date)}: {next.title}</Link>
              : <Link to="/membership#join"><b>Join</b> KES 500 to register</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
const kes = (n) => "KES " + Number(n).toLocaleString("en-US");

function SponsorMini() {
  const c = campaigns.find((x) => x.kind === "student" && x.status === "live" && x.goal != null && x.raised != null);
  const [ref, seen] = useInView();
  if (!c) return null;
  const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
  const left = Math.max(0, c.goal - c.raised);
  return (
    <Link to={`/campaigns#${c.slug}`} className="h-spon" ref={ref}>
      <div className="h-spon-top">
        <span><GraduationCap size={16} /> Sponsor a student</span>
        <b>{pct}%</b>
      </div>
      <h3>{c.title}</h3>
      <div className="h-spon-bar"><i style={{ width: seen ? `${pct}%` : 0 }} /></div>
      <div className="h-spon-txt">
        <span><b>{kes(c.raised)}</b> of {kes(c.goal)}</span>
        <span>{left > 0 ? `${kes(left)} to go` : "Fully funded"}</span>
      </div>
      <span className="h-spon-go">Support her <ArrowRight size={16} /></span>
    </Link>
  );
}

export default function Home() {
  const fc = featuredCampaign();
  return (
    <div className="h" data-own-motion>
      <Hero />

      <section className="h-stats" aria-label="Key figures">
        <div className="wrap">
          <Reveal className="h-statcard">
            {stats.map(([big, label]) => (
              <div key={label} className="h-stat"><CountUp value={big} /><span>{label}</span></div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section" id="start">
        <div className="wrap">
          <Reveal className="h-head">
            <span className="eyebrow">Get started</span>
            <h2>Start with what matters to you.</h2>
            <p className="lede">Direct routes to the things members, mentors and supporters do most.</p>
          </Reveal>
          <div className="h-routes">
            {routes.map(([Icon, label, title, text, to, go], k) => (
              <Reveal key={title} delay={k * 90}>
                <Link to={to} className="h-route">
                  <span className="h-route-ico"><Icon size={26} /></span>
                  <small>{label}</small>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <b className="h-go">{go} <ArrowRight size={16} /></b>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {fc && (
        <section className="h-camp" aria-label="Current campaign">
          <div className="wrap h-camp-in">
            <Reveal className="h-camp-copy">
              <span className="eyebrow light"><Megaphone size={15} /> Current campaign</span>
              <h2>{fc.title}</h2>
              <p>{fc.summary}</p>
              <ul className="h-camp-asks">
                {fc.asks.map((a) => <li key={a}><Check size={17} /> {a}</li>)}
              </ul>
              <div className="actions">
                <Link className="btn" to={fc.cta[1]}>{fc.cta[0]} <ArrowRight size={18} /></Link>
                <Link className="btn ghost" to="/campaigns">All campaigns</Link>
              </div>
              <SponsorMini />
            </Reveal>
            <Reveal className="h-camp-media" delay={120}>
              {fc.video
                ? <video controls playsInline preload="none" poster={fc.poster} aria-label={`${fc.title} campaign film`}><source src={fc.video} type="video/mp4" /></video>
                : <img src={fc.image} alt="" loading="lazy" />}
              <span className="h-camp-badge"><i /> Live now</span>
            </Reveal>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap h-abt">
          <Reveal className="h-abt-media">
            <img className="h-abt-main" src="/images/gathering-1.jpg" alt="Members and mentors seated together at a gathering" style={{ objectPosition: "30% 60%" }} loading="lazy" />
            <img className="h-abt-small" src="/images/mentorship-tree.jpg" alt="" loading="lazy" />
            <div className="h-abt-badge"><b>Led by beneficiaries</b><span>Africa Education and Development Trust alumni</span></div>
          </Reveal>
          <Reveal delay={120}>
            <span className="eyebrow">Who we are</span>
            <h2>An association built on <span className="h-uline">giving back.</span></h2>
            <p>The Association brings together people who were supported by AEDT. Members join willingly and give what they can each month. Together, those contributions become school fees and meals for students who would otherwise drop out.</p>
            <p>Our members also give their time, as mentors, volunteers and community service teams.</p>
            <ul className="h-check">
              <li><Check size={18} /> Open to AEDT beneficiaries and graduates</li>
              <li><Check size={18} /> You choose your own monthly contribution</li>
              <li><Check size={18} /> Mentors and volunteers are always welcome</li>
            </ul>
            <Link className="btn green" to="/about">Our story and mission</Link>
          </Reveal>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap">
          <Reveal className="h-head row">
            <div>
              <span className="eyebrow">What we do</span>
              <h2>Where does your support go?</h2>
            </div>
            <Link className="btn line" to="/programmes">View all programmes</Link>
          </Reveal>
          <div className="h-bento">
            {progs.map(([Icon, src, pos, title, text], k) => (
              <Reveal key={title} delay={k * 80} className={k === 0 ? "h-big" : ""}>
                <Link to="/programmes" className="h-pg">
                  <img src={src} alt="" style={{ objectPosition: pos }} loading="lazy" />
                  <div className="h-pg-body">
                    <span className="h-pg-ico"><Icon size={20} /></span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="h-head center">
            <span className="eyebrow">How it works</span>
            <h2>Three steps to keep a student learning.</h2>
          </Reveal>
          <ol className="h-steps">
            {steps.map(([t, d, to], k) => (
              <Reveal as="li" key={t} delay={k * 120}>
                <span className="h-step-n">{k + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
                <Link to={to} className="h-go">Learn more <ArrowRight size={16} /></Link>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap">
          <Reveal className="h-head row">
            <div>
              <span className="eyebrow">What is happening</span>
              <h2>News, events and updates.</h2>
            </div>
            <Link className="btn line" to="/news">All news and events</Link>
          </Reveal>
          <div className="h-news">
            {updates.slice(0, 3).map((u, k) => {
              const href = safeUrl(u.link);
              const inner = (
                <>
                  <div className="h-ncard-img"><img src={u.image} alt="" loading="lazy" /><span className="tag">{u.tag}</span></div>
                  <div className="h-ncard-body">
                    <small>{longDate(u.date)}</small>
                    <h3>{u.title}</h3>
                    <p>{u.summary}</p>
                    {href && <b className="h-go">Read the post on {platformOf(href)} <ArrowRight size={16} /></b>}
                  </div>
                </>
              );
              return (
                <Reveal key={u.date + u.title} delay={k * 90}>
                  {href
                    ? <a className="h-ncard" href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
                    : <Link to="/news" className="h-ncard">{inner}</Link>}
                </Reveal>
              );
            })}
          </div>
          <Reveal className="panel h-ev">
            <h2>Coming up</h2>
            <div className="evgrid"><Upcoming limit={3} /></div>
          </Reveal>
        </div>
      </section>

      <section className="section h-vsec">
        <div className="wrap h-vgrid">
          <Reveal>
            <span className="eyebrow light">See us in action</span>
            <h2>Stories that feel closer.</h2>
            <p>Watch our members and mentors at a gathering, and see how the work gets done.</p>
            <div className="actions">
              <Link className="btn" to="/gallery">Photo gallery</Link>
              <Link className="btn ghost" to="/volunteer">Join the mentors</Link>
            </div>
          </Reveal>
          <Reveal className="h-vbox" delay={120}>
            <video controls playsInline preload="metadata" poster="/videos/poster.jpg" aria-label="Members and mentors at a gathering">
              <source src="/videos/hero.mp4" type="video/mp4" />
            </video>
          </Reveal>
        </div>
      </section>

      <section className="h-band">
        <div className="wrap">
          <Reveal className="h-band-in">
            <span className="eyebrow light">The next chapter can start today</span>
            <h2>Be part of the next student's story.</h2>
            <p>Join the Association, give what you can, or share your time as a mentor or volunteer.</p>
            <div className="actions">
              <Link className="btn" to="/membership#join">Become a member <ArrowRight size={18} /></Link>
              <Link className="btn ghost" to="/contribute">Contribute</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
