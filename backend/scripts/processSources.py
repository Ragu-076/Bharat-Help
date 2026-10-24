"""Reproducible source normalization. Never edits the downloaded originals."""
import csv
import hashlib
import html
import json
import re
import sys
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
from openpyxl import load_workbook
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'datasets/real-data/raw'
OUT = ROOT / 'datasets/real-data/processed'
DATE = '2026-10-24'
REPORT = {'processedOn': DATE, 'tables': {}, 'documents': [], 'issues': [], 'rawHashes': {}}


def clean(value):
    if value is None:
        return ''
    value = html.unescape(str(value)).replace('\x00', '')
    value = re.sub(r'<[^>]*>', ' ', value)
    value = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', value)
    value = re.sub(r'\*\*|__|`', '', value)
    value = re.sub(r'(?m)^\s*[>#]+\s*', '', value)
    value = re.sub(r'\s+', ' ', value).strip()
    return '' if value.lower() in {'0', 'null', 'none', 'nan', 'n/a', 'na', '-', '--', 'nil'} else value


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')


def safe_url(value, government=False):
    # URL paths and fragments must not pass through Markdown/text normalization.
    value = html.unescape(str(value or '')).strip().replace('\x00', '')
    if re.search(r'\s', value):
        return ''
    try:
        url = urlparse(value)
        host = (url.hostname or '').lower()
        if url.scheme not in {'http', 'https'} or not host or url.username or url.password:
            return ''
        if government and not (host.endswith('.gov.in') or host.endswith('.nic.in') or host == 'myscheme.gov.in'):
            return ''
        return value
    except ValueError:
        return ''


def phones(value):
    # Do not invent an STD code, merge alternatives or reuse nodal-person details.
    found = []
    for part in re.split(r'[,;/\n]|\bor\b', str(value or ''), flags=re.I):
        part = part.strip().strip('. ')
        if not re.fullmatch(r'[+\d\s()\-]+', part):
            continue
        digits = re.sub(r'\D', '', part)
        if 7 <= len(digits) <= 13 and len(set(digits)) > 1:
            number = ('+' if part.startswith('+') else '') + digits
            if number not in found:
                found.append(number)
    return found


ALIASES = {'Orissa': 'Odisha', 'Uttaranchal': 'Uttarakhand', 'Pondicherry': 'Puducherry',
           'NCT of Delhi': 'Delhi', 'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
           'Andaman and Nicobar Islands (UT)': 'Andaman and Nicobar Islands'}


def state_name(value):
    value = re.sub(r'\s*\(\d+\)\s*$', '', clean(value)).strip()
    value = re.sub(r'\s*\(UT\)\s*$', '', value, flags=re.I).strip()
    value = re.sub(r'\s*&\s*', ' and ', value)
    return ALIASES.get(value, value)


def district_name(state, value, centre=False):
    value = clean(value)
    if centre:
        value = re.sub(r'\s*[-–]\s*(?:I{1,3}|IV|[AB])\s*$', '', value, flags=re.I).strip()
    if state == 'Tamil Nadu':
        aliases = {'kancheepuram': 'Kanchipuram', 'kanyakumari': 'Kanniyakumari', 'dindugul': 'Dindigul',
            'puddukottai': 'Pudukkottai', 'ramanathapuram': 'Ramanathapuram', 'nilgiris': 'The Nilgiris',
            'sivagangai': 'Sivaganga', 'thoothukudi': 'Thoothukudi', 'tuticorin': 'Thoothukudi',
            'tenakasi': 'Tenkasi', 'thirunelveli': 'Tirunelveli', 'thiruvallur': 'Tiruvallur',
            'thiruvannamalai': 'Tiruvannamalai', 'tiruchirapally': 'Tiruchirappalli', 'trichy': 'Tiruchirappalli'}
        value = aliases.get(re.sub(r'\s+', '', value).lower(), value)
    return value


def key(value):
    return re.sub(r'[^\w]+', '', value.casefold())


def hospitals():
    path = RAW / 'medical-emergency/national_hospital_directory.csv'
    records, seen, rejected, duplicates = [], {}, [], []
    with path.open(encoding='utf-8-sig', newline='') as stream:
        source = list(csv.DictReader(stream))
    known_states = {state_name(row['State']) for row in source}
    known_states.discard('North Twenty Four Parganas')  # A district was put in the State column.
    for line, row in enumerate(source, 2):
        name, state = clean(row['Hospital_Name']), state_name(row['State'])
        district = district_name(state, row['District'])
        if not name or not state or not district or state not in known_states:
            rejected.append({'row': line, 'reason': 'Missing or invalid name/state/district', 'name': name, 'state': state, 'district': district})
            continue
        address = clean(row['Address_Original_First_Line']) or clean(row['Location'])
        address_key = address or '|'.join(filter(None, [clean(row['Subdistrict']), clean(row['Town']), clean(row['Village'])])) or f'source-row-{line}'
        ident = (key(name), key(state), key(district), key(address_key))
        if ident in seen:
            duplicates.append({'row': line, 'duplicateOf': seen[ident]})
            continue
        ident_hash = hashlib.sha256('|'.join(ident).encode()).hexdigest()[:16]
        seen[ident] = line
        records.append({'id': f'hospital-{ident_hash}', 'type': 'hospitals', 'name': name, 'state': state,
                        'district': district, 'address': address, 'pincode': clean(row['Pincode']),
                        'phones': phones(row['Telephone']), 'website': safe_url(row['Website']),
                        'sourceRows': [line], 'verificationStatus': 'source-listing-unconfirmed'})
    report = {'sourceRows': len(source), 'accepted': len(records), 'duplicateRows': duplicates, 'rejectedRows': rejected}
    REPORT['tables']['hospitals'] = report
    dump(OUT / 'hospitals.json', {'sourceFile': path.relative_to(ROOT).as_posix(), 'sourceUrl': 'https://www.data.gov.in/catalog/hospital-directory-national-health-portal',
         'processedOn': DATE, 'sourceUpdatedOn': None, 'records': records})


def centres():
    path = RAW / 'woman-support/one_stop_centres.xlsx'
    book = load_workbook(path, read_only=True, data_only=True)
    rows = list(book.active.values)
    records, seen, rejected, duplicates, state = [], set(), [], [], ''
    for line, row in enumerate(rows[1:], 2):
        if row[1]:
            state = state_name(row[1])
        source_district, address = clean(row[2]), clean(row[3])
        district = district_name(state, source_district, centre=True)
        if not state or not district or not address:
            rejected.append({'row': line, 'reason': 'Missing state/district/address'})
            continue
        ident = (key(state), key(district), key(address))
        if ident in seen:
            duplicates.append({'row': line, 'reason': 'Duplicate state/district/address'})
            continue
        seen.add(ident)
        ident_hash = hashlib.sha256('|'.join(ident).encode()).hexdigest()[:16]
        records.append({'id': f'osc-{ident_hash}', 'type': 'centres', 'name': f'One Stop Centre — {source_district}',
                        'state': state, 'district': district, 'sourceDistrict': source_district, 'address': address, 'pincode': '',
                        'phones': phones(row[4]), 'website': '', 'sourceRows': [line],
                        'verificationStatus': 'source-listing-unconfirmed'})
    book.close()
    REPORT['tables']['centres'] = {'sourceRows': len(rows) - 1, 'accepted': len(records), 'duplicateRows': duplicates, 'rejectedRows': rejected}
    dump(OUT / 'one-stop-centres.json', {'sourceFile': path.relative_to(ROOT).as_posix(),
         'sourceUrl': 'https://www.wcd.gov.in/women/one-stop-centre-header', 'processedOn': DATE, 'sourceUpdatedOn': None, 'records': records})


def schemes():
    path = RAW / 'government-schemes/government_schemes_unverified.csv'
    with path.open(encoding='utf-8-sig', newline='') as stream:
        rows = list(csv.DictReader(stream))
    records, seen, duplicate, rejected = [], {}, [], []
    topic_words = {'Health Insurance': ['health', 'medical'], 'Education': ['education', 'learning'],
                   'Housing': ['housing', 'shelter'], 'Employment': ['skills', 'employment', 'entrepreneurship'],
                   'Agriculture': ['agriculture', 'rural', 'environment'], 'Pension': ['pension', 'old age'],
                   'Disability Support': ['disabil', 'differently abled', 'divyang', 'specially-abled'],
                   'Financial Aid': ['banking', 'financial', 'social welfare', 'empowerment']}
    for line, row in enumerate(rows, 2):
        name, slug = clean(row['name']), clean(row['slug'])
        official = safe_url(row['official_url'], government=True)
        if not name or not slug or not official or urlparse(official).hostname not in {'myscheme.gov.in', 'www.myscheme.gov.in'}:
            rejected.append({'row': line, 'reason': 'Missing title/slug or valid official myScheme URL'})
            continue
        if official in seen:
            duplicate.append({'row': line, 'duplicateOf': seen[official]})
            continue
        seen[official] = line
        category, beneficiary = clean(row['category']), clean(row['beneficiary_type'])
        haystack = f'{name} {category}'.casefold()
        topics = [topic for topic, words in topic_words.items() if any(word in haystack for word in words)]
        institutional = bool(re.search(r'university|institution|industries|registered societ|business entity', beneficiary, re.I)) and not re.search(r'individual|family|self help', beneficiary, re.I)
        stale = bool(re.search(r'mahatma gandhi national rural employment guarantee|\bmgnrega\b|mahila samman savings certificate|amma two wheeler', name, re.I))
        records.append({'id': f'scheme-{hashlib.sha256(official.encode()).hexdigest()[:16]}', 'slug': slug,
                        'name': name, 'state': state_name(row['state']), 'category': category,
                        'topics': topics, 'beneficiaryType': beneficiary, 'description': clean(row['description']),
                        'benefits': clean(row['benefits']), 'eligibility': clean(row['eligibility_text']),
                        'application': clean(row['application_process']), 'documents': clean(row['documents_required']),
                        'officialUrl': official, 'applicationUrl': safe_url(row['apply_url'], government=True),
                        'collectedAt': clean(row['scraped_at']), 'sourceRows': [line],
                        'verificationStatus': 'third-party-snapshot-unconfirmed',
                        'reviewReasons': (['institution-focused'] if institutional else []) + (['potentially-outdated'] if stale else []),
                        'browseable': bool(topics and not institutional and not stale)})
    REPORT['tables']['schemes'] = {'sourceRows': len(rows), 'accepted': len(records),
        'publicDiscoveryLinks': sum(r['browseable'] for r in records), 'duplicateRows': duplicate, 'rejectedRows': rejected,
        'excludedParsedEligibilityColumns': [k for k in rows[0] if k.startswith('eligibility_') and k != 'eligibility_text']}
    dump(OUT / 'schemes-normalized.json', {'sourceFile': path.relative_to(ROOT).as_posix(),
         'sourceUrl': 'https://huggingface.co/datasets/smartduketech/indian-government-schemes-2025',
         'processedOn': DATE, 'records': records})


def documents():
    for path in sorted(RAW.rglob('*')):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        REPORT['rawHashes'][rel] = hashlib.sha256(path.read_bytes()).hexdigest()
        if path.suffix.lower() == '.pdf':
            reader = PdfReader(path)
            pages = []
            for index, page in enumerate(reader.pages):
                text = page.extract_text() or ''
                pages.append({'page': index + 1, 'text': text, 'method': 'pdf-text' if len(text.strip()) >= 80 else 'image-needs-ocr'})
            dump(OUT / 'documents' / f'{path.stem}.json', {'sourceFile': rel, 'processedOn': DATE, 'pages': pages})
            REPORT['documents'].append({'sourceFile': rel, 'pages': len(pages),
                'textPages': sum(p['method'] == 'pdf-text' for p in pages),
                'needsOcrPages': [p['page'] for p in pages if p['method'] == 'image-needs-ocr']})
        elif path.suffix.lower() == '.txt':
            dump(OUT / 'documents' / f'{path.stem}.json', {'sourceFile': rel, 'processedOn': DATE,
                'text': path.read_text(encoding='utf-8-sig'), 'kind': 'curated-reference-summary'})


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    hospitals()
    centres()
    schemes()
    if '--tables-only' in sys.argv:
        previous = json.loads((OUT / 'processing-report.json').read_text(encoding='utf-8'))
        previous['tables'] = REPORT['tables']
        REPORT = previous
    else:
        documents()
    dump(OUT / 'processing-report.json', REPORT)
    print(json.dumps({'tables': {k: {x: v[x] for x in ['sourceRows', 'accepted']} for k, v in REPORT['tables'].items()},
                      'pdfs': len(REPORT['documents']), 'rawFiles': len(REPORT['rawHashes'])}))
