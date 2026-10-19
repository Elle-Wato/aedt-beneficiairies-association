import { useState } from "react";
import { Link } from "react-router-dom";

const KEY = "aedt_cookie_consent";
export default function CookieBanner() {
  const [choice, setChoice] = useState(() => { try { return localStorage.getItem(KEY); } catch { return null; } });
  if (choice) return null;
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch {} setChoice(v); };
  return (
    <div className="cookie" role="dialog" aria-label="Cookie notice">
      <p>We use essential cookies to make this site work. With your permission we may also use analytics cookies to improve it. See our <Link to="/cookies">cookie policy</Link>.</p>
      <div className="row">
        <button className="btn green" onClick={() => save("all")}>Accept all</button>
        <button className="btn" style={{background:"#fff",color:"var(--green)",borderColor:"var(--green)"}} onClick={() => save("essential")}>Essential only</button>
      </div>
    </div>
  );
}