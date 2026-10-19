import { useState } from "react";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import Social from "../components/Social.jsx";
import { site } from "../data/site.js";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showMap, setShowMap] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const q = encodeURIComponent(site.address);

  async function submit(e) {
    e.preventDefault();
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json();
      if (d.ok) { setMsg({ type: "ok", text: "Thank you. We will reply by email." }); setF({ name: "", email: "", subject: "", message: "" }); }
      else setMsg({ type: "bad", text: d.error || "Check the form and try again." });
    } catch { setMsg({ type: "bad", text: "Could not reach the server. Try again shortly." }); }
  }

  return (
    <>
      <section className="pagehead" style={{ backgroundImage: "url(/images/gathering-1.jpg)" }}>
        <div className="wrap">
          <h1>Contact us</h1>
          <p>Questions about joining, contributions or partnerships? We would love to hear from you.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap contactgrid">
          <div>
            <h2>Get in touch</h2>
            <ul className="cinfo">
              <li><span className="ico"><MapPin size={22} /></span><div><h3>Location</h3><p>{site.address}</p></div></li>
              <li><span className="ico"><Mail size={22} /></span><div><h3>Email</h3><p><a href={"mailto:" + site.email}>{site.email}</a></p></div></li>
              <li><span className="ico"><Phone size={22} /></span><div><h3>Phone</h3><p><a href={"tel:" + site.phone.replace(/\s/g, "")}>{site.phone}</a></p></div></li>
              <li><span className="ico"><Clock size={22} /></span><div><h3>Office hours</h3><p>{site.hours}</p></div></li>
            </ul>
            <h3>Follow us</h3>
            <Social className="on-light" />
          </div>

          <div>
            <h2>Send a message</h2>
            {msg.text && <div className={"notice " + msg.type} role="status">{msg.text}</div>}
            <form className="form" onSubmit={submit}>
              <div className="grid2">
                <label>Name<input value={f.name} onChange={set("name")} required /></label>
                <label>Email<input type="email" value={f.email} onChange={set("email")} required /></label>
              </div>
              <label>Subject<input value={f.subject} onChange={set("subject")} /></label>
              <label>Message<textarea rows={6} value={f.message} onChange={set("message")} required /></label>
              <div><button className="btn green">Send message</button></div>
            </form>
          </div>
        </div>
      </section>

      <section className="section sand">
        <div className="wrap">
          <h2>Find us</h2>
          {showMap ? (
            <iframe className="map" title="Map showing our location" loading="lazy"
              src={"https://www.google.com/maps?q=" + q + "&output=embed"} referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="map placeholder">
              <MapPin size={34} />
              <p>{site.address}</p>
              <p className="small">Loading the map shares your visit with Google.</p>
              <button className="btn green" onClick={() => setShowMap(true)}>Show map</button>
            </div>
          )}
          <p style={{ marginTop: "1rem" }}>
            <a className="btn line" href={"https://www.google.com/maps/search/?api=1&query=" + q} target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
          </p>
        </div>
      </section>
    </>
  );
}