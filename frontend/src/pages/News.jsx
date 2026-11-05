import { useMemo, useState } from "react";
import { updates } from "../data/content.js";
import { Upcoming, NewsCard } from "../components/NewsBits.jsx";
import Social from "../components/Social.jsx";
import { site } from "../data/site.js";

export default function News() {
  const all = useMemo(() => [...updates].sort((a, b) => b.date.localeCompare(a.date)), []);
  const tags = useMemo(() => ["All", ...new Set(all.map((u) => u.tag))], [all]);
  const [tag, setTag] = useState("All");

  const shown = all.filter((u) => tag === "All" || u.tag === tag);
  const feat = tag === "All" ? shown[0] : null;
  const rest = feat ? shown.slice(1) : shown;

  return (
    <>
      <section className="nw-head">
        <div className="wrap">
          <span className="eyebrow">News and events</span>
          <h1>What we have been up to.</h1>
          <p className="lede">We post every event we attend on our social media. Open a story to read the full post and see more photos.</p>
        </div>
      </section>

      <section className="section nw-main">
        <div className="wrap">
          {all.length > 1 && (
            <div className="chips" role="group" aria-label="Filter stories">
              {tags.map((t) => (
                <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(t)}>{t}</button>
              ))}
            </div>
          )}

          {!all.length && <p>No stories yet. Check back soon.</p>}

          {feat && (
            <div className="nw-feat">
              <NewsCard u={feat} featured />
            </div>
          )}

          {rest.length > 0 && (
            <div className="nw-grid">
              {rest.map((u) => <NewsCard key={u.date + u.title} u={u} />)}
            </div>
          )}
        </div>
      </section>

      <section className="section nw-events">
        <div className="wrap">
          <span className="eyebrow">Mark your calendar</span>
          <h2>Coming up</h2>
          <div className="nw-evgrid"><Upcoming /></div>
        </div>
      </section>

      <section className="nw-follow">
        <div className="wrap">
          <span className="eyebrow light">Follow the story</span>
          <h2>See it as it happens.</h2>
          <p>We share photos and updates from every visit, session and gathering on our social media.</p>
          <div className="nw-fol-row">
            <a className="btn" href={site.social.x} target="_blank" rel="noopener noreferrer">Follow us on X</a>
            <Social />
          </div>
        </div>
      </section>
    </>
  );
}