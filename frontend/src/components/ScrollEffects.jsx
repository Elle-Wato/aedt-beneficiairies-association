import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollEffects() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  // go to the top of a new page, or to the section named in the link
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView(); return; }
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

    document.querySelectorAll("main :is(.section,.statement,.cta,.pagehead) .wrap > *").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen
      const index = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty("--i", String(Math.min(index, 4)));
      el.classList.add("rv");
      io.observe(el);
    });

    return () => io.disconnect();
  }, [pathname]);

  return null;
}