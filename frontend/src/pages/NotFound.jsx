import { Link } from "react-router-dom";
import { Home, Users, HeartHandshake, Megaphone, Briefcase, Mail, ArrowRight } from "lucide-react";
import "../styles/pages.css";

const links = [
  [Home, "Home", "Start from the beginning", "/"],
  [Users, "Become a member", "Join for KES 500", "/membership#join"],
  [Megaphone, "Campaigns", "Causes we are rallying behind", "/campaigns"],
  [Briefcase, "Internships", "Find a placement", "/opportunities"],
  [HeartHandshake, "Mentor or volunteer", "Give your time", "/volunteer"],
  [Mail, "Contact us", "We will help you find it", "/contact"],
];

export default function NotFound() {
  return (
    <div className="px">
      <section className="nf">
        <div className="wrap nf-in">
          <div className="nf-num" aria-hidden="true"><span>4</span><i /><span>4</span></div>
          <h1>This page has moved on to its next chapter.</h1>
          <p>We could not find the page you were looking for. It may have been renamed, or the link may be mistyped. These might help:</p>
          <div className="nf-links">
            {links.map(([Icon, t, d, to]) => (
              <Link key={to} to={to} className="nf-link">
                <span><Icon size={20} /></span>
                <div><b>{t}</b><small>{d}</small></div>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}