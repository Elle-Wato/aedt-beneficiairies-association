import "../styles/pages.css";

// Shared banner for inner pages. hl = the part of the title shown in gold.
export default function PageHero({ kicker, title, hl, text, image, children }) {
  const i = hl && title.includes(hl) ? title.indexOf(hl) : -1;
  return (
    <section className="px-hero">
      {image && <div className="px-hero-bg" style={{ backgroundImage: `url(${image})` }} />}
      <div className="wrap px-hero-in">
        {kicker && <span className="px-kicker">{kicker}</span>}
        <h1>{i >= 0 ? <>{title.slice(0, i)}<span>{hl}</span>{title.slice(i + hl.length)}</> : title}</h1>
        {text && <p>{text}</p>}
        {children}
      </div>
    </section>
  );
}
