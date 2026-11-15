import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye, Target, GraduationCap, Utensils, HeartHandshake, Wrench, Briefcase, TreePine,
  ShieldCheck, Users, Scale, Handshake, Sprout, BookOpen, User, FileText, ArrowRight, Quote, Download,
} from "lucide-react";
import "../styles/about.css";

const objectives = [
  [GraduationCap, "Education support", "Raise funds to keep needy students in school."],
  [Utensils, "Meal support", "Provide meal vouchers so students can eat and focus."],
  [HeartHandshake, "Graduate mentorship", "Connect students with graduates and professionals."],
  [Wrench, "Skills development", "Train members in digital, job-search and business skills."],
  [Briefcase, "Employment linkages", "Share jobs, internships and attachments with members."],
  [TreePine, "Community service", "Give back through visits, tree planting and clean-ups."],
];

const values = [
  [ShieldCheck, "Integrity", "We are honest in how we raise and use money."],
  [Users, "Solidarity", "We stand together, and no member is left behind."],
  [Scale, "Accountability", "We report openly to members and partners."],
  [Handshake, "Inclusion", "Every beneficiary is welcome to join."],
  [Sprout, "Service", "We give our time as well as our money."],
  [BookOpen, "Lifelong learning", "We keep learning and help others learn."],
];

// EDIT HERE: officials. Add name and photo (e.g. "/images/leaders/chair.jpg") once confirmed.
const leaders = [
  { role: "Chairperson", name: "", photo: "" },
  { role: "Vice-chairperson", name: "", photo: "" },
  { role: "Secretary", name: "", photo: "" },
  { role: "Treasurer", name: "", photo: "" },
];

// EDIT HERE: governance documents in /public/docs, e.g. ["Constitution", "/docs/constitution.pdf"]
const documents = [];

function Reveal({ delay = 0, className = "", as: Tag = "div", children, ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`ab-rv ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>{children}</Tag>;
}

export default function About() {
  return (
    <div className="ab" data-own-motion>
      <section className="ab-hero">
        <div className="ab-hero-bg" style={{ backgroundImage: "url(/images/mentorship-tree.jpg)" }} />
        <div className="wrap ab-hero-in">
          <span className="ab-kicker">About the Association</span>
          <h1>Once supported. <span>Now giving back.</span></h1>
          <p>A community of AEDT beneficiaries who give back so that other students can finish their studies.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap ab-story">
          <Reveal>
            <span className="eyebrow">Our story</span>
            <h2>From beneficiaries to <span className="ab-uline">benefactors.</span></h2>
            <p>Africa Education and Development Trust (AEDT) gives interest-free study loans and partial scholarships to extremely needy students. Many people who benefited want to do the same for the next student.</p>
            <p>The Association brings those beneficiaries together. Members join willingly, contribute a small amount each month, and give their time as mentors and volunteers. Together we pay fees, provide meals, build skills and serve our communities.</p>
            <div className="ab-actions">
              <Link className="btn green" to="/membership#join">Join the Association <ArrowRight size={18} /></Link>
              <Link className="ab-link" to="/programmes">See our programmes <ArrowRight size={16} /></Link>
            </div>
          </Reveal>
          <Reveal className="ab-photo" delay={120}>
            <img src="/images/gathering-1.jpg" alt="Members seated together at a gathering" style={{ objectPosition: "30% 60%" }} />
            <p className="ab-cap">Members, mentors and partners at a gathering</p>
            <div className="ab-quote"><Quote size={22} /><p>Giving back is not just about what we have. It is about what we are willing to share.</p></div>
          </Reveal>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap ab-vm">
          <Reveal className="ab-vcard green">
            <span className="ab-vico"><Eye size={28} /></span>
            <small>Our vision</small>
            <p>A connected, empowered community that advances educational opportunity.</p>
          </Reveal>
          <Reveal className="ab-vcard navy" delay={120}>
            <span className="ab-vico"><Target size={28} /></span>
            <small>Our mission</small>
            <p>To mobilise beneficiaries, skills, networks and resources for fee support, meals, mentorship and skills development.</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="ab-head">
            <span className="eyebrow">What we aim to do</span>
            <h2>Six objectives guide every programme.</h2>
          </Reveal>
          <div className="ab-obj">
            {objectives.map(([Icon, title, text], k) => (
              <Reveal key={title} delay={k * 70} className="ab-ocard">
                <span className="ab-onum">0{k + 1}</span>
                <span className="ab-oico"><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="ab-values">
        <div className="wrap">
          <Reveal className="ab-head light">
            <span className="eyebrow light">Our values</span>
            <h2>What we stand for.</h2>
          </Reveal>
          <div className="ab-vgrid">
            {values.map(([Icon, title, text], k) => (
              <Reveal key={title} delay={k * 70} className="ab-vitem">
                <span><Icon size={24} /></span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="ab-head center">
            <span className="eyebrow">Leadership</span>
            <h2>Chosen by members, accountable to members.</h2>
            <p className="lede">Names and photos will appear here once confirmed.</p>
          </Reveal>
          <div className="ab-leaders">
            {leaders.map((l, k) => (
              <Reveal key={l.role} delay={k * 80} className="ab-leader">
                <span className="ab-avatar">{l.photo ? <img src={l.photo} alt={l.name || l.role} /> : <User size={34} />}</span>
                <h3>{l.name || "Name to be confirmed"}</h3>
                <p>{l.role}</p>
              </Reveal>
            ))}
          </div>
          <p className="ab-subnote">The committee members and sub-committees will be listed here too.</p>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap">
          <Reveal className="ab-docs">
            <span className="ab-docico"><FileText size={28} /></span>
            <div>
              <h3>Constitution and governance documents</h3>
              {documents.length
                ? <ul>{documents.map(([t, href]) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer"><Download size={16} /> {t}</a></li>)}</ul>
                : <p>Our approved constitution and governance documents will be published here for members to read.</p>}
            </div>
          </Reveal>
          {/* Shown only while developing (npm run dev), never on the live site */}
          {import.meta.env.DEV && (
            <p className="ab-devnote">Note for editors: the vision, mission, objectives and values above are proposed wording. Align them with the Association's registered constitution before launch.</p>
          )}
        </div>
      </section>
    </div>
  );
}
