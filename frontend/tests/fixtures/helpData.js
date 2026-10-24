// Mock data for the prototype — will be replaced with MongoDB/PostgreSQL/MySql later

const helpData = [
  {
    id: "women-support",
    label: "Women Support",
    icon: "🛡️",
    description: "Help related to women's safety, rights, and legal protection",
    clues: [
      "Violence",
      "Harassment",
      "Threat",
      "Domestic Issue",
      "Online Abuse",
      "Workplace",
      "Dowry",
      "Stalking",
    ],
    issues: [
      {
        name: "Domestic Violence",
        keywords: ["violence", "domestic issue", "threat"],
        help: {
          immediateHelp: [
            "Move to a safe location if possible",
            "Contact a trusted neighbor, friend, or family member",
            "If injured, seek medical attention immediately",
            "Preserve any evidence (photos of injuries, messages)",
          ],
          contacts: [
            { name: "Women Helpline", number: "181", available: "24x7" },
            { name: "Police Emergency", number: "112", available: "24x7" },
            {
              name: "National Commission for Women",
              number: "7827-170-170",
              available: "Office hours",
            },
          ],
          rights: [
            "Protection of Women from Domestic Violence Act, 2005 — right to reside in the shared household",
            "Right to obtain a protection order from the Magistrate",
            "Right to monetary relief and compensation",
            "Section 498A IPC — cruelty by husband or relatives is a criminal offence",
          ],
          schemes: [
            {
              name: "One Stop Centre (Sakhi)",
              description:
                "Integrated support including police, legal, medical, and counselling services under one roof",
            },
            {
              name: "Mahila Shakti Kendra",
              description:
                "Community engagement through college student volunteers for awareness and support",
            },
            {
              name: "Swadhar Greh",
              description:
                "Shelter, food, clothing, and rehabilitation for women in difficult circumstances",
            },
          ],
          sources: [
            "Ministry of Women and Child Development — wcd.nic.in",
            "National Commission for Women — ncw.nic.in",
            "Protection of Women from Domestic Violence Act, 2005",
          ],
        },
      },
      {
        name: "Workplace Harassment",
        keywords: ["harassment", "workplace", "threat"],
        help: {
          immediateHelp: [
            "Document every incident with dates, times, and witnesses",
            "Report to the Internal Complaints Committee (ICC) at your workplace",
            "Every organisation with 10+ employees must have an ICC",
            "File a written complaint within 3 months of the incident",
          ],
          contacts: [
            { name: "Women Helpline", number: "181", available: "24x7" },
            {
              name: "SHe-Box Online Complaints",
              number: "shebox.nic.in",
              available: "Online portal",
            },
          ],
          rights: [
            "Sexual Harassment of Women at Workplace Act, 2013 (POSH Act)",
            "Right to file a complaint with the Internal Complaints Committee",
            "Right to confidentiality during inquiry proceedings",
            "Right to transfer or leave during the inquiry process",
          ],
          schemes: [
            {
              name: "SHe-Box",
              description:
                "Online complaint management system for sexual harassment at workplace, managed by Ministry of WCD",
            },
          ],
          sources: [
            "Sexual Harassment of Women at Workplace Act, 2013",
            "Ministry of Women and Child Development — wcd.nic.in",
          ],
        },
      },
      {
        name: "Online Abuse / Cyberstalking",
        keywords: ["online abuse", "stalking", "harassment", "threat"],
        help: {
          immediateHelp: [
            "Take screenshots and save URLs of abusive content",
            "Block the abuser on all platforms",
            "Report the content on the platform itself",
            "Do not delete your own evidence",
          ],
          contacts: [
            {
              name: "Cyber Crime Helpline",
              number: "1930",
              available: "24x7",
            },
            { name: "Women Helpline", number: "181", available: "24x7" },
            {
              name: "Cyber Crime Portal",
              number: "cybercrime.gov.in",
              available: "Online",
            },
          ],
          rights: [
            "IT Act Section 66E — punishment for violation of privacy",
            "IT Act Section 67 — publishing obscene material electronically",
            "IPC Section 354D — stalking",
            "IPC Section 509 — word, gesture, or act intended to insult modesty",
          ],
          schemes: [
            {
              name: "National Cyber Crime Reporting Portal",
              description:
                "File online FIR for cyber crimes including those against women",
            },
          ],
          sources: [
            "Information Technology Act, 2000",
            "cybercrime.gov.in",
            "Ministry of Home Affairs",
          ],
        },
      },
      {
        name: "Dowry Harassment",
        keywords: ["dowry", "domestic issue", "threat", "violence"],
        help: {
          immediateHelp: [
            "Keep records of dowry demands (messages, witnesses)",
            "Contact family members or trusted persons for support",
            "File a complaint at the nearest police station",
            "Seek legal counsel",
          ],
          contacts: [
            { name: "Women Helpline", number: "181", available: "24x7" },
            { name: "Police Emergency", number: "112", available: "24x7" },
          ],
          rights: [
            "Dowry Prohibition Act, 1961 — giving or taking dowry is punishable",
            "Section 498A IPC — cruelty by husband or relatives",
            "Section 304B IPC — dowry death",
          ],
          schemes: [
            {
              name: "Legal Aid Services",
              description:
                "Free legal aid available through District Legal Services Authority under NALSA",
            },
          ],
          sources: [
            "Dowry Prohibition Act, 1961",
            "National Legal Services Authority — nalsa.gov.in",
          ],
        },
      },
    ],
  },
  {
    id: "child-support",
    label: "Child Support",
    icon: "👶",
    description: "Protection and welfare services for children",
    clues: [
      "Abuse",
      "Child Labour",
      "Missing Child",
      "Education Denied",
      "Abandonment",
      "Trafficking",
      "Online Danger",
    ],
    issues: [
      {
        name: "Child Abuse",
        keywords: ["abuse", "violence"],
        help: {
          immediateHelp: [
            "Ensure the child is in a safe environment",
            "Seek immediate medical attention if the child is injured",
            "Report to Childline or local police",
            "Do not confront the abuser alone",
          ],
          contacts: [
            { name: "Childline India", number: "1098", available: "24x7" },
            { name: "Police Emergency", number: "112", available: "24x7" },
          ],
          rights: [
            "Protection of Children from Sexual Offences (POCSO) Act, 2012",
            "Juvenile Justice (Care and Protection of Children) Act, 2015",
            "Right to free and compulsory education (Article 21A)",
          ],
          schemes: [
            {
              name: "Integrated Child Protection Scheme (ICPS)",
              description:
                "Government programme for children in need of care and protection",
            },
            {
              name: "Childline 1098",
              description:
                "24-hour emergency phone service for children in distress",
            },
          ],
          sources: [
            "Ministry of Women and Child Development",
            "POCSO Act, 2012",
            "childlineindia.org",
          ],
        },
      },
      {
        name: "Child Labour",
        keywords: ["child labour", "education denied"],
        help: {
          immediateHelp: [
            "Report to the District Magistrate or local labour inspector",
            "Contact Childline 1098",
            "Document evidence if possible (photos, location)",
          ],
          contacts: [
            { name: "Childline India", number: "1098", available: "24x7" },
            {
              name: "National Child Labour Helpline",
              number: "14461",
              available: "Office hours",
            },
          ],
          rights: [
            "Child and Adolescent Labour (Prohibition and Regulation) Act, 1986",
            "Right to Education Act, 2009 — free education for ages 6–14",
            "Article 24 of the Constitution — prohibition of child labour",
          ],
          schemes: [
            {
              name: "National Child Labour Project (NCLP)",
              description:
                "Rehabilitation of child labourers through special training centres",
            },
          ],
          sources: [
            "Ministry of Labour and Employment",
            "labour.gov.in",
          ],
        },
      },
      {
        name: "Missing Child",
        keywords: ["missing child", "trafficking", "abandonment"],
        help: {
          immediateHelp: [
            "Report to police immediately — FIR must be registered",
            "Call Childline 1098",
            "Share recent photo and details with local authorities",
            "Check the TrackChild portal for missing children database",
          ],
          contacts: [
            { name: "Childline India", number: "1098", available: "24x7" },
            { name: "Police Emergency", number: "112", available: "24x7" },
            {
              name: "TrackChild Portal",
              number: "trackthemissingchild.gov.in",
              available: "Online",
            },
          ],
          rights: [
            "Police must register a missing child FIR immediately — no waiting period",
            "Juvenile Justice Act, 2015 — provisions for missing and abandoned children",
          ],
          schemes: [
            {
              name: "TrackChild",
              description:
                "National portal for tracking missing and found children",
            },
          ],
          sources: [
            "Ministry of Women and Child Development",
            "trackthemissingchild.gov.in",
          ],
        },
      },
    ],
  },
  {
    id: "medical-emergency",
    label: "Medical Emergency",
    icon: "🏥",
    description: "Emergency medical help, ambulance, and hospital information",
    clues: [
      "Accident",
      "Heart Attack",
      "Breathing Problem",
      "Poisoning",
      "Burns",
      "Pregnancy Emergency",
      "Mental Health Crisis",
      "Snake Bite",
    ],
    issues: [
      {
        name: "Accident / Trauma",
        keywords: ["accident", "burns"],
        help: {
          immediateHelp: [
            "Call ambulance immediately",
            "Do not move the person if spinal injury is suspected",
            "Apply pressure on wounds to stop bleeding",
            "Keep the person warm and conscious",
            "Under Motor Vehicles Act, Good Samaritans are protected from legal trouble",
          ],
          contacts: [
            {
              name: "National Ambulance Service",
              number: "108",
              available: "24x7",
            },
            {
              name: "Emergency (ERSS)",
              number: "112",
              available: "24x7",
            },
            {
              name: "Road Accident Emergency",
              number: "1073",
              available: "24x7",
            },
          ],
          rights: [
            "Every hospital must stabilise an accident victim before asking for payment or paperwork",
            "Good Samaritan Law — bystanders who help accident victims are protected",
            "Right to emergency medical care (Article 21 — Right to Life)",
          ],
          schemes: [
            {
              name: "Ayushman Bharat — PMJAY",
              description:
                "Health insurance cover of ₹5 lakh per family per year for secondary and tertiary hospitalisation",
            },
            {
              name: "108 Ambulance Service",
              description:
                "Free emergency ambulance service available across most states",
            },
          ],
          sources: [
            "Ministry of Health and Family Welfare — mohfw.gov.in",
            "pmjay.gov.in",
          ],
        },
      },
      {
        name: "Heart Attack / Cardiac Emergency",
        keywords: ["heart attack", "breathing problem"],
        help: {
          immediateHelp: [
            "Call 108 ambulance immediately",
            "Make the person sit or lie down comfortably",
            "If prescribed, give them an aspirin tablet to chew",
            "Loosen tight clothing",
            "Be ready to perform CPR if the person becomes unresponsive",
          ],
          contacts: [
            {
              name: "National Ambulance Service",
              number: "108",
              available: "24x7",
            },
            {
              name: "Emergency (ERSS)",
              number: "112",
              available: "24x7",
            },
          ],
          rights: [
            "Right to emergency treatment — hospitals cannot refuse",
            "Ayushman Bharat covers cardiac procedures for eligible families",
          ],
          schemes: [
            {
              name: "Ayushman Bharat — PMJAY",
              description:
                "Covers heart surgery and cardiac procedures for eligible families",
            },
          ],
          sources: [
            "Ministry of Health and Family Welfare",
            "pmjay.gov.in",
          ],
        },
      },
      {
        name: "Mental Health Crisis",
        keywords: ["mental health crisis"],
        help: {
          immediateHelp: [
            "Stay with the person and listen without judgement",
            "Remove access to any means of self-harm",
            "Call a mental health helpline or take to nearest hospital",
            "Do not leave the person alone",
          ],
          contacts: [
            {
              name: "Vandrevala Foundation Helpline",
              number: "1860-2662-345",
              available: "24x7",
            },
            {
              name: "iCall (TISS)",
              number: "9152987821",
              available: "Mon–Sat, 8am–10pm",
            },
            {
              name: "NIMHANS Helpline",
              number: "080-46110007",
              available: "24x7",
            },
          ],
          rights: [
            "Mental Healthcare Act, 2017 — right to access mental healthcare",
            "Right to confidentiality of mental health information",
            "Right to make advance directives for mental health treatment",
          ],
          schemes: [
            {
              name: "National Mental Health Programme (NMHP)",
              description:
                "District Mental Health Programme providing psychiatric services at district level",
            },
          ],
          sources: [
            "Mental Healthcare Act, 2017",
            "nimhans.ac.in",
          ],
        },
      },
      {
        name: "Pregnancy / Maternal Emergency",
        keywords: ["pregnancy emergency"],
        help: {
          immediateHelp: [
            "Call 102 or 108 ambulance immediately — state it is a pregnancy emergency for priority dispatch",
            "Keep the pregnant woman lying comfortably on her left side to improve oxygen and blood flow",
            "Keep her calm and warm, and gather ANC (antenatal care) cards and medical records",
            "In case of heavy bleeding, severe abdominal pain, or contractions, transport immediately to nearest CHC/District Hospital",
          ],
          contacts: [
            {
              name: "Maternal Ambulance Service",
              number: "102 / 108",
              available: "24x7",
            },
            {
              name: "Emergency (ERSS)",
              number: "112",
              available: "24x7",
            },
            {
              name: "Women Helpline",
              number: "181",
              available: "24x7",
            },
          ],
          rights: [
            "Right to free, cashless delivery and emergency care under Janani Shishu Suraksha Karyakram (JSSK)",
            "Hospitals cannot refuse emergency medical stabilization to a pregnant woman",
            "Right to free transport from home to hospital, inter-facility transfer, and drop back home",
          ],
          schemes: [
            {
              name: "Janani Shishu Suraksha Karyakram (JSSK)",
              description:
                "Completely free delivery, C-section, drugs, diagnostics, blood, and transport for pregnant women in government hospitals",
            },
            {
              name: "Janani Suraksha Yojana (JSY)",
              description:
                "Cash assistance for institutional delivery for pregnant women, especially from BPL households",
            },
            {
              name: "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
              description:
                "Direct benefit transfer cash incentive of ₹5,000 for pregnant women and lactating mothers",
            },
          ],
          sources: [
            "Ministry of Health and Family Welfare — mohfw.gov.in",
            "National Health Mission — nhm.gov.in",
          ],
        },
      },
      {
        name: "Poisoning / Snake Bite Emergency",
        keywords: ["poisoning", "snake bite"],
        help: {
          immediateHelp: [
            "For Snake Bite: Keep the person calm and still; immobilize the bitten limb below heart level (do NOT cut, suck, or tie tight tourniquets)",
            "Transport immediately to nearest government hospital with Anti-Snake Venom (ASV)",
            "For Poisoning: Identify the chemical/substance if safe to do so; call Poison Information Centre at 1066",
            "Do NOT induce vomiting unless explicitly advised by a medical professional",
          ],
          contacts: [
            {
              name: "National Ambulance Service",
              number: "108 / 102",
              available: "24x7",
            },
            {
              name: "National Poison Information Centre",
              number: "1066 / 011-26588663",
              available: "24x7",
            },
            {
              name: "Emergency (ERSS)",
              number: "112",
              available: "24x7",
            },
          ],
          rights: [
            "Right to emergency anti-snake venom (ASV) and antidote treatment — public hospitals must provide free emergency care",
          ],
          schemes: [
            {
              name: "Free Essential Drugs Initiative",
              description:
                "Provides free anti-snake venom (ASV) and emergency life-saving medicines at public health facilities",
            },
          ],
          sources: [
            "Ministry of Health and Family Welfare — mohfw.gov.in",
            "AIIMS National Poison Information Centre — aiims.edu",
          ],
        },
      },
    ],
  },
  {
    id: "cyber-crime",
    label: "Cyber Crime",
    icon: "💻",
    description: "Help for online fraud, hacking, cyberbullying, and digital threats",
    clues: [
      "Online Fraud",
      "Hacking",
      "Identity Theft",
      "Cyberbullying",
      "Phishing",
      "UPI / Banking Fraud",
      "Social Media Threat",
    ],
    issues: [
      {
        name: "Online Financial Fraud",
        keywords: ["online fraud", "phishing", "upi / banking fraud", "identity theft"],
        help: {
          immediateHelp: [
            "Call 1930 immediately — quick action can freeze the fraudulent transaction",
            "Report to your bank to block the account/card",
            "File a complaint on cybercrime.gov.in",
            "Do not share OTP or banking details with anyone",
            "Save all transaction records and messages",
          ],
          contacts: [
            {
              name: "Cyber Crime Helpline",
              number: "1930",
              available: "24x7",
            },
            {
              name: "Cyber Crime Portal",
              number: "cybercrime.gov.in",
              available: "Online",
            },
            {
              name: "RBI Complaint",
              number: "cms.rbi.org.in",
              available: "Online",
            },
          ],
          rights: [
            "IT Act Section 66C — identity theft punishment",
            "IT Act Section 66D — cheating by personation using computer resource",
            "RBI guidelines — zero liability for unauthorised electronic banking transactions if reported within 3 days",
          ],
          schemes: [
            {
              name: "Citizen Financial Cyber Fraud Reporting",
              description:
                "Report within the golden hour (first few hours) for highest chance of recovery via 1930 helpline",
            },
          ],
          sources: [
            "cybercrime.gov.in",
            "Information Technology Act, 2000",
            "Reserve Bank of India — rbi.org.in",
          ],
        },
      },
      {
        name: "Hacking / Unauthorised Access",
        keywords: ["hacking", "identity theft"],
        help: {
          immediateHelp: [
            "Change all passwords immediately from a secure device",
            "Enable two-factor authentication on all accounts",
            "Check for unauthorised logins in account settings",
            "Report to cybercrime.gov.in",
          ],
          contacts: [
            {
              name: "Cyber Crime Helpline",
              number: "1930",
              available: "24x7",
            },
            {
              name: "CERT-In",
              number: "cert-in.org.in",
              available: "Online",
            },
          ],
          rights: [
            "IT Act Section 66 — computer-related offences, up to 3 years imprisonment",
            "IT Act Section 43 — penalty for damage to computer systems",
          ],
          schemes: [
            {
              name: "CERT-In Incident Reporting",
              description:
                "Indian Computer Emergency Response Team handles cyber security incidents",
            },
          ],
          sources: [
            "Information Technology Act, 2000",
            "cert-in.org.in",
          ],
        },
      },
      {
        name: "Cyberbullying / Online Threat",
        keywords: ["cyberbullying", "social media threat"],
        help: {
          immediateHelp: [
            "Do not respond to the bully",
            "Take screenshots of all abusive messages",
            "Block and report the person on the platform",
            "File a complaint on cybercrime.gov.in",
          ],
          contacts: [
            {
              name: "Cyber Crime Helpline",
              number: "1930",
              available: "24x7",
            },
            { name: "Police Emergency", number: "112", available: "24x7" },
          ],
          rights: [
            "IT Act Section 67 — publishing obscene content",
            "IPC Section 507 — criminal intimidation by anonymous communication",
            "IPC Section 506 — criminal intimidation",
          ],
          schemes: [
            {
              name: "National Cyber Crime Reporting Portal",
              description:
                "File complaints for all types of cyber crime including bullying and threats",
            },
          ],
          sources: [
            "cybercrime.gov.in",
            "Ministry of Home Affairs",
          ],
        },
      },
    ],
  },
  {
    id: "government-schemes",
    label: "Government Schemes",
    icon: "🏛️",
    description: "Find government welfare schemes, benefits, and entitlements",
    clues: [
      "Health Insurance",
      "Education",
      "Housing",
      "Employment",
      "Agriculture",
      "Pension",
      "Disability Support",
      "Financial Aid",
    ],
    issues: [
      {
        name: "Health Insurance / Medical Aid",
        keywords: ["health insurance", "financial aid"],
        help: {
          immediateHelp: [
            "Check eligibility on mera.pmjay.gov.in using Aadhaar or ration card",
            "Visit Common Service Centre (CSC) for registration help",
            "Contact state health department for state-specific schemes",
          ],
          contacts: [
            {
              name: "Ayushman Bharat Helpline",
              number: "14555",
              available: "24x7",
            },
            {
              name: "PMJAY Portal",
              number: "pmjay.gov.in",
              available: "Online",
            },
          ],
          rights: [
            "Eligible families can receive ₹5 lakh coverage per year",
            "No pre-existing condition exclusion under PMJAY",
            "Cashless treatment at empanelled hospitals",
          ],
          schemes: [
            {
              name: "Ayushman Bharat — PMJAY",
              description:
                "₹5 lakh health insurance per family per year for eligible households",
            },
            {
              name: "Janani Suraksha Yojana",
              description:
                "Cash assistance for institutional delivery for pregnant women from BPL families",
            },
          ],
          sources: [
            "pmjay.gov.in",
            "Ministry of Health and Family Welfare",
          ],
        },
      },
      {
        name: "Education Support",
        keywords: ["education", "financial aid"],
        help: {
          immediateHelp: [
            "Check scholarship portals: scholarships.gov.in",
            "Apply through National Scholarship Portal for central schemes",
            "Contact district education officer for state scholarships",
          ],
          contacts: [
            {
              name: "National Scholarship Portal",
              number: "scholarships.gov.in",
              available: "Online",
            },
          ],
          rights: [
            "Right to Education Act — free education for children aged 6–14",
            "25% seats in private schools reserved under RTE for EWS/disadvantaged",
          ],
          schemes: [
            {
              name: "National Scholarship Portal",
              description:
                "Single platform for central and state scholarship schemes",
            },
            {
              name: "PM Vidya Lakshmi",
              description:
                "Education loan portal connecting students with banks",
            },
            {
              name: "Mid Day Meal Scheme (PM POSHAN)",
              description:
                "Free lunch in government schools to improve nutrition and attendance",
            },
          ],
          sources: [
            "scholarships.gov.in",
            "Ministry of Education — education.gov.in",
          ],
        },
      },
      {
        name: "Housing Assistance",
        keywords: ["housing", "financial aid"],
        help: {
          immediateHelp: [
            "Check eligibility on pmaymis.gov.in (urban) or pmayg.nic.in (rural)",
            "Apply through local municipality or gram panchayat",
          ],
          contacts: [
            {
              name: "PMAY Helpline",
              number: "1800-11-6163",
              available: "Office hours",
            },
          ],
          rights: [
            "Eligible families can receive subsidy for house construction or purchase",
          ],
          schemes: [
            {
              name: "Pradhan Mantri Awas Yojana (PMAY)",
              description:
                "Affordable housing for urban and rural poor with interest subsidy",
            },
          ],
          sources: [
            "pmaymis.gov.in",
            "Ministry of Housing and Urban Affairs",
          ],
        },
      },
      {
        name: "Pension / Old Age Support",
        keywords: ["pension", "financial aid"],
        help: {
          immediateHelp: [
            "Check eligibility at jansuraksha.gov.in",
            "Visit nearest bank branch or Common Service Centre to enrol",
          ],
          contacts: [
            {
              name: "Jan Suraksha Helpline",
              number: "1800-180-1111",
              available: "Office hours",
            },
          ],
          rights: [
            "Eligible unorganised sector workers can get ₹3000/month pension after age 60",
          ],
          schemes: [
            {
              name: "PM Shram Yogi Maan-dhan (PM-SYM)",
              description:
                "Monthly pension of ₹3000 for unorganised sector workers after age 60",
            },
            {
              name: "Atal Pension Yojana (APY)",
              description:
                "Guaranteed pension of ₹1000–5000 per month based on contribution",
            },
            {
              name: "Indira Gandhi National Old Age Pension",
              description:
                "Monthly pension for BPL citizens above 60 years of age",
            },
          ],
          sources: [
            "jansuraksha.gov.in",
            "Ministry of Labour and Employment",
          ],
        },
      },
    ],
  },
  {
    id: "emergency-helplines",
    label: "Emergency Helplines",
    icon: "📞",
    description: "Quick 24x7 emergency helpline numbers and contacts across India",
    clues: [
      "Police",
      "Ambulance",
      "Fire",
      "Women Helpline",
      "Childline",
      "Cyber Crime",
      "Disaster",
      "Mental Health",
    ],
    issues: [
      {
        name: "National Emergency & Safety Helplines",
        keywords: ["police", "ambulance", "fire", "women helpline", "childline", "cyber crime", "disaster", "mental health"],
        help: {
          immediateHelp: [
            "For general life-threatening emergencies, call 112 (ERSS) immediately",
            "For medical emergencies, call 108 or 102 for instant ambulance response",
            "For cyber financial fraud, call 1930 within the golden hour",
            "For child distress, call Childline at 1098",
          ],
          contacts: [
            { name: "National Emergency (ERSS)", number: "112", available: "24x7" },
            { name: "Police Emergency", number: "100", available: "24x7" },
            { name: "Ambulance Service", number: "108 / 102", available: "24x7" },
            { name: "Fire Service", number: "101", available: "24x7" },
            { name: "Women Helpline", number: "181", available: "24x7" },
            { name: "Childline India", number: "1098", available: "24x7" },
            { name: "Cyber Crime Helpline", number: "1930", available: "24x7" },
            { name: "Disaster Management", number: "1070", available: "24x7" },
          ],
          rights: [
            "Right to Emergency Services under Article 21 (Right to Life)",
            "Mandatory emergency response without delay or jurisdiction refusal",
          ],
          schemes: [
            {
              name: "Emergency Response Support System (ERSS)",
              description: "Pan-India single emergency response number 112 for all emergency services",
            },
            {
              name: "Citizen Financial Cyber Fraud Reporting",
              description: "National helpline 1930 to report and freeze fraudulent financial transactions",
            },
          ],
          sources: [
            "Emergency Response Support System — erss.gov.in",
            "National Portal of India — india.gov.in",
            "Cyber Crime Reporting — cybercrime.gov.in",
          ],
        },
      },
    ],
  },
];

// Simple matching — compare selected clues against each issue's keywords
// Returns matches sorted by how many clues matched (most relevant first)
export function matchIssues(category, selectedClues) {
  if (!category || !selectedClues || selectedClues.length === 0) {
    return [];
  }

  const normalizedClues = selectedClues.map((c) => c.toLowerCase());

  const scored = category.issues.map((issue) => {
    const matchCount = issue.keywords.filter((keyword) =>
      normalizedClues.includes(keyword.toLowerCase())
    ).length;

    return { ...issue, matchCount };
  });

  // Return only issues that have at least 1 keyword match, sorted by relevance
  return scored
    .filter((issue) => issue.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);
}

export default helpData;
