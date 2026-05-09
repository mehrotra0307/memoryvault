# MemoryVault 🧠

> **Search your photos, PDFs, notes, and audio using plain English — no keywords needed.**
>
> Built with Google's **Gemini Embedding 2** — the world's first AI model that understands text, images, audio, PDFs, and video in one unified space.

---

## What is this project?

MemoryVault is a web application where you can:

1. **Upload any file** — a holiday photo, a PDF article, a text note, or an audio clip
2. **Search by typing anything** — `"warm beach vacation"` or `"snowy mountain trek"`
3. **Get results from all file types** — a photo, a PDF, and a text note about the same topic all appear together

The magic: you never tag your files. You never write keywords. The AI understands the *meaning* of your content and matches it to the *meaning* of your search query.

---

## What is Gemini Embedding 2?

Think of it like this: imagine if every photo, PDF, song, and sentence you ever had could be translated into the same secret language — a list of 3,072 numbers that captures its meaning.

- A **beach photo** → becomes numbers like `[-0.026, -0.009, 0.044 ... ×3072]`
- A **text note about a beach holiday** → becomes similar numbers `[-0.024, -0.007, 0.051 ... ×3072]`
- A **mountain photo** → becomes very *different* numbers

Because similar-meaning things get similar numbers, you can search by meaning, not by file name or keyword.

Gemini Embedding 2 (model ID: `gemini-embedding-2`) is Google's model that does this conversion. It is the **first model in the world** that handles text, images, audio, video, and PDFs all in the same number space natively — without any workarounds.

**Official announcement:** https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/

---

## How It Works — Full Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UPLOAD A FILE                                │
│                                                                     │
│  You drag a file       Browser          FastAPI         Gemini API  │
│  onto the website  →  sends file   →  receives   →  converts file  │
│                       (HTTP POST)      file           to 3,072      │
│                                        │              numbers       │
│                                        │                  │         │
│                                        ▼                  ▼         │
│                                  Saves file to    Returns 3,072     │
│                                  uploads/ folder  numbers           │
│                                        │                  │         │
│                                        └──────────────────┘         │
│                                                  │                  │
│                                                  ▼                  │
│                                           ChromaDB stores           │
│                                           numbers + filename         │
│                                           on your laptop            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SEARCH FOR SOMETHING                         │
│                                                                     │
│  You type "beach"      Browser          FastAPI         Gemini API  │
│  and click Search  →  sends text   →  receives   →  converts text  │
│                       (HTTP POST)      query          to 3,072      │
│                                                        numbers       │
│                                                           │          │
│                                                           ▼          │
│                                                     ChromaDB:        │
│                                                  Compare these       │
│                                                  3,072 numbers vs   │
│                                                  ALL stored items   │
│                                                           │          │
│                                                           ▼          │
│                                                  Returns closest    │
│                                                  matches with       │
│                                                  similarity score   │
│                                                           │          │
│                                                           ▼          │
│                                              Browser shows results   │
│                                              (e.g., 68.5% similar)  │
└─────────────────────────────────────────────────────────────────────┘
```

**In simple words:**
- Uploading = converting your file to numbers, storing in local database
- Searching = converting your query to numbers, finding closest stored numbers
- Both conversions go to Gemini API (on Google's servers, very fast)
- The comparison/search happens locally on your machine (ChromaDB)

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js (React + TypeScript) | The website you see in the browser |
| Backend | FastAPI (Python) | The server that coordinates everything |
| Embedding model | Gemini Embedding 2 (`gemini-embedding-2`) | Converts files to numbers |
| Vector database | ChromaDB | Stores and searches the numbers locally |
| Styling | Tailwind CSS | Makes it look nice |

---

## Prerequisites

Before you start, make sure you have these installed on your laptop:

1. **Python 3.9 or newer** — check with: `python3 --version`
2. **Node.js 18 or newer** — check with: `node --version`
3. **A Gemini API key** — get one free at: https://aistudio.google.com/apikey

---

## Setup — First Time Only

Do this once when you first clone the project.

### Step 1 — Clone the project

Open your terminal and run:

```bash
git clone https://github.com/mehrotra0307/memoryvault.git
cd memoryvault
```

### Step 2 — Add your API key

Create a `.env` file in the root of the project:

```bash
echo "GEMINI_API_KEY=paste_your_key_here" > .env
```

Replace `paste_your_key_here` with the key you got from https://aistudio.google.com/apikey

Verify it looks right:

```bash
cat .env
# Should show: GEMINI_API_KEY=AIzaSy...
```

### Step 3 — Set up the backend (Python)

```bash
cd backend
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cd ..
```

This creates a virtual environment and installs all Python packages.

### Step 4 — Set up the frontend (Node.js)

```bash
cd frontend
npm install
cd ..
```

This installs all JavaScript packages.

---

## Running the App

You need **two terminal windows open at the same time**.

### Terminal 1 — Start the backend

```bash
cd /path/to/memoryvault/backend
./venv/bin/uvicorn main:app --reload --port 8000
```

You should see:
```
INFO: Uvicorn running on http://127.0.0.1:8000
INFO: Application startup complete.
```

**Leave this terminal open and running.**

### Terminal 2 — Start the frontend

```bash
cd /path/to/memoryvault/frontend
npm run dev
```

You should see:
```
▲ Next.js
- Local: http://localhost:3000
✓ Ready in 2s
```

**Leave this terminal open and running.**

### Open the app

Open **Google Chrome** and go to: **http://localhost:3000**

You should see the MemoryVault home page.

> **Note:** If port 3000 is already in use by another project, Next.js will automatically use port 3001. The terminal will tell you which port it picked.

---

## Restarting After Closing Terminals

If you close your laptop or close the terminals, just do this next time:

**Terminal 1 (backend):**
```bash
cd /path/to/memoryvault/backend
./venv/bin/uvicorn main:app --reload --port 8000
```

**Terminal 2 (frontend):**
```bash
cd /path/to/memoryvault/frontend
npm run dev
```

Then open http://localhost:3000 in Chrome.

You do **NOT** need to reinstall packages. The `venv/` and `node_modules/` folders stay on your laptop. Only the two `run` commands are needed each time.

---

## How to Use the App

### Uploading files

1. Go to **http://localhost:3000**
2. Drag any file into the upload box — or click to browse
3. Supported formats: **JPG, PNG, WebP** (images), **PDF**, **TXT** (text), **MP3, WAV** (audio)
4. Wait a second while Gemini converts it to numbers
5. Your file appears in the vault grid

### Searching by text

1. Click **"Search Vault"** (top right)
2. Type anything — a feeling, a description, a topic
3. Click **Search**
4. Results appear ranked by similarity percentage

### Searching by image

1. Click **"Search Vault"**
2. Click **"Search by Image"**
3. Drop a query image into the box
4. MemoryVault finds everything in your vault with similar meaning

---

## Demo: The Wow Moment

Upload these different types of files with the same theme, then search with one query:

**Beach theme files:**
- A beach photo (JPG)
- A text note: *"Loved the white sand beaches of Mauritius, warm Indian Ocean, palm trees"*
- A PDF travel guide about a tropical island

**Mountain theme files:**
- A mountain photo
- A text note: *"Snow-capped peaks, thin air, cold Himalayan trek at 5000 metres"*

**Now search:** `"tropical beach ocean"` → Only beach files appear

**Now search:** `"mountain snow trek"` → Only mountain files appear

**Now search:** `"outdoor nature travel"` → Both beach AND mountain files appear (both are outdoor travel)

The third search is the jaw-dropper — one query finds completely different content types because it understands meaning.

---

## Viewing the Embeddings (Optional / For Curiosity)

Want to actually SEE the 3,072 numbers stored for your files? Run this from the `backend/` folder:

```bash
cd backend
./venv/bin/python inspect_db.py
```

You'll see something like:
```
Item 1: Mauritius_beach.png
  Type       : image
  Dimensions : 3072
  First 5 numbers: [-0.026, -0.009, -0.035, 0.003, 0.012]
```

Those are real numbers computed by Gemini Embedding 2. That is the embedding.

---

## Cost (If You Want to Deploy Publicly)

The app currently uses the **Gemini API free tier** — zero cost for personal/learning use.

If you deploy it publicly:

| Usage | Approx Cost |
|---|---|
| Text embedding | $0.20 per 1 million tokens |
| Image embedding | $0.45 per 1 million tokens |
| 100 users/day × 15 actions each | < $1/month |

**Source:** https://ai.google.dev/gemini-api/docs/pricing

---

## Free Media for Demo

Non-copyrighted images, audio, and videos you can use freely:

| Type | Website | What to search |
|---|---|---|
| Photos | https://pixabay.com | "tropical beach", "mountain snow" |
| Photos | https://unsplash.com | "beach", "himalaya", "ocean" |
| Audio | https://pixabay.com/music/ | "ocean waves", "beach ambient" |
| AI Images | https://gemini.google.com | "Generate a tropical beach photo" |

All Pixabay and Unsplash content is free for any use, no attribution needed.

---

## Project Structure

```
memoryvault/
│
├── .env.example          ← Template — copy this to .env and add your key
├── .gitignore
├── start.sh              ← Convenience script to start both servers
│
├── backend/
│   ├── main.py           ← FastAPI server — all API routes
│   ├── embedder.py       ← Calls Gemini Embedding 2 API
│   ├── vector_store.py   ← Stores and searches embeddings in ChromaDB
│   ├── inspect_db.py     ← Utility: print what's stored in ChromaDB
│   └── requirements.txt  ← Python packages needed
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx          ← Home page (upload + vault)
        │   └── search/page.tsx   ← Search page
        ├── components/
        │   └── ItemCard.tsx      ← Card showing each result
        └── lib/
            └── api.ts            ← Connects frontend to backend
```

---

## What You Learn Building This

After understanding and building this project, you will know:

- **What embeddings are** — numbers that represent meaning (the foundation of modern AI search)
- **What a vector database is** — a database optimized for comparing lists of numbers
- **What multimodal AI means** — one model that understands text, images, audio together
- **What RAG is** — Retrieval Augmented Generation: store content as embeddings, retrieve by meaning
- **How semantic search differs from keyword search** — meaning matches, not word matches

---

## Author

Built by Ashish Mehrotra as a learning project exploring Google's Gemini Embedding 2 model.

GitHub: https://github.com/mehrotra0307
