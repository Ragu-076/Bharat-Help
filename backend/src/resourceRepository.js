import { readFileSync } from 'node:fs';
import { RequestError } from './helpRepository.js';

const root = new URL('../../datasets/real-data/processed/', import.meta.url);
const types = { hospitals: 'hospitals.json', centres: 'one-stop-centres.json', schemes: 'schemes-normalized.json' };
// Field corrections are separate from imported snapshots so reprocessing preserves source evidence.
const pilotReview = JSON.parse(readFileSync(new URL('pilot-verification.json', root), 'utf8'));
const corrections = new Map(pilotReview.corrections.map((row) => [row.id, row]));
const stores = Object.fromEntries(Object.entries(types).map(([type, file]) => {
  const source = JSON.parse(readFileSync(new URL(file, root), 'utf8'));
  const records = type === 'schemes' ? source.records.filter((record) => record.browseable) : source.records.map((record) => {
    const correction = corrections.get(record.id);
    if (!correction || correction.type !== type) return record;
    const { original, ...fields } = correction;
    return { ...record, ...fields };
  });
  return [type, { ...source, records, index: new Map(records.map((record) => [record.id,
    [record.name, record.state, record.district, record.address, record.description, record.category].filter(Boolean).join(' ').normalize('NFKC').toLowerCase()])) }];
}));

const messages = {
  schemes: {
    en: 'Collected scheme information is shown in its original English. It may be outdated or incorrectly copied. Confirm benefits, eligibility and application steps on the official scheme page.',
    hi: 'संकलित योजना की जानकारी मूल अंग्रेज़ी में दिखाई गई है। यह पुरानी या गलत कॉपी की हुई हो सकती है। लाभ, पात्रता और आवेदन प्रक्रिया आधिकारिक योजना पृष्ठ पर जाँचें।',
    ta: 'சேகரிக்கப்பட்ட திட்ட விவரங்கள் மூல ஆங்கிலத்தில் காட்டப்படுகின்றன. அவை பழையதாகவோ தவறாக நகலெடுக்கப்பட்டதாகவோ இருக்கலாம். பயன்கள், தகுதி மற்றும் விண்ணப்ப முறையை அதிகாரப்பூர்வ திட்டப் பக்கத்தில் சரிபார்க்கவும்.',
  },
  directory: {
    en: 'These are collected directory listings, not confirmed current services. Addresses, district boundaries and phone numbers may have changed. Confirm details before travelling. This directory does not establish emergency capability or bed availability.',
    hi: 'ये संकलित निर्देशिका प्रविष्टियाँ हैं, वर्तमान सेवाओं की पुष्टि नहीं। पते, जिला सीमाएँ और फोन नंबर बदल सकते हैं। जाने से पहले जानकारी जाँचें। इससे आपातकालीन सुविधा या बिस्तर उपलब्धता की पुष्टि नहीं होती।',
    ta: 'இவை சேகரிக்கப்பட்ட பட்டியல் பதிவுகள்; தற்போதைய சேவைகள் உறுதிப்படுத்தப்படவில்லை. முகவரி, மாவட்ட எல்லைகள் மற்றும் தொலைபேசி எண்கள் மாறியிருக்கலாம். செல்லும் முன் விவரங்களை உறுதிசெய்யவும். அவசர சிகிச்சை வசதி அல்லது படுக்கை இருப்பை இப்பட்டியல் உறுதிசெய்யாது.',
  },
  centres: {
    en: 'These are collected centre listings. Addresses, district names and contact numbers may have changed. Confirm the centre and available support with the official service before travelling.',
    hi: 'ये संकलित केंद्र प्रविष्टियाँ हैं। पते, जिलों के नाम और संपर्क नंबर बदल सकते हैं। जाने से पहले आधिकारिक सेवा से केंद्र और उपलब्ध सहायता की पुष्टि करें।',
    ta: 'இவை சேகரிக்கப்பட்ட மையப் பதிவுகள். முகவரி, மாவட்டப் பெயர்கள் மற்றும் தொடர்பு எண்கள் மாறியிருக்கலாம். செல்லும் முன் அதிகாரப்பூர்வ சேவையிடம் மையத்தையும் கிடைக்கும் உதவியையும் உறுதிசெய்யவும்.',
  },
};

function options(query) {
  const { type, language = 'en' } = query;
  if (typeof type !== 'string' || !Object.hasOwn(stores, type)) throw new RequestError(400, 'Choose a valid resource type.');
  if (!['en', 'hi', 'ta'].includes(language)) throw new RequestError(400, 'Unsupported language. Use en, hi or ta.');
  for (const name of ['state', 'district', 'q', 'topic']) {
    if (query[name] !== undefined && (typeof query[name] !== 'string' || query[name].length > 160)) {
      throw new RequestError(400, 'Invalid resource filter.');
    }
  }
  const text = (key) => (query[key] || '').normalize('NFKC').trim();
  return { type, language, state: text('state'), district: text('district'), q: text('q'), topic: text('topic'), store: stores[type] };
}

function metadata(type, language, store) {
  return { type, language, notice: messages[type === 'schemes' ? 'schemes' : type === 'centres' ? 'centres' : 'directory'][language],
    processedOn: store.processedOn, sourceUpdatedOn: store.sourceUpdatedOn || null,
    sourceUrl: store.sourceUrl, totalImported: store.records.length };
}

export function resourceOptions(query) {
  const { type, language, state, store } = options(query);
  const states = [...new Set(store.records.map((record) => record.state))].sort();
  if (state && !states.includes(state)) throw new RequestError(400, 'Unknown resource state.');
  return { ...metadata(type, language, store), states,
    districts: type !== 'schemes' && state ? [...new Set(store.records.filter((record) => record.state === state).map((record) => record.district))].sort() : [],
    topics: type === 'schemes' ? [...new Set(store.records.flatMap((record) => record.topics))].sort() : [],
  };
}

export function searchResources(query) {
  const { type, language, state, district, q, topic, store } = options(query);
  const page = query.page === undefined ? 1 : Number(query.page);
  if ((query.page !== undefined && !['string', 'number'].includes(typeof query.page)) || !Number.isInteger(page) || page < 1 || page > 100000) throw new RequestError(400, 'Invalid resource page.');
  const available = resourceOptions(query);
  if (type !== 'schemes' && (!state || !district)) throw new RequestError(400, 'Choose a state and district.');
  if (district && !available.districts.includes(district)) throw new RequestError(400, 'Unknown resource district.');
  if (topic && !available.topics.includes(topic)) throw new RequestError(400, 'Unknown resource topic.');
  const terms = q.toLowerCase().split(/\s+/u).filter(Boolean);
  const matching = store.records.filter((record) =>
    (!state || record.state === state || (type === 'schemes' && record.state === 'Central')) &&
    (!district || record.district === district) && (!topic || record.topics?.includes(topic)) &&
    terms.every((term) => store.index.get(record.id).includes(term)));
  const pageSize = 10;
  const records = matching.slice((page - 1) * pageSize, page * pageSize).map((record) => {
    if (type !== 'schemes') {
      const row = structuredClone(record);
      if (row.reviewNotice) row.reviewNotice = row.reviewNotice[language];
      return row;
    }
    // Full normalized text is retained in processed data. Discovery links are not eligibility decisions.
    return { id: record.id, name: record.name, state: record.state, category: record.category, topics: record.topics,
      description: record.description, benefits: record.benefits, eligibility: record.eligibility,
      application: record.application, documents: record.documents, officialUrl: record.officialUrl,
      collectedAt: record.collectedAt, originalLanguage: 'en', verificationStatus: record.verificationStatus };
  });
  return { ...metadata(type, language, store), page, pageSize, total: matching.length, records };
}

export const resourceCounts = Object.fromEntries(Object.entries(stores).map(([type, store]) => [type, store.records.length]));
