// EDIT THIS FILE to change news, events and gallery photos.
// Dates are YYYY-MM-DD. Events in the past are hidden automatically.

export const events = [
  { date: "2026-11-07", title: "Mentorship session with students", place: "Venue to be confirmed", note: "Mentors and students welcome" },
  { date: "2026-11-21", title: "Tree planting and clean-up", place: "Venue to be confirmed", note: "Open to all members" },
  { date: "2026-12-05", title: "Members' meeting", place: "Venue to be confirmed", note: "Updates on fee and meal support" },
];

export const updates = [
  { date: "2026-10-10", tag: "Mentorship", title: "Mentors meet secondary school students",
    summary: "Mentors spent the afternoon with students, talking about studies, careers and staying focused.",
    image: "/images/mentorship-hall.jpg",
  link: "https://x.com/aedt_interact/status/2075139501530243213?s=48" },
    
  { date: "2026-09-20", tag: "Partners", title: "Partner contribution presented to AEDT",
    summary: "A KES 100,000 contribution was presented to support students.",
    image: "/images/partner-cheque.jpg",
  link: "https://x.com/aedt_interact/status/2075139501530243213?s=48" },
  { date: "2026-09-05", tag: "Gathering", title: "Members and mentors meet",
    summary: "Members came together to share progress and plan the next programmes.",
    image: "/images/gathering-1.jpg",
  link: "https://x.com/aedt_interact/status/2075139501530243213?s=48" },
];

export const photos = [
  { src: "/images/mentorship-tree.jpg", category: "Mentorship", alt: "A mentor speaking to students under an acacia tree", caption: "Mentorship session under the acacia" },
  { src: "/images/mentorship-hall.jpg", category: "Mentorship", alt: "Students listening to a mentor in an open school hall", caption: "Open-air session with secondary school students" },
  { src: "/images/girls-session.jpg", category: "Mentorship", alt: "Women mentors addressing a group of girls", caption: "Girls' mentorship and support session" },
  { src: "/images/gathering-1.jpg", category: "Gatherings", alt: "Members seated at long tables in a garden", caption: "Members' mentorship gathering" },
  { src: "/images/gathering-2.jpg", category: "Gatherings", alt: "A speaker addressing guests at a garden gathering", caption: "Guests and elders addressing the gathering" },
  { src: "/images/partner-cheque.jpg", category: "Partners", alt: "Partners presenting a KES 100,000 cheque", caption: "A KES 100,000 contribution presented to Africa Education & Development Trust" },
];



export const longDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const upcoming = () =>
  events.filter((e) => new Date(e.date + "T23:59:59") >= new Date()).sort((a, b) => a.date.localeCompare(b.date));

// Works out which site a link points to, so the card can say "Read the post on X".
export const platformOf = (url) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    if (h === "x.com" || h.endsWith("twitter.com")) return "X";
    if (h.endsWith("facebook.com") || h === "fb.watch" || h === "fb.com") return "Facebook";
    if (h.endsWith("instagram.com")) return "Instagram";
    if (h.endsWith("tiktok.com")) return "TikTok";
    if (h.endsWith("youtube.com") || h === "youtu.be") return "YouTube";
    if (h.endsWith("linkedin.com")) return "LinkedIn";
  } catch {}
  return "social media";
};

// Only allows normal web links.
export const safeUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch { return ""; }
};