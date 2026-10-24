"""Selected source-checked, trilingual summaries; no automatic eligibility decisions."""
import json
import csv
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'backend/data'
DATE = '2026-10-24'

def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def scheme(slug, clue, names, actions, descriptions, source):
    records = []
    for i in range(3):
        records.append({'name': names[i], 'help': {'immediateHelp': actions[i], 'contacts': [], 'rights': [],
            'schemes': [{'name': names[i], 'description': descriptions[i]}], 'sources': [source]}})
    row = {'id': f'government-schemes/{slug}', 'categoryId': 'government-schemes', 'keywords': [clue],
        **records[0], 'translations': {'hi': records[1], 'ta': records[2]},
        'sourceDetails': [{'title': names[0] + ' — official scheme information', 'url': source, 'reviewedOn': DATE}],
        'reviewedOn': DATE, 'coverage': {
            'en': 'India; scheme rules, local implementation and current application windows apply. The authority determines eligibility.',
            'hi': 'भारत; योजना के नियम, स्थानीय क्रियान्वयन और मौजूदा आवेदन अवधि लागू हैं। पात्रता संबंधित प्राधिकरण तय करता है।',
            'ta': 'இந்தியா; திட்ட விதிகள், உள்ளூர் செயல்பாடு மற்றும் தற்போதைய விண்ணப்பக் காலம் பொருந்தும். உரிய அதிகாரியே தகுதியை முடிவுசெய்கிறார்.'}}
    return row

extra = [
scheme('pmuy-lpg', 'Financial Aid',
 ['Ujjwala — LPG connection support', 'उज्ज्वला — एलपीजी कनेक्शन सहायता', 'உஜ்வாலா — சமையல் எரிவாயு இணைப்பு உதவி'],
 [['An adult woman in a poor household without an existing household LPG connection can check PMUY eligibility. The LPG distributor verifies the application.',
   'Use the official PMUY application route or an authorised LPG distributor. Prepare the current KYC, household, address and bank documents listed in the official FAQ.'],
  ['मौजूदा घरेलू एलपीजी कनेक्शन के बिना गरीब परिवार की वयस्क महिला पीएमयूवाई की पात्रता जाँच सकती है। एलपीजी वितरक आवेदन की जाँच करता है।',
   'आधिकारिक पीएमयूवाई आवेदन प्रक्रिया या अधिकृत एलपीजी वितरक का उपयोग करें। आधिकारिक प्रश्नोत्तर में दी गई वर्तमान केवाईसी, परिवार, पते और बैंक के दस्तावेज़ तैयार रखें।'],
  ['வீட்டில் ஏற்கெனவே எல்பிஜி இணைப்பு இல்லாத ஏழைக் குடும்பத்தின் வயதுவந்த பெண் பிஎம்யுவை தகுதியைச் சரிபார்க்கலாம். எரிவாயு விநியோகஸ்தர் விண்ணப்பத்தைச் சரிபார்ப்பார்.',
   'அதிகாரப்பூர்வ பிஎம்யுவை விண்ணப்ப வழியை அல்லது அங்கீகரிக்கப்பட்ட எரிவாயு விநியோகஸ்தரை அணுகவும். அதிகாரப்பூர்வக் கேள்வி பதில்களில் உள்ள தற்போதைய அடையாளம், குடும்பம், முகவரி மற்றும் வங்கி ஆவணங்களைத் தயார்செய்யவும்.']],
 ['PMUY supports an eligible household with a deposit-free LPG connection and the scheme-specified initial equipment/refill benefits. Continuing refill costs and current rules should be confirmed.',
  'पीएमयूवाई पात्र परिवार को बिना सुरक्षा जमा वाला एलपीजी कनेक्शन और योजना के अनुसार शुरुआती उपकरण/रिफिल लाभ देता है। आगे की रिफिल लागत और वर्तमान नियम जाँचें।',
  'பிஎம்யுவை தகுதியுள்ள குடும்பத்துக்கு வைப்புத்தொகையில்லா எரிவாயு இணைப்பையும் திட்டப்படி ஆரம்ப சாதனங்கள்/நிரப்புதல் பயன்களையும் வழங்குகிறது. தொடர்ந்த நிரப்புதல் செலவையும் தற்போதைய விதிகளையும் உறுதிசெய்யவும்.'],
 'https://www.pmuy.gov.in/faq.html'),
scheme('pm-vishwakarma', 'Employment',
 ['PM Vishwakarma — traditional artisans', 'पीएम विश्वकर्मा — पारंपरिक कारीगर', 'பிஎம் விஸ்வகர்மா — பாரம்பரியக் கைவினைஞர்கள்'],
 [['Check whether your occupation is one of the notified traditional trades. Registration, family and prior-loan restrictions apply.',
   'Ask an authorised Common Service Centre about registration and current local implementation. Approval requires official verification; assistance and credit are not automatic.'],
  ['जाँचें कि आपका काम अधिसूचित पारंपरिक व्यवसायों में शामिल है या नहीं। पंजीकरण, परिवार और पुराने ऋण से संबंधित प्रतिबंध लागू हैं।',
   'पंजीकरण और मौजूदा स्थानीय क्रियान्वयन के बारे में अधिकृत सामान्य सेवा केंद्र से पूछें। स्वीकृति के लिए आधिकारिक जाँच आवश्यक है; सहायता और ऋण अपने आप नहीं मिलते।'],
  ['உங்கள் தொழில் அறிவிக்கப்பட்ட பாரம்பரியத் தொழில்களில் உள்ளதா எனச் சரிபார்க்கவும். பதிவு, குடும்பம் மற்றும் முந்தைய கடன் தொடர்பான கட்டுப்பாடுகள் பொருந்தும்.',
   'பதிவு மற்றும் தற்போதைய உள்ளூர் செயல்பாடு பற்றி அங்கீகரிக்கப்பட்ட பொதுச் சேவை மையத்திடம் கேளுங்கள். அதிகாரப்பூர்வச் சரிபார்ப்புக்குப் பிறகே ஒப்புதல்; உதவியும் கடனும் தானாகக் கிடைக்காது.']],
 ['Support can include skill training, tools, market links and credit for eligible artisans in notified trades. Confirm availability and applicable conditions locally.',
  'அधिसूचित व्यवसायों के पात्र कारीगरों को कौशल प्रशिक्षण, औज़ार, बाज़ार संपर्क और ऋण जैसी सहायता मिल सकती है। उपलब्धता और लागू शर्तें स्थानीय स्तर पर जाँचें।',
  'அறிவிக்கப்பட்ட தொழில்களில் தகுதியுள்ள கைவினைஞர்களுக்கு திறன் பயிற்சி, கருவிகள், சந்தை இணைப்பு மற்றும் கடன் உதவி இருக்கலாம். கிடைக்கும் சேவைகளையும் பொருந்தும் விதிகளையும் உள்ளூரில் உறுதிசெய்யவும்.'],
 'https://www.myscheme.gov.in/schemes/pmv'),
scheme('nmmss', 'Education',
 ['NMMSS — school scholarship', 'एनएमएमएसएस — विद्यालय छात्रवृत्ति', 'என்எம்எம்எஸ்எஸ் — பள்ளி உதவித்தொகை'],
 [['Ask your school about the State/UT selection test, income criteria and renewal requirements for NMMSS.',
   'The cited 2026–27 announcement set 30 September 2026 as the student application deadline. That date has passed: check NSP and your school for later notices, verification or the next cycle.'],
  ['एनएमएमएसएस की राज्य/केंद्र शासित प्रदेश चयन परीक्षा, आय मानदंड और नवीनीकरण की शर्तों के बारे में अपने विद्यालय से पूछें।',
   'उद्धृत 2026–27 सूचना में छात्र आवेदन की अंतिम तारीख 30 सितंबर 2026 थी। यह तारीख बीत चुकी है: आगे की सूचना, सत्यापन या अगले चक्र के लिए एनएसपी और विद्यालय से जाँचें।'],
  ['என்எம்எம்எஸ்எஸ் மாநிலம்/ஒன்றியப் பகுதி தேர்வு, வருமான வரம்பு மற்றும் புதுப்பித்தல் விதிகள் குறித்து பள்ளியிடம் கேளுங்கள்.',
   'குறிப்பிடப்பட்ட 2026–27 அறிவிப்பில் மாணவர் விண்ணப்பத்துக்கான கடைசி நாள் 30 செப்டம்பர் 2026. அந்த நாள் கடந்துவிட்டது: புதிய அறிவிப்பு, சரிபார்ப்பு அல்லது அடுத்த சுற்றுக்காக என்எஸ்பி மற்றும் பள்ளியிடம் கேளுங்கள்.']],
 ['Scholarships support selected economically weaker students in eligible government, aided and local-body schools through secondary/higher-secondary education, subject to selection and renewal rules.',
  'चयन और नवीनीकरण नियमों के अनुसार पात्र सरकारी, सहायता प्राप्त और स्थानीय निकाय विद्यालयों के आर्थिक रूप से कमजोर चयनित विद्यार्थियों को माध्यमिक/उच्च माध्यमिक शिक्षा के लिए छात्रवृत्ति मिलती है।',
  'தேர்வு மற்றும் புதுப்பித்தல் விதிகளுக்கு உட்பட்டு தகுதியுள்ள அரசு, அரசு உதவி மற்றும் உள்ளாட்சி பள்ளிகளில் பொருளாதாரத்தில் பின்தங்கிய தேர்வான மாணவர்களின் இடைநிலை/மேல்நிலைக் கல்விக்கு உதவித்தொகை வழங்கப்படுகிறது.'],
 'https://www.pib.gov.in/newsite/erelcontent.aspx?lang=2&reg=48&relid=294184'),
scheme('adip-assistive-devices', 'Disability Support',
 ['ADIP — assistive devices', 'एडिप — सहायक उपकरण', 'ஏடிஐபி — உதவி உபகரணங்கள்'],
 [['Ask the district disability rehabilitation centre or an authorised implementing agency about assessment and suitable assistive devices.',
   'Check current disability/UDID, income and document rules on the official page. Eligible applicants can use the indicated ARJUN route; a professional assessment is needed for suitable fitting.'],
  ['मूल्यांकन और उपयुक्त सहायक उपकरणों के बारे में जिला दिव्यांग पुनर्वास केंद्र या अधिकृत कार्यान्वयन संस्था से पूछें।',
   'दिव्यांगता/यूडीआईडी, आय और दस्तावेज़ के मौजूदा नियम आधिकारिक पृष्ठ पर जाँचें। पात्र आवेदक बताए गए अर्जुन माध्यम का उपयोग कर सकते हैं; उचित उपकरण लगाने के लिए विशेषज्ञ मूल्यांकन आवश्यक है।'],
  ['மதிப்பீடு மற்றும் பொருத்தமான உதவி உபகரணங்கள் குறித்து மாவட்ட மாற்றுத்திறனாளர் மறுவாழ்வு மையம் அல்லது அங்கீகரிக்கப்பட்ட செயல்பாட்டு நிறுவனத்திடம் கேளுங்கள்.',
   'மாற்றுத்திறன்/யுடிஐடி, வருமானம் மற்றும் ஆவணங்களுக்கான தற்போதைய விதிகளை அதிகாரப்பூர்வப் பக்கத்தில் சரிபார்க்கவும். தகுதியுள்ளவர்கள் குறிப்பிடப்பட்ட அர்ஜுன் வழியைப் பயன்படுத்தலாம்; பொருத்தமான உபகரணத்துக்கு நிபுணர் மதிப்பீடு தேவை.']],
 ['The scheme assists eligible persons with disabilities with approved aids and appliances through implementing agencies. Device choice, subsidy and replacement rules apply.',
  'यह योजना कार्यान्वयन संस्थाओं के माध्यम से पात्र दिव्यांग व्यक्तियों को स्वीकृत सहायक उपकरण उपलब्ध कराने में मदद करती है। उपकरण चयन, सब्सिडी और बदलने के नियम लागू हैं।',
  'செயல்பாட்டு நிறுவனங்கள் மூலம் தகுதியுள்ள மாற்றுத்திறனாளிகளுக்கு அங்கீகரிக்கப்பட்ட உதவி உபகரணங்களைப் பெற இத்திட்டம் உதவுகிறது. சாதனத் தேர்வு, மானியம் மற்றும் மாற்றுவதற்கான விதிகள் பொருந்தும்.'],
 'https://depwd.gov.in/en/adip-scheme/'),
scheme('pmfby-crop-insurance', 'Agriculture',
 ['PMFBY — crop insurance', 'पीएमएफबीवाई — फसल बीमा', 'பிஎம்எஃப்பிவை — பயிர்க் காப்பீடு'],
 [['Check that your State, crop, area and season are notified under PMFBY, and confirm the enrolment deadline with the agriculture office, bank or official portal.',
   'Keep the application and premium receipt. Report covered crop loss through the official process within its specified time limit; a loss does not automatically qualify for a payment.'],
  ['कृषि कार्यालय, बैंक या आधिकारिक पोर्टल पर जाँचें कि आपका राज्य, फसल, क्षेत्र और मौसम पीएमएफबीवाई में अधिसूचित हैं तथा नामांकन की अंतिम तारीख क्या है।',
   'आवेदन और प्रीमियम की रसीद रखें। निर्धारित समय सीमा के अंदर आधिकारिक प्रक्रिया से शामिल फसल हानि की सूचना दें; हर नुकसान पर भुगतान अपने आप नहीं मिलता।'],
  ['உங்கள் மாநிலம், பயிர், பகுதி மற்றும் பருவம் பிஎம்எஃப்பிவை திட்டத்தில் அறிவிக்கப்பட்டுள்ளதா என வேளாண் அலுவலகம், வங்கி அல்லது அதிகாரப்பூர்வத் தளத்தில் சரிபார்த்து பதிவுக் கடைசி நாளை உறுதிசெய்யவும்.',
   'விண்ணப்பம் மற்றும் காப்பீட்டுக் கட்டண ரசீதை வைத்திருங்கள். திட்டத்தில் உள்ள பயிர் இழப்பை நிர்ணயிக்கப்பட்ட காலத்திற்குள் அதிகாரப்பூர்வ முறையில் தெரிவிக்கவும்; எல்லா இழப்புக்கும் தானாகப் பணம் கிடைக்காது.']],
 ['Crop insurance can cover specified natural/climatic risks for insured, notified crops and areas. Premiums, exclusions, loss assessment and claim procedures depend on the applicable notification.',
  'फसल बीमा बीमित, अधिसूचित फसलों और क्षेत्रों के लिए निर्धारित प्राकृतिक/मौसमी जोखिमों को कवर कर सकता है। प्रीमियम, अपवाद, हानि मूल्यांकन और दावा प्रक्रिया संबंधित अधिसूचना पर निर्भर हैं।',
  'காப்பீடு செய்யப்பட்ட, அறிவிக்கப்பட்ட பயிர்கள் மற்றும் பகுதிகளுக்கு குறிப்பிட்ட இயற்கை/வானிலை அபாயங்களைக் காப்பீடு ஈடுசெய்யலாம். கட்டணம், விலக்குகள், இழப்பு மதிப்பீடு மற்றும் கோரிக்கை நடைமுறை உரிய அறிவிப்பைப் பொறுத்தது.'],
 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2304549&lang=1&reg=48'),
scheme('pmjjby-life-insurance', 'Financial Aid',
 ['PMJJBY — renewable life insurance', 'पीएमजेजेबीवाई — नवीकरणीय जीवन बीमा', 'பிஎம்ஜேஜேபிவை — புதுப்பிக்கத்தக்க ஆயுள் காப்பீடு'],
 [['Ask a participating bank or post office about PMJJBY enrolment, current premium, renewal, nominee and claim conditions. It is insurance, not a general cash grant.',
   'The cited scheme information describes joining through one eligible savings account for people aged 18–50. Confirm current terms with the provider before consenting to premium debit.'],
  ['पीएमजेजेबीवाई के नामांकन, वर्तमान प्रीमियम, नवीनीकरण, नामित व्यक्ति और दावा शर्तों के बारे में सहभागी बैंक या डाकघर से पूछें। यह बीमा है, सामान्य नकद अनुदान नहीं।',
   'उद्धृत योजना जानकारी में 18–50 वर्ष के लोगों के लिए एक पात्र बचत खाते से जुड़ने का प्रावधान है। प्रीमियम कटौती की सहमति देने से पहले प्रदाता से वर्तमान नियम जाँचें।'],
  ['பிஎம்ஜேஜேபிவை பதிவு, தற்போதைய கட்டணம், புதுப்பித்தல், நியமனப் பயனாளர் மற்றும் கோரிக்கை விதிகள் குறித்து பங்கேற்கும் வங்கி அல்லது அஞ்சலகத்திடம் கேளுங்கள். இது காப்பீடு; பொதுப் பண உதவி அல்ல.',
   'குறிப்பிடப்பட்ட திட்ட விவரம் 18–50 வயதினருக்கு தகுதியுள்ள ஒரு சேமிப்புக் கணக்கு மூலம் சேர்வதைக் குறிப்பிடுகிறது. கட்டணம் பிடித்தம் செய்ய ஒப்புதல் தருமுன் வழங்குநரிடம் தற்போதைய விதிகளை உறுதிசெய்யவும்.']],
 ['A one-year renewable life-insurance scheme with provider-administered cover and claim rules. Keep the policy details and ensure your nominee knows the official claim route.',
  'यह प्रदाता द्वारा संचालित कवर और दावा नियमों वाला एक वर्ष का नवीकरणीय जीवन बीमा है। पॉलिसी की जानकारी रखें और नामित व्यक्ति को आधिकारिक दावा प्रक्रिया बताएँ।',
  'வழங்குநரின் காப்பு மற்றும் கோரிக்கை விதிகளுடன் ஓராண்டுக்கு புதுப்பிக்கத்தக்க ஆயுள் காப்பீடு. பாலிசி விவரங்களைப் பாதுகாத்து நியமனப் பயனாளருக்கு அதிகாரப்பூர்வ கோரிக்கை வழியைத் தெரிவிக்கவும்.'],
 'https://www.indiapost.gov.in/insurance-services/pmjjby')
]
# Correct a transcription character before writing the authored Hindi text.
extra[1]['translations']['hi']['help']['schemes'][0]['description'] = extra[1]['translations']['hi']['help']['schemes'][0]['description'].replace('அधिसूचित', 'अधिसूचित')
with (ROOT / 'datasets/real-data/raw/government-schemes/government_schemes_unverified.csv').open(encoding='utf-8-sig', newline='') as stream:
    discovery = {row['slug']: (index, row) for index, row in enumerate(csv.DictReader(stream), 2)}
for record, slug in zip(extra, ['pmuy2', 'pmv', 'nmmss', 'sadppfaa', 'pmfby', 'pmjjby']):
    if slug in discovery:
        index, row = discovery[slug]
        record['sourceDetails'].append({'title': 'myScheme — source collection reference', 'url': row['official_url'],
            'rawFile': 'datasets/real-data/raw/government-schemes/government_schemes_unverified.csv',
            'locator': f'CSV record {index}; eligibility checked against the primary source, not parsed columns'})
        for target in [record, record['translations']['hi'], record['translations']['ta']]:
            if row['official_url'] not in target['help']['sources']:
                target['help']['sources'].append(row['official_url'])
save(DATA / 'expanded-guidance.json', extra)

# Community-awareness material is separate from emergency actions and clinical diagnosis.
medical_path = DATA / 'medical-common.json'
medical = json.loads(medical_path.read_text(encoding='utf-8'))
mental = next(row for row in medical if row['id'] == 'medical-emergency/mental-health-crisis')
awareness = [
 ['Listen calmly and without judgement. Avoid blame or labelling a person with a diagnosis; a qualified professional should assess persistent symptoms.',
  'For ongoing stress or distress, ask a local health worker or primary health centre about assessment and continuing support. Keep medicines under the prescriber’s supervision.'],
 ['शांत रहकर और बिना निर्णय सुनाए बात सुनें। दोष न दें और व्यक्ति को किसी रोग का नाम देकर न पुकारें; लगातार लक्षणों का मूल्यांकन योग्य विशेषज्ञ करे।',
  'लगातार तनाव या परेशानी के लिए स्थानीय स्वास्थ्य कार्यकर्ता या प्राथमिक स्वास्थ्य केंद्र से मूल्यांकन और निरंतर सहायता के बारे में पूछें। दवाएँ चिकित्सक की देखरेख में लें।'],
 ['அமைதியாகவும் குற்றம் சாட்டாமலும் கேளுங்கள். ஒருவரை நோய்ப் பெயரால் அடையாளப்படுத்த வேண்டாம்; தொடர்ந்து இருக்கும் அறிகுறிகளைத் தகுதியுள்ள நிபுணர் மதிப்பிட வேண்டும்.',
  'தொடர்ந்த மன அழுத்தம் அல்லது துயரத்துக்கு மதிப்பீடு மற்றும் தொடர் உதவி பற்றி உள்ளூர் சுகாதாரப் பணியாளர் அல்லது ஆரம்ப சுகாதார நிலையத்திடம் கேளுங்கள். மருத்துவர் மேற்பார்வையில் மருந்துகளைப் பயன்படுத்தவும்.']]
for lang, items in zip(['en', 'hi', 'ta'], awareness):
    target = mental if lang == 'en' else mental['translations'][lang]
    target['help']['awareness'] = items
url = 'https://nhsrcindia.org/sites/default/files/2021-12/MNS%20Care%20Training%20Manual%20for%20ASHA.pdf'
for target in [mental, mental['translations']['hi'], mental['translations']['ta']]:
    if url not in target['help']['sources']: target['help']['sources'].append(url)
mental['sourceDetails'] = [s for s in mental['sourceDetails'] if s['url'] != url] + [{
    'title': 'MoHFW/NHSRC — mental health care and community support for ASHA', 'url': url,
    'rawFile': 'datasets/real-data/raw/medical-emergency/mental_health_asha.pdf',
    'locator': 'Chapters on mental health promotion, first aid and service referral; PDF pages 46–50 on the care team and assessment', 'reviewedOn': DATE}]
save(medical_path, medical)

emergency_path = DATA / 'emergency-cyber.json'
emergency = json.loads(emergency_path.read_text(encoding='utf-8'))
disaster = next(row for row in emergency if row['id'] == 'emergency-helplines/disaster-safety')
awareness = [
 ['Prepare an emergency kit with drinking water, essential medicines, a torch and copies of important documents. Follow official warnings and evacuation instructions.',
  'Before a cyclone or flood, identify a safe shelter and help children, older people and people who need assistance plan how to reach it. Do not return until authorities say it is safe.'],
 ['पीने के पानी, ज़रूरी दवाओं, टॉर्च और महत्वपूर्ण दस्तावेज़ों की प्रतियों वाला आपातकालीन किट तैयार रखें। आधिकारिक चेतावनियों और निकासी निर्देशों का पालन करें।',
  'चक्रवात या बाढ़ से पहले सुरक्षित आश्रय पहचानें और बच्चों, बुज़ुर्गों तथा सहायता की ज़रूरत वाले लोगों के वहाँ पहुँचने की योजना बनाएँ। प्रशासन के सुरक्षित बताने तक वापस न जाएँ।'],
 ['குடிநீர், அத்தியாவசிய மருந்துகள், மின்விளக்கு மற்றும் முக்கிய ஆவண நகல்களுடன் அவசரத் தொகுப்பைத் தயார்செய்யவும். அதிகாரப்பூர்வ எச்சரிக்கைகளையும் வெளியேற்ற வழிமுறைகளையும் பின்பற்றவும்.',
  'புயல் அல்லது வெள்ளத்துக்கு முன் பாதுகாப்பு மையத்தை அறிந்து, குழந்தைகள், முதியவர்கள் மற்றும் உதவி தேவைப்படுவோர் அங்கு செல்வதற்குத் திட்டமிடவும். பாதுகாப்பானது என அதிகாரிகள் தெரிவிக்கும் வரை திரும்ப வேண்டாம்.']]
for lang, items in zip(['en', 'hi', 'ta'], awareness):
    target = disaster if lang == 'en' else disaster['translations'][lang]
    target['help']['awareness'] = items
for lang, url in [('hi', 'https://nidm.mha.gov.in/PDF/IEC/DOS_H_24.pdf'), ('ta', 'https://nidm.mha.gov.in/PDF/IEC/DosDont/Tamil.pdf')]:
    for target in [disaster, disaster['translations']['hi'], disaster['translations']['ta']]:
        if url not in target['help']['sources']: target['help']['sources'].append(url)
    if not any(source['url'] == url for source in disaster['sourceDetails']):
        disaster['sourceDetails'].append({'title': 'NIDM — disaster awareness (' + ('Hindi' if lang == 'hi' else 'Tamil') + ')',
            'url': url, 'rawFile': f'datasets/real-data/raw/emergency-helplines/disaster_awareness_{lang}.pdf',
            'locator': 'PDF pages 4–5: earthquake/flood preparedness and precautions, visually checked', 'reviewedOn': DATE,
            'extractionNote': 'Selected pages visually checked; full text OCR not claimed.'})
save(emergency_path, emergency)
print(f'Added {len(extra)} trilingual scheme summaries; expanded mental-health and disaster awareness.')
