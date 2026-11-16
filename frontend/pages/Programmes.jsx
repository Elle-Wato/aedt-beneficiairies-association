import { Link } from "react-router-dom";
import { GraduationCap, Utensils, HeartHandshake, Wrench, TreePine, Check, ArrowRight } from "lucide-react";
import PageHero from "../components/PageHero.jsx";
import Reveal from "../components/Reveal.jsx";

// EDIT HERE: text, photos and key points for each programme.
const programmes = [
  {
    id: "fees", Icon: GraduationCap, title: "Fee support for needy students", nav: "Fee support",
    image: "/images/partner-cheque.jpg", pos: "50% 40%", alt: "Partners presenting a contribution to AEDT",
    short: "Member contributions and partner gifts pay school fees for students who cannot afford them.",
    about: "Fee support keeps students in class when money runs out. It is paid for by member contributions and partner gifts.",
    points: [
      "Eligibility rules and the application process will be published here.",
      "Every award is reviewed by the committee.",
      "Funded by members' monthly contributions and partner gifts.",
    ],
  },
  {
    id: "meals", Icon: Utensils, title: "Student meal support", nav: "Meals",
    image: "/images/meal-support.jpg", pos: "50% 50%", alt: "Students at a meal support event",
    short: "Meal vouchers so needy students can eat every day and stay focused on their studies.",
    about: "AEDT provides interest-free study loans and partial scholarships, but many extremely needy students still struggle to afford daily meals. That affects their health, concentration and results.",
    points: [
      "Target: 1,000 meal vouchers per semester, costing about KES 100,000.",
      "Vouchers are bought from restaurants at Umma University.",
      "They are given out through the Imam's office.",
      "AEDT selects beneficiaries, runs distribution and oversees the programme.",
    ],
  },
  {
    id: "mentorship", Icon: HeartHandshake, title: "Mentorship", nav: "Mentorship",
    image: "/images/outreach-school-hall.jpg", pos: "50% 55%", alt: "Students listening to mentors at a school session",
    short: "Graduates and professionals guide students on studies, careers and personal growth.",
    about: "Mentors visit schools and meet students in person, and are matched with younger members for ongoing guidance.",
    points: [
      "Open-air and classroom sessions with students.",
      "Career guidance, leadership and personal development.",
      "Open to graduates and professionals who want to volunteer.",
    ],
    cta: ["Become a mentor", "/volunteer"],
  },
  {
    id: "skills", Icon: Wrench, title: "Skills development", nav: "Skills",
    image: "/images/seminar-classroom.jpg", pos: "50% 50%", alt: "Students taking notes at a skills seminar",
    short: "Training in digital skills, CVs, interviews and starting a business.",
    about: "Skills development helps members move from study to work.",
    points: [
      "Digital skills and entrepreneurship training.",
      "CV writing and interview preparation.",
      "Jobs and internship leads shared with members.",
    ],
    cta: ["Find an internship or attachment", "/opportunities"],
  },
  {
    id: "community", Icon: TreePine, title: "Community service", nav: "Community service",
    image: "/images/cleanup-volunteer.jpg", pos: "50% 45%", alt: "A volunteer collecting litter during a clean-up",
    short: "Visits to children's homes, tree planting, clean-ups and mosque cleaning.",
    about: "Our beneficiaries give back to the communities that supported them.",
    points: [
      "Visiting children's homes.",
      "Tree planting activities.",
      "Neighbourhood and mosque clean-ups.",
      "Every member is invited to take part.",
    ],
    cta: ["Volunteer with us", "/volunteer"],
  },
];

const jump = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", "#" + id);
};

export default function Programmes() {
  return (
    <div className="px" data-own-motion>
      <PageHero kicker="Our programmes" title="Everything we do is powered by our members." hl="powered by our members."
        text="Five programmes, one purpose: keep students learning and help members grow." image="/images/conference-crowd.jpg" />

      <nav className="px-subnav" aria-label="Programmes on this page">
        <div className="wrap">
          {programmes.map((p) => (
            <a key={p.id} href={"#" + p.id} onClick={jump(p.id)}><p.Icon size={16} /> {p.nav}</a>
          ))}
        </div>
      </nav>

      <section className="section">
        <div className="wrap px-progs">
          {programmes.map((p, k) => (
            <article className="px-prog" id={p.id} key={p.id}>
              <Reveal className="px-prog-media">
                <div className="px-img"><img src={p.image} alt={p.alt} style={{ objectPosition: p.pos }} loading="lazy" /></div>
                <span className="px-badge"><p.Icon size={26} /></span>
              </Reveal>
              <Reveal delay={120}>
                <span className="px-num">Programme {String(k + 1).padStart(2, "0")}</span>
                <h2>{p.title}</h2>
                <p className="px-short">{p.short}</p>
                <p>{p.about}</p>
                <ul className="px-ticks">
                  {p.points.map((t) => <li key={t}><Check size={16} /><span>{t}</span></li>)}
                </ul>
                <div className="px-acts">
                  <Link className="btn green" to={p.cta ? p.cta[1] : "/membership#join"}>{p.cta ? p.cta[0] : "Join and support this"} <ArrowRight size={17} /></Link>
                  <Link className="btn line" to="/contact">Ask a question</Link>
                </div>
              </Reveal>
            </article>
          ))}
        </div>
      </section>

      <section className="px-band">
        <div className="wrap">
          <Reveal className="px-band-in">
            <div>
              <h2>Help us reach more students</h2>
              <p>Your monthly contribution supports every programme above.</p>
            </div>
            <div className="px-band-btns">
              <Link className="btn" to="/membership#join">Become a member</Link>
              <Link className="btn ghost" to="/volunteer">Mentor or volunteer</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
