import { useEffect, useState } from "react";
import { sfetch, when } from "./client.js";
import { Pager, useToast } from "./ui.jsx";

export default function Activity() {
  const [page, setPage] = useState(1);
  const [d, setD] = useState(null);
  const toast = useToast();
  useEffect(() => { sfetch(`/audit?page=${page}`).then(setD).catch((e) => toast(e.message, "bad")); }, [page, toast]);
  return (
    <div className="sd-stack">
      <p className="sd-muted">Every change made in the dashboard, newest first.</p>
      {!d ? <p className="sd-muted">Loading...</p> : (
        <div className="sd-table-wrap"><table className="sd-table static">
          <thead><tr><th>When</th><th>Who</th><th>What</th><th className="sd-hide-m">Details</th></tr></thead>
          <tbody>{d.items.map((a) => (
            <tr key={a.id}><td><small>{when(a.created_at)}</small></td><td><small>{a.staff_email}</small></td>
              <td>{a.action}{a.target && <small>{a.target}</small>}</td><td className="sd-hide-m"><small>{a.detail}</small></td></tr>))}
          </tbody></table></div>)}
      {d && <Pager page={d.page} total={d.total} per={d.per_page} onPage={setPage} />}
    </div>
  );
}
