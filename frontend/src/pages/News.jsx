import { updates } from "../data/content.js";
import { Upcoming, UpdateItem } from "../components/NewsBits.jsx";

export default function News() {
  return (
    <section className="wrap page">
      <h1>News and events</h1>
      <p className="lede">What we have done, and what is coming up.</p>
      <div className="newsgrid">
        <div>
          <h2>Latest updates</h2>
          {updates.map((u) => <UpdateItem key={u.date + u.title} u={u} />)}
        </div>
        <aside className="panel">
          <h2>Coming up</h2>
          <Upcoming />
        </aside>
      </div>
    </section>
  );
}