import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { photos } from "../data/content.js";
import PageHero from "../components/PageHero.jsx";
import Reveal from "../components/Reveal.jsx";

const cats = ["All", ...new Set(photos.map((p) => p.category))];

export default function Gallery() {
  const [cat, setCat] = useState("All");
  const [idx, setIdx] = useState(null);           // index in the filtered list
  const shown = photos.filter((p) => cat === "All" || p.category === cat);
  const open = idx === null ? null : shown[idx];

  const step = useCallback((d) => setIdx((i) => (i === null ? i : (i + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (idx === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setIdx(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [idx, step]);

  return (
    <div className="px" data-own-motion>
      <PageHero kicker="Gallery" title="Moments that matter." hl="matter."
        text="Moments from our mentorship sessions, gatherings and partnerships." image="/images/tree-planting.jpg" />

      <section className="section">
        <div className="wrap">
          <div className="px-gal-tools">
            <div className="chips" role="group" aria-label="Filter photos">
              {cats.map((c) => (
                <button key={c} className="chip" aria-pressed={cat === c} onClick={() => { setCat(c); setIdx(null); }}>{c}</button>
              ))}
            </div>
            <span className="px-gal-count">{shown.length} photo{shown.length === 1 ? "" : "s"}</span>
          </div>
          <div className="px-masonry">
            {shown.map((p, k) => (
              <Reveal as="figure" key={p.src} delay={(k % 6) * 60}>
                <button className="shot" onClick={() => setIdx(k)} aria-label={"Enlarge photo: " + p.caption}>
                  <img src={p.src} alt={p.alt} loading="lazy" />
                  <span className="px-cat">{p.category}</span>
                </button>
                <figcaption>{p.caption}</figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-band">
        <div className="wrap">
          <Reveal className="px-band-in">
            <div>
              <h2>Be in the next photo.</h2>
              <p>Join a mentorship session, a clean-up or our next gathering.</p>
            </div>
            <div className="px-band-btns">
              <Link className="btn" to="/volunteer">Get involved</Link>
              <Link className="btn ghost" to="/news">See upcoming events</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {open && (
        <div className="px-lb" role="dialog" aria-modal="true" aria-label={open.caption} onClick={() => setIdx(null)}>
          <button className="px-lb-x" aria-label="Close photo" onClick={() => setIdx(null)}><X /></button>
          {shown.length > 1
            ? <button className="px-prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); step(-1); }}><ChevronLeft /></button>
            : <span />}
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={open.src} alt={open.alt} />
            <figcaption>{open.caption}<small>{idx + 1} / {shown.length}</small></figcaption>
          </figure>
          {shown.length > 1
            ? <button className="px-next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); step(1); }}><ChevronRight /></button>
            : <span />}
        </div>
      )}
    </div>
  );
}
