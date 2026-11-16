import { useState } from "react";
import { sfetch } from "./client.js";
import { Field } from "./ui.jsx";

export default function PasswordForm({ onDone, submitLabel = "Save new password", currentLabel = "Current password" }) {
  const [f, setF] = useState({ current: "", new: "", again: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setErrors({});
    if (f.new !== f.again) { setErrors({ again: "The two new passwords do not match." }); return; }
    setBusy(true);
    try { onDone(await sfetch("/me/password", { method: "POST", body: { current: f.current, new: f.new } })); setF({ current: "", new: "", again: "" }); }
    catch (e2) { setErrors({ ...e2.errors, _: e2.message }); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="sd-stack">
      <Field label={currentLabel} error={errors.current}><input type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></Field>
      <Field label="New password" error={errors.new} hint="At least 10 characters, with upper and lower case letters and a number."><input type="password" autoComplete="new-password" value={f.new} onChange={(e) => setF({ ...f, new: e.target.value })} required /></Field>
      <Field label="New password again" error={errors.again}><input type="password" autoComplete="new-password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} required /></Field>
      {errors._ && !errors.current && !errors.new && <p className="sd-alert bad">{errors._}</p>}
      <button className="sd-btn primary" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
    </form>
  );
}

