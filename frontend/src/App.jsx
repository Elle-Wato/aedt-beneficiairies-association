import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CookieBanner from "./components/CookieBanner.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Programmes from "./pages/Programmes.jsx";
import Membership from "./pages/Membership.jsx";
import Contact from "./pages/Contact.jsx";
import News from "./pages/News.jsx";
import Volunteer from "./pages/Volunteer.jsx";
import Gallery from "./pages/Gallery.jsx";
  import ScrollEffects from "./components/ScrollEffects.jsx";
import { Privacy, Cookies } from "./pages/Legal.jsx";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
  window.scrollTo(0, 0);
}, [pathname]);
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programmes" element={<Programmes />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/news" element={<News />} />
<Route path="/gallery" element={<Gallery />} />
<Route path="/volunteer" element={<Volunteer />} />
          <Route path="*" element={<section className="wrap page"><h1>Page not found</h1><p>Use the menu to find what you need.</p></section>} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}