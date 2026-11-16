import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { sfetch, kes, when, mediaUrl } from "./client.js";
import { ContentManager } from "./ContentAdmin.jsx";

const FIELDS = [
  "Basics",
  ["title", "Title"], ["category", "Category", "text", { placeholder: "Meal support" }],
  ["status", "Status", "select", { options: [["live", "Live now"], ["upcoming", "Coming up"], ["completed", "Completed"]] }],
  ["kind", "Layout", "select", { options: [["", "Standard card"], ["student", "Fundraiser with large progress panel"]] }],
  ["start", "Start date", "date", { hint: "Optional." }], ["end", "End date", "date", { hint: "Optional." }],
  ["featured", "Feature this campaign at the top of the Campaigns page and on the homepage", "toggle", { hint: "Only one campaign can be featured. Turning this on turns it off for the others." }],
  "Story",
  ["summary", "Short summary", "textarea", { rows: 3 }],
  ["body", "Full story", "lines", { paras: true, rows: 6 }],
  ["asks", "Ways to help (one per line)", "lines", { rows: 3 }],
  ["cta", "Main button", "cta"],
  "Photo and video",
  ["image", "Main photo", "image"], ["video", "Video file (optional)", "text", { placeholder: "/videos/launch.mp4" }],
  ["poster", "Video cover image (optional)", "image"],
  "Money",
  ["goal", "Target (KES)", "number", { hint: "Leave empty for campaigns without a money target." }],
  ["raised_offline", "Raised before tracking started (KES)", "number", { hint: "Money already raised that is not recorded under Contributions. Contributions you record are added on top automatically." }],
  ["supporters_offline", "Supporters before tracking started", "number"],
  ["mpesaRef", "M-Pesa account number donors should use", "text", { placeholder: "937937#meals", hint: "Pay Bill 630640. Also used to match imported payments to this campaign." }],
  ["unit.amount", "Cost to help one person (KES)", "number", { placeholder: "3000", hint: "Optional. Shows how many people the money covers." }],
  ["unit.one", "One person is called", "text", { placeholder: "student" }], ["unit.many", "Several are called", "text", { placeholder: "students" }],
  ["unit.per", "What that amount covers", "text", { placeholder: "meals for 3 months" }],
  ["revolving", "Revolving fund (shows how repaid money supports the next student)", "toggle"],
  "Student (only with their consent)",
  ["student.name", "First name or initials"], ["student.course", "Course"], ["student.institution", "Institution"],
];

function Gifts({ item }) {
  const [d, setD] = useState(null);
  useEffect(() => { sfetch(`/contributions?campaign=${encodeURIComponent(item.slug)}`).then(setD).catch(() => setD({ items: [] })); }, [item.slug, item.updated_at]);
  return (
    <section className="sd-card sd-gifts">
      <h3>Money for this campaign</h3>
      <div className="sd-money">
        <div><small>Shown on the website</small><b>{item.raised == null ? "No progress bar" : kes(item.raised)}</b></div>
        <div><small>From recorded contributions</small><b>{kes(item.tracked)}</b></div>
        <div><small>Supporters</small><b>{item.supporters ?? 0}</b></div>
      </div>
      {!d ? <p className="sd-muted">Loading...</p> : !d.items.length ? <p className="sd-muted">No contributions recorded for this campaign yet. Record them under Contributions.</p> : (
        <ul className="sd-list">{d.items.slice(0, 8).map((g) => (
          <li key={g.id}><span className="sd-li"><span><b>{kes(g.amount)}</b><small>{g.donor_name || "Anonymous"} · {when(g.received_on)} · {g.reference || "no code"}</small></span>{g.status !== "confirmed" && <span className="sd-tag">{g.status}</span>}</span></li>))}
        </ul>)}
    </section>
  );
}

export default function CampaignsAdmin(props) {
  return (
    <ContentManager {...props} kind="campaign" noun="Campaign" fields={FIELDS} sortable slugEdit viewOn="/campaigns"
      defaults={{ status: "live", cta: ["Contribute now", "/contribute"] }}
      intro="Edit campaigns, targets and stories. Progress bars update automatically from the contributions you record."
      extra={(item) => <Gifts item={item} />}
      row={(it) => {
        const goal = it.data.goal; const pct = goal ? Math.min(100, Math.round(((it.raised || 0) / goal) * 100)) : null;
        return <>
          <span className="sd-thumb">{it.data.image && <img src={mediaUrl(it.data.image)} alt="" loading="lazy" />}</span>
          <span className="sd-grow"><b>{it.data.featured && <Star size={14} className="sd-star" aria-label="Featured" />} {it.data.title}</b>
            <small>{({ live: "Live now", upcoming: "Coming up", completed: "Completed" })[it.data.status]} · {it.data.category || "No category"}{goal ? ` · ${kes(it.raised)} of ${kes(goal)}` : ""}</small>
            {pct != null && <span className="sd-bar sm"><i style={{ width: pct + "%" }} /></span>}</span>
        </>;
      }} />
  );
}
