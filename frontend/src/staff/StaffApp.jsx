// Staff dashboard: /staff. Lets the office manage form submissions, campaigns, contributions,
// news, events, the gallery and internship listings without editing code.
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Inbox as InboxIcon, Megaphone, Wallet, Newspaper, Images, Briefcase, Settings as SettingsIcon,
  Users, History, LogOut, Menu, X, ExternalLink, Lock, IdCard, FileDown,
} from "lucide-react";
import { sfetch, getToken, setToken, setExpiredHandler } from "./client.js";
import { ToastHost, Field } from "./ui.jsx";
import PasswordForm from "./PasswordForm.jsx";
import Overview from "./Overview.jsx";
import Inbox from "./Inbox.jsx";
import CampaignsAdmin from "./CampaignsAdmin.jsx";
import Contributions from "./Contributions.jsx";
import { NewsAdmin, GalleryAdmin, InternshipsAdmin } from "./ContentAdmin.jsx";
import Settings from "./Settings.jsx";
import Team from "./Team.jsx";
import Activity from "./Activity.jsx";
import Members from "./Members.jsx";
import Downloads from "./Downloads.jsx";
import { site } from "../data/site.js";
import "./staff.css";

const NAV = [
  ["", "Overview", LayoutDashboard], ["inbox", "Inbox", InboxIcon], ["members", "Members", IdCard],
  ["contributions", "Contributions", Wallet], ["campaigns", "Campaigns", Megaphone], ["news", "News and events", Newspaper], ["gallery", "Gallery", Images],
  ["internships", "Internships", Briefcase], ["downloads", "Downloads", FileDown], ["settings", "Settings", SettingsIcon],
  ["team", "Staff accounts", Users, "admin"], ["activity", "Activity log", History, "admin"],
];

export default function StaffApp() {
  const [me, setMe] = useState(null);
  const [meta, setMeta] = useState(null);
  const [checking, setChecking] = useState(!!getToken());

  const signOut = useCallback(() => { setToken(null); setMe(null); }, []);
  useEffect(() => { setExpiredHandler(() => setMe(null)); }, []);
  const loadMe = useCallback(async () => {
    try { const d = await sfetch("/me"); setMe(d.staff); setMeta(d); } catch { setMe(null); }
    finally { setChecking(false); }
  }, []);
  useEffect(() => { if (getToken()) loadMe(); }, [loadMe]);
  useEffect(() => {
    const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex, nofollow";
    document.head.appendChild(m); document.title = "Staff dashboard | AEDT Beneficiaries Association";
    return () => m.remove();
  }, []);

  return (
    <div className="sd" translate="no">
      <ToastHost>
        {checking ? <div className="sd-center">Checking your sign-in...</div>
          : !me ? <Login onIn={(d) => { setToken(d.token); loadMe(); }} />
          : me.must_change_password ? <FirstPassword me={me} onDone={(d) => { setToken(d.token); loadMe(); }} onOut={signOut} />
          : <Shell me={me} meta={meta} onOut={signOut} reloadMe={loadMe} />}
      </ToastHost>
    </div>
  );
}

function Brand() {
  return (
    <div className="sd-brand">
      {site.logo ? <img src={site.logo} alt="" /> : <b>AEDT</b>}
      <span>Staff dashboard</span>
    </div>
  );
}

function Login({ onIn }) {
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { onIn(await sfetch("/login", { method: "POST", body: f })); }
    catch (e2) { setErr(e2.message); }
    finally { setBusy(false); }
  }
  return (
    <div className="sd-login">
      <form className="sd-login-card" onSubmit={submit}>
        <Brand />
        <h1>Sign in</h1>
        <p className="sd-muted">For AEDT Beneficiaries Association staff and volunteers with an account.</p>
        <Field label="Email"><input type="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required autoFocus /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></Field>
        {err && <p className="sd-alert bad" role="alert">{err}</p>}
        <button className="sd-btn primary block" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        <p className="sd-small">Forgot your password? Ask an admin to reset it from Staff accounts.</p>
        <Link className="sd-small sd-back" to="/">Back to the website</Link>
      </form>
    </div>
  );
}

function FirstPassword({ me, onDone, onOut }) {
  return (
    <div className="sd-login">
      <div className="sd-login-card">
        <Brand />
        <h1><Lock size={22} /> Choose your password</h1>
        <p className="sd-muted">Welcome, {me.name}. Replace the temporary password you were given before you continue.</p>
        <PasswordForm onDone={onDone} currentLabel="Temporary password" submitLabel="Save and continue" />
        <button className="sd-small sd-linkbtn" onClick={onOut}>Sign out</button>
      </div>
    </div>
  );
}

function Shell({ me, meta, onOut, reloadMe }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const section = pathname.replace(/^\/staff\/?/, "").split("/")[0];
  const [open, setOpen] = useState(false);
  const go = (s) => { navigate("/staff" + (s ? "/" + s : "")); setOpen(false); window.scrollTo(0, 0); };
  const items = NAV.filter((n) => !n[3] || n[3] === me.role);
  const current = items.find((n) => n[0] === section) || items[0];
  const props = { me, meta, go };
  const page = {
    "": <Overview {...props} />, inbox: <Inbox {...props} />, members: <Members {...props} />,
    downloads: <Downloads {...props} />, campaigns: <CampaignsAdmin {...props} />,
    contributions: <Contributions {...props} />, news: <NewsAdmin {...props} />, gallery: <GalleryAdmin {...props} />,
    internships: <InternshipsAdmin {...props} />, settings: <Settings {...props} reloadMe={reloadMe} />,
    team: me.role === "admin" ? <Team {...props} /> : null, activity: me.role === "admin" ? <Activity {...props} /> : null,
  }[current[0]];
  return (
    <div className={"sd-shell" + (open ? " nav-open" : "")}>
      <aside className="sd-side">
        <div className="sd-side-top"><Brand /><button className="sd-icon sd-only-m" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
        <nav aria-label="Dashboard">
          {items.map(([key, label, Icon]) => (
            <a key={key} href={"/staff" + (key ? "/" + key : "")} className={key === current[0] ? "on" : ""}
              aria-current={key === current[0] ? "page" : undefined}
              onClick={(e) => { e.preventDefault(); go(key); }}><Icon size={18} /> {label}</a>
          ))}
        </nav>
        <div className="sd-side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> View website</a>
          <div className="sd-me"><b>{me.name}</b><span>{me.email} · {me.role}</span></div>
          <button className="sd-btn ghost block" onClick={onOut}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>
      <div className="sd-scrim" onClick={() => setOpen(false)} />
      <div className="sd-main">
        <header className="sd-top">
          <button className="sd-icon sd-only-m" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <h1>{current[1]}</h1>
        </header>
        <div className="sd-page" key={current[0]}>{page}</div>
      </div>
    </div>
  );
}
