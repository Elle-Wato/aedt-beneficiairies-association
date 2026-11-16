import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X, Upload, ImageIcon, Check, AlertCircle } from "lucide-react";
import { sfetch, mediaUrl } from "./client.js";

/* ---------- toasts ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastHost({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((text, kind = "ok") => {
    const id = Math.random();
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === "bad" ? 6000 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="sd-toasts" role="status" aria-live="polite">
        {list.map((t) => <div key={t.id} className={"sd-toast " + t.kind}>{t.kind === "bad" ? <AlertCircle size={17} /> : <Check size={17} />}{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- modal / drawer ---------- */
export function Drawer({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    ref.current?.focus();
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="sd-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={"sd-drawer" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}>
        <header><h2>{title}</h2><button className="sd-icon" onClick={onClose} aria-label="Close"><X size={20} /></button></header>
        <div className="sd-drawer-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </div>
  );
}

/* ---------- form fields ---------- */
export function Field({ label, error, hint, children, full }) {
  return (
    <label className={"sd-field" + (full ? " full" : "") + (error ? " has-err" : "")}>
      <span className="sd-label">{label}</span>
      {children}
      {hint && !error && <small className="sd-hint">{hint}</small>}
      {error && <small className="sd-err">{error}</small>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="sd-toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" /><span>{label}</span>
    </label>
  );
}

export function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [lib, setLib] = useState(null);
  const toast = useToast();
  async function upload(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const form = new FormData(); form.append("file", f);
    setBusy(true);
    try { const d = await sfetch("/uploads", { method: "POST", form }); onChange(d.files[0].url); toast("Image uploaded"); }
    catch (err) { toast(err.message, "bad"); }
    finally { setBusy(false); e.target.value = ""; }
  }
  async function openLib() {
    try { setLib((await sfetch("/uploads")).items); } catch (err) { toast(err.message, "bad"); }
  }
  return (
    <div className="sd-image">
      <div className="sd-image-prev">{value ? <img src={mediaUrl(value)} alt="" /> : <ImageIcon size={26} />}</div>
      <div className="sd-image-ctl">
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="/images/photo.jpg or upload" />
        <div className="sd-row">
          <label className="sd-btn sm"><Upload size={15} /> {busy ? "Uploading..." : "Upload"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden disabled={busy} /></label>
          <button type="button" className="sd-btn sm ghost" onClick={openLib}>Choose uploaded</button>
          {value && <button type="button" className="sd-btn sm ghost" onClick={() => onChange("")}>Clear</button>}
        </div>
      </div>
      {lib && (
        <Drawer title="Uploaded images" onClose={() => setLib(null)} wide>
          {!lib.length ? <p className="sd-muted">No uploads yet. Use Upload to add one.</p> : (
            <div className="sd-lib">{lib.map((u) => (
              <button type="button" key={u.id} onClick={() => { onChange(u.url); setLib(null); }}>
                <img src={mediaUrl(u.url)} alt={u.original} loading="lazy" /><span>{u.original || u.filename}</span>
              </button>))}
            </div>)}
        </Drawer>
      )}
    </div>
  );
}

export const Empty = ({ children }) => <div className="sd-empty">{children}</div>;

export function Pager({ page, total, per, onPage }) {
  const pages = Math.max(1, Math.ceil(total / per));
  if (pages <= 1) return null;
  return (
    <div className="sd-pager">
      <button className="sd-btn sm ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>Page {page} of {pages}</span>
      <button className="sd-btn sm ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}

export function StatusPill({ s }) { return <span className={"sd-pill s-" + s}>{s}</span>; }

export function Confirm({ text, onYes, children, className = "sd-btn sm danger" }) {
  const [ask, setAsk] = useState(false);
  if (!ask) return <button type="button" className={className} onClick={() => setAsk(true)}>{children}</button>;
  return (
    <span className="sd-confirm">{text}
      <button type="button" className="sd-btn sm danger" onClick={() => { setAsk(false); onYes(); }}>Yes</button>
      <button type="button" className="sd-btn sm ghost" onClick={() => setAsk(false)}>No</button>
    </span>
  );
}
