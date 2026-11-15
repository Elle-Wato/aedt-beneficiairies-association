import { useEffect, useRef, useState } from "react";
import { Globe, Moon, Sun, Check, ChevronDown } from "lucide-react";
import "../styles/theme.css";

/* ------------------------------------------------------------------ languages
   EDIT HERE to add or remove languages. Codes are Google Translate codes,
   e.g. { code: "fr", label: "Français", short: "FR" } or { code: "am", label: "አማርኛ", short: "AM" }. */
export const LANGS = [
  { code: "en", label: "English", short: "EN" },
  { code: "ar", label: "العربية", short: "AR", rtl: true },
  { code: "sw", label: "Kiswahili", short: "SW" },
  { code: "so", label: "Soomaali", short: "SO" },
];

// Google Translate changes text on the page behind React's back. These two guards stop
// React from crashing when it later tries to update text that Google has replaced.
if (typeof Node === "function" && Node.prototype && !Node.prototype.__aedtPatched) {
  const rc = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) return child;
    return rc.apply(this, arguments);
  };
  const ib = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (node, ref) {
    if (ref && ref.parentNode !== this) return node;
    return ib.apply(this, arguments);
  };
  Node.prototype.__aedtPatched = true;
}

const readLang = () => {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/;]*\/([^;]+)/);
  const c = m ? decodeURIComponent(m[1]) : "en";
  return LANGS.some((l) => l.code === c) ? c : "en";
};
const writeCookie = (code) => {
  const off = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const v = code && code !== "en" ? `/en/${code}` : "";
  const tail = v ? "" : off;
  document.cookie = `googtrans=${v}; path=/${tail}`;
  const host = location.hostname.replace(/^www\./, "");
  if (host.includes(".")) document.cookie = `googtrans=${v}; path=/; domain=.${host}${tail}`;
};
const applyDir = (code) => {
  const l = LANGS.find((x) => x.code === code);
  document.documentElement.lang = code;
  document.documentElement.dir = l && l.rtl ? "rtl" : "ltr";
};

let requested = false;
function loadGoogle() {          // only loaded once someone picks a language other than English
  if (requested) return;
  requested = true;
  if (!document.getElementById("gt-el")) {
    const d = document.createElement("div"); d.id = "gt-el"; d.style.display = "none"; document.body.appendChild(d);
  }
  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement({
      pageLanguage: "en",
      includedLanguages: LANGS.filter((l) => l.code !== "en").map((l) => l.code).join(","),
      autoDisplay: false,
    }, "gt-el");
  };
  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.body.appendChild(s);
}

function useLanguage() {
  const [lang, setLang] = useState("en");
  useEffect(() => {
    const c = readLang();
    setLang(c); applyDir(c);
    if (c !== "en") loadGoogle();
    const sync = (e) => setLang(e.detail);
    window.addEventListener("aedt-lang", sync);
    return () => window.removeEventListener("aedt-lang", sync);
  }, []);
  const change = (code) => {
    if (code === lang) return;
    if (code === "en") { writeCookie("en"); applyDir("en"); location.reload(); return; }
    writeCookie(code); applyDir(code);
    const combo = document.querySelector(".goog-te-combo");
    if (combo) { combo.value = code; combo.dispatchEvent(new Event("change")); }
    else loadGoogle();
    setLang(code);
    window.dispatchEvent(new CustomEvent("aedt-lang", { detail: code }));
  };
  return [lang, change];
}

/* ------------------------------------------------------------------ language menu */
export function LanguageMenu({ variant = "top" }) {
  const [lang, change] = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = LANGS.find((l) => l.code === lang) || LANGS[0];

  useEffect(() => {
    if (!open) return;
    const out = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const key = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", out); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", out); document.removeEventListener("keydown", key); };
  }, [open]);

  if (variant === "list") {      // used in the phone menu
    return (
      <div className="lt-list notranslate" translate="no" role="group" aria-label="Language">
        {LANGS.map((l) => (
          <button key={l.code} type="button" className={l.code === lang ? "on" : ""} aria-pressed={l.code === lang} onClick={() => change(l.code)} lang={l.code}>
            {l.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={"lt-menu notranslate " + variant} translate="no" ref={ref}>
      <button type="button" className="lt-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={`Language: ${cur.label}`} onClick={() => setOpen(!open)}>
        <Globe size={15} /> <span>{cur.short}</span> <ChevronDown size={14} className="lt-chev" />
      </button>
      {open && (
        <ul className="lt-pop" role="listbox" aria-label="Choose language">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button type="button" role="option" aria-selected={l.code === lang} lang={l.code} onClick={() => { change(l.code); setOpen(false); }}>
                <span>{l.label}</span>{l.code === lang && <Check size={15} />}
              </button>
            </li>
          ))}
          <li className="lt-note">Automatic translation by Google</li>
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ dark / light */
const THEME_KEY = "aedt_theme";
export function ThemeToggle({ withLabel = false }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.add("theme-anim");
    if (next) document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch { /* ignore */ }
    setTimeout(() => document.documentElement.classList.remove("theme-anim"), 450);
  };
  return (
    <button type="button" className={"lt-theme" + (withLabel ? " wide" : "")} onClick={flip} aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>
      <span className="lt-ic">{dark ? <Sun size={18} /> : <Moon size={18} />}</span>
      {withLabel && <span>{dark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}

// Applies the saved theme as early as possible (also add the snippet in SETUP to index.html to avoid a flash).
try {
  if (localStorage.getItem(THEME_KEY) === "dark") document.documentElement.dataset.theme = "dark";
} catch { /* ignore */ }
