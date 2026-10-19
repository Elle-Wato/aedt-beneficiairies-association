import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const items = [["/", "Home"], ["/about", "About"], ["/programmes", "Programmes"], ["/news", "News"], ["/gallery", "Gallery"], ["/membership", "Membership"], ["/contact", "Contact"]];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
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
  );
}