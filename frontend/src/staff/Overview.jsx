import { useEffect, useState } from "react";
import { UserPlus, HeartHandshake, Mail, Briefcase, Plus, Newspaper, Images, Wallet } from "lucide-react";
import { sfetch, kes, when } from "./client.js";
import { StatusPill, useToast } from "./ui.jsx";

const TYPES = [["member", "Membership", UserPlus], ["volunteer", "Mentors and volunteers", HeartHandshake],
  ["contact", "Messages", Mail], ["placement", "Internship applications", Briefcase]];

export default function Overview({ me, meta, go }) {
  const [d, setD] = useState(null);
  const toast = useToast();
  useEffect(() => { sfetch("/overview").then(setD).catch((e) => toast(e.message, "bad")); }, [toast]);
  if (!d) return <p className="sd-muted">Loading...</p>;
  const label = (t) => meta?.labels?.[t] || t;
  return (
    <div className="sd-stack lg">
      <p className="sd-lead">Welcome back, {me.name.split(" ")[0]}. Here is what needs attention.</p>
      <div className="sd-cards">
        {TYPES.map(([t, name, Icon]) => (
          <button key={t} className="sd-card sd-count" onClick={() => go(`inbox?type=${t}&status=new`)}>
            <span className="sd-count-ic"><Icon size={20} /></span>
            <span className="sd-count-name">{name}</span>
            <b>{d.counts[t].new}</b>
            <small>new · {d.counts[t].total} in total</small>
          </button>
        ))}
      </div>

      {d.members && (
        <section className="sd-card">
          <div className="sd-card-head"><h2>Members and monthly pledges</h2><button className="sd-btn sm ghost" onClick={() => go("members")}>Open register</button></div>
          <div className="sd-money four">
            <div><small>Active members</small><b>{d.members.active}</b></div>
            <div><small>Committed per month</small><b>{kes(d.members.committed_monthly)}</b></div>
            <div><small>Collected this month</small><b>{kes(d.members.collected_this_month)}</b></div>
            <div className={d.members.behind ? "neg" : ""}><small>Behind on pledges</small><b>{d.members.behind}</b></div>
          </div>
        </section>)}

      <div className="sd-grid2">
        <section className="sd-card">
          <div className="sd-card-head"><h2>Contributions</h2><button className="sd-btn sm" onClick={() => go("contributions")}><Plus size={15} /> Record one</button></div>
          <div className="sd-money">
            <div><small>This month</small><b>{kes(d.money.month)}</b></div>
            <div><small>All time</small><b>{kes(d.money.total)}</b></div>
            <div><small>Gifts recorded</small><b>{d.money.count}</b></div>
          </div>
          <h3 className="sd-sub">Campaign targets</h3>
          {!d.campaigns.length ? <p className="sd-muted">No campaigns with a target yet.</p> : d.campaigns.map((c) => {
            const pct = c.goal ? Math.min(100, Math.round(((c.raised || 0) / c.goal) * 100)) : 0;
            return (
              <div key={c.id} className="sd-prog">
                <div className="sd-prog-top"><span>{c.title}{!c.published && <em> (hidden)</em>}</span><b>{pct}%</b></div>
                <div className="sd-bar"><i style={{ width: pct + "%" }} /></div>
                <small>{kes(c.raised)} of {kes(c.goal)} · {kes(Math.max(0, c.goal - (c.raised || 0)))} to go</small>
              </div>
            );
          })}
        </section>

        <section className="sd-card">
          <div className="sd-card-head"><h2>Latest submissions</h2><button className="sd-btn sm ghost" onClick={() => go("inbox")}>Open inbox</button></div>
          {!d.recent.length ? <p className="sd-muted">Nothing yet. New form submissions will appear here.</p> : (
            <ul className="sd-list">{d.recent.map((r) => (
              <li key={r.id}><button onClick={() => go(`inbox?type=${r.type}`)}>
                <span><b>{r.name}</b><small>{label(r.type)} · {when(r.created_at)}</small></span><StatusPill s={r.status} />
              </button></li>))}
            </ul>)}
          <h3 className="sd-sub">Latest contributions</h3>
          {!d.gifts.length ? <p className="sd-muted">No contributions recorded yet.</p> : (
            <ul className="sd-list">{d.gifts.map((g) => (
              <li key={g.id}><span className="sd-li"><span><b>{kes(g.amount)}</b><small>{g.member?.name || g.donor_name || "Anonymous"} · {g.kind === "monthly" ? "Monthly contribution" : g.kind === "registration" ? "Registration" : g.campaign_slug || "General"} · {when(g.received_on)}</small></span><span className="sd-tag">{g.channel}</span></span></li>))}
            </ul>)}
        </section>
      </div>

      <section className="sd-card">
        <h2>Quick actions</h2>
        <div className="sd-row sd-wrap">
          <button className="sd-btn" onClick={() => go("contributions")}><Wallet size={16} /> Record a contribution</button>
          <button className="sd-btn ghost" onClick={() => go("news")}><Newspaper size={16} /> Post news or an event</button>
          <button className="sd-btn ghost" onClick={() => go("gallery")}><Images size={16} /> Add photos</button>
          <button className="sd-btn ghost" onClick={() => go("internships")}><Briefcase size={16} /> Add an internship</button>
        </div>
      </section>
    </div>
  );
}
