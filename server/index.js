require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const app = express();

// ─── CORS — allow localhost dev + Railway production ──────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL, // set this in Railway env vars
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve built React app
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  console.log('✓ Serving React build from', buildPath);
}

// ─── Google OAuth ─────────────────────────────────────────────────────────
const REDIRECT =
  process.env.NODE_ENV === 'production'
    ? `${process.env.SERVER_URL}/auth/google/callback`
    : 'http://localhost:3001/auth/google/callback';

const CLIENT_REDIRECT =
  process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : 'http://localhost:3000';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT
);

const TOKEN_PATH = path.join(__dirname, '.tokens.json');
let tokens = null;
if (fs.existsSync(TOKEN_PATH)) {
  tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oauth2Client.setCredentials(tokens);
}

app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
    prompt: 'consent',
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens: t } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(t);
    tokens = t;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(t));
    res.redirect(`${CLIENT_REDIRECT}?auth=success`);
  } catch (err) {
    res.redirect(`${CLIENT_REDIRECT}?auth=error`);
  }
});

app.get('/auth/status', async (req, res) => {
  if (!tokens) return res.json({ authenticated: false });
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    res.json({ authenticated: true, user: data });
  } catch {
    res.json({ authenticated: false });
  }
});

app.post('/auth/logout', (req, res) => {
  tokens = null;
  if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
  res.json({ success: true });
});

// ─── Drive helpers ────────────────────────────────────────────────────────
const drive = () => google.drive({ version: 'v3', auth: oauth2Client });
const docs  = () => google.docs({ version: 'v1', auth: oauth2Client });

async function getOrCreateFolder(name, parentId = null) {
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const list = await drive().files.list({ q, fields: 'files(id)' });
  if (list.data.files.length) return list.data.files[0].id;
  const f = await drive().files.create({
    resource: { name, mimeType: 'application/vnd.google-apps.folder', ...(parentId ? { parents: [parentId] } : {}) },
    fields: 'id',
  });
  return f.data.id;
}

async function getRootFolder() {
  return getOrCreateFolder('Brain Chemicals Pitch OS');
}

// ─── Clients CRUD ─────────────────────────────────────────────────────────
app.get('/clients', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const root = await getRootFolder();
    const folder = await getOrCreateFolder('clients', root);
    const list = await drive().files.list({
      q: `'${folder}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      orderBy: 'modifiedTime desc',
    });
    const clients = [];
    for (const f of list.data.files) {
      const r = await drive().files.get({ fileId: f.id, alt: 'media' });
      clients.push({ ...r.data, _fileId: f.id });
    }
    res.json(clients);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/clients', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const root = await getRootFolder();
    const folder = await getOrCreateFolder('clients', root);
    const client = { ...req.body, id: req.body.id || `c_${Date.now()}`, createdAt: new Date().toISOString() };
    const f = await drive().files.create({
      resource: { name: `${client.id}.json`, parents: [folder], mimeType: 'application/json' },
      media: { mimeType: 'application/json', body: Readable.from([JSON.stringify(client)]) },
      fields: 'id',
    });
    res.json({ ...client, _fileId: f.data.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/clients/:fileId', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await drive().files.update({
      fileId: req.params.fileId,
      media: { mimeType: 'application/json', body: Readable.from([JSON.stringify(req.body)]) },
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/clients/:fileId', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await drive().files.delete({ fileId: req.params.fileId });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── AI helpers ───────────────────────────────────────────────────────────
async function callClaude(system, user, maxTokens = 2000) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const r = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] },
    { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } }
  );
  return r.data.content.map(b => b.text || '').join('');
}

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const r = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
    { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2000 } },
    { headers: { 'content-type': 'application/json' } }
  );
  return r.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

const BC_SYSTEM = `You are a senior creative strategist and production director at Brain Chemicals, a premium media production studio in Kerala, India specialising in brand films, commercials, and content strategy. Be direct, sharp, production-aware. Write with confidence. No fluff, no generic advice.`;

// ─── Research (Gemini + Claude parallel, Claude synthesises) ─────────────
app.post('/ai/research', async (req, res) => {
  const { client, userInstructions } = req.body;

  const baseContext = `
Client: ${client.name}
Industry: ${client.industry || 'unspecified'}
Website: ${client.website || 'not provided'}
Social links: ${client.social || 'not provided'}
Brief: ${client.brief || 'none'}
${userInstructions ? `\nAdditional instructions: ${userInstructions}` : ''}`;

  const geminiPrompt = `You are a brand strategist doing research on a potential client for a media production studio.

${baseContext}

Research this brand thoroughly and provide:
1. BRAND POSITIONING — How the brand currently sits in the market. Tone, voice, visual identity.
2. TARGET AUDIENCE — Who they're speaking to right now. Demographics, psychographics, online behaviour.
3. COMPETITOR LANDSCAPE — 3-4 key competitors. What are they doing well? Where are the gaps?
4. CONTENT ANALYSIS — What kind of content is this brand putting out? Quality, frequency, formats used.
5. MARKET OPPORTUNITIES — What trends or shifts in this industry could this brand capitalise on?

Be specific, data-aware, and sharp.`;

  const claudePrompt = `You are researching a client for Brain Chemicals, a premium media production studio.

${baseContext}

Analyse this brand from a creative production and storytelling perspective:
1. BRAND STORY GAPS — What stories are they NOT telling that they should be?
2. VISUAL IDENTITY READ — What does their current visual presence feel like? What's missing?
3. CONTENT OPPORTUNITIES — 3 specific content formats or campaign angles Brain Chemicals could pitch.
4. PLATFORM STRATEGY GAPS — Where should they be showing up that they're not?
5. RED FLAGS — Anything to be careful about as a production partner.

Think like a director-strategist.`;

  try {
    // Run both in parallel
    const [geminiRaw, claudeRaw] = await Promise.all([
      callGemini(geminiPrompt).catch(e => `[Gemini unavailable: ${e.message}]`),
      callClaude(BC_SYSTEM, claudePrompt),
    ]);

    // Claude synthesises both
    const synthesis = await callClaude(
      BC_SYSTEM,
      `You have two research reports on the same client from two different AI analysts. Synthesise them into one sharp, unified research brief.

CLIENT: ${client.name}
${userInstructions ? `SPECIFIC FOCUS: ${userInstructions}` : ''}

--- ANALYST 1 (Market & Competitive Research) ---
${geminiRaw}

--- ANALYST 2 (Creative & Production Perspective) ---
${claudeRaw}

Synthesise into a single research brief with these ALL CAPS sections:

BRAND READ
(Positioning, tone, visual identity — what this brand feels like today)

AUDIENCE
(Who they're speaking to — specific, not generic)

COMPETITIVE LANDSCAPE
(Key competitors and where the gaps are)

CONTENT GAPS
(What's missing from their current output)

OPPORTUNITIES FOR BRAIN CHEMICALS
(3 specific, shootable campaign or content angles we can pitch)

RED FLAGS
(What to be careful about)

PITCH ANGLE
(One sentence that frames how Brain Chemicals enters this conversation)

Be sharp. No repetition. Write like a senior creative strategist presenting to their team.`,
      3000
    );

    res.json({ text: synthesis, geminiRaw, claudeRaw });
} catch (err) { 
    console.error('RESEARCH ERROR:', err.message, err.response?.data);
    res.status(500).json({ error: err.message, detail: err.response?.data }); 
  }});

// ─── Plan ────────────────────────────────────────────────────────────────
app.post('/ai/plan', async (req, res) => {
  const { client, userInstructions } = req.body;
  try {
    const text = await callClaude(BC_SYSTEM,
      `Build a marketing plan to pitch to this client.

Client: ${client.name}
Industry: ${client.industry || ''}
Brief: ${client.brief || ''}
Research: ${client.research || ''}
${userInstructions ? `\nSpecific instructions / focus areas: ${userInstructions}` : ''}

Output with ALL CAPS headers:

CAMPAIGN DIRECTION
(The single big idea. Name it. What is the strategic and creative angle?)

CONTENT FORMATS
(Which formats — ad film, reels, brand doc, social series, podcast etc — and exactly why each one)

PLATFORM STRATEGY
(Where to run it: Instagram, YouTube, OOH, etc. How each platform is used differently)

PRODUCTION APPROACH
(How Brain Chemicals executes this. Tone, visual aesthetic, crew scale, shoot style)

CONTENT CALENDAR OUTLINE
(Phase 1 / Phase 2 / Phase 3 — what gets made and when)

PITCH HEADLINE
(One sentence that sells the entire idea to the client)

Be confident and specific. No generic marketing advice.`);
    res.json({ text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Key Persons (Gemini + Claude) ───────────────────────────────────────
app.post('/ai/keypersons', async (req, res) => {
  const { client } = req.body;

  const geminiPrompt = `Research and find the key decision-makers and stakeholders at this company:

Company: ${client.name}
Industry: ${client.industry || ''}
Website: ${client.website || ''}

Find and list:
- Founder / CEO / Managing Director
- Marketing Head / CMO / Brand Manager
- Creative Director (if applicable)
- Any other key decision-maker relevant to marketing or content partnerships

For each person provide:
- Full name
- Title / Role
- LinkedIn URL (if findable)
- Email (if publicly available)
- Any relevant background or context about their role

If you cannot find specific individuals, describe the typical decision-making structure for a company of this type and size in this industry.`;

  try {
    const geminiRaw = await callGemini(geminiPrompt).catch(e => `Could not retrieve: ${e.message}`);

    const structured = await callClaude(
      BC_SYSTEM,
      `Based on this research about key persons at ${client.name}, structure the information into clean profiles.

Raw research:
${geminiRaw}

Output a JSON array of person objects. Each object must have:
- name (string)
- title (string)
- relevance (string — why they matter for a Brain Chemicals pitch)
- linkedin (string or null)
- email (string or null)
- notes (string — 1-2 lines of useful context)

Return ONLY the JSON array, no other text. If data is uncertain, mark fields as null rather than guessing.`
    );

    let persons = [];
    try {
      const clean = structured.replace(/```json|```/g, '').trim();
      persons = JSON.parse(clean);
    } catch {
      persons = [];
    }

    res.json({ persons, geminiRaw });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Proposal ────────────────────────────────────────────────────────────
app.post('/proposal/generate', async (req, res) => {
  const { client, userInstructions } = req.body;
  try {
    const text = await callClaude(BC_SYSTEM,
      `Write a full client proposal for Brain Chemicals.

Client: ${client.name}
Industry: ${client.industry || ''}
Brief: ${client.brief || ''}
Research: ${client.research || ''}
Plan: ${client.plan || ''}
${userInstructions ? `\nSpecific instructions / angle: ${userInstructions}` : ''}

Use ALL CAPS section headers. Write these sections:

EXECUTIVE SUMMARY
ABOUT BRAIN CHEMICALS
THE OPPORTUNITY
CAMPAIGN CONCEPT & BIG IDEA
CONTENT FORMATS & DELIVERABLES
PLATFORM STRATEGY
PRODUCTION APPROACH
BUDGET TIERS
(Three tiers: Starter / Core / Full Campaign — INR ranges, what's included at each)
TIMELINE
(Pre-production → Production → Post → Delivery, approximate weeks per phase)
NEXT STEPS

Write like you mean it. Confident, specific, no corporate filler.`,
      3000
    );
    res.json({ text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Chat (contextual, per-tab) ───────────────────────────────────────────
app.post('/ai/chat', async (req, res) => {
  const { message, clientContext, tab, history } = req.body;

  const tabContext = {
    research: 'You are helping refine a brand research brief. Focus on brand analysis, audience, competitive landscape, and content opportunities.',
    plan: 'You are helping build a marketing plan. Focus on campaign direction, content formats, platform strategy, and production approach.',
    proposal: 'You are helping write a client proposal. Focus on making it persuasive, specific, and production-ready.',
  }[tab] || 'You are a creative strategist at Brain Chemicals.';

  const messages = [
    ...(history || []),
    { role: 'user', content: message },
  ];

  try {
    const text = await callClaude(
      `${BC_SYSTEM}\n\n${tabContext}\n\nClient context:\n${clientContext || 'none'}`,
      messages.map(m => `${m.role === 'user' ? 'User' : 'You'}: ${m.content}`).join('\n\n')
    );
    res.json({ text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Save to Google Docs ─────────────────────────────────────────────────
app.post('/proposal/save-doc', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  const { client, proposalText } = req.body;
  try {
    const root = await getRootFolder();
    const folder = await getOrCreateFolder('proposals', root);

    const docMeta = await drive().files.create({
      resource: {
        name: `Proposal — ${client.name} — ${new Date().toLocaleDateString('en-IN')}`,
        mimeType: 'application/vnd.google-apps.document',
        parents: [folder],
      },
      fields: 'id,webViewLink',
    });

    const docId = docMeta.data.id;
    const lines = proposalText.split('\n');
    const requests = [];
    let index = 1;

    const header = `BRAIN CHEMICALS — Proposal for ${client.name}\n${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    requests.push({ insertText: { location: { index }, text: header } });
    index += header.length;

    for (const line of lines) {
      const text = line + '\n';
      requests.push({ insertText: { location: { index }, text } });
      index += text.length;
    }

    await docs().documents.batchUpdate({ documentId: docId, resource: { requests } });
    res.json({ docUrl: docMeta.data.webViewLink });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Save PDF to Drive ────────────────────────────────────────────────────
app.post('/proposal/save-pdf', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  const { client, proposalText } = req.body;
  try {
    const PDFDocument = require('pdfkit');
    const root = await getRootFolder();
    const folder = await getOrCreateFolder('proposals', root);

    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));

    await new Promise(resolve => {
      doc.on('end', resolve);
      doc.rect(0, 0, doc.page.width, 160).fill('#0a0a08');
      doc.fillColor('#c8f060').font('Helvetica-Bold').fontSize(20).text('BRAIN CHEMICALS', 60, 55);
      doc.fillColor('#888880').font('Helvetica').fontSize(10).text('Media Production & Content Strategy', 60, 83);
      doc.fillColor('#e8e6df').font('Helvetica-Bold').fontSize(13).text(`Proposal for ${client.name}`, 60, 108);
      doc.fillColor('#888880').font('Helvetica').fontSize(9)
        .text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 60, 130);
      doc.y = 190;

      for (const line of proposalText.split('\n')) {
        if (!line.trim()) { doc.moveDown(0.35); continue; }
        const isHeader = line.trim() === line.trim().toUpperCase() && line.trim().replace(/[^A-Z&]/g, '').length > 3;
        if (isHeader) {
          doc.moveDown(0.7);
          const y = doc.y;
          doc.rect(54, y, doc.page.width - 108, 20).fill('#f0f0e8');
          doc.fillColor('#0a0a08').font('Helvetica-Bold').fontSize(9).text(line, 62, y + 6, { lineBreak: false });
          doc.y = y + 28;
        } else {
          doc.fillColor('#222220').font('Helvetica').fontSize(10).text(line, { lineGap: 2 });
        }
      }
      doc.fontSize(8).fillColor('#aaaaaa')
        .text('Brain Chemicals — brainchemicals.in', 60, doc.page.height - 40, { align: 'center' });
      doc.end();
    });

    const f = await drive().files.create({
      resource: {
        name: `Proposal — ${client.name} — ${new Date().toLocaleDateString('en-IN')}.pdf`,
        mimeType: 'application/pdf',
        parents: [folder],
      },
      media: { mimeType: 'application/pdf', body: Readable.from([Buffer.concat(chunks)]) },
      fields: 'id,webViewLink',
    });

    res.json({ pdfUrl: f.data.webViewLink });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Catch-all → React ───────────────────────────────────────────────────
const indexHtml = path.join(__dirname, '../client/build/index.html');
if (fs.existsSync(indexHtml)) {
  app.get('*', (req, res) => res.sendFile(indexHtml));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`\n✓ BC Pitch OS → http://localhost:${PORT}\n`));
