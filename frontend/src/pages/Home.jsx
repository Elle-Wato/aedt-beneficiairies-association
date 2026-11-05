import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus, Wallet, HeartHandshake, GraduationCap, Utensils, Wrench, TreePine,
  ArrowRight, ArrowDown, ChevronLeft, ChevronRight, Pause, Play, Check,
} from "lucide-react";
import { updates, upcoming, longDate } from "../data/content.js";
import { Upcoming } from "../components/NewsBits.jsx";

// EDIT HERE: the rotating hero slides. a and b are [button text, link].
const slides = [
  { img: "/images/mentorship-hall.jpg", pos: "50% 40%", tag: "Beneficiaries giving back",
    title: "Helping each other through school, and beyond.",
    text: "We are AEDT beneficiaries who pay fees for needy students, mentor each other and build skills that lead to work.",
    a: ["Become a member", "/membership#join"], b: ["See our programmes", "/programmes"],
    note: "Join for KES 500, then give what you can each month." },
  { img: "/images/mentorship-tree.jpg", pos: "50% 45%", tag: "Mentorship",
    title: "Mentors who come back to guide the next student.",
    text: "Graduates and professionals visit schools and sit with students to talk about studies, careers and life.",
    a: ["Mentor or volunteer", "/volunteer"], b: ["How mentorship works", "/programmes"] },
  { img: "/images/girls-session.jpg", pos: "50% 50%", tag: "Fees and meals",
    title: "School fees and daily meals, paid by members like you.",
    text: "Contributions keep needy students in class and make sure they can eat while they study.",
    a: ["Contribute", "/contribute"], b: ["Join the Association", "/membership#join"] },
];

const routes = [
  [UserPlus, "Join us", "Become a member", "Register for KES 500 and choose your monthly contribution.", "/membership#join", "Join now"],
  [Wallet, "Give", "Contribute", "Pay your registration, monthly contribution or a gift by M-Pesa.", "/contribute", "Make a contribution"],
  [HeartHandshake, "Give your time", "Mentor or volunteer", "Share your skills with students, or join community activities.", "/volunteer", "Sign up"],
  [GraduationCap, "Find out more", "Our programmes", "Fee support, meals, mentorship, skills and community service.", "/programmes", "View programmes"],
];

// Figures come from AEDT materials, not the Association. Confirm the latest numbers before publishing.
const stats = [
  ["4,000+", "beneficiaries supported by AEDT"],
  ["1,000+", "AEDT graduates"],
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

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const next = upcoming()[0];

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => clearInterval(t);
  }, [paused, n, i]);

  return (
    <section className="hz" aria-roledescription="carousel" aria-label="Featured">
      <h1 className="sr">AEDT Beneficiaries Association</h1>
      {slides.map((s, k) => {
        const on = k === i;
        return (
          <div key={s.title} className={"hz-slide" + (on ? " on" : "")} aria-hidden={!on}>
            <div className="hz-bg" style={{ backgroundImage: `url(${s.img})`, backgroundPosition: s.pos }} />
            <div className="wrap hz-copy">
              <span className="hz-tag">{s.tag}</span>
              <h2 className="hz-title">{s.title}</h2>
              <p className="hz-text">{s.text}</p>
              <div className="actions">
                <Link className="btn" to={s.a[1]} tabIndex={on ? 0 : -1}>{s.a[0]}</Link>
                <Link className="btn ghost" to={s.b[1]} tabIndex={on ? 0 : -1}>{s.b[0]}</Link>
              </div>
              {s.note && <p className="hz-note">{s.note}</p>}
            </div>
          </div>
        );
      })}

      <div className="hz-bar">
        <div className="wrap hz-barin">
          <div className="hz-ctrl">
            <span className="hz-count"><b>{String(i + 1).padStart(2, "0")}</b> / {String(n).padStart(2, "0")}</span>
            <button aria-label="Previous slide" onClick={() => setI((i - 1 + n) % n)}><ChevronLeft size={18} /></button>
            <button aria-label="Next slide" onClick={() => setI((i + 1) % n)}><ChevronRight size={18} /></button>
            <button aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(!paused)}>
              {paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          </div>
          <a className="hz-scroll" href="#start">Scroll to discover <ArrowDown size={16} /></a>
          <div className="hz-live">
            {next
              ? <Link to="/news"><b>Next</b> {longDate(next.date)}: {next.title}</Link>
              : <Link to="/membership#join"><b>Join</b> KES 500 to register</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      <section className="section" id="start">
        <div className="wrap">
          <div className="shead">
            <div>
              <span className="eyebrow">Get started</span>
              <h2>Start with what matters to you.</h2>
              <p className="lede" style={{ margin: 0 }}>Direct routes to the things members, mentors and supporters do most.</p>
            </div>
          </div>
          <div className="routes">
            {routes.map(([Icon, label, title, text, to, go]) => (
              <Link to={to} className="route" key={title}>
                <span className="route-ico"><Icon size={26} /></span>
                <small>{label}</small>
                <h3>{title}</h3>
                <p>{text}</p>
                <b className="go">{go} <ArrowRight size={16} /></b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Key figures">
        <div className="wrap statgrid">
          {stats.map(([big, label]) => (
            <div key={label}><b>{big}</b><span>{label}</span></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap abt">
          <div className="abt-photo">
            <img src="/images/gathering-1.jpg" alt="Members and mentors seated together at a gathering" style={{ objectPosition: "30% 60%" }} loading="lazy" />
            <div className="abt-badge"><b>Led by beneficiaries</b><span>Africa Education and Development Trust alumni</span></div>
          </div>
          <div>
            <span className="eyebrow">Who we are</span>
            <h2>An association built on giving back.</h2>
            <p>The Association brings together people who were supported by AEDT. Members join willingly and give what they can each month. Together, those contributions become school fees and meals for students who would otherwise drop out.</p>
            <p>Our members also give their time, as mentors, volunteers and community service teams.</p>
            <ul className="checklist">
              <li><Check size={18} /> Open to AEDT beneficiaries and graduates</li>
              <li><Check size={18} /> You choose your own monthly contribution</li>
              <li><Check size={18} /> Mentors and volunteers are always welcome</li>
            </ul>
            <Link className="btn green" to="/about">Our story and mission</Link>
          </div>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap">
          <div className="shead">
            <div>
              <span className="eyebrow">What we do</span>
              <h2>Where does your support go?</h2>
            </div>
            <Link className="btn line" to="/programmes">View all programmes</Link>
          </div>
          <div className="pg">
            {progs.map(([Icon, src, pos, title, text]) => (
              <Link to="/programmes" className="pgc" key={title}>
                <img src={src} alt="" style={{ objectPosition: pos }} loading="lazy" />
                <div className="pgc-body">
                  <span className="pgc-ico"><Icon size={20} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="shead">
            <div>
              <span className="eyebrow">What is happening</span>
              <h2>News, events and updates.</h2>
            </div>
            <Link className="btn line" to="/news">All news and events</Link>
          </div>
          <div className="cards3">
            {updates.slice(0, 3).map((u) => (
              <Link to="/news" className="ncard" key={u.date + u.title}>
                <img src={u.image} alt="" loading="lazy" />
                <div className="ncard-body">
                  <span className="tag">{u.tag}</span>
                  <small>{longDate(u.date)}</small>
                  <h3>{u.title}</h3>
                  <p>{u.summary}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="panel evpanel">
            <h2>Coming up</h2>
            <div className="evgrid"><Upcoming limit={3} /></div>
          </div>
        </div>
      </section>

      <section className="section vsec">
        <div className="wrap vgrid2">
          <div>
            <span className="eyebrow light">See us in action</span>
            <h2>Stories that feel closer.</h2>
            <p>Watch our members and mentors at a gathering, and see how the work gets done.</p>
            <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap" }}>
              <Link className="btn" to="/gallery">Photo gallery</Link>
              <Link className="btn ghost" to="/volunteer">Join the mentors</Link>
            </div>
          </div>
          <div className="vbox">
            <video controls playsInline preload="metadata" poster="/videos/poster.jpg" aria-label="Members and mentors at a gathering">
              <source src="/videos/hero.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <span className="eyebrow light">The next chapter can start today</span>
          <h2>Be part of the next student's story.</h2>
          <p>Join the Association, give what you can, or share your time as a mentor or volunteer.</p>
          <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap" }}>
            <Link className="btn" to="/membership#join">Become a member</Link>
            <Link className="btn ghost" to="/contribute">Contribute</Link>
          </div>
        </div>
      </section>
    </>
  );
}