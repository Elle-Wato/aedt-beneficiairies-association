import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { sfetch, kes } from "./client.js";

// Search the members register by name, member number, phone or email.
export default function MemberPicker({ value, onChange }) {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => sfetch("/members/lookup?q=" + encodeURIComponent(q)).then((d) => setList(d.items)).catch(() => {}), 200);
    return () => clearTimeout(t);
  }, [q, open]);
  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  if (value) return (
    <div className="sd-picked"><span><b>{value.name}</b><small>{value.member_no}</small></span>
      <button type="button" className="sd-icon" onClick={() => onChange(null)} aria-label="Change member"><X size={16} /></button></div>
  );
  return (
    <div className="sd-picker" ref={box}>
      <div className="sd-search"><Search size={16} /><input placeholder="Type a name, member no. or phone" value={q}
        onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} /></div>
      {open && (
        <ul className="sd-picker-list" role="listbox">
          {!list.length ? <li className="sd-muted">No members found. Add them under Members first.</li> : list.map((m) => (
            <li key={m.id}><button type="button" onClick={() => { onChange({ id: m.id, name: m.full_name, member_no: m.member_no, pledge: m.monthly_pledge }); setOpen(false); }}>
              <b>{m.full_name}</b><small>{m.member_no} · {m.phone || "no phone"} · pledge {kes(m.monthly_pledge)}{m.status !== "active" ? ` · ${m.status}` : ""}</small>
            </button></li>))}
        </ul>)}
    </div>
  );
}
