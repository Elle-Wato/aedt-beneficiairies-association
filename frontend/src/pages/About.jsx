import { Link } from "react-router-dom";
import {
  Eye, Target, GraduationCap, Utensils, HeartHandshake, Wrench, Briefcase, TreePine,
  ShieldCheck, Users, Scale, Handshake, Sprout, BookOpen, User, FileText,
} from "lucide-react";

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

const leaders = ["Chairperson", "Vice-chairperson", "Secretary", "Treasurer"];

export default function About() {
  return (
    <>
      <section className="pagehead" style={{ backgroundImage: "url(/images/mentorship-tree.jpg)" }}>
        <div className="wrap">
          <h1>About the Association</h1>
          <p>A community of AEDT beneficiaries who give back so that other students can finish their studies.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <div>
            <h2>Our story</h2>
            <p>Africa Education and Development Trust (AEDT) gives interest-free study loans and partial scholarships to extremely needy students. Many people who benefited want to do the same for the next student.</p>
            <p>The Association brings those beneficiaries together. Members join willingly, contribute a small amount each month, and give their time as mentors and volunteers. Together we pay fees, provide meals, build skills and serve our communities.</p>
            <Link className="btn green" to="/membership#join">Join the Association</Link>
          </div>
          <figure className="storyphoto">
            <img src="/images/gathering-1.jpg" alt="Members seated together at a gathering" style={{ objectPosition: "30% 60%" }} />
            <figcaption>Members, mentors and partners at a gathering</figcaption>
          </figure>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap vm">
          <article className="vcard green">
            <Eye size={34} />
            <h2>Our vision</h2>
            <p>A connected, empowered community that advances educational opportunity.</p>
          </article>
          <article className="vcard navy">
            <Target size={34} />
            <h2>Our mission</h2>
            <p>To mobilise beneficiaries, skills, networks and resources for fee support, meals, mentorship and skills development.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What we aim to do</h2>
          <p className="lede">Our objectives guide every programme we run.</p>
          <div className="ogrid">
            {objectives.map(([Icon, title, text]) => (
              <div className="ocard" key={title}>
                <span className="ico"><Icon size={26} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section navy">
        <div className="wrap">
          <h2>Our values</h2>
          <div className="vgrid">
            {values.map(([Icon, title, text]) => (
              <div className="vitem" key={title}>
                <Icon size={26} />
                <div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Leadership</h2>
          <p className="lede">Our officials are chosen by members. Names and photos will appear here once confirmed.</p>
          <div className="leaders">
            {leaders.map((role) => (
              <div className="leader" key={role}>
                <span className="avatar"><User size={34} /></span>
                <h3>{role}</h3>
                <p>Name to be confirmed</p>
              </div>
            ))}
          </div>
          <p className="subnote">The committee members and sub-committees will be listed here too.</p>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap">
          <div className="docs">
            <span className="ico"><FileText size={28} /></span>
            <div>
              <h3>Constitution and governance documents</h3>
              <p>Our approved constitution and governance documents will be published here for members to read.</p>
            </div>
          </div>
          <p className="notice">The vision, mission, objectives and values above are proposed wording. Align them with the Association's registered constitution before launch.</p>
        </div>
      </section>
    </>
  );
}