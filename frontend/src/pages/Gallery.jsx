import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { photos } from "../data/content.js";

const cats = ["All", ...new Set(photos.map((p) => p.category))];

export default function Gallery() {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(null);
  const shown = photos.filter((p) => cat === "All" || p.category === cat);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="wrap page">
      <h1>Gallery</h1>
      <p className="lede">Moments from our mentorship sessions, gatherings and partnerships.</p>
      <div className="chips" role="group" aria-label="Filter photos">
        {cats.map((c) => (
          <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <div className="masonry">
        {shown.map((p) => (
          <figure key={p.src}>
            <button className="shot" onClick={() => setOpen(p)} aria-label={"Enlarge photo: " + p.caption}>
              <img src={p.src} alt={p.alt} loading="lazy" />
            </button>
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={open.caption} onClick={() => setOpen(null)}>
          <button className="lb-close" aria-label="Close photo" onClick={() => setOpen(null)}><X /></button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={open.src} alt={open.alt} />
            <figcaption>{open.caption}</figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}