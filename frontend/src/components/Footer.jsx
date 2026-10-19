import { Link } from "react-router-dom";
import { MapPin, Mail, Phone } from "lucide-react";
import Social from "./Social.jsx";
import { site } from "../data/site.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <h3>AEDT Beneficiaries Association</h3>
            <p>A beneficiary-led community for mentorship, fee support, meals and skills development.</p>
            <Social />
          </div>
          <div>
            <h3>Explore</h3>
            <Link to="/about">About us</Link><Link to="/programmes">Programmes</Link>
            <Link to="/news">News</Link><Link to="/gallery">Gallery</Link>
            <Link to="/membership">Membership</Link><Link to="/contact">Contact</Link>
          </div>
          <div>
            <h3>Legal</h3>
            <Link to="/privacy">Privacy statement</Link><Link to="/cookies">Cookie policy</Link>
          </div>
          <div>
            <h3>Find us</h3>
            <ul className="finfo">
              <li><MapPin size={18} /><span>{site.address}</span></li>
              <li><Mail size={18} /><a href={"mailto:" + site.email}>{site.email}</a></li>
              <li><Phone size={18} /><a href={"tel:" + site.phone.replace(/\s/g, "")}>{site.phone}</a></li>
            </ul>
          </div>
        </div>
        <small>© {new Date().getFullYear()} AEDT Beneficiaries Association. All rights reserved.</small>
      </div>
    </footer>
  );
}