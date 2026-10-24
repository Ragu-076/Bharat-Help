import categories from '../data/categoryCatalog.js';
import { translate } from '../translations/translations.js';

// Search vocabulary only: these aliases point to existing clues, not new advice.
// This is a phrase matcher. Suggestions must be reviewed before using them.
const aliases = {
  'women-support': {
    Violence: ['physical violence', 'being beaten', 'husband hit me', 'அடித்து துன்புறுத்துகிறார்', 'கணவர் அடிக்கிறார்', 'मारपीट', 'पति मारते हैं'],
    Harassment: ['being harassed', 'sexual harassment', 'பாலியல் தொல்லை', 'தொல்லை தருகிறார்', 'यौन उत्पीड़न', 'परेशान कर रहा है'],
    Threat: ['being threatened', 'threatening me', 'மிரட்டல்', 'மிரட்டுகிறார்', 'धमकी दे रहा है'],
    'Domestic Issue': ['domestic violence', 'family violence', 'family problem', 'வீட்டு வன்முறை', 'குடும்ப வன்முறை', 'குடும்ப பிரச்சனை', 'घरेलू हिंसा', 'घर में हिंसा'],
    'Online Abuse': ['online harassment', 'internet abuse', 'இணைய தொல்லை', 'ஆன்லைன் துன்புறுத்தல்', 'ऑनलाइन गाली', 'ऑनलाइन परेशान करना'],
    Workplace: ['at work', 'work place', 'office harassment', 'வேலை செய்யும் இடம்', 'அலுவலக தொல்லை', 'ऑफिस', 'काम की जगह'],
    Dowry: ['dowry demand', 'வரதட்சணை கேட்கிறார்கள்', 'दहेज मांगते हैं'],
    Stalking: ['being followed', 'someone following me', 'பின்தொடர்கிறார்', 'பின் தொடர்ந்து வருகிறார்', 'पीछा कर रहा है'],
  },
  'child-support': {
    Abuse: ['child abuse', 'child being beaten', 'குழந்தை துன்புறுத்தல்', 'குழந்தையை அடிக்கிறார்கள்', 'बच्चे के साथ दुर्व्यवहार', 'बच्चे को मारते हैं'],
    'Child Labour': ['child labor', 'child forced to work', 'children working', 'குழந்தை தொழிலாளர்', 'குழந்தையை வேலைக்கு அனுப்புகிறார்கள்', 'बाल मजदूरी', 'बच्चे से काम करवाना'],
    'Missing Child': ['child missing', 'child is missing', 'child has been missing', 'child went missing', 'missing daughter', 'daughter is missing', 'daughter has been missing', 'missing son', 'son is missing', 'son has been missing', 'குழந்தை காணவில்லை', 'குழந்தையை காணவில்லை', 'குழந்தை காணாமல் போய்விட்டது', 'बच्चा लापता', 'बच्चा गायब', 'बच्चा खो गया', 'बच्ची लापता'],
    'Education Denied': ['denied education', 'denied school admission', 'not allowed to attend school', 'கல்வி மறுக்கப்படுகிறது', 'பள்ளியில் சேர்க்க மறுப்பு', 'பள்ளிக்கு அனுப்ப மறுக்கிறார்கள்', 'स्कूल में प्रवेश नहीं मिला', 'पढ़ाई से वंचित', 'स्कूल नहीं जाने देते'],
    Abandonment: ['abandoned child', 'child abandoned', 'கைவிடப்பட்ட குழந்தை', 'குழந்தையை கைவிட்டனர்', 'लावारिस बच्चा', 'बच्चे को छोड़ दिया'],
    Trafficking: ['child trafficking', 'human trafficking', 'குழந்தை கடத்தல்', 'மனித கடத்தல்', 'குழந்தையை கடத்திவிட்டார்கள்', 'बच्चों की तस्करी', 'बाल तस्करी'],
    'Online Danger': ['child online danger', 'unsafe online for child', 'குழந்தைக்கு இணைய ஆபத்து', 'குழந்தைக்கு ஆன்லைன் ஆபத்து', 'बच्चे को ऑनलाइन खतरा'],
  },
  'medical-emergency': {
    Accident: ['road accident', 'car crash', 'bike crash', 'சாலை விபத்து', 'வாகன விபத்து', 'सड़क हादसा', 'एक्सीडेंट'],
    'Heart Attack': ['heartattack', 'மாரடைப்பு ஏற்பட்டுள்ளது', 'இதயத் தாக்குதல்', 'हार्ट अटैक', 'दिल का दौरा पड़ा'],
    'Breathing Problem': ['difficulty breathing', 'trouble breathing', 'cannot breathe', 'cant breathe', 'unable to breathe', 'மூச்சு திணறல்', 'மூச்சுத்திணறல்', 'மூச்சு விட முடியவில்லை', 'சுவாசிக்க முடியவில்லை', 'सांस लेने में दिक्कत', 'साँस लेने में दिक्कत', 'सांस नहीं आ रही', 'साँस नहीं आ रही'],
    Poisoning: ['poison swallowed', 'swallowed poison', 'drank poison', 'விஷம் குடித்துவிட்டார்', 'விஷம் குடித்தார்', 'நஞ்சு', 'जहर पी लिया', 'ज़हर पी लिया', 'जहर खा लिया'],
    Burns: ['burn injury', 'burn injuries', 'தீ காயம்', 'தீக்காயங்கள்', 'आग से जल गया', 'जलने की चोट'],
    'Pregnancy Emergency': ['pregnancy complication', 'pregnant and bleeding', 'bleeding during pregnancy', 'கர்ப்பகால அவசர நிலை', 'கர்ப்பிணிக்கு இரத்தப்போக்கு', 'गर्भवती को रक्तस्राव', 'गर्भावस्था में रक्तस्राव'],
    'Mental Health Crisis': ['suicidal', 'suicide thoughts', 'suicidal thoughts', 'want to end my life', 'தற்கொலை எண்ணம்', 'தற்கொலை எண்ணங்கள்', 'தற்கொலை செய்ய நினைக்கிறேன்', 'आत्महत्या के विचार', 'आत्महत्या करना चाहता हूं', 'आत्महत्या करना चाहती हूं'],
    'Snake Bite': ['snakebite', 'snake bit me', 'bitten by a snake', 'பாம்பு கடி', 'பாம்பு கடித்துவிட்டது', 'सांप ने काटा', 'साँप ने काटा', 'सांप काट गया'],
  },
  'cyber-crime': {
    'Online Fraud': ['internet fraud', 'online scam', 'scammed online', 'ஆன்லைன் மோசடி', 'இணையத்தில் ஏமாற்றிவிட்டார்கள்', 'ऑनलाइन ठगी', 'इंटरनेट धोखाधड़ी'],
    Hacking: ['hacked', 'account hacked', 'கணக்கு ஹேக்', 'ஹேக்கிங்', 'ஹேக் செய்யப்பட்டது', 'अकाउंट हैक', 'खाता हैक'],
    'Identity Theft': ['stolen identity', 'identity stolen', 'someone using my identity', 'அடையாளம் திருடப்பட்டது', 'என் பெயரில் போலி கணக்கு', 'मेरी पहचान चुरा ली', 'मेरे नाम से फर्जी खाता'],
    Cyberbullying: ['cyber bullying', 'online bullying', 'இணைய மிரட்டல்', 'ஆன்லைன் தொல்லை', 'साइबर बुलिंग', 'ऑनलाइन बदमाशी'],
    Phishing: ['fake link', 'fraud link', 'fake bank message', 'போலி லிங்க்', 'போலி இணைப்பு', 'போலி வங்கி செய்தி', 'फर्जी लिंक', 'नकली बैंक संदेश', 'फिशिंग'],
    'UPI / Banking Fraud': ['upi fraud', 'upi scam', 'bank fraud', 'banking fraud', 'lost money through upi', 'lost money on upi', 'lost money via upi', 'lost money using upi', 'money lost through upi', 'upi money stolen', 'stole money through upi', 'stole money via upi', 'stole money using upi', 'stole my money through upi', 'stole my money via upi', 'stole my money using upi', 'money stolen through upi', 'money was stolen through upi', 'money was stolen via upi', 'money was stolen using upi', 'upi மோசடி', 'வங்கி மோசடி', 'upi மூலம் பணம் இழந்தேன்', 'யுபிஐ மோசடி', 'யூபிஐ மோசடி', 'upi से पैसे कट गए', 'upi से पैसे खो गए', 'यूपीआई धोखाधड़ी', 'यूपीआई फ्रॉड', 'यूपीआई से पैसे चले गए', 'बैंक धोखाधड़ी'],
    'Social Media Threat': ['social media threats', 'threatened on social media', 'instagram threat', 'facebook threat', 'சமூக வலைதள மிரட்டல்', 'இன்ஸ்டாகிராமில் மிரட்டல்', 'सोशल मीडिया धमकी', 'इंस्टाग्राम पर धमकी'],
  },
  'government-schemes': {
    'Health Insurance': ['medical insurance', 'மருத்துவ காப்பீடு', 'ஆயுஷ்மான்', 'चिकित्सा बीमा', 'आयुष्मान'],
    Education: ['scholarship', 'student scholarship', 'கல்வி உதவித்தொகை', 'படிப்பு உதவித்தொகை', 'छात्रवृत्ति', 'पढ़ाई के लिए सहायता'],
    Housing: ['housing scheme', 'house scheme', 'வீட்டு வசதி', 'வீடு கட்ட உதவி', 'வீடு திட்டம்', 'घर बनाने में सहायता', 'आवास योजना'],
    Employment: ['unemployment', 'job scheme', 'employment scheme', 'need a job', 'looking for a job', 'looking for work', 'வேலை வாய்ப்பு', 'வேலைவாய்ப்பு திட்டம்', 'வேலையின்மை', 'வேலை தேடுகிறேன்', 'வேலை வேண்டும்', 'रोजगार', 'बेरोजगारी', 'नौकरी योजना', 'नौकरी चाहिए', 'नौकरी की तलाश', 'काम चाहिए'],
    Agriculture: ['farming', 'farmer support', 'விவசாயம்', 'விவசாய உதவி', 'किसान', 'खेती'],
    Pension: ['old age pension', 'ஓய்வு ஊதியம்', 'முதியோர் உதவித்தொகை', 'वृद्धावस्था पेंशन', 'बुढ़ापा पेंशन'],
    'Disability Support': ['disability benefits', 'disabled assistance', 'மாற்றுத்திறனாளி உதவி', 'ஊனமுற்றோர் உதவி', 'दिव्यांग सहायता', 'विकलांग सहायता'],
    'Financial Aid': ['financial assistance', 'financial support', 'நிதியுதவி', 'பண உதவி', 'வறுமை உதவி', 'वित्तीय सहायता', 'पैसों की सहायता'],
  },
  'emergency-helplines': {
    Police: ['call police', 'police number', 'காவல்துறை', 'போலீஸ்', 'पुलिस नंबर'],
    Ambulance: ['ambulance needed', 'need an ambulance', 'ஆம்புலன்சு', 'அவசர ஊர்தி', 'ஆம்புலன்ஸ் வேண்டும்', 'एंबुलेंस', 'एम्बुलेंस चाहिए', 'ऐम्बुलेंस'],
    Fire: ['house on fire', 'building on fire', 'fire emergency', 'fire brigade', 'தீ பிடித்துவிட்டது', 'தீப்பிடித்துவிட்டது', 'வீடு எரிகிறது', 'தீயணைப்பு', 'आग लग गई', 'फायर ब्रिगेड'],
    'Women Helpline': ['womens helpline', 'women help number', 'பெண்கள் உதவி', 'மகளிர் உதவி எண்', 'महिला सहायता नंबर', 'महिलाओं की हेल्पलाइन'],
    Childline: ['child helpline', 'child help number', 'குழந்தை உதவி எண்', 'குழந்தைகள் உதவி', 'बाल हेल्पलाइन', 'बच्चों की हेल्पलाइन'],
    'Cyber Crime': ['cybercrime', 'cyber crime number', 'சைபர் குற்றம்', 'சைபர் கிரைம்', 'साइबर क्राइम'],
    Disaster: ['flood', 'earthquake', 'cyclone', 'வெள்ளம்', 'நிலநடுக்கம்', 'புயல்', 'बाढ़', 'भूकंप', 'चक्रवात'],
    'Mental Health': ['mental health support', 'counselling', 'counseling', 'மனநல உதவி', 'மன அழுத்தம்', 'ஆலோசனை உதவி', 'मानसिक स्वास्थ्य सहायता', 'मनोवैज्ञानिक सहायता'],
  },
  'common-health': {
    'Mild Headache': ['headache', 'mild headache', 'லேசான தலை வலி', 'தலைவலி', 'सिरदर्द', 'सिर दर्द'],
    'Common Cold': ['cold', 'runny nose', 'common cold', 'சளி', 'மூக்கு ஒழுகுதல்', 'सर्दी', 'जुकाम', 'ज़ुकाम', 'नाक बह रही'],
    Diarrhoea: ['diarrhea', 'loose stools', 'loose motions', 'வயிற்று போக்கு', 'பேதி', 'வயிற்றுப்போக்கு', 'लूज मोशन', 'पतले दस्त'],
    'Occasional Acidity': ['acidity', 'heartburn', 'acid reflux', 'நெஞ்செரிச்சல்', 'அமிலத்தன்மை', 'एसिडिटी', 'सीने में जलन'],
  },
};

const categoryContext = {
  'women-support': ['woman', 'women', 'wife', 'பெண்', 'பெண்கள்', 'மனைவி', 'महिला', 'औरत', 'पत्नी'],
  'child-support': ['child', 'children', 'daughter', 'son', 'குழந்தை', 'குழந்தைகள்', 'குழந்தைக்கு', 'குழந்தையை', 'குழந்தைகளுக்கு', 'சிறுமி', 'சிறுவன்', 'மகள்', 'மகன்', 'बच्चा', 'बच्चे', 'बच्ची', 'बच्चों', 'बेटा', 'बेटी', 'बेटे'],
};

function normalize(text) {
  return text.normalize('NFC').toLowerCase().replace(/['’]/gu, '')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim().replace(/\s+/gu, ' ')
    .replace(/\bu p i\b/gu, 'upi');
}

// Include combining marks in word boundaries: JS \b does not handle Indic text.
const isWordCharacter = (character) => /[\p{L}\p{M}\p{N}]/u.test(character || '');

function occurrences(text, phrase) {
  const matches = [];
  let from = 0;
  while (from < text.length) {
    const start = text.indexOf(phrase, from);
    if (start < 0) break;
    const end = start + phrase.length;
    if (!isWordCharacter(text[start - 1]) && !isWordCharacter(text[end])) matches.push({ start, end });
    from = end;
  }
  return matches;
}

const vocabulary = categories.map((category, categoryIndex) => ({
  ...category,
  categoryIndex,
  contexts: [...(categoryContext[category.id] || []), category.label,
    translate(category.label, 'ta'), translate(category.label, 'hi')].map(normalize),
  entries: category.clues.flatMap((clue, clueIndex) => [...new Set([
    clue, translate(clue, 'ta'), translate(clue, 'hi'), ...(aliases[category.id]?.[clue] || []),
  ].map(normalize))].map((phrase) => ({ clue, clueIndex, phrase }))),
}));

function isNegated(text, { start, end }) {
  const before = text.slice(0, start).trim().split(' ').slice(-4);
  const after = text.slice(end).trim().split(' ').slice(0, 3);
  // Deliberately limited to nearby explicit negations. Negative symptom phrases
  // such as "cannot breathe" are aliases themselves and are kept as a whole.
  const beforeText = before.join(' ');
  // "Do not delay calling police" negates the delay, not the request. Restrict
  // this exception to that explicit phrase instead of interpreting arbitrary verbs.
  const requestText = `${beforeText} ${text.slice(start, end)}`;
  const negatesDelay = /(?:^| )(?:dont|do not|not) (?:delay|wait|hesitate)(?: (?:to|in))? (?:call|calling|contact|contacting)(?: |$)/u.test(requestText);
  const englishNegated = /(?:^| )(?:no|not|without|dont|doesnt|didnt|never)(?: |$)/u.test(beforeText) && !negatesDelay;
  // A completed negative Hindi clause ("दुर्घटना नहीं हुई") must not negate a
  // later positive request ("एंबुलेंस चाहिए"). Keep "नहीं चाहिए एंबुलेंस" negative.
  const hindiPositiveRequest = after.some((word) => ['चाहिए', 'बुलाओ', 'भेजो', 'बुलाना'].includes(word));
  const hindiPrefix = hindiPositiveRequest
    ? beforeText.replace(/(?:नहीं|नही) (?:हुई|हुआ|हुए|था|थी|थे|है|हैं)(?: |$)/gu, ' ')
    : beforeText;
  return englishNegated
    || /(?:^| )(?:नहीं|नही|मत)(?: |$)/u.test(hindiPrefix)
    || after.some((word) => ['இல்லை', 'இல்ல', 'கிடையாது', 'नहीं', 'नही'].includes(word));
}

function hasContext(text, categoryId) {
  return (categoryContext[categoryId] || []).some((word) =>
    occurrences(text, normalize(word)).some((position) => !isNegated(text, position)));
}

function applyChildContext(hits, clauses) {
  return hits.flatMap((hit) => {
    const clause = clauses[hit.clauseIndex];
    if (hit.categoryId !== 'women-support' || hit.clue !== 'Online Abuse' || !hasContext(clause, 'child-support')) return [hit];
    const childHit = { ...hit, categoryId: 'child-support', clue: 'Online Danger' };
    return hasContext(clause, 'women-support') ? [hit, childHit] : [childHit];
  });
}

function contradictsMildHeadache(text, hit) {
  if (hit.clue !== 'Mild Headache') return false;
  // The record is explicitly for mild symptoms. Do not offer that clue when
  // nearby words explicitly describe a severe/sudden headache instead.
  const nearby = text.slice(0, hit.start).trim().split(' ').slice(-3)
    .concat(text.slice(hit.end).trim().split(' ').slice(0, 3));
  return nearby.some((word) => ['severe', 'sudden', 'worst', 'unbearable', 'கடுமையான', 'கடும்', 'திடீர்',
    'கடுமையாக', 'तेज', 'तीव्र', 'अचानक', 'गंभीर', 'असहनीय'].includes(word));
}

/** Return existing, reviewable clue suggestions from a spoken or typed phrase.
 * No semantic diagnosis, eligibility decision, or emergency triage is performed.
 */
export function matchVoiceSearch(text, { categoryId } = {}) {
  if (typeof text !== 'string' || !text.trim()) return [];
  if (categoryId && !categories.some((category) => category.id === categoryId)) return [];
  // Keep an acronym's dots from splitting one request into separate clauses.
  text = text.replace(/\bu\s*\.\s*p\s*\.\s*i\b\.?/giu, 'UPI');
  // A negation in one clause must not suppress an unrelated later request.
  const clauses = text.split(/[.!?;,\n]|\b(?:but|however|instead)\b|\band\s+(?=(?:i\s+)?(?:need|want|require|call|please)\b)|ஆனால்|ஆனா |लेकिन|मगर|बल्कि/iu)
    .map(normalize).filter(Boolean);
  const candidates = vocabulary.filter((category) => !categoryId || category.id === categoryId);
  const allHits = [];
  // Even in a category scope, recognise longer phrases from the whole catalogue
  // so "education denied" cannot accidentally become the scheme clue Education.
  for (const category of vocabulary) {
    for (const entry of category.entries) {
      clauses.forEach((clause, clauseIndex) => {
        for (const position of occurrences(clause, entry.phrase)) {
          const hit = { ...entry, ...position, categoryId: category.id, clauseIndex };
          if (!isNegated(clause, position) && !contradictsMildHeadache(clause, hit)) allHits.push(hit);
        }
      });
    }
  }
  // E.g. "online abuse" must not also become child "Abuse"; "education denied"
  // must not become a scheme's "Education" merely because a word overlaps.
  const contextualHits = applyChildContext(allHits, clauses);
  const preciseHits = contextualHits.filter((hit) => !contextualHits.some((other) =>
    other.clauseIndex === hit.clauseIndex && other.start <= hit.start && other.end >= hit.end
      && other.end - other.start > hit.end - hit.start));
  return candidates.flatMap((category) => {
    const hits = preciseHits.filter((hit) => hit.categoryId === category.id);
    if (!hits.length) return [];
    const clues = category.clues.filter((clue) => hits.some((hit) => hit.clue === clue));
    const score = clues.reduce((total, clue) => total + Math.max(...hits.filter((hit) => hit.clue === clue)
      .map((hit) => 10 + hit.phrase.split(' ').length * 2)), 0)
      + (clauses.some((clause) => category.contexts.some((context) => occurrences(clause, context).length)) ? 5 : 0);
    return [{ categoryId: category.id, clues, score, categoryIndex: category.categoryIndex }];
  }).sort((a, b) => b.score - a.score || a.categoryIndex - b.categoryIndex)
    .map(({ categoryId: id, clues, score }) => ({ categoryId: id, clues, score }));
}
