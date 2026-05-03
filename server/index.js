require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));

// ─── Google OAuth2 ─────────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3001/auth/google/callback'
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
    res.redirect('http://localhost:3000?auth=success');
  } catch (err) {
    res.redirect('http://localhost:3000?auth=error');
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

// ─── Drive Helpers ─────────────────────────────────────────────────────────
const drive = () => google.drive({ version: 'v3', auth: oauth2Client });
const docs = () => google.docs({ version: 'v1', auth: oauth2Client });

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

// ─── Clients ───────────────────────────────────────────────────────────────
app.get('/clients', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const root = await getRootFolder();
    const clientsFolder = await getOrCreateFolder('clients', root);
    const list = await drive().files.list({
      q: `'${clientsFolder}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      orderBy: 'modifiedTime desc',
    });
    const clients = [];
    for (const f of list.data.files) {
      const r = await drive().files.get({ fileId: f.id, alt: 'media' });
      clients.push({ ...r.data, _fileId: f.id });
    }
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/clients', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const root = await getRootFolder();
    const clientsFolder = await getOrCreateFolder('clients', root);
    const client = { ...req.body, id: req.body.id || `c_${Date.now()}`, createdAt: new Date().toISOString() };
    const f = await drive().files.create({
      resource: { name: `${client.id}.json`, parents: [clientsFolder], mimeType: 'application/json' },
      media: { mimeType: 'application/json', body: Readable.from([JSON.stringify(client)]) },
      fields: 'id',
    });
    res.json({ ...client, _fileId: f.data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/clients/:fileId', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await drive().files.update({
      fileId: req.params.fileId,
      media: { mimeType: 'application/json', body: Readable.from([JSON.stringify(req.body)]) },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/clients/:fileId', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await drive().files.delete({ fileId: req.params.fileId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Claude AI ─────────────────────────────────────────────────────────────
async function callClaude(system, user) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const r = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model: 'claude-sonnet-4-20250514', max_tokens: 2000, system, messages: [{ role: 'user', content: user }] },
    { headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' } }
  );
  return r.data.content.map(b => b.text || '').join('');
}

const BC_SYSTEM = 'You are a senior creative strategist and production director at Brain Chemicals, a premium media production studio in Kerala, India specialising in brand films, commercials, and content strategy. Be direct, sharp, and production-aware. No fluff.';

app.post('/ai/research', async (req, res) => {
  const { client } = req.body;
  try {
    const text = await callClaude(BC_SYSTEM,
      `Research brief for client:
Client: ${client.name}
Industry: ${client.industry || 'unspecified'}
Website: ${client.website || 'not provided'}
Social: ${client.social || 'not provided'}
Brief: ${client.brief || 'none'}

Output these sections with headers in ALL CAPS:

BRAND READ
AUDIENCE
CONTENT GAPS
OPPORTUNITIES
RED FLAGS

Keep it sharp. Director-strategist voice.`);
    res.json({ text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/ai/plan', async (req, res) => {
  const { client } = req.body;
  try {
    const text = await callClaude(BC_SYSTEM,
      `Marketing plan for:
Client: ${client.name}
Industry: ${client.industry || ''}
Brief: ${client.brief || ''}
Research notes: ${client.research || ''}

Output with ALL CAPS section headers:

CAMPAIGN DIRECTION
CONTENT FORMATS
PLATFORM STRATEGY
PRODUCTION APPROACH
PITCH HEADLINE

Confident and specific.`);
    res.json({ text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/ai/chat', async (req, res) => {
  const { message, clientContext } = req.body;
  try {
    const text = await callClaude(BC_SYSTEM,
      `Client context:\n${clientContext || 'none'}\n\nQuestion: ${message}`);
    res.json({ text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Proposals ─────────────────────────────────────────────────────────────
app.post('/proposal/generate', async (req, res) => {
  const { client } = req.body;
  try {
    const text = await callClaude(BC_SYSTEM,
      `Write a full client proposal for Brain Chemicals.

Client: ${client.name}
Industry: ${client.industry || ''}
Brief: ${client.brief || ''}
Research: ${client.research || ''}
Plan: ${client.plan || ''}

Use ALL CAPS section headers. Sections:

EXECUTIVE SUMMARY
ABOUT BRAIN CHEMICALS
THE OPPORTUNITY
CAMPAIGN CONCEPT & BIG IDEA
CONTENT FORMATS & DELIVERABLES
PLATFORM STRATEGY
PRODUCTION APPROACH
BUDGET TIERS
(Three tiers: Starter / Core / Full Campaign with indicative INR ranges and what's included)
TIMELINE
(Phase by phase — Pre-production, Production, Post, Delivery — approximate weeks)
NEXT STEPS

Write like you mean it. No corporate filler.`);
    res.json({ text });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/proposal/save-doc', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  const { client, proposalText } = req.body;
  try {
    const root = await getRootFolder();
    const proposalsFolder = await getOrCreateFolder('proposals', root);

    const docMeta = await drive().files.create({
      resource: {
        name: `Proposal — ${client.name} — ${new Date().toLocaleDateString('en-IN')}`,
        mimeType: 'application/vnd.google-apps.document',
        parents: [proposalsFolder],
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

app.post('/proposal/save-pdf', async (req, res) => {
  if (!tokens) return res.status(401).json({ error: 'Not authenticated' });
  const { client, proposalText } = req.body;
  try {
    const PDFDocument = require('pdfkit');
    const root = await getRootFolder();
    const proposalsFolder = await getOrCreateFolder('proposals', root);

    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));

    await new Promise(resolve => {
      doc.on('end', resolve);

      // Cover header
      doc.rect(0, 0, doc.page.width, 160).fill('#0a0a08');
      doc.fillColor('#c8f060').font('Helvetica-Bold').fontSize(20).text('BRAIN CHEMICALS', 60, 55);
      doc.fillColor('#888880').font('Helvetica').fontSize(10).text('Media Production & Content Strategy', 60, 83);
      doc.fillColor('#e8e6df').font('Helvetica-Bold').fontSize(13)
        .text(`Proposal for ${client.name}`, 60, 108);
      doc.fillColor('#888880').font('Helvetica').fontSize(9)
        .text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 60, 130);

      doc.y = 190;

      const lines = proposalText.split('\n');
      for (const line of lines) {
        if (!line.trim()) { doc.moveDown(0.35); continue; }
        const isHeader = line === line.toUpperCase() && line.replace(/[^A-Z]/g,'').length > 3;
        if (isHeader) {
          doc.moveDown(0.7);
          const y = doc.y;
          doc.rect(54, y, doc.page.width - 108, 20).fill('#f0f0e8');
          doc.fillColor('#0a0a08').font('Helvetica-Bold').fontSize(9)
            .text(line, 62, y + 6, { lineBreak: false });
          doc.y = y + 26;
          doc.moveDown(0.3);
        } else {
          doc.fillColor('#222220').font('Helvetica').fontSize(10)
            .text(line, { lineGap: 2 });
        }
      }

      // Footer
      doc.fontSize(8).fillColor('#aaaaaa')
        .text('Brain Chemicals — brainchemicals.in', 60, doc.page.height - 40, { align: 'center' });

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const f = await drive().files.create({
      resource: {
        name: `Proposal — ${client.name} — ${new Date().toLocaleDateString('en-IN')}.pdf`,
        mimeType: 'application/pdf',
        parents: [proposalsFolder],
      },
      media: { mimeType: 'application/pdf', body: Readable.from([pdfBuffer]) },
      fields: 'id,webViewLink',
    });

    res.json({ pdfUrl: f.data.webViewLink });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`\n✓ BC Pitch OS server → http://localhost:${PORT}\n`));
