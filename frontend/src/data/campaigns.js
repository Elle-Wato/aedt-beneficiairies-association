// EDIT HERE: the Association's campaigns, shown on /campaigns and in the homepage spotlight.
//
// status:   "live" | "upcoming" | "completed"
// start/end: "YYYY-MM-DD", or null to show "Date to be confirmed"
// goal/raised: amounts in KES. Leave both null to hide the progress bar.
//              Only fill these in with confirmed figures. Update "raised" as contributions come in:
//              the bar, percentage and amount remaining update automatically.
// supporters: optional number of people who have given (null hides it).
// kind:     "student" shows the campaign in the "Sponsor a student" section with a large progress panel.
// student:  optional details shown on a student campaign. Only publish with the student's consent;
//           a first name or initials is enough.
// revolving: true shows the "how your money keeps working" explanation.
// mpesaRef: optional account reference donors should use for this campaign, e.g. "STUDY1".
// unit:     optional cost of helping one person, e.g. { amount: 3000, one: "student", many: "students", per: "meals for 3 months" }.
//           Shows how many people the money raised so far covers, a row of figures, and a quick "how many can you feed?" picker.
//           Tip: make goal a multiple of unit.amount (e.g. 30 students x 3,000 = 90,000).
// video:    optional MP4 in /public/videos. poster is the still shown before it plays.
// featured: the campaign shown at the top of /campaigns and on the homepage (use one).
//
// The entries below come from the Association's own launch material. Check dates and
// wording before publishing.

export const campaigns = [
  {
    slug: "feed-a-student",
    kind: "student",
    title: "Feed a Student for a Semester",
    status: "live",
    category: "Meal support",
    start: null,
    end: null,
    image: "/images/meal-boxes.jpg",
    summary:
      "Many needy students skip meals to stay in school. KES 3,000 gives one student daily meals for three months, so they can focus on their studies.",
    body: [
      "Our target is to feed 30 students this semester. Meal vouchers are bought from restaurants at the university and given out through the Imam's office, with AEDT selecting the students and overseeing distribution.",
      "Give for one student, or for several. Every KES 3,000 is another student who can eat and learn.",
    ],
    asks: ["Feed one student: KES 3,000", "Give any amount: it all adds up", "Share this campaign on WhatsApp"],
    cta: ["Contribute now", "/contribute"],
    goal: 90000,            // 30 students x KES 3,000
    raised: 0,              // UPDATE as money comes in
    supporters: null,
    unit: { amount: 3000, one: "student", many: "students", per: "meals for 3 months" },
    mpesaRef: "937937#meals",
  },
  {
    slug: "start-her-studies",
    kind: "student",
    title: "Help Her Start Her Studies",
    status: "live",
    category: "Revolving study fund",
    start: null,
    end: null,
    image: "/images/group-discussion.jpg",
    student: { name: "", course: "", institution: "" },   // e.g. { name: "Amina", course: "BSc Nursing", institution: "Umma University" }
    summary:
      "A bright student has a place at university but cannot afford to start. Together we can raise KES 70,000 to get her into class.",
    body: [
      "The money goes into a revolving study fund. It pays her fees as she studies, and as it is repaid it is used again, semester after semester, until she completes.",
      "When she graduates, the same money keeps going: it moves on to support the next student. One contribution, many futures.",
    ],
    asks: ["Give any amount by M-Pesa", "Share this campaign with friends and family", "Ask your workplace to match your gift"],
    cta: ["Contribute now", "/contribute"],
    goal: 70000,
    raised: 0,              // UPDATE as money comes in, e.g. 50000
    supporters: null,       // e.g. 23
    revolving: true,
    mpesaRef: "937937#fees",   // Pay Bill 630640, this account number
  },
  {
    slug: "together-we-can-do-more",
    title: "Together, We Can Do More",
    status: "live",
    featured: true,
    category: "Membership drive",
    start: null,
    end: null,
    image: "/images/graduation-day.jpg",
    video: "/videos/together-we-can-do-more.mp4",
    poster: "/images/poster-together-we-can-do-more.jpg",
    summary:
      "We were once supported. Now it's our turn to give back. Join fellow AEDT beneficiaries and graduates to connect, empower one another and open doors for the next student.",
    body: [
      "Africa Education and Development Trust has been a bridge to opportunity for thousands of students. Behind every number is a story: a dream pursued, a challenge overcome and a future made possible through education.",
      "This campaign invites every beneficiary and graduate to keep that story going, through mentorship, skills development, volunteering, job linkages, and support for bright but financially disadvantaged students.",
    ],
    asks: [
      "Register as a member for KES 500",
      "Choose a monthly contribution you can keep up",
      "Mentor, volunteer or share an opportunity",
    ],
    cta: ["Become a member", "/membership#join"],
    goal: null,
    raised: null,
  },
  {
    slug: "a-new-chapter-begins",
    title: "A New Chapter Begins",
    status: "live",
    category: "Digital launch",
    start: null,
    end: null,
    image: "/images/poster-a-new-chapter-begins.jpg",
    video: "/videos/a-new-chapter-begins.mp4",
    poster: "/images/poster-a-new-chapter-begins.jpg",
    summary:
      "The online unveiling of the AEDT Beneficiaries Association and its new digital home, ahead of the formal launch planned for January.",
    body: [
      "With this unveiling, the Association is open to its community: current beneficiaries, graduates and everyone who believes in the mission.",
    ],
    asks: ["Watch and share the launch film", "Register on the website", "Invite a fellow beneficiary"],
    cta: ["Join the community", "/membership#join"],
    goal: null,
    raised: null,
  },
  {
    slug: "keep-a-student-in-class",
    title: "Keep a Student in Class",
    status: "live",
    category: "Fees and meals",
    start: null,
    end: null,
    image: "/images/seminar-classroom.jpg",
    summary:
      "Member contributions pay school fees for needy students, including orphans, and help university students facing financial difficulties get meals and other essentials.",
    body: [
      "Giving back is not just about what we have. It is about what we are willing to share. Every contribution, large or small, goes towards keeping a student learning.",
    ],
    asks: ["Give a one-off gift by M-Pesa", "Increase your monthly contribution", "Tell us about a student in need"],
    cta: ["Contribute", "/contribute"],
    goal: null,
    raised: null,
  },
  {
    slug: "formal-launch",
    title: "Formal Launch of the Association",
    status: "upcoming",
    category: "Event",
    start: null,
    end: null,
    image: "/images/conference-stage.jpg",
    summary:
      "The Association's formal physical launch is planned for January. Date, venue and programme will be announced here.",
    body: [],
    asks: ["Register so we can invite you", "Offer to help organise", "Bring a fellow beneficiary"],
    cta: ["Get updates", "/news"],
    goal: null,
    raised: null,
  },
];

export const statusLabel = { live: "Live now", upcoming: "Coming up", completed: "Completed" };

export const featuredCampaign = () => campaigns.find((c) => c.featured) || campaigns[0];
