import json
from pathlib import Path
root = Path(__file__).resolve().parents[2]
out = root / 'datasets/real-data/processed'
rows = json.loads((out / 'ocr-results.json').read_text(encoding='utf-8-sig'))
for row in rows:
    path = Path(row['document'])
    document = json.loads(path.read_text(encoding='utf-8'))
    page = document['pages'][row['page'] - 1]
    if row['text'].strip():
        page.update(text=row['text'], method='windows-ocr-en', reviewStatus='machine-extracted; check original before quoting')
    else:
        page['method'] = 'no-text-detected'
    path.write_text(json.dumps(document, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
report = json.loads((out / 'processing-report.json').read_text(encoding='utf-8'))
for item in report['documents']:
    document = json.loads((out / 'documents' / (Path(item['sourceFile']).stem + '.json')).read_text(encoding='utf-8'))
    item['ocrPages'] = [p['page'] for p in document['pages'] if p['method'] == 'windows-ocr-en']
    item['needsOcrPages'] = [p['page'] for p in document['pages'] if p['method'] == 'image-needs-ocr']
report['ocr'] = {'engine': 'Windows OCR en-US', 'pagesAttempted': len(rows),
    'limitation': 'Hindi/Tamil image-only pages retained in original PDFs; installed Windows OCR supports only English. Do not describe these as fully transcribed.',
    'pendingImagePages': sum(len(item['needsOcrPages']) for item in report['documents'])}
(out / 'processing-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Merged OCR for {len(rows)} pages. Remaining image-language extraction is explicitly tracked.')
