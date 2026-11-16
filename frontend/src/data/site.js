// EDIT THIS FILE: contact details, location, payment details and social links used across the site.
export const site = {
  email: "beneficiaries.association@elimishatrust.or.ke",
  phone: "+254 726 919 711",
  // WhatsApp number for the chat button (international format, digits only). Leave "" to hide the button.
  whatsapp: "254726919711",
  whatsappMessage: "Hello AEDT Beneficiaries Association, I would like to ask about ",
  address: "Heidelberg House, Bellevue Mombasa road, Nairobi, Kenya",       // shown on the site and used for the map
  hours: "Monday to Friday, 8:00 am to 5:00 pm",

  // Optional: path to the logo in /public (e.g. "/images/logo.png"). Leave "" to show the text badge.
  logo: "/images/logo.png",

  // M-Pesa details shown on the Contribute page.
  mpesa: {
    paybill: "630640",
    accountName: "AEDT Beneficiaries",
    // Account numbers to use in Pay Bill. The first one is selected by default.
    accounts: [
      { ref: "937937#fees", label: "School fees", note: "Keeps needy students in class." },
      { ref: "937937#meals", label: "Meal support", note: "Meals for students facing hardship." },
    ],
    registration: "KES 500",
  },

  // Bank transfer details shown on the Contribute page. Set to null to hide.
  bank: {
    name: "Gulf African Bank",
    accountName: "AEDT Beneficiaries",
    accountNumber: "0800110301",
    branch: "Kenyatta Avenue",
    currency: "KES (Kenya shillings)",
  },

  social: {
    facebook:  "https://www.facebook.com/",   // replace with your page link
    instagram: "https://www.instagram.com/aedt_beneficiaries_association?exln=MW9uMmRqamhkc3d4Ng==",
    x:         "https://x.com/aedt_benefs?s=11",
    tiktok:    "https://www.tiktok.com/@aedt.beneficiarie?_r=1&_t=ZS-9BRp5RRtlXY",
  },
};
