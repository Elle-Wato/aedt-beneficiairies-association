// EDIT THIS FILE: contact details, location, payment details and social links used across the site.
export const site = {
  email: "beneficiaries.association@elimishatrust.or.ke",
  phone: "+254 726 919 711",
  address: "Heidelberg House, Bellevue Mombasa road, Nairobi, Kenya",       // shown on the site and used for the map
  hours: "Monday to Friday, 8:00 am to 5:00 pm",

  // Optional: path to the logo in /public (e.g. "/images/logo.png"). Leave "" to show the text badge.
  logo: "/images/logo.png",

  // M-Pesa details shown on the Contribute page. Leave a value "" until it is confirmed:
  // the page then shows "to be confirmed" instead of a number.
  mpesa: {
    paybill: "",            // business number, e.g. "123456"
    account: "",            // account number or name, e.g. "AEDTBA"
    registration: "KES 500",
  },

  social: {
    facebook:  "https://www.facebook.com/",   // replace with your page link
    instagram: "https://www.instagram.com/",
    x:         "https://x.com/",
    tiktok:    "https://www.tiktok.com/",
  },
};