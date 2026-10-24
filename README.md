# Bharat Help

Bharat Help helps people find government schemes, emergency contacts, rights and support services without having to search several websites. It is aimed at people in villages and remote areas who may not know the official name of the help they need.

Users choose a category and clues related to their situation, or describe the problem using voice search. The app shows matching guidance, contacts and source links. The Dumb Charades idea comes from finding the right assistance through clues.

## Features

- Seven categories: women support, child support, medical emergencies, cybercrime, government schemes, emergency helplines and common health issues.
- English, Tamil and Hindi interface and curated help results.
- Voice search with editable text and suggested clues.
- Listen and Stop buttons for reading results aloud.
- Hospital and One Stop Centre searches by state and district.
- Scheme browsing with source links and application information.

The frontend uses React and Vite. The backend uses Node.js and Express. They are connected through a REST-style API. Data is stored in JSON files; there is no database at the moment.

## Run locally

Install Node.js and npm first. The project was tested with Node.js 24.

Open a terminal in the project folder and install the dependencies:

```powershell
npm --prefix frontend install
npm --prefix backend install
```

Start the backend:

```powershell
npm run dev:api
```

Open a second terminal in the same project folder and start the frontend:

```powershell
npm run dev
```

Open the address shown in the terminal, usually http://localhost:5173. Keep both terminals running. Use Ctrl+C in each terminal to stop the servers.

The backend runs on port 3001. Vite forwards `/api` requests to it. Restart the backend after changing its JSON data files.

## Using the app

1. Choose a language and category.
2. Select the clues that describe the situation, then click **Find Help**.
3. Read the guidance, check the official sources or use **Listen**.
4. For hospital and centre listings, choose a state and district below the results.

For voice search, allow microphone access, speak, review the recognised text and click **Find matching clues**. Confirm the suggested clues before requesting help.

Try: "Someone stole money through UPI" or "My child is missing" from the home page.

Voice input depends on browser support and may need internet access. Audio playback needs a matching voice on the device. If voice input fails, users can type or select clues manually. The browser's recognition provider may process microphone audio; Bharat Help does not store recordings or transcripts.

## Data

The app currently has 53 curated help records, 30,211 hospital listings and 770 One Stop Centre listings. All 4,693 collected scheme rows were processed, with 3,863 available to browse.

Sources include myScheme, government department websites, the OGD Hospital Directory, WCD centre listings and awareness documents. The bulk scheme CSV came from a community dataset based on myScheme. Exact source links and review notes are kept with the records.

- `backend/data/` contains the curated multilingual help records.
- `datasets/real-data/raw/` contains the original downloads.
- `datasets/real-data/processed/` contains cleaned tables, extracted text and verification records.
- `frontend/tests/fixtures/` contains old sample records used only by tests.

The directory listings are not all verified. A small Chennai batch was checked against official webpages, and conflicting centre contacts are flagged. These checks do not confirm phone response, current services or bed availability.

Bulk scheme descriptions are still in English. The interface and curated help records support all three languages. Health and medicine information still needs qualified medical review.

## Checks

Run these from the project folder:

```powershell
npm test
npm run test:api
npm run lint
npm run build
```

The last code checks passed 78 frontend tests and 34 backend tests. Voice input and playback should also be checked in the browser being used.

## Remaining work

Verify more contacts and scheme details, resolve duplicate listings, translate selected scheme content into Tamil and Hindi, and finish extracting text from the scanned awareness documents. Testing with intended rural users is also pending.
