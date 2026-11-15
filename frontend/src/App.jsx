import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CookieBanner from "./components/CookieBanner.jsx";
import ScrollEffects from "./components/ScrollEffects.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Programmes from "./pages/Programmes.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import Membership from "./pages/Membership.jsx";
import Contribute from "./pages/Contribute.jsx";
import Contact from "./pages/Contact.jsx";
import News from "./pages/News.jsx";
import Volunteer from "./pages/Volunteer.jsx";
import Opportunities from "./pages/Opportunities.jsx";
import Gallery from "./pages/Gallery.jsx";
import { Privacy, Cookies } from "./pages/Legal.jsx";

export default function App() {
  return (
    <>
      {/* ScrollEffects handles scroll-to-top on page change, #section links and the reveal animations */}
      <ScrollEffects />
      <a className="skip" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programmes" element={<Programmes />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/contribute" element={<Contribute />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/news" element={<News />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="*" element={<section className="wrap page"><h1>Page not found</h1><p>Use the menu to find what you need.</p></section>} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}
