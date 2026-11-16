import { ArrowUpRight } from "lucide-react";
import { longDate, platformOf, safeUrl } from "../data/content.js";
import { useLive } from "../data/live.jsx";

// Upcoming events now come from the staff dashboard (News & events), with content.js as the fallback.
export function Upcoming({ limit = 99 }) {
  const list = useLive().events.slice(0, limit);
  if (!list.length) return <p>No upcoming activities yet. Join to hear first when they are announced.</p>;
  return (<>{list.map((e) => { const d = new Date(e.date + "T00:00:00"); const href = safeUrl(e.link);
    return (<div className="event" key={e.date + e.title}><div className="date"><b>{d.getDate()}</b><span>{d.toLocaleDateString("en-GB", { month: "short" })}</span></div>
      <div><h3>{e.title}</h3><p>{e.place}{e.note ? ". " + e.note : ""}</p>{href && <a className="ev-link" href={href} target="_blank" rel="noopener noreferrer">Details <ArrowUpRight size={14} /></a>}</div></div>); })}</>);
}

export function NewsCard({ u, featured = false }) {
  const href = safeUrl(u.link); const site = href ? platformOf(href) : ""; const cls = "nw-card" + (featured ? " feat" : "");
  const inner = (<><div className="nw-img"><img src={u.image} alt="" loading="lazy" />{site && <span className="nw-src">Posted on {site}</span>}</div>
    <div className="nw-body"><div className="nw-meta"><span className="tag">{u.tag}</span><time dateTime={u.date}>{longDate(u.date)}</time></div><h3>{u.title}</h3><p>{u.summary}</p>{site && <span className="nw-go">Read the post on {site} <ArrowUpRight size={17} /></span>}</div></>);
  return href ? <a className={cls} href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : <article className={cls}>{inner}</article>;
}
