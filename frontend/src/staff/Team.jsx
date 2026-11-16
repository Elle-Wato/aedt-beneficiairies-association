import { useEffect, useState } from "react";
import { Plus, KeyRound, Copy } from "lucide-react";
import { sfetch, when } from "./client.js";
import { Drawer, Field, useToast } from "./ui.jsx";

export default function Team({ me }) {
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [temp, setTemp] = useState(null);
  const toast = useToast();
  const load = () => sfetch("/users").then((d) => setItems(d.items)).catch((e) => toast(e.message, "bad"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function patch(u, body, msg) {
    try { const d = await sfetch(`/users/${u.id}`, { method: "PATCH", body }); toast(msg); if (d.temp_password) setTemp({ email: u.email, pw: d.temp_password }); load(); }
    catch (e) { toast(e.message, "bad"); }
  }
  return (
    <div className="sd-stack">
      <div className="sd-toolbar">
        <p className="sd-muted sd-grow"><b>Admins</b> can do everything, including staff accounts and deleting records. <b>Editors</b> can manage the inbox, content and contributions.</p>
        <button className="sd-btn primary" onClick={() => setAdding(true)}><Plus size={16} /> Add staff member</button>
      </div>
      {!items ? <p className="sd-muted">Loading...</p> : (
        <div className="sd-table-wrap"><table className="sd-table static">
          <thead><tr><th>Name</th><th>Role</th><th className="sd-hide-m">Last sign-in</th><th>Actions</th></tr></thead>
          <tbody>{items.map((u) => (
            <tr key={u.id} className={u.active ? "" : "void"}>
              <td><b>{u.name}</b>{u.id === me.id && <span className="sd-tag">you</span>}<small>{u.email}{!u.active && " · deactivated"}</small></td>
              <td><select value={u.role} onChange={(e) => patch(u, { role: e.target.value }, "Role changed")} disabled={u.id === me.id} aria-label="Role">
                <option value="editor">Editor</option><option value="admin">Admin</option></select></td>
              <td className="sd-hide-m"><small>{u.last_login_at ? when(u.last_login_at) : "Never"}</small></td>
              <td><div className="sd-row sd-wrap">
                <button className="sd-btn sm ghost" onClick={() => patch(u, { reset_password: true }, "Password reset")}><KeyRound size={14} /> Reset password</button>
                {u.id !== me.id && <button className="sd-btn sm ghost" onClick={() => patch(u, { active: !u.active }, u.active ? "Deactivated" : "Reactivated")}>{u.active ? "Deactivate" : "Reactivate"}</button>}
              </div></td>
            </tr>))}
          </tbody></table></div>)}
      {adding && <AddUser onClose={() => setAdding(false)} onDone={(email, pw) => { setAdding(false); setTemp({ email, pw }); load(); }} />}
      {temp && (
        <Drawer title="Temporary password" onClose={() => setTemp(null)} footer={<button className="sd-btn primary" onClick={() => setTemp(null)}>I have shared it</button>}>
          <p>Give this password to <b>{temp.email}</b> in person or by phone, not by email. They will be asked to choose their own password when they first sign in.</p>
          <div className="sd-secret"><code>{temp.pw}</code><button className="sd-btn sm" onClick={() => navigator.clipboard?.writeText(temp.pw).then(() => toast("Copied"))}><Copy size={14} /> Copy</button></div>
          <p className="sd-muted sd-small">It will not be shown again. The sign-in page is at {window.location.origin}/staff</p>
        </Drawer>)}
    </div>
  );
}

function AddUser({ onClose, onDone }) {
  const [f, setF] = useState({ name: "", email: "", role: "editor" });
  const [errors, setErrors] = useState({});
  const toast = useToast();
  async function save(e) {
    e?.preventDefault();
    try { const d = await sfetch("/users", { method: "POST", body: f }); onDone(f.email, d.temp_password); }
    catch (err) { setErrors(err.errors || {}); toast(err.message, "bad"); }
  }
  return (
    <Drawer title="Add staff member" onClose={onClose} footer={<><button className="sd-btn primary" onClick={save}>Create account</button><button className="sd-btn ghost" onClick={onClose}>Cancel</button></>}>
      <form className="sd-stack" onSubmit={save}>
        <Field label="Full name" error={errors.name}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="Email" error={errors.email}><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Role"><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="editor">Editor</option><option value="admin">Admin</option></select></Field>
      </form>
    </Drawer>
  );
}
