import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, UserPlus, CalendarHeart, Gift, Copy, Check, Smartphone, Landmark, GraduationCap, Utensils, HeartHandshake, Wrench, TreePine, ArrowRight, Phone, Mail, ChevronDown } from "lucide-react";
import { site } from "../data/site.js";
import "../styles/contribute.css";

function Reveal({ delay = 0, className = "", children }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`gv-rv ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

function CopyValue({ label, value }) {
  const [done, setDone] = useState(false);
  if (!value) return <div className="gv-pay-row"><span>{label}</span><b className="tbc">To be confirmed</b></div>;
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ }
  };
  return (
    <div className="gv-pay-row">
      <span>{label}</span>
      <b className="notranslate" translate="no">{value}</b>
      <button type="button" onClick={copy} aria-label={`Copy ${label}`}>{done ? <Check size={16} /> : <Copy size={16} />}{done ? "Copied" : "Copy"}</button>
    </div>
  );
}

const ways = [
  [UserPlus, "Registration", site.mpesa.registration, "one time", "Join the Association and become a member.", "/membership#join", "Register"],
  [CalendarHeart, "Monthly contribution", "You choose", "every month", "Pick an amount you can keep up. Every amount counts.", "/membership#join", "Start giving monthly"],
  [Gift, "One-off gift", "Any amount", "whenever you can", "Support a campaign or programme of your choice.", "/campaigns", "See campaigns"],
];

const uses = [
  [GraduationCap, "School fees", "Keeping needy students, including orphans, in class."],
  [Utensils, "Meals", "Helping university students facing hardship to eat and focus."],
  [HeartHandshake, "Mentorship", "Graduates guiding students on studies and careers."],
  [Wrench, "Skills", "Digital skills, CVs, interviews and business."],
  [TreePine, "Community service", "Children's homes, tree planting and clean-ups."],
];

// EDIT HERE: questions and answers
const faqs = [
  ["Which M-Pesa account number should I use?", `Use Pay Bill ${site.mpesa.paybill}. For the account number, enter ${site.mpesa.accounts.map((x) => `${x.ref} for ${x.label.toLowerCase()}`).join(", or ")}.`],
  ["Is the KES 500 registration a one-time payment?", "Yes. You pay it once when you join, then choose your own monthly contribution."],
  ["How much should I give each month?", "It is up to you. Members choose an amount they can keep up, and every amount counts."],
  ["Can I give if I am not an AEDT beneficiary?", "Yes. Anyone who believes in the mission can give a one-off gift to a campaign or programme."],
  ["I have a question about a payment. Who do I contact?", `Email ${site.email} or call ${site.phone}, ${site.hours.toLowerCase()}.`],
];

function PayCard() {
  const m = site.mpesa;
  const b = site.bank;
  const [tab, setTab] = useState("mpesa");
  const [acc, setAcc] = useState(0);
  const a = m.accounts[acc] || m.accounts[0];
  return (
    <div className="gv-paycard" id="pay">
      {b && (
        <div className="gv-tabs" role="tablist" aria-label="Payment method">
          <button role="tab" aria-selected={tab === "mpesa"} className={tab === "mpesa" ? "on" : ""} onClick={() => setTab("mpesa")}><Smartphone size={16} /> M-Pesa</button>
          <button role="tab" aria-selected={tab === "bank"} className={tab === "bank" ? "on" : ""} onClick={() => setTab("bank")}><Landmark size={16} /> Bank transfer</button>
        </div>
      )}
      {tab === "mpesa" ? (
        <div role="tabpanel">
          <div className="gv-paycard-head"><Smartphone size={20} /> Lipa na M-Pesa · Pay Bill</div>
          <CopyValue label="Business number" value={m.paybill} />
          <div className="gv-for">
            <span>What is your contribution for?</span>
            <div className="gv-for-opts" role="radiogroup" aria-label="Contribution purpose">
              {m.accounts.map((x, k) => (
                <button key={x.ref} type="button" role="radio" aria-checked={k === acc} className={k === acc ? "on" : ""} onClick={() => setAcc(k)}>{x.label}</button>
              ))}
            </div>
            {a.note && <small>{a.note}</small>}
          </div>
          <CopyValue label="Account number" value={a.ref} />
          <div className="gv-pay-row"><span>Account name</span><b className="sm notranslate" translate="no">{m.accountName}</b></div>
          <div className="gv-pay-row"><span>Registration</span><b>{m.registration}</b></div>
        </div>
      ) : (
        <div role="tabpanel">
          <div className="gv-paycard-head bank"><Landmark size={20} /> Bank transfer</div>
          <div className="gv-pay-row"><span>Bank</span><b className="sm notranslate" translate="no">{b.name}</b></div>
          <div className="gv-pay-row"><span>Account name</span><b className="sm notranslate" translate="no">{b.accountName}</b></div>
          <CopyValue label="Account number" value={b.accountNumber} />
          <div className="gv-pay-row"><span>Branch</span><b className="sm notranslate" translate="no">{b.branch}</b></div>
          <div className="gv-pay-row"><span>Currency</span><b className="sm">{b.currency}</b></div>
          <p className="gv-pay-note">Please use your name as the payment reference so we can match your contribution.</p>
        </div>
      )}
    </div>
  );
}

export default function Contribute() {
  const m = site.mpesa;
  const tel = "tel:" + site.phone.replace(/\s/g, "");
  return (
    <div className="gv" data-own-motion>
      <section className="gv-hero">
        <div className="gv-hero-bg" />
        <div className="wrap gv-hero-in">
          <div className="gv-hero-copy">
            <span className="gv-kicker"><Wallet size={15} /> Contribute</span>
            <h1>Your contribution keeps a student <span>learning.</span></h1>
            <p>Members' registration, monthly contributions and gifts become school fees, meals and mentorship for students who would otherwise drop out.</p>
            <div className="actions">
              <a className="btn" href="#pay">Give by M-Pesa <ArrowRight size={18} /></a>
              <Link className="btn ghost" to="/membership#join">Become a member</Link>
            </div>
          </div>
          <Reveal className="gv-paycard-wrap" delay={150}>
            <PayCard />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="gv-head center">
            <span className="eyebrow">Ways to give</span>
            <h2>Choose how you want to support.</h2>
          </div>
          <div className="gv-ways">
            {ways.map(([Icon, t, amt, per, d, to, go], k) => (
              <Reveal key={t} delay={k * 100}>
                <article className={"gv-way" + (k === 1 ? " hl" : "")}>
                  {k === 1 && <span className="gv-pop">Most impact</span>}
                  <span className="gv-way-ico"><Icon size={24} /></span>
                  <h3>{t}</h3>
                  <div className="gv-amt"><b>{amt}</b><small>{per}</small></div>
                  <p>{d}</p>
                  <Link className={k === 1 ? "btn" : "btn line"} to={to}>{go}</Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section tinted gv-record" id="record">
        <div className="wrap gv-steps-grid">
          <Reveal>
            <span className="eyebrow">How to pay</span>
            <h2>Give in under a minute.</h2>
            <p className="lede">Use M-Pesa on your phone. Keep the confirmation message for your records.</p>
            {site.bank && (
              <p className="gv-bankline"><Landmark size={18} /><span>Prefer the bank? Pay to <b className="notranslate" translate="no">{site.bank.name}</b>, account <b className="notranslate" translate="no">{site.bank.accountNumber}</b> (<span className="notranslate" translate="no">{site.bank.accountName}</span>, {site.bank.branch} branch).</span></p>
            )}
          </Reveal>
          <ol className="gv-steps">
            {[
              ["Open M-Pesa", "Go to Lipa na M-Pesa, then Pay Bill."],
              ["Enter the details", <>Business number <b className="notranslate" translate="no">{m.paybill}</b>. Account number <b className="notranslate" translate="no">{m.accounts.map((x) => x.ref).join(" or ")}</b> ({m.accounts.map((x) => x.label.toLowerCase()).join(" or ")}).</>],
              ["Enter the amount", "Your registration, monthly contribution or gift."],
              ["Confirm with your PIN", "You will get an M-Pesa confirmation message."],
            ].map(([t, d], k) => (
              <Reveal key={t} delay={k * 90}>
                <li><span>{k + 1}</span><div><h3>{t}</h3><p>{d}</p></div></li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="gv-head center">
            <span className="eyebrow">Where it goes</span>
            <h2>What your contribution supports.</h2>
          </div>
          <div className="gv-uses">
            {uses.map(([Icon, t, d], k) => (
              <Reveal key={t} delay={k * 70}>
                <div className="gv-use"><span><Icon size={22} /></span><h3>{t}</h3><p>{d}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section tinted">
        <div className="wrap gv-faq-grid">
          <Reveal>
            <span className="eyebrow">Questions</span>
            <h2>Good to know.</h2>
            <div className="gv-contact">
              <a href={tel}><Phone size={18} /> {site.phone}</a>
              <a href={"mailto:" + site.email}><Mail size={18} /> {site.email}</a>
            </div>
          </Reveal>
          <div className="gv-faq">
            {faqs.map(([q, a], k) => (
              <Reveal key={q} delay={k * 70}>
                <details>
                  <summary>{q} <ChevronDown size={20} /></summary>
                  <p>{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
