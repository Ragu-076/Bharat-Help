// Shared with the visible notice so audio includes the same safety information.
export const healthNotices = [
  'General adult information, not a diagnosis or prescription. Ask a pharmacist about suitability and follow the product label. Children, pregnancy, ongoing illnesses, and other medicines need individual advice.',
  'Use emergency services for severe symptoms; do not wait for an over-the-counter medicine to work.',
];

export function buildResultSpeech(issue, t, { isSchemes = false, isCommonHealth = false } = {}) {
  const parts = [];
  const add = (text) => { if (text?.trim()) parts.push(text.trim()); };
  const heading = (key) => add(t(key).replace(/^[^\p{L}\p{N}]+/u, ''));
  const { help } = issue;
  add(`${t('Related help:')} ${t(issue.name)}`);
  add(`${t('Matches:')} ${(issue.matchedClueLabels ?? issue.matchedClues.map(t)).join(', ')}`);
  add(t('Related information based on matching clues. Match counts show relevance, not urgency.'));
  if (isCommonHealth) healthNotices.forEach((notice) => add(t(notice)));
  heading(isCommonHealth ? 'Self-care' : isSchemes ? 'Next steps' : '🚨 Immediate Help');
  help.immediateHelp.forEach((item) => add(t(item)));
  if (help.awareness?.length) {
    heading('Safety and awareness');
    help.awareness.forEach((text) => add(t(text)));
  }

  if (isCommonHealth) {
    heading('When to seek medical help');
    help.seekHelp.forEach((item) => add(t(item)));
    heading('Medicine information');
    help.medicines.forEach((medicine) => {
      add(t(medicine.name));
      add(t(medicine.purpose));
      heading('Precautions');
      medicine.precautions.forEach((item) => add(t(item)));
    });
  }
  if (help.contacts.length) {
    heading(isSchemes ? 'Application / Support Contacts' : '📞 Emergency / Support Contacts');
    help.contacts.forEach((contact) => {
      add(t(contact.name));
      // Web addresses are useful links on screen, but poor audio instructions.
      if (!/(?:https?:\/\/|(?:[a-z0-9-]+\.)+[a-z]{2,})/iu.test(contact.number)) add(contact.number);
      add(t(contact.available));
    });
  }
  if (help.rights.length) {
    heading('⚖️ Your Rights');
    help.rights.forEach((item) => add(t(item)));
  }
  if (help.schemes.length) {
    heading('🏛️ Government Schemes / Resources');
    help.schemes.forEach((scheme) => { add(t(scheme.name)); add(t(scheme.description)); });
  }
  const sources = issue.sourceDetails?.length ? issue.sourceDetails.map(({ title }) => t(title)) : help.sources.map((source) => {
    if (/^https?:\/\//i.test(source)) return '';
    const label = source.split(' — ')[0];
    return /^[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?$/i.test(label) ? '' : t(label);
  }).filter(Boolean);
  if (sources.length) {
    heading(isCommonHealth ? 'Health information sources' : 'Information sources');
    sources.forEach(add);
  }
  if (issue.coverage) add(`${t('Coverage')}: ${issue.coverage}`);
  if (issue.reviewedOn) add(`${t('Sources checked')}: ${issue.reviewedOn}`);
  add(`${t('Need urgent emergency help?')} ${t('Call 112')}`);
  return parts.join('\n\n');
}
