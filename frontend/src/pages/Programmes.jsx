import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Utensils, HeartHandshake, Wrench, TreePine, X, Check } from "lucide-react";

// EDIT HERE: text, photos and key points for each programme.
const programmes = [
  {
    id: "fees", Icon: GraduationCap, title: "Fee support for needy students",
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
    id: "meals", Icon: Utensils, title: "Student meal support",
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
    id: "mentorship", Icon: HeartHandshake, title: "Mentorship",
    image: "/images/mentorship-tree.jpg", pos: "50% 45%", alt: "A mentor speaking to students under a tree",
    short: "Graduates and professionals guide students on studies, careers and personal growth.",
    about: "Mentors visit schools and meet students in person, and are matched with younger members for ongoing guidance.",
    points: [
      "Open-air and classroom sessions with students.",
      "Career guidance, leadership and personal development.",
      "Open to graduates and professionals who want to volunteer.",
    ],
  },
  {
    id: "skills", Icon: Wrench, title: "Skills development",
    image: "/images/mentorship-hall.jpg", pos: "50% 50%", alt: "Students at an open-air session",
    short: "Training in digital skills, CVs, interviews and starting a business.",
    about: "Skills development helps members move from study to work.",
    points: [
      "Digital skills and entrepreneurship training.",
      "CV writing and interview preparation.",
      "Jobs and internship leads shared with members.",
    ],
  },
  {
    id: "community", Icon: TreePine, title: "Community service",
    image: "/images/community-service.jpg", pos: "50% 50%", alt: "Beneficiaries taking part in a community activity",
    short: "Visits to children's homes, tree planting, clean-ups and mosque cleaning.",
    about: "Our beneficiaries give back to the communities that supported them.",
    points: [
      "Visiting children's homes.",
      "Tree planting activities.",
      "Neighbourhood and mosque clean-ups.",
      "Every member is invited to take part.",
    ],
  },
];

export default function Programmes() {
  const [open, setOpen] = useState(null);
  const closeRef = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      trigger.current?.focus();
    };
  }, [open]);

  const show = (p, e) => { trigger.current = e.currentTarget; setOpen(p); };

  return (
    <>
      <section className="pagehead" style={{ backgroundImage: "url(/images/mentorship-hall.jpg)" }}>
        <div className="wrap">
          <h1>Our programmes</h1>
          <p>Everything we do is paid for and powered by our members.</p>
        </div>
      </section>

      <section className="section sand">
        <div className="wrap">
          <div className="pc-grid">
            {programmes.map((p) => (
              <article className="pc" key={p.id}>
                <div className="pc-media">
                  <div className="ph"><img src={p.image} alt={p.alt} style={{ objectPosition: p.pos }} loading="lazy" /></div>
                  <span className="badge"><p.Icon size={24} /></span>
                </div>
                <div className="tx">
                  <h3>{p.title}</h3>
                  <p>{p.short}</p>
                  <button className="btn line" onClick={(e) => show(p, e)} aria-haspopup="dialog">Read more</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
                    <div><h2>Help us reach more students</h2><p style={{ margin: 0 }}>Your monthly contribution supports every programme above.</p></div>
                    <div style={{ display: "flex", gap: ".8rem", flexWrap: "wrap" }}>
            <Link className="btn" to="/membership#join">Become a member</Link>
            <Link className="btn ghost" to="/volunteer">Mentor or volunteer</Link>
          </div>
        </div>
      </section>

      {open && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} className="x-close" aria-label="Close" onClick={() => setOpen(null)}><X size={20} /></button>
            <div className="sph"><img src={open.image} alt={open.alt} style={{ objectPosition: open.pos }} /></div>
            <div className="body">
              <span className="badge inline"><open.Icon size={22} /></span>
              <h2 id="sheet-title">{open.title}</h2>
              <p>{open.about}</p>
              <ul className="ticks">
                {open.points.map((t) => <li key={t}><Check size={18} /><span>{t}</span></li>)}
              </ul>
              <div className="acts">
                <Link className="btn green" to="/membership#join">Join and support this</Link>
                <Link className="btn line" to="/contact">Ask a question</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}