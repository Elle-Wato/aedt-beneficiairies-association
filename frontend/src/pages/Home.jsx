import { Link } from "react-router-dom";
import { photos, updates } from "../data/content.js";
import { Upcoming, UpdateItem } from "../components/NewsBits.jsx";

const progs = [
  ["/images/partner-cheque.jpg", "50% 40%", "Fee support", "Contributions and partner gifts that keep needy students in class."],
  ["/images/meal-support.jpg", "50% 50%", "Student meal support", "Meal vouchers so students can eat daily and focus on their studies."],
  ["/images/mentorship-tree.jpg", "50% 45%", "Mentorship", "Graduates and professionals guiding students on studies and careers."],
  ["/images/mentorship-hall.jpg", "50% 50%", "Skills development", "Digital skills, CVs, interviews and entrepreneurship."],
  ["/images/community-service.jpg", "50% 50%", "Community service", "Children's home visits, tree planting and clean-ups."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>Helping each other through school, and beyond.</h1>
          <p className="lede">We are AEDT beneficiaries who give back: paying fees for needy students, mentoring each other and building skills that lead to work.</p>
          <div className="actions">
            <Link className="btn" to="/membership#join">Become a member</Link>
            <Link className="btn ghost" to="/programmes">See what we do</Link>
          </div>
          <div className="feebar" aria-label="Membership fees">
            <div><b>KES 500</b><span>one-time registration</span></div>
            <div><b>KES 500</b><span>monthly contribution</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>What your membership pays for</h2>
          <p className="lede">Five programmes, all funded and powered by our members.</p>
          <div className="pgrid">
            {progs.map(([src, pos, title, text]) => (
              <Link to="/programmes" className="pcard" key={title}>
                <div className="ph"><img src={src} alt="" style={{ objectPosition: pos }} loading="lazy" /></div>
                <div className="tx"><h3>{title}</h3><p>{text}</p><span className="more">Learn more</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section navy">
        <div className="wrap split">
          <div>
            <h2>Owned by members, run for students</h2>
            <p>The Association brings together people who were supported by AEDT. Each member joins willingly and pays a small amount every month. Together, those small amounts become school fees and meals for students who would otherwise drop out.</p>
            <Link className="btn" to="/about">Read our story</Link>
          </div>
          <ol className="steps">
            <li><div><strong>Fill in the form.</strong> Tell us about yourself and agree to the privacy statement.</div></li>
            <li><div><strong>Pay KES 500 to register.</strong> We send payment instructions once we receive your form.</div></li>
            <li><div><strong>Contribute KES 500 each month.</strong> Your money goes to fee support and member programmes.</div></li>
          </ol>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap">
          <div className="newsgrid">
            <div>
              <h2>Latest updates</h2>
              {updates.slice(0, 2).map((u) => <UpdateItem key={u.date + u.title} u={u} />)}
              <Link className="btn ghost" to="/news">All news and events</Link>
            </div>
            <aside className="panel">
              <h2>Coming up</h2>
              <Upcoming limit={3} />
            </aside>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Moments from our work</h2>
          <div className="mosaic">
            {photos.slice(0, 3).map((p) => (
              <figure key={p.src}>
                <img src={p.src} alt={p.alt} loading="lazy" />
                <figcaption>{p.caption}</figcaption>
              </figure>
            ))}
          </div>
          <p style={{ marginTop: "1.6rem" }}><Link className="btn green" to="/gallery">See all photos</Link></p>
        </div>
      </section>

      <section className="cta">
        <div className="wrap">
          <div><h2>Ready to give back?</h2><p style={{ margin: 0 }}>Joining is voluntary and takes about three minutes.</p></div>
          <Link className="btn" to="/membership#join">Fill the membership form</Link>
        </div>
      </section>
    </>
  );
}