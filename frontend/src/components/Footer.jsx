import { Link, useLocation } from "react-router-dom";
import { MapPin, Mail, Phone, Clock, ArrowRight, ArrowUp, Heart } from "lucide-react";
import Social from "./Social.jsx";
import { site } from "../data/site.js";
import "../styles/footer.css";

// EDIT HERE: footer link columns
const cols = [
  ["Explore", [["/about", "About us"], ["/programmes", "Programmes"], ["/campaigns", "Campaigns"], ["/news", "News and events"], ["/gallery", "Gallery"]]],
  ["Get involved", [["/membership#join", "Become a member"], ["/contribute", "Contribute"], ["/opportunities", "Internships and attachments"], ["/volunteer", "Mentor or volunteer"], ["/contact", "Contact us"]]],
];

// pages that already end with their own call to action
const OWN_CTA = ["/", "/programmes", "/gallery"];

export default function Footer() {
  const { pathname } = useLocation();
  const showCta = !OWN_CTA.includes(pathname);
  const tel = "tel:" + site.phone.replace(/\s/g, "");
  return (
    <footer className={"ft" + (showCta ? "" : " no-cta")}>
      <div className="wrap">
        {showCta && <div className="ft-cta">
          <div>
            <span className="ft-kicker">Connect. Empower. Give back.</span>
            <h2>You were once supported. Now you can support the next student.</h2>
          </div>
          <div className="ft-cta-btns">
            <Link className="btn" to="/membership#join">Become a member <ArrowRight size={18} /></Link>
            <Link className="btn ft-ghost" to="/contribute"><Heart size={17} /> Contribute</Link>
          </div>
        </div>}

        <div className="ft-cols">
          <div className="ft-about">
            <Link to="/" className="ft-brand notranslate" translate="no">
              {site.logo
                ? <span className="ft-logo"><img src={site.logo} alt="AEDT Beneficiaries Association" /></span>
                : <><span className="ft-badge">AEDT</span><span><b>Beneficiaries</b><small>Association</small></span></>}
            </Link>
            <p>A beneficiary-led community for mentorship, fee support, meals and skills development.</p>
            <Social className="ft-social" />
          </div>
          {cols.map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <h3>{title}</h3>
              <ul>{links.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul>
            </nav>
          ))}
          <div>
            <h3>Find us</h3>
            <ul className="ft-info notranslate" translate="no">
              <li><MapPin size={18} /><span>{site.address}</span></li>
              <li><Mail size={18} /><a href={"mailto:" + site.email}>{site.email}</a></li>
              <li><Phone size={18} /><a href={tel}>{site.phone}</a></li>
              <li><Clock size={18} /><span>{site.hours}</span></li>
            </ul>
          </div>
        </div>

        <div className="ft-bottom">
          <small>© {new Date().getFullYear()} AEDT Beneficiaries Association. All rights reserved.</small>
          <span className="ft-legal">
            <Link to="/privacy">Privacy statement</Link>
            <Link to="/cookies">Cookie policy</Link>
            <button type="button" className="ft-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ArrowUp size={16} /></button>
          </span>
        </div>
      </div>
    </footer>
  );
}
