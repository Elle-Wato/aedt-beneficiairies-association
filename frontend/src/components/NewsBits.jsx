import { upcoming, longDate } from "../data/content.js";

export function Upcoming({ limit = 99 }) {
  const list = upcoming().slice(0, limit);
  if (!list.length) return <p>No upcoming activities yet. Join to hear first when they are announced.</p>;
  return (
    <>
      {list.map((e) => {
        const d = new Date(e.date + "T00:00:00");
        return (
          <div className="event" key={e.date + e.title}>
            <div className="date"><b>{d.getDate()}</b><span>{d.toLocaleDateString("en-GB", { month: "short" })}</span></div>
            <div><h3>{e.title}</h3><p>{e.place}{e.note ? ". " + e.note : ""}</p></div>
          </div>
        );
      })}
    </>
  );
}

export function UpdateItem({ u }) {
  return (
    <article className="update">
      <img src={u.image} alt="" />
      <div>
        <span className="tag">{u.tag}</span>
        <h3>{u.title}</h3>
        <p>{u.summary}</p>
        <small style={{ color: "var(--muted)" }}>{longDate(u.date)}</small>
      </div>
    </article>
  );
}