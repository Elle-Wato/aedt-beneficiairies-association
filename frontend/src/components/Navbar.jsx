import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, Mail, Phone } from "lucide-react";
import Social from "./Social.jsx";
import { site } from "../data/site.js";

const items = [["/", "Home"], ["/about", "About"], ["/programmes", "Programmes"], ["/news", "News"], ["/gallery", "Gallery"], ["/volunteer", "Get involved"], ["/contact", "Contact"]];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="tb-info">
            <a href={"mailto:" + site.email}><Mail size={15} /> {site.email}</a>
            <a href={"tel:" + site.phone.replace(/\s/g, "")}><Phone size={15} /> {site.phone}</a>
          </div>
          <div className="tb-right">
            <Social />
            <Link className="tb-cta" to="/contribute">Contribute</Link>
          </div>
        </div>
      </div>

      <header className="nav">
        <div className="wrap">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <i>AEDT</i> Beneficiaries Association
          </Link>
          <button className="burger" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <nav className={"links" + (open ? " open" : "")} aria-label="Main">
            {items.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}
            <Link to="/membership#join" className="btn" onClick={() => setOpen(false)}>Join now</Link>
          </nav>
        </div>
      </header>
    </>
  );
}