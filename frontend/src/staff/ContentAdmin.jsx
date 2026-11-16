import { useCallback, useEffect, useState } from "react";
import { Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pencil, EyeOff, Upload, ExternalLink } from "lucide-react";
import { sfetch, mediaUrl, when } from "./client.js";
import { Drawer, Field, Toggle, ImageField, Confirm, Empty, useToast } from "./ui.jsx";
import { fields as studyFields } from "../data/opportunities.js";

/* ---------- generic form ---------- */
// field: [key, label, type, options]   types: text textarea date number select toggle image lines cta url
export function FormFields({ fields, data, set, errors }) {
  return (
    <div className="sd-form">
      {fields.map((f) => {
        if (typeof f === "string") return <h3 key={f} className="sd-form-sec">{f}</h3>;
        const [key, label, type = "text", opt = {}] = f;
        const path = key.split(".");
        const val = path.length > 1 ? data[path[0]]?.[path[1]] : data[key];
        const put = (v) => {
          if (path.length > 1) set({ ...data, [path[0]]: { ...(data[path[0]] || {}), [path[1]]: v } });
          else set({ ...data, [key]: v });
        };
        const err = errors[key];
        const common = { full: opt.full || ["textarea", "lines", "image", "cta"].includes(type), error: err, hint: opt.hint, label };
        if (type === "toggle") return <div key={key} className="sd-field full"><Toggle checked={val} onChange={put} label={label} />{opt.hint && <small className="sd-hint">{opt.hint}</small>}</div>;
        if (type === "image") return <Field key={key} {...common}><ImageField value={val} onChange={put} /></Field>;
        if (type === "textarea") return <Field key={key} {...common}><textarea rows={opt.rows || 4} value={val || ""} onChange={(e) => put(e.target.value)} /></Field>;
        if (type === "lines") return (
          <Field key={key} {...common} hint={opt.hint || (opt.paras ? "Leave an empty line between paragraphs." : "One per line.")}>
            <textarea rows={opt.rows || 4} value={(val || []).join(opt.paras ? "\n\n" : "\n")}
              onChange={(e) => put(opt.paras ? e.target.value.split(/\n\s*\n/) : e.target.value.split("\n"))} />
          </Field>);
        if (type === "cta") return (
          <Field key={key} {...common}>
            <div className="sd-row"><input placeholder="Button text" value={val?.[0] || ""} onChange={(e) => put([e.target.value, val?.[1] || ""])} />
              <input placeholder="/contribute" value={val?.[1] || ""} onChange={(e) => put([val?.[0] || "", e.target.value])} /></div>
          </Field>);
        if (type === "select") return (
          <Field key={key} {...common}><select value={val ?? ""} onChange={(e) => put(e.target.value)}>
            {opt.options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
          </select></Field>);
        if (type === "number") return <Field key={key} {...common}><input inputMode="numeric" value={val ?? ""} onChange={(e) => put(e.target.value.replace(/[^\d]/g, "") === "" ? null : Number(e.target.value.replace(/[^\d]/g, "")))} placeholder={opt.placeholder} /></Field>;
        return <Field key={key} {...common}><input type={type === "date" ? "date" : "text"} value={val || ""} onChange={(e) => put(e.target.value)} placeholder={opt.placeholder} list={opt.list} /></Field>;
      })}
    </div>
  );
}

/* ---------- generic list + editor ---------- */
export function useContent(kind) {
  const [items, setItems] = useState(null);
  const toast = useToast();
  const load = useCallback(() => sfetch(`/content/${kind}`).then((d) => setItems(d.items)).catch((e) => toast(e.message, "bad")), [kind, toast]);
  useEffect(() => { load(); }, [load]);
  return [items, setItems, load];
}

export function Editor({ kind, noun, item, fields, defaults = {}, onClose, onSaved, onDeleted, extra, me, slugEdit }) {
  const [data, setData] = useState(item ? item.data : defaults);
  const [published, setPublished] = useState(item ? item.published : true);
  const [slug, setSlug] = useState(item?.slug || "");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function save() {
    setBusy(true); setErrors({});
    try {
      const body = { data, published, ...(slugEdit && slug ? { slug } : {}) };
      const r = item ? await sfetch(`/content/${kind}/${item.id}`, { method: "PUT", body }) : await sfetch(`/content/${kind}`, { method: "POST", body });
      toast(item ? "Saved. The website updates within a minute." : `${noun} added`);
      onSaved(r.item);
    } catch (e) { setErrors(e.errors || {}); toast(e.message, "bad"); }
    finally { setBusy(false); }
  }
  async function remove() {
    try { await sfetch(`/content/${kind}/${item.id}`, { method: "DELETE" }); toast(`${noun} deleted`); onDeleted(); }
    catch (e) { toast(e.message, "bad"); }
  }
  return (
    <Drawer title={item ? `Edit ${noun.toLowerCase()}` : `New ${noun.toLowerCase()}`} onClose={onClose} wide
      footer={<>
        <button className="sd-btn primary" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save"}</button>
        <button className="sd-btn ghost" onClick={onClose}>Cancel</button>
        {item && <span className="sd-push"><Confirm text={`Delete this ${noun.toLowerCase()}?`} onYes={remove}>Delete</Confirm></span>}
      </>}>
      <div className="sd-pubrow">
        <Toggle checked={published} onChange={setPublished} label={published ? "Shown on the website" : "Hidden from the website"} />
        {item && <small className="sd-muted">Last saved {when(item.updated_at)}{item.updated_by ? ` by ${item.updated_by}` : ""}</small>}
      </div>
      {Object.keys(errors).length > 0 && <p className="sd-alert bad">Please fix the highlighted fields.</p>}
      <FormFields fields={fields} data={data} set={setData} errors={errors} />
      {slugEdit && (
        <Field label="Web address" hint={`Used in links like /campaigns#${slug || "your-campaign"}. Changing it breaks links people have already shared.`} error={errors.slug}>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="made from the title if left empty" />
        </Field>)}
      {extra && item && extra(item)}
    </Drawer>
  );
}

export function ContentManager({ kind, noun, intro, fields, defaults, row, me, sortable, slugEdit, extra, viewOn }) {
  const [items, setItems, load] = useContent(kind);
  const [edit, setEdit] = useState(null);        // item, or "new"
  const toast = useToast();
  async function move(i, d) {
    const next = [...items]; const [x] = next.splice(i, 1); next.splice(i + d, 0, x); setItems(next);
    try { await sfetch(`/content/${kind}/reorder`, { method: "POST", body: { ids: next.map((n) => n.id) } }); }
    catch (e) { toast(e.message, "bad"); load(); }
  }
  return (
    <div className="sd-stack">
      <div className="sd-toolbar">
        {intro && <p className="sd-muted sd-grow">{intro}</p>}
        {viewOn && <a className="sd-btn ghost" href={viewOn} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> View page</a>}
        <button className="sd-btn primary" onClick={() => setEdit("new")}><Plus size={16} /> Add {noun.toLowerCase()}</button>
      </div>
      {!items ? <p className="sd-muted">Loading...</p> : !items.length ? <Empty>Nothing here yet. Use "Add {noun.toLowerCase()}" to create the first one.</Empty> : (
        <ul className="sd-items">{items.map((it, i) => (
          <li key={it.id} className={it.published ? "" : "off"}>
            <button className="sd-item-main" onClick={() => setEdit(it)}>{row(it)}{!it.published && <span className="sd-tag"><EyeOff size={12} /> hidden</span>}</button>
            <div className="sd-item-act">
              {sortable && <>
                <button className="sd-icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={16} /></button>
                <button className="sd-icon" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={16} /></button>
              </>}
              <button className="sd-icon" onClick={() => setEdit(it)} aria-label="Edit"><Pencil size={16} /></button>
            </div>
          </li>))}
        </ul>)}
      {edit && <Editor kind={kind} noun={noun} item={edit === "new" ? null : edit} fields={fields} defaults={defaults} me={me}
        slugEdit={slugEdit} extra={extra} onClose={() => setEdit(null)}
        onSaved={(it) => { setEdit(it); load(); }} onDeleted={() => { setEdit(null); load(); }} />}
    </div>
  );
}

const Thumb = ({ src }) => <span className="sd-thumb">{src ? <img src={mediaUrl(src)} alt="" loading="lazy" /> : null}</span>;

/* ---------- news and events ---------- */
const UPDATE_FIELDS = [["title", "Headline"], ["date", "Date", "date"], ["tag", "Tag", "text", { placeholder: "Mentorship, Partners, Gathering..." }],
  ["summary", "Short summary", "textarea", { rows: 3 }], ["image", "Photo", "image"],
  ["link", "Link to the full post", "text", { full: true, placeholder: "https://x.com/...", hint: "Optional. The X, Facebook or Instagram post with more photos." }]];
const EVENT_FIELDS = [["title", "Event name"], ["date", "Date", "date"], ["place", "Venue", "text", { placeholder: "Venue to be confirmed" }],
  ["note", "Short note", "text", { placeholder: "Open to all members" }], ["link", "Link for details", "text", { full: true, placeholder: "https://...", hint: "Optional." }]];

export function NewsAdmin(props) {
  const [tab, setTab] = useState("update");
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="sd-stack">
      <div className="sd-tabs">
        <button className={tab === "update" ? "on" : ""} onClick={() => setTab("update")}>News posts</button>
        <button className={tab === "event" ? "on" : ""} onClick={() => setTab("event")}>Upcoming events</button>
      </div>
      {tab === "update" ? (
        <ContentManager key="u" {...props} kind="update" noun="News post" fields={UPDATE_FIELDS} defaults={{ date: today }} viewOn="/news"
          intro="Posts show newest first on the homepage and the News page."
          row={(it) => <><Thumb src={it.data.image} /><span><b>{it.data.title}</b><small>{when(it.data.date)} · {it.data.tag || "No tag"}</small></span></>} />
      ) : (
        <ContentManager key="e" {...props} kind="event" noun="Event" fields={EVENT_FIELDS} viewOn="/news"
          intro="Events disappear from the website by themselves once their date has passed."
          row={(it) => <><span className="sd-date"><b>{it.data.date ? new Date(it.data.date + "T00:00:00").getDate() : "?"}</b>{it.data.date ? new Date(it.data.date + "T00:00:00").toLocaleDateString("en-GB", { month: "short" }) : ""}</span>
            <span><b>{it.data.title}</b><small>{it.data.place || "Venue to be confirmed"}{it.data.date < today ? " · past, not shown" : ""}</small></span></>} />
      )}
    </div>
  );
}

/* ---------- gallery ---------- */
const PHOTO_FIELDS = [["src", "Photo", "image"], ["category", "Category", "text", { list: "sd-cats", hint: "Used for the filter buttons on the Gallery page." }],
  ["caption", "Caption"], ["alt", "Description for screen readers", "text", { full: true, hint: "Describe what the photo shows, e.g. 'Volunteers planting trees at a school'." }]];

export function GalleryAdmin({ me }) {
  const [items, setItems, load] = useContent("photo");
  const [edit, setEdit] = useState(null);
  const [cat, setCat] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const cats = [...new Set((items || []).map((i) => i.data.category).filter(Boolean))];
  async function addMany(e) {
    const files = [...(e.target.files || [])]; if (!files.length) return;
    if (!cat.trim()) { toast("Choose a category for the new photos first.", "bad"); e.target.value = ""; return; }
    setBusy(true);
    try {
      const form = new FormData(); files.forEach((f) => form.append("file", f));
      const up = await sfetch("/uploads", { method: "POST", form });
      for (const f of up.files) await sfetch("/content/photo", { method: "POST", body: { data: { src: f.url, category: cat.trim() } } });
      toast(`${up.files.length} photo(s) added. Add captions by clicking each one.`); load();
    } catch (err) { toast(err.message, "bad"); }
    finally { setBusy(false); e.target.value = ""; }
  }
  async function move(i, d) {
    const next = [...items]; const [x] = next.splice(i, 1); next.splice(i + d, 0, x); setItems(next);
    try { await sfetch("/content/photo/reorder", { method: "POST", body: { ids: next.map((n) => n.id) } }); } catch (err) { toast(err.message, "bad"); load(); }
  }
  return (
    <div className="sd-stack">
      <section className="sd-card sd-upload">
        <h2>Add photos</h2>
        <p className="sd-muted">Pick a category, then choose one or more photos. Large photos are resized automatically and location data is removed. Only post photos of people who have agreed, and be extra careful with children.</p>
        <div className="sd-row sd-wrap">
          <input list="sd-cats" placeholder="Category, e.g. Mentorship" value={cat} onChange={(e) => setCat(e.target.value)} />
          <label className={"sd-btn primary" + (busy ? " disabled" : "")}><Upload size={16} /> {busy ? "Uploading..." : "Choose photos"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={addMany} disabled={busy} /></label>
          <a className="sd-btn ghost" href="/gallery" target="_blank" rel="noopener noreferrer"><ExternalLink size={16} /> View gallery</a>
        </div>
        <datalist id="sd-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
      </section>
      {!items ? <p className="sd-muted">Loading...</p> : !items.length ? <Empty>No photos yet.</Empty> : (
        <div className="sd-gallery">{items.map((it, i) => (
          <figure key={it.id} className={it.published ? "" : "off"}>
            <button onClick={() => setEdit(it)} aria-label={`Edit ${it.data.caption || "photo"}`}><img src={mediaUrl(it.data.src)} alt="" loading="lazy" /></button>
            <figcaption><b>{it.data.caption || <em>No caption</em>}</b><small>{it.data.category}{!it.published && " · hidden"}</small></figcaption>
            <div className="sd-gal-act">
              <button className="sd-icon" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier"><ArrowLeft size={15} /></button>
              <button className="sd-icon" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move later"><ArrowRight size={15} /></button>
            </div>
          </figure>))}
        </div>)}
      {edit && <Editor kind="photo" noun="Photo" item={edit} fields={PHOTO_FIELDS} me={me} onClose={() => setEdit(null)}
        onSaved={(it) => { setEdit(it); load(); }} onDeleted={() => { setEdit(null); load(); }} />}
    </div>
  );
}

/* ---------- internships ---------- */
const OPP_FIELDS = [["title", "Role"], ["org", "Organisation"],
  ["type", "Type", "select", { options: ["Internship", "Attachment", "Graduate job", "Volunteer placement"] }],
  ["field", "Field", "select", { options: [["", "Choose a field"], ...studyFields.map((f) => [f, f])], hint: "Pre-selects this field when a student applies." }],
  ["location", "Location"], ["duration", "Duration", "text", { placeholder: "3 months" }],
  ["deadline", "Apply by", "date", { hint: "The listing hides itself after this date." }],
  ["summary", "What the role involves", "textarea", { rows: 3 }],
  ["link", "Partner's own advert (optional)", "text", { full: true, placeholder: "https://..." }]];

export function InternshipsAdmin(props) {
  return <ContentManager {...props} kind="opportunity" noun="Listing" fields={OPP_FIELDS} defaults={{ type: "Internship" }} viewOn="/opportunities" sortable
    intro="Open placements from partners. Students apply through the form on the Internships page, and you will find applications in the Inbox."
    row={(it) => <span><b>{it.data.title} · {it.data.org}</b><small>{it.data.type}{it.data.location ? " · " + it.data.location : ""}{it.data.deadline ? " · apply by " + when(it.data.deadline) : ""}</small></span>} />;
}
