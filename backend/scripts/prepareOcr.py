"""Render image-based English source pages for Windows' installed English OCR."""
import json
from pathlib import Path
import pypdfium2 as pdfium

root = Path(__file__).resolve().parents[2]
out = root / 'datasets/real-data/processed'
images = out / 'ocr-pages'
images.mkdir(exist_ok=True)
manifest = []
for path in sorted((out / 'documents').glob('*.json')):
    data = json.loads(path.read_text(encoding='utf-8'))
    if 'pages' not in data or path.stem.endswith(('_hi', '_ta')):
        continue
    pending = [page for page in data['pages'] if page['method'] == 'image-needs-ocr']
    if not pending:
        continue
    pdf = pdfium.PdfDocument(str(root / data['sourceFile']))
    for page in pending:
        bitmap = pdf[page['page'] - 1].render(scale=1.7)
        image_path = images / f'{path.stem}__{page["page"]}.png'
        bitmap.to_pil().save(image_path)
        manifest.append({'image': str(image_path), 'document': str(path), 'page': page['page']})
    pdf.close()
(out / 'ocr-manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
print(f'{len(manifest)} English pages rendered for OCR; Hindi/Tamil image pages require a matching OCR engine or manual review.')
