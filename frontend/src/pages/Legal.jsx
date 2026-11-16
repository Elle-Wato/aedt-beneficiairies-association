import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Cookie, Mail, Phone } from "lucide-react";
import PageHero from "../components/PageHero.jsx";
import { site } from "../data/site.js";

// Shared layout: banner, sticky contents list, readable text column.
function LegalPage({ kicker, title, hl, intro, updated, sections, other }) {
  const [active, setActive] = useState(sections[0].id);
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      const v = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (v[0]) setActive(v[0].target.id);
    }, { rootMargin: "-120px 0px -60% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [sections]);
  const go = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", "#" + id); };

  return (
    <div className="px">
      <PageHero kicker={kicker} title={title} hl={hl} text={intro} />
      <section className="section lg">
        <div className="wrap lg-grid">
          <aside className="lg-toc" aria-label="On this page">
            <span className="lg-toc-h">On this page</span>
            <nav>
              {sections.map((s, k) => (
                <a key={s.id} href={"#" + s.id} onClick={go(s.id)} className={active === s.id ? "on" : ""}>
                  <i>{String(k + 1).padStart(2, "0")}</i>{s.h}
                </a>
              ))}
            </nav>
            <div className="lg-toc-other">{other}</div>
          </aside>
          <article className="lg-body legal">
            <p className="lg-updated">Last updated: {updated}</p>
            {sections.map((s, k) => (
              <section key={s.id} id={s.id} className="lg-sec">
                <h2><span>{String(k + 1).padStart(2, "0")}</span>{s.h}</h2>
                {s.body}
              </section>
            ))}
            <div className="lg-contact">
              <h3>Questions about your information?</h3>
              <p>Contact the Association. We will respond as soon as we can.</p>
              <div className="notranslate" translate="no">
                <a href={"mailto:" + site.email}><Mail size={16} /> {site.email}</a>
                <a href={"tel:" + site.phone.replace(/\s/g, "")}><Phone size={16} /> {site.phone}</a>
              </div>
            </div>
            {/* Shown only while developing (npm run dev), never on the live site */}
            {import.meta.env.DEV && (
              <p className="ab-devnote">Note for editors: have this reviewed against the Kenya Data Protection Act, 2019 and the Association's constitution before launch.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}

export function Privacy() {
  const sections = [
    { id: "who", h: "Who we are", body: <p>The AEDT Beneficiaries Association ("we") is the data controller for information collected on this website.</p> },
    { id: "collect", h: "What we collect", body: (
      <ul>
        <li><strong>Membership form:</strong> name, email, phone, county or town, education details, AEDT status, employment details, your chosen monthly contribution, areas you want to help with, and your consent.</li>
        <li><strong>Mentor and volunteer form:</strong> name, email, phone, location, profession, organisation, the areas you can help with, availability, experience and your consent.</li>
        <li><strong>Internship and attachment application:</strong> name, email, phone, AEDT status, institution, course, year of study, the placement you want, preferred location and dates, a link to your CV, any message, and your consent.</li>
        <li><strong>Contact form:</strong> your name, email, subject and message.</li>
      </ul>
    ) },
    { id: "why", h: "Why we use it", body: (
      <ul>
        <li>To process your membership and contact you about contributions and activities.</li>
        <li>To run mentorship, training, volunteer and community programmes.</li>
        <li>To match placement applicants with internship and attachment opportunities.</li>
        <li>To reply to your messages.</li>
        <li>To keep accurate member records and report to the membership.</li>
      </ul>
    ) },
    { id: "consent", h: "Your consent", body: <p>Joining and applying are voluntary. We process your information because you agree when you submit a form. You can withdraw consent at any time by contacting us.</p> },
    { id: "share", h: "Who sees it", body: (
      <>
        <p>Only authorised officials. We do not sell your information.</p>
        <p>If you apply for an internship or attachment, and only with your consent on that form, we share your profile and CV with the partner organisations we introduce you to.</p>
        <p>Otherwise we share it only where the law requires, or with a service provider acting for us (for example email or payment providers) under confidentiality.</p>
      </>
    ) },
    { id: "keep", h: "How long we keep it", body: <p>For as long as you are a member or your application is active, and afterwards only as long as needed for records and legal duties. Then we delete it.</p> },
    { id: "rights", h: "Your rights", body: <p>You may ask to see, correct or delete your information, object to its use, or complain to the Office of the Data Protection Commissioner.</p> },
    { id: "security", h: "Security", body: <p>We limit access to records and use secure connections. We never ask for your M-Pesa PIN or passwords through this website.</p> },
  ];
  return (
    <LegalPage kicker="Privacy" title="Privacy statement." hl="statement." updated="November 2026"
      intro="How we collect, use and protect your personal information." sections={sections}
      other={<Link to="/cookies"><Cookie size={16} /> Cookie policy</Link>} />
  );
}

export function Cookies() {
  const sections = [
    { id: "what", h: "What cookies are", body: <p>Cookies and similar browser storage are small pieces of data a website saves on your device.</p> },
    { id: "use", h: "What we use", body: (
      <ul>
        <li><strong>Essential:</strong> remembers your cookie choice so we do not ask again. The site works without anything else.</li>
        <li><strong>Preferences:</strong> remembers whether you chose dark or light mode (<code>aedt_theme</code>), and the language you picked (<code>googtrans</code>, only after you choose a language other than English).</li>
        <li><strong>Analytics (only if you accept):</strong> helps us see which pages are useful. Not active until you choose "Accept all" and an analytics tool is added.</li>
      </ul>
    ) },
    { id: "third", h: "Third parties", body: (
      <ul>
        <li><strong>Google Fonts:</strong> our fonts load from Google, which may receive your IP address.</li>
        <li><strong>Google Translate:</strong> only loads if you choose a language other than English. Google then processes the page text to translate it.</li>
        <li><strong>Google Maps:</strong> only loads on the Contact page if you press "Show map".</li>
        <li><strong>WhatsApp:</strong> the chat button opens WhatsApp only when you tap it.</li>
      </ul>
    ) },
    { id: "change", h: "Changing your choice", body: <p>Clear this site's data in your browser settings and the cookie notice will appear again. Choosing English in the language menu removes the language cookie.</p> },
  ];
  return (
    <LegalPage kicker="Cookies" title="Cookie policy." hl="policy." updated="November 2026"
      intro="What this website stores on your device, and why." sections={sections}
      other={<Link to="/privacy"><ShieldCheck size={16} /> Privacy statement</Link>} />
  );
}