import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Clock, Send, ChevronDown } from "lucide-react";
import Social from "../components/Social.jsx";
import { site } from "../data/site.js";

// EDIT HERE: questions and answers shown under the form.
const faqs = [
  ["How do I join the Association?",
   <>Fill in the <Link to="/membership#join">membership form</Link>, pay the KES 500 registration fee, and choose your monthly contribution.</>],
  ["How much is the monthly contribution?",
   "You choose the amount. Pick one of the quick options or enter your own, from KES 100 upward."],
  ["Can I mentor or volunteer without being a member?",
   <>Yes. You do not need to be a paying member. Use the <Link to="/volunteer">mentor and volunteer sign-up</Link>.</>],
  ["How will I know my contribution was received?",
   "After you record a payment, our treasurer matches it to the account statement and marks it confirmed."],
];

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const q = encodeURIComponent(site.address);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg({ type: "", text: "" });
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json();
      if (d.ok) { setMsg({ type: "ok", text: "Thank you. We will reply by email." }); setF({ name: "", email: "", subject: "", message: "" }); }
      else setMsg({ type: "bad", text: d.error || "Check the form and try again." });
    } catch { setMsg({ type: "bad", text: "Could not reach the server. Try again shortly." }); }
    setBusy(false);
  }

  const cards = [
    [MapPin, "Location", site.address],
    [Mail, "Email", <a href={"mailto:" + site.email}>{site.email}</a>],
    [Phone, "Phone", <a href={"tel:" + site.phone.replace(/\s/g, "")}>{site.phone}</a>],
    [Clock, "Office hours", site.hours],
  ];

  return (
    <>
      <section className="ct-head">
        <div className="wrap">
          <span className="eyebrow">Contact</span>
          <h1>We would love to hear from you.</h1>
          <p className="lede">Questions about joining, contributions, mentoring or partnerships? Send us a message and we will reply by email.</p>
        </div>
      </section>

      <section className="section ct-main">
        <div className="wrap ct-grid">
          <div>
            <h2>Get in touch</h2>
            <div className="ct-cards">
              {cards.map(([Icon, title, body]) => (
                <div className="ct-card" key={title}>
                  <span className="ct-ico"><Icon size={22} /></span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <div className="ct-follow">
              <h3>Follow us</h3>
              <Social className="on-light" />
            </div>
          </div>

          <div className="ct-form">
            <h2>Send a message</h2>
            <p className="ct-sub">We usually reply within a few working days.</p>
            {msg.text && <div className={"notice " + msg.type} role="status">{msg.text}</div>}
            <form className="form" onSubmit={submit}>
              <div className="grid2">
                <label>Name<input value={f.name} onChange={set("name")} autoComplete="name" required /></label>
                <label>Email<input type="email" value={f.email} onChange={set("email")} autoComplete="email" required /></label>
              </div>
              <label>Subject<input value={f.subject} onChange={set("subject")} placeholder="What is this about?" /></label>
              <label>Message<textarea rows={6} value={f.message} onChange={set("message")} required /></label>
              <div>
                <button className="btn green" disabled={busy}>
                  {busy ? "Sending…" : <>Send message <Send size={16} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="section ct-faq">
        <div className="wrap">
          <span className="eyebrow">Quick answers</span>
          <h2>Frequently asked questions</h2>
          <div className="faqs">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}<ChevronDown size={20} className="chev" /></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section ct-mapsec">
        <div className="wrap">
          <span className="eyebrow">Visit us</span>
          <h2>Find us</h2>
          {showMap ? (
            <iframe className="ct-map" title="Map showing our location" loading="lazy"
              src={"https://www.google.com/maps?q=" + q + "&output=embed"} referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="ct-map ct-mapph">
              <span className="ct-ico big"><MapPin size={30} /></span>
              <p className="addr">{site.address}</p>
              <p className="small">Loading the map shares your visit with Google.</p>
              <button className="btn green" onClick={() => setShowMap(true)}>Show map</button>
            </div>
          )}
          <p style={{ marginTop: "1.2rem" }}>
            <a className="btn line" href={"https://www.google.com/maps/search/?api=1&query=" + q} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
          </p>
        </div>
      </section>
    </>
  );
}