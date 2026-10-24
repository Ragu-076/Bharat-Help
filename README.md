# Bharat Help

Bharat Help is a local assistance-discovery prototype for people who may not know which government scheme, emergency contact, right or support service applies to their situation. Users select familiar categories and situation clues, or use voice search to obtain clue suggestions, then receive related guidance and official source links.

The **Dumb Charades-inspired** idea is discovery through clues. The current implementation uses words and predefined matching rules; it does not recognise gestures or use a generative AI model to produce advice.

This README consolidates the frontend, backend, source-data, pilot-verification and test-fixture documentation. Status recorded on **24 October 2026**.

## Features and current scope

- Seven categories: Women Support, Child Support, Medical Emergency, Cyber Crime, Government Schemes, Emergency Helplines and Common Health Issues.
- Fifty selectable clues and 53 curated assistance records served by the backend API.
- English, Tamil and Hindi interface and curated guidance, with a saved language preference.
- Manual clue selection, editable voice-search text and reviewable category/clue suggestions.
- Structured actions, contacts, rights, schemes, source links, source-check dates and geographic coverage.
- Listen/Stop controls for available browser voices; health narration includes precautions and escalation information.
- Hospital and One Stop Centre browsing by state, district and optional name/keyword, below the corresponding results.
- Additional scheme browsing, with state and keyword filters and ten entries per page.
- Request cancellation, 15-second timeouts, validation, loading states and retry screens. API failures are not hidden by mock-result fallbacks.

The frontend and API are connected. Records use local JSON storage; no database or automatic external feed is configured. Deployment is outside the current project scope.

## Install and run

Use a Node.js version compatible with the installed Vite version. This project was tested with Node.js 24 and npm.

From `C:\Bharat-Help`, install both sets of dependencies:

```powershell
npm --prefix frontend install
npm --prefix backend install
```

Start the API in one terminal from the project root:

```powershell
npm run dev:api
```

Start the frontend in a second terminal from the project root:

```powershell
npm run dev
```

Open the address printed by Vite, normally **http://localhost:5173**. The API normally runs at **http://127.0.0.1:3001**. Vite forwards `/api` requests to that API. Both terminals must remain running; use **Ctrl+C** in each to stop them. The project has no automatic computer-startup configuration.

The API accepts `HOST` and `PORT` environment variables, defaulting to `127.0.0.1` and `3001`. If its address changes, update the target in `frontend/vite.config.js` and restart Vite. Frontend development and preview both use that proxy.

For a local preview of the frontend build:

```powershell
npm run build
npm start
```

Keep the API running separately. Vite preview normally opens at **http://localhost:4173**; it does not start Express. Restart the API after editing any runtime JSON record, processed resource table or pilot-verification overlay. The development watcher tracks JavaScript imports, not JSON files loaded through file reads.

## Using the application

1. Select a language, then an assistance category and relevant clues.
2. Choose **Find Help** to request related API results. Match counts indicate relevance to selected clues, not urgency. Review coverage, sources and any unmatched clues.
3. Select **Listen** to read a curated result in the chosen language. **Stop** ends playback. Starting another reading, changing language or leaving the results stops the previous narration.
4. For hospital/centre listings, choose a state and district below the guidance, optionally enter a name, then search. Scheme searches include national schemes alongside the selected state's entries; inclusion does not establish eligibility.

### Voice search

Choose English, Tamil or Hindi before starting voice search. Allow microphone access in the browser, speak a short situation, review/edit the recognised text, select **Find matching clues**, and review the suggestion. Use **Continue with these clues**, check the selections and choose **Find Help**. Suggestions inside a category are restricted to that category.

Examples for English voice search on the home page:

- `Someone stole money through UPI` -> Cyber Crime / UPI / Banking Fraud.
- `My child is missing` -> Child Support / Missing Child.
- `I need an ambulance` -> Emergency Helplines / Ambulance.

The phrase vocabulary is finite. Unrecognised phrases can be reworded or typed; manual category/clue buttons remain available. **Stop recording** requests final recognition, while **Cancel recording** discards it. Changing language or leaving the page cancels the session and clears its words.

Speech recognition uses the browser's speech service with `en-IN`, `ta-IN` or `hi-IN`. Availability varies by browser/device and may require internet access. Use the external browser where recognition has been tested; embedded IDE browsers may not expose the required service. Recognition failures do not prevent manual input.

### Audio availability and privacy

Read-aloud uses browser speech synthesis and existing text. It does not use the microphone or an external translation endpoint. Tamil/Hindi Listen can be unavailable when the browser exposes no matching voice. Enable/install a suitable system voice, restart the browser and select **Check voices again**. The app also refreshes the voice list when language changes or the window regains focus. Some voices need a network connection; actual pronunciation and playback require device testing.

Installing a keyboard/display language alone does not guarantee a speech voice. Windows voice setup is described in [Microsoft's supported languages and voices guidance](https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-a-supported-languages-and-voices). Speech-input support is separate from installed read-aloud voices.

The browser may send microphone audio to its recognition provider. Bharat Help does not store or log voice recordings or transcripts. Only the confirmed category, canonical clue keys and response language are sent to `/api/help`. Applications and complaints are handled on the linked official services; this prototype does not collect applicant, complainant or patient case records.

## Application structure and request flow

```text
frontend/src/data/categoryCatalog.js  Category and canonical clue catalogue
frontend/src/components/             Interface, results and source explorer
frontend/src/services/               Validated API adapters
frontend/src/translations/           Interface and compatibility text mappings
frontend/src/utils/                  Voice-search matching and speech helpers
frontend/tests/                     Frontend tests and legacy fixtures
backend/src/                        Express routes, matching, localization and stores
backend/data/                       Curated multilingual assistance records
backend/tests/                      API, matching, provenance and integration checks
backend/scripts/                    Source processing and optional OCR helpers
datasets/real-data/raw/              Original collected documents and tables
datasets/real-data/processed/        Normalized records, extraction and review evidence
```

Voice input becomes editable text and clue suggestions in the frontend. Confirmed manual or voice selections use the same API flow: the frontend sends canonical selections, the backend matches curated records and localizes display fields, and the frontend validates and presents the response. No raw voice transcript is needed for backend matching.

The backend shares the category catalogue and translation utilities in `frontend/src`; keep both folders together. Assistance results come from `backend/data`, not the old frontend sample records. Historical `helpData.js`, `commonHealthData.js` and `legacyTamilResults.js` are retained only under `frontend/tests/fixtures`. Text-only compatibility mappings remain under `frontend/src/translations`. Test fixtures are not runtime assistance or fallback data.

## API reference

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Status, data source, catalogue version, curated count and resource counts |
| POST | `/api/help` | Match a category and canonical clue selections; return localized guidance |
| GET | `/api/resources/options` | Available state/district/topic filters and localized source notice |
| GET | `/api/resources` | Search collected listings, ten per page |

Example `/api/help` body, sent with `Content-Type: application/json`:

```json
{
  "categoryId": "cyber-crime",
  "clues": ["UPI / Banking Fraud"],
  "language": "en"
}
```

Language codes are `en`, `hi` and `ta`; omission defaults to English. Unsupported values, including `null`, are rejected. The API returns a `Content-Language` header. IDs, canonical clue keys, contact numbers and source URLs remain unchanged by localization. Selected, matched and unmatched display labels use the response language. Results include source metadata, `reviewedOn` and localized coverage.

The help route validates the JSON object, category and clue array and limits JSON bodies to 10 KB. Invalid requests return JSON errors. Empty and uncovered selections are valid responses with appropriate coverage information. The frontend cancels obsolete requests when selections/language change and shows a retry state for network, HTTP or invalid-payload failures.

Resource query fields are `type=hospitals|centres|schemes`, `language`, `state`, `district`, `topic`, `q` and `page`. Hospital and centre searches require a known state and district. `topic` is used for scheme categories; the UI can supply it from the selected assistance clue. Scheme responses contain narrative eligibility, not automated approval decisions.

Example URLs:

```text
/api/resources/options?type=hospitals&state=Tamil%20Nadu&language=en
/api/resources?type=hospitals&state=Tamil%20Nadu&district=Chennai&q=Government%20General&page=1&language=en
/api/resources?type=schemes&state=Tamil%20Nadu&topic=Education&page=1&language=ta
```

## Data, sources and processing

### Curated guidance

| File in `backend/data` | Scope | Records |
| --- | --- | ---: |
| `emergency-cyber.json` | Emergency referrals, disaster awareness and cyber reporting/safety | 13 |
| `women-child.json` | Women support and child protection/referrals | 12 |
| `government-schemes.json` | Selected national schemes and Tamil Nadu health insurance | 10 |
| `medical-common.json` | Emergency referral and general adult common-health information | 12 |
| `expanded-guidance.json` | Additional source-checked scheme summaries | 6 |
| **Total** | **All seven categories and 50 clues** | **53** |

Curated records include stable IDs, canonical keywords, English/Hindi/Tamil guidance, source URLs, source-check dates and geographic scope. Where applicable, source metadata identifies original files, rows or document sections. Coverage is limited to the defined situations; it is not a complete catalogue of Indian services or medical/legal cases. Broad scheme clues may return several relevant options without establishing individual eligibility.

### Bulk imports and extracted documents

| Source/output | Processing and public scope |
| --- | --- |
| Hospital CSV -> `processed/hospitals.json` | All 30,273 rows accounted for; 30,211 accepted, 60 exact duplicates and two invalid rows recorded separately |
| OSC workbook -> `processed/one-stop-centres.json` | All 770 rows normalized, including filled-down state cells and source district aliases |
| Community scheme CSV -> `processed/schemes-normalized.json` | All 4,693 rows retained; 3,863 relevant discovery entries browsable; 830 institution-oriented, potentially outdated or unmapped entries retained for review |
| 15 PDFs and three text summaries -> `processed/documents/` | Page/text extraction retained; English OCR added for 39 image/low-text pages; 36 scanned Hindi/Tamil disaster pages still need full language-appropriate extraction |

The raw collection has 21 files. `processed/source-inventory.json` records source filenames, sizes, hashes and catalogue information. `processed/processing-report.json` reconciles table rows, duplicates/rejections, raw hashes and extraction/OCR status. `processed/scheme-selection.json` holds initial scheme-selection provenance; additional summaries have evidence in their own curated records. Raw downloads are preserved unchanged, including the existing `raw/woman-support` folder name.

Hospital personal nodal-contact fields are not exposed. OSC listings expose normalized public centre contact fields without staff names or email addresses. Addresses and location names can reflect old boundaries. The app does not infer missing districts, proximity, emergency capability or available beds.

Bulk scheme descriptions, benefits, eligibility, documents and application instructions remain **original English source text**, with explicit source-snapshot notices and an English Listen control. Filter controls and notices support all three languages. Parsed numeric/boolean eligibility columns never decide eligibility. Imported narratives have not all been independently verified or translated.

Original-language disaster PDFs are linked and selected safety pages were visually checked. Full Hindi/Tamil booklet transcription is not claimed. Machine OCR text requires checking against the original. Public safety summaries are not live warnings. Health source checks are not clinical approval, and professional manuals are not automated prescribing instructions.

Principal collection/reference sources include [myScheme](https://www.myscheme.gov.in/), the [OGD Hospital Directory](https://www.data.gov.in/catalog/hospital-directory-national-health-portal), the [WCD One Stop Centre directory](https://www.wcd.gov.in/women/one-stop-centre-header), [Chennai's official hospital directory](https://chennai.nic.in/public-utility-category/hospitals/), [Tamil Nadu Women Helpline](https://www.whl.tnsw.in/sakhi-one-stop-centres.html), NIDM disaster material and NHSRC health references. The [community scheme CSV](https://huggingface.co/datasets/smartduketech/indian-government-schemes-2025) is a discovery snapshot, not an official bulk export. Exact per-record URLs and document locators are retained in the JSON evidence.

### Focused Chennai verification batch

`processed/pilot-verification.json` preserves separate field corrections and evidence for **five hospital locations (14 imported name/address variants)**, all **three Chennai OSC entries**, and **ten curated scheme summaries**. The API applies the hospital/centre corrections as an overlay, preserving the imported originals, and displays the source-check date and translated limitation notice.

- Government General Hospital, Billroth Shenoy Nagar and Dr. Mehta's Chetpet contacts were checked against Chennai's district directory. CSI Kalyani and Apollo Greams Road were checked against their own official pages.
- Fourteen corrected rows do not mean 14 distinct facilities. Same-location variants remain separate pending authoritative reconciliation.
- Chennai OSC official contact lists differ. All three entries retain a contact-conflict notice and advise using Women Helpline 181 for current routing. North Chennai's number was corroborated; central/southern contact differences were not silently replaced. Overlapping Tambaram addresses were not automatically merged.
- Scheme summary checks covered PM-JAY, CMCHIS, PM-USP CSSS, PMAY-G, PMKVY, PM-KISAN, PM-SYM, IGNOAPS, IGNDPS and NFBS. This does not verify every bulk field, current application window, Tamil Nadu pension total or individual entitlement.

This is web-source verification, not telephone response testing or confirmation of current service availability. It does not cover all 550 imported Chennai hospital rows. Source-check dates indicate when information was checked, not a permanent guarantee of accuracy.

## Maintenance and source rebuilding

For a curated-record change: check the exact official source and location, update all three language versions, preserve contacts/URLs and warning meaning, and update `sourceDetails`, locators and `reviewedOn` only after a real source check. Keep publication dates separate. Review native-language wording and obtain qualified medical review where relevant.

Optional processing tools are not needed to run the existing app. Run these from the project root only when intentionally rebuilding data:

```powershell
python backend/scripts/processSources.py --tables-only
```

This requires Python with `openpyxl` and `pypdf`, and an existing processing report. It rebuilds normalized tables while preserving prior document/OCR report data. Omit `--tables-only` to rebuild PDF/text extraction as well; that resets document extraction and requires the OCR merge to be repeated.

The optional English OCR sequence is `prepareOcr.py` (also requires `pypdfium2` and Pillow), the Windows OCR helper `ocrSources.ps1`, then `mergeOcr.py`. It requires suitable installed Windows language engines and file permissions. Do not weaken PowerShell execution policy to run the helper. Matching-language OCR or manual review is still needed for scanned Tamil/Hindi pages.

`expandGuidance.py` regenerates six authored scheme summaries and selected awareness fields; review any curated edits before rerunning it. Pilot corrections stay separate in `pilot-verification.json`. Review them against changed source IDs after re-importing data. Run the checks below and restart the API after updating JSON.

## Checks and validation

From the project root:

```powershell
npm test
npm run test:api
npm run lint
npm run build
```

The last verified implementation passed **78 frontend tests and 34 backend tests (112 total)**, lint and the frontend production build. Coverage includes transport validation, cancellation/retry, routing, localization, clue overlap/negation, voice-search phrases, speech lifecycle, source provenance, table reconciliation, resource pagination and filters. Backend matching checks cover all 1,296 supported clue combinations. API integration tests use a real local HTTP server; some frontend/content/speech tests use controlled fixtures or fake browser engines.

Automated tests do not prove actual microphone recognition, audible playback, source freshness, clinical correctness or usability. Recheck voice input/output in the intended browser/device. Evaluation with intended rural users remains pending.

## Remaining work

- Verify more directory contacts, addresses, services and scheme rules/current application periods.
- Resolve conflicting official contacts and reconcile same-location duplicate variants.
- Translate selected verified bulk scheme content into Tamil and Hindi, with native-speaker review.
- Finish extraction/review of scanned Tamil/Hindi awareness pages.
- Obtain qualified medical review of health and medicine guidance.
- Evaluate result relevance, voice recognition, accessibility and search effort with intended users.

A database can be considered when maintenance requirements justify it. The current local JSON prototype does not need deployment to demonstrate its implemented flow.
