// EDIT HERE: open internship and attachment placements from partner organisations.
// Leave the list empty to show "No open listings right now" (students can still apply generally).
//
// type:     "Internship" | "Attachment" | "Graduate job" | "Volunteer placement"
// deadline: "YYYY-MM-DD" or null. Listings past their deadline are hidden automatically.
// field:    should match one of the fields below so the form can pre-select it.
//
// Example:
// { id: "acme-finance-2027", title: "Finance intern", org: "Acme Ltd", type: "Internship",
//   field: "Accounting and finance", location: "Nairobi", duration: "3 months", deadline: "2027-01-31",
//   summary: "Support the finance team with reconciliations and reporting." },

export const opportunities = [];

// The fields students can choose on the application form (keep in step with the back end).
export const fields = [
  "Accounting and finance", "Business and management", "Education and teaching", "Engineering",
  "Health and nursing", "ICT and computer science", "Law", "Media and communications",
  "Procurement and supply chain", "Social work and community development", "Agriculture and environment", "Other",
];

export const openOpportunities = () =>
  opportunities.filter((o) => !o.deadline || new Date(o.deadline + "T23:59:59") >= new Date());