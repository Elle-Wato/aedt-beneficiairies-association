import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import "../styles/cookie.css";

const KEY = "aedt_cookie_consent";
export default function CookieBanner() {
  const [choice, setChoice] = useState(() => { try { return localStorage.getItem(KEY); } catch { return null; } });
  const [show, setShow] = useState(false);
  useEffect(() => { if (!choice) { const t = setTimeout(() => setShow(true), 900); return () => clearTimeout(t); } }, [choice]);
  if (choice) return null;
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch {} setChoice(v); };
  return (
    <div className={"ck" + (show ? " on" : "")} role="dialog" aria-label="Cookie notice">
      <span className="ck-ico"><Cookie size={22} /></span>
      <div className="ck-body">
        <h2>We value your privacy</h2>
        <p>We use essential cookies to make this site work. With your permission we may also use analytics cookies to improve it. See our <Link to="/cookies">cookie policy</Link>.</p>
        <div className="ck-row">
          <button className="btn green" onClick={() => save("all")}>Accept all</button>
          <button className="ck-alt" onClick={() => save("essential")}>Essential only</button>
        </div>
      </div>
    </div>
  );
}
