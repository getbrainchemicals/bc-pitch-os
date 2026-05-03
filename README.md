# Brain Chemicals — Pitch OS

Client research, marketing plans, proposals, and progress tracking.  
Claude AI backend. Google Drive storage. Runs on localhost.

---

## What You Need

- Node.js 18+ (https://nodejs.org)
- A Claude API key
- A Google account (for Drive storage)

---

## STEP 1 — Get Your Claude API Key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

---

## STEP 2 — Set Up Google OAuth

1. Go to https://console.cloud.google.com
2. Create a new project (name it "BC Pitch OS" or anything)
3. Go to **APIs & Services → Library**
   - Enable **Google Drive API**
   - Enable **Google Docs API**
4. Go to **APIs & Services → OAuth consent screen**
   - Choose **External**
   - Fill in App name: "Brain Chemicals Pitch OS"
   - Add your Gmail as a test user
5. Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorised redirect URIs: `http://localhost:3001/auth/google/callback`
   - Click Create
   - Copy the **Client ID** and **Client Secret**

---

## STEP 3 — Configure Environment

Inside the `server/` folder, create a file called `.env`:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
PORT=3001
```

(A template file `.env.example` is already in `server/` — copy and rename it)

---

## STEP 4 — Install & Run

Open Terminal in the project root folder:

```bash
# Install everything
npm run install:all

# Start both server and client
npm run dev
```

Then open http://localhost:3000 in your browser.

---

## First Launch

1. App opens → click **Connect Google Drive**
2. Log in with your Google account
3. Approve permissions (Drive + Docs access)
4. You're in

A folder called **"Brain Chemicals Pitch OS"** will be created in your Google Drive automatically. All client data, proposals, and PDFs save there.

---

## How It Works

| Tab | What it does |
|-----|-------------|
| **Clients** | Add clients with brief, website, social links |
| **Research** | AI brand analysis — positioning, gaps, opportunities |
| **Plan** | AI marketing plan — campaign direction, formats, platform strategy |
| **Proposal** | Full proposal generation → save as Google Doc + PDF to Drive |
| **Progress** | Phase-by-phase production tracking with tasks |
| **Notes** | Timestamped notes per client |

---

## Folder Structure in Google Drive

```
Brain Chemicals Pitch OS/
├── clients/          ← Client data as JSON files
└── proposals/        ← Generated Google Docs and PDFs
```

---

## Troubleshooting

**Google auth not working?**
Make sure `http://localhost:3001/auth/google/callback` is in your OAuth redirect URIs.

**Claude API error?**
Check your API key in `server/.env`. Make sure billing is set up on console.anthropic.com.

**Port conflict?**
Change `PORT=3001` in `.env` and update the proxy in `client/package.json`.
