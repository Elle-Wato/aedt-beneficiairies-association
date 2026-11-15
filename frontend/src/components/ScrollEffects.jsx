import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollEffects() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  // go to the top of a new page, or to the section named in the link (e.g. /membership#join)
  useEffect(() => {
    if (hash) {
      // wait a moment so the new page has rendered before looking for the section
      const t = setTimeout(() => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo(0, 0);
      }, 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  // gentle reveal as sections come into view
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    const t = setTimeout(() => {
      document.querySelectorAll("main :is(.section,.statement,.cta,.pagehead) .wrap > *").forEach((el) => {
        // the redesigned pages (Home, Campaigns, Contribute) animate themselves
        if (el.closest("[data-own-motion]")) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen
        const index = Array.prototype.indexOf.call(el.parentElement.children, el);
        el.style.setProperty("--i", String(Math.min(index, 4)));
        el.classList.add("rv");
        io.observe(el);
      });
    }, 30);

    return () => { clearTimeout(t); io.disconnect(); };
  }, [pathname]);

  return null;
}
