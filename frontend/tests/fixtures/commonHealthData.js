// General adult information; no symptom diagnosis, dosing, or prescription logic.
// Source pages checked 2026-10-16. A clinician should review before public release.
export const healthRows = [];
function text(en, ta) { healthRows.push([en, ta]); return en; }

const paracetamol = {
  name: text('Paracetamol', 'பாராசிட்டமால்'),
  purpose: text('May relieve mild pain or fever.', 'லேசான வலி அல்லது காய்ச்சலைக் குறைக்க உதவலாம்.'),
  precautions: [
    text('Do not combine products containing paracetamol. Check with a pharmacist if you have liver or kidney disease or heavy alcohol use.', 'பாராசிட்டமால் உள்ள பல மருந்துகளைச் சேர்த்து எடுக்க வேண்டாம். கல்லீரல் அல்லது சிறுநீரக நோய் அல்லது அதிக மது அருந்தும் பழக்கம் இருந்தால் மருந்தாளரிடம் கேளுங்கள்.'),
    text('Follow the label; seek urgent medical advice after an overdose, even if you feel well.', 'பொட்டல வழிமுறைகளைப் பின்பற்றுங்கள்; அளவுக்கு அதிகமாக எடுத்தால் நன்றாக உணர்ந்தாலும் உடனே மருத்துவ ஆலோசனை பெறுங்கள்.'),
  ],
};

export const commonHealthCategory = {
  id: 'common-health', label: 'Common Health Issues', icon: '🩺',
  description: 'General self-care and medicine information for common, mild symptoms',
  clues: ['Mild Headache', 'Common Cold', 'Diarrhoea', 'Occasional Acidity'],
  issues: [
    {
      name: 'Mild Headache', keywords: ['mild headache'],
      help: {
        immediateHelp: [text('Drink water, eat regularly, and take a break from screens.', 'தண்ணீர் குடியுங்கள், நேரத்திற்கு உணவு உண்ணுங்கள், திரைப் பயன்பாட்டில் இடைவேளை எடுங்கள்.')],
        medicines: [paracetamol],
        seekHelp: [text('Sudden severe headache, weakness, confusion, fever with a stiff neck, or headache after injury needs urgent assessment. Seek care for persistent or worsening headache.', 'திடீர் கடும் தலைவலி, பலவீனம், குழப்பம், கழுத்து இறுக்கத்துடன் காய்ச்சல் அல்லது காயத்திற்குப் பின் தலைவலிக்கு அவசரப் பரிசோதனை தேவை. நீடிக்கும் அல்லது அதிகரிக்கும் தலைவலிக்கு மருத்துவ உதவி பெறுங்கள்.')],
        contacts: [], rights: [], schemes: [],
        sources: ['https://www.nhs.uk/symptoms/headaches/', 'https://www.nhs.uk/medicines/paracetamol-for-adults/'],
      },
    },
    {
      name: 'Common Cold', keywords: ['common cold'],
      help: {
        immediateHelp: [text('Rest and drink fluids. Antibiotics do not treat a common cold.', 'ஓய்வெடுத்து திரவங்கள் அருந்துங்கள். சாதாரண சளிக்கு நுண்ணுயிர் எதிர்ப்பு மருந்துகள் பயனில்லை.')],
        medicines: [paracetamol],
        seekHelp: [text('Get urgent help for breathing difficulty or chest pain. Seek medical advice if fever lasts over 3 days, symptoms worsen, or the cold has not improved after 10 days.', 'சுவாசிக்கச் சிரமம் அல்லது நெஞ்சுவலி இருந்தால் அவசர உதவி பெறுங்கள். காய்ச்சல் 3 நாட்களுக்கு மேல் நீடித்தால், அறிகுறிகள் மோசமானால் அல்லது 10 நாட்களுக்குப் பிறகும் சளி குறையாவிட்டால் மருத்துவ ஆலோசனை பெறுங்கள்.')],
        contacts: [], rights: [], schemes: [],
        sources: ['https://www.nhs.uk/conditions/common-cold/', 'https://www.nhs.uk/medicines/paracetamol-for-adults/'],
      },
    },
    {
      name: 'Diarrhoea', keywords: ['diarrhoea'],
      help: {
        immediateHelp: [text('Sip fluids often and eat when able. Wash hands carefully.', 'சிறிது சிறிதாக அடிக்கடி திரவங்கள் அருந்தி, முடிந்தபோது உணவு உண்ணுங்கள். கைகளை நன்கு கழுவுங்கள்.')],
        medicines: [{
          name: text('Oral rehydration salts (ORS)', 'வாய்வழி நீரேற்ற உப்புகள் (ORS)'),
          purpose: text('Replace fluids and salts lost through diarrhoea.', 'வயிற்றுப்போக்கால் இழந்த நீர் மற்றும் உப்புகளை ஈடு செய்யும்.'),
          precautions: [text('Mix with safe water exactly as the packet directs. Ask a pharmacist about suitability, especially with kidney disease or fluid restrictions.', 'பொட்டல வழிமுறைப்படியே பாதுகாப்பான நீரில் கலக்குங்கள். குறிப்பாகச் சிறுநீரக நோய் அல்லது திரவக் கட்டுப்பாடு இருந்தால் பொருத்தத்தை மருந்தாளரிடம் கேளுங்கள்.')],
        }],
        seekHelp: [text('Seek urgent care for blood in stool, severe abdominal pain, very little urine, confusion, or inability to keep fluids down. Get advice if diarrhoea lasts over 7 days.', 'மலத்தில் இரத்தம், கடும் வயிற்றுவலி, மிகக் குறைந்த சிறுநீர், குழப்பம் அல்லது திரவங்கள் தங்காத நிலையில் அவசரச் சிகிச்சை பெறுங்கள். வயிற்றுப்போக்கு 7 நாட்களுக்கு மேல் நீடித்தால் ஆலோசனை பெறுங்கள்.')],
        contacts: [], rights: [], schemes: [],
        sources: ['https://www.nhs.uk/symptoms/diarrhoea-and-vomiting/', 'https://www.nhs.uk/conditions/dehydration/'],
      },
    },
    {
      name: 'Occasional Acidity', keywords: ['occasional acidity'],
      help: {
        immediateHelp: [text('Avoid foods that trigger symptoms and avoid eating shortly before bed.', 'அறிகுறிகளைத் தூண்டும் உணவுகளைத் தவிர்த்து, படுக்கைக்குச் செல்லும் முன் உணவு உண்ண வேண்டாம்.')],
        medicines: [{
          name: text('Antacids (for example, calcium carbonate)', 'அமிலநீக்கிகள் (எடுத்துக்காட்டு: கால்சியம் கார்பனேட்)'),
          purpose: text('May give short-term relief from heartburn.', 'நெஞ்செரிச்சலுக்கு குறுகிய கால நிவாரணம் தரலாம்.'),
          precautions: [text('Antacids can affect other medicines. Ask about spacing doses and suitability with kidney disease, heart failure, or sodium restrictions. Frequent use needs medical advice.', 'அமிலநீக்கிகள் பிற மருந்துகளைப் பாதிக்கலாம். மருந்து இடைவெளி மற்றும் சிறுநீரக நோய், இதயச் செயலிழப்பு அல்லது உப்புக் கட்டுப்பாட்டில் பொருத்தத்தைப் பற்றிக் கேளுங்கள். அடிக்கடி பயன்படுத்த மருத்துவ ஆலோசனை தேவை.')],
        }],
        seekHelp: [text('Do not assume new chest pain is acidity; seek urgent assessment. Get medical care for trouble swallowing, unexplained weight loss, blood in vomit or stool, or recurring symptoms.', 'புதிய நெஞ்சுவலியை அமிலத்தன்மை என்று கருத வேண்டாம்; அவசரப் பரிசோதனை பெறுங்கள். விழுங்குவதில் சிரமம், காரணமற்ற எடைக்குறைவு, வாந்தி அல்லது மலத்தில் இரத்தம், அல்லது மீண்டும் வரும் அறிகுறிகளுக்கு மருத்துவ உதவி பெறுங்கள்.')],
        contacts: [], rights: [], schemes: [],
        sources: ['https://www.nhs.uk/conditions/indigestion/', 'https://www.nhs.uk/medicines/antacids/', 'https://www.nhs.uk/symptoms/chest-pain/'],
      },
    },
  ],
};
