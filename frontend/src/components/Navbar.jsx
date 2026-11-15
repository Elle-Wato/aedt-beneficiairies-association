import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { Menu, X, Mail, Phone, ArrowRight, Heart } from "lucide-react";
import Social from "./Social.jsx";
import { LanguageMenu, ThemeToggle } from "./LangTheme.jsx";
import { site } from "../data/site.js";
import "../styles/nav.css";

// EDIT HERE: main menu items [link, label]
const items = [
  ["/", "Home"], ["/about", "About"], ["/programmes", "Programmes"], ["/campaigns", "Campaigns"],
  ["/opportunities", "Internships"], ["/news", "News"], ["/gallery", "Gallery"], ["/volunteer", "Get involved"], ["/contact", "Contact"],
];

function Brand({ onClick }) {
  return (
    <Link to="/" className="nv-brand notranslate" translate="no" onClick={onClick} aria-label="Home">
      {site.logo
        ? <img src={site.logo} alt="AEDT Beneficiaries Association" />
        : <><span className="nv-badge">AEDT</span><span className="nv-name"><b>Beneficiaries</b><small>Association</small></span></>}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {   // lock page scroll and allow Escape while the mobile menu is open
    document.body.style.overflow = open ? "hidden" : "";
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", key); };
  }, [open]);

  const tel = "tel:" + site.phone.replace(/\s/g, "");
  return (
    <>
      <div className="nv-top">
        <div className="wrap nv-top-in">
          <div className="nv-info notranslate" translate="no">
            <a href={"mailto:" + site.email}><Mail size={14} /> <span>{site.email}</span></a>
            <a href={tel}><Phone size={14} /> <span>{site.phone}</span></a>
          </div>
          <div className="nv-top-right">
            <LanguageMenu />
            <Social />
            <Link className="nv-give" to="/contribute"><Heart size={14} /> Contribute</Link>
          </div>
        </div>
      </div>

      <header className={"nv" + (scrolled ? " scrolled" : "")}>
        <div className="wrap nv-in">
          <Brand />
          <nav className="nv-links" aria-label="Main">
            {items.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink>
            ))}
          </nav>
          <div className="nv-tools"><ThemeToggle /></div>
          <Link to="/membership#join" className="btn nv-join">Become a member</Link>
          <button className="nv-burger" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="nv-drawer" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <div className={"nv-scrim" + (open ? " open" : "")} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside id="nv-drawer" className={"nv-drawer" + (open ? " open" : "")} aria-hidden={!open} aria-label="Menu">
        <div className="nv-drawer-head">
          <Brand onClick={() => setOpen(false)} />
          <button className="nv-burger" aria-label="Close menu" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}><X /></button>
        </div>
        <nav className="nv-dlinks" aria-label="Main mobile">
          {items.map(([to, label], k) => (
            <NavLink key={to} to={to} end={to === "/"} style={{ transitionDelay: open ? `${60 + k * 35}ms` : "0ms" }}
              className={({ isActive }) => (isActive ? "active" : "")} tabIndex={open ? 0 : -1}>
              {label} <ArrowRight size={18} />
            </NavLink>
          ))}
        </nav>
        <div className="nv-dprefs">
          <span className="nv-dlabel">Language</span>
          <LanguageMenu variant="list" />
          <ThemeToggle withLabel />
        </div>
        <div className="nv-dcta">
          <Link to="/membership#join" className="btn" tabIndex={open ? 0 : -1}>Become a member</Link>
          <Link to="/contribute" className="btn line" tabIndex={open ? 0 : -1}>Contribute</Link>
        </div>
        <div className="nv-dinfo notranslate" translate="no">
          <a href={"mailto:" + site.email} tabIndex={open ? 0 : -1}><Mail size={16} /> {site.email}</a>
          <a href={tel} tabIndex={open ? 0 : -1}><Phone size={16} /> {site.phone}</a>
          <Social />
        </div>
      </aside>
    </>
  );
}
