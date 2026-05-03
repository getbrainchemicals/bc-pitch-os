import React, { useState } from 'react';
import api from '../utils/api';
import { ClientSelector, AIOutput, ChatInput } from './Shared';

export default function ProposalPanel({ clients, activeClientId, setActiveClientId, updateActiveClient }) {
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [saving, setSaving] = useState('');
  const [links, setLinks] = useState({ doc: null, pdf: null });
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [personsError, setPersonsError] = useState('');

  const activeClient = clients.find(c => c.id === activeClientId);

  const generate = async (customInstruction) => {
    if (!activeClient) return;
    setLoading(true);
    setLinks({ doc: null, pdf: null });
    try {
      const { data } = await api.post('/proposal/generate', {
        client: activeClient,
        userInstructions: customInstruction || instruction || '',
      });
      await updateActiveClient({ proposal: data.text });
    } catch (e) { alert('Generation failed: ' + e.message); }
    setLoading(false);
  };

  const fetchKeyPersons = async () => {
    if (!activeClient) return;
    setLoadingPersons(true);
    setPersonsError('');
    try {
      const { data } = await api.post('/ai/keypersons', { client: activeClient });
      await updateActiveClient({ keyPersons: data.persons, keyPersonsRaw: data.geminiRaw });
    } catch (e) { setPersonsError(e.message); }
    setLoadingPersons(false);
  };

  const saveDoc = async () => {
    if (!activeClient?.proposal) return;
    setSaving('doc');
    try {
      const { data } = await api.post('/proposal/save-doc', { client: activeClient, proposalText: activeClient.proposal });
      setLinks(l => ({ ...l, doc: data.docUrl }));
    } catch (e) { alert('Save to Docs failed: ' + e.message); }
    setSaving('');
  };

  const savePDF = async () => {
    if (!activeClient?.proposal) return;
    setSaving('pdf');
    try {
      const { data } = await api.post('/proposal/save-pdf', { client: activeClient, proposalText: activeClient.proposal });
      setLinks(l => ({ ...l, pdf: data.pdfUrl }));
    } catch (e) { alert('Save PDF failed: ' + e.message); }
    setSaving('');
  };

  return (
    <div className="panel">
      <div className="section-label" style={{ marginBottom: 16 }}>Proposal Builder</div>
      <ClientSelector clients={clients} activeClientId={activeClientId} setActiveClientId={setActiveClientId} />

      {!activeClient ? (
        <div className="empty-state"><div className="icon">◎</div><div>Select a client to build a proposal</div></div>
      ) : (
        <>
          {/* Readiness */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <ReadinessTag label="Brief" done={!!activeClient.brief} />
            <ReadinessTag label="Research" done={!!activeClient.research} />
            <ReadinessTag label="Plan" done={!!activeClient.plan} />
          </div>

          {/* Chat */}
          <ChatInput
            client={activeClient}
            tab="proposal"
            onInstruction={setInstruction}
            placeholder="e.g. 'Lead with the brand film angle' or 'They have a ₹5L budget, make the starter tier the hero' or 'Tone should feel premium but approachable'"
          />

          {instruction && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(200,240,96,0.06)', border: '1px solid rgba(200,240,96,0.2)', borderRadius: 5, fontSize: 11, color: 'var(--accent)' }}>
              ✦ Instruction: "{instruction}"
              <span style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--muted)' }} onClick={() => setInstruction('')}>× clear</span>
            </div>
          )}

          <div className="btn-row" style={{ marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => generate(instruction)} disabled={loading}>
              {loading ? 'Generating...' : '✦ Generate Proposal'}
            </button>
            {activeClient.proposal && (
              <>
                <button className="btn btn-sm" onClick={saveDoc} disabled={!!saving}>
                  {saving === 'doc' ? 'Saving...' : '→ Google Doc'}
                </button>
                <button className="btn btn-sm" onClick={savePDF} disabled={!!saving}>
                  {saving === 'pdf' ? 'Saving...' : '→ PDF to Drive'}
                </button>
              </>
            )}
          </div>

          {(links.doc || links.pdf) && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(64,208,168,0.3)', borderRadius: 6, padding: '12px 14px', marginBottom: 14, fontSize: 12 }}>
              <div style={{ color: 'var(--teal)', marginBottom: 6, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Saved to Google Drive</div>
              {links.doc && <div style={{ marginBottom: 4 }}><a href={links.doc} target="_blank" rel="noreferrer">Open Google Doc ↗</a></div>}
              {links.pdf && <div><a href={links.pdf} target="_blank" rel="noreferrer">Open PDF ↗</a></div>}
            </div>
          )}

          <AIOutput
            text={activeClient.proposal}
            loading={loading}
            placeholder="Generate a proposal. Use the chat to set specific instructions — tone, budget angle, key focus — before hitting Generate."
          />

          {/* ── Key Persons Section ─────────────────────────────────────── */}
          <div className="separator" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 2 }}>Key Persons & Contacts</div>
              <div style={{ fontSize: 11, color: 'var(--dim)' }}>Decision-makers found via Gemini + structured by Claude</div>
            </div>
            <button className="btn btn-sm" onClick={fetchKeyPersons} disabled={loadingPersons}
              style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}>
              {loadingPersons ? 'Searching...' : '⟳ Find Key Persons'}
            </button>
          </div>

          {loadingPersons && (
            <div style={{ fontSize: 11, color: 'var(--dim)', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5 }}>
              Searching for decision-makers at {activeClient.name}<span className="cursor-blink" />
            </div>
          )}

          {personsError && (
            <div style={{ fontSize: 11, color: 'var(--red)', padding: '8px 12px', background: 'rgba(240,80,80,0.05)', border: '1px solid rgba(240,80,80,0.2)', borderRadius: 5, marginBottom: 10 }}>
              {personsError}
            </div>
          )}

          {activeClient.keyPersons?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {activeClient.keyPersons.map((p, i) => (
                <PersonCard key={i} person={p} />
              ))}
            </div>
          )}

          {!activeClient.keyPersons?.length && !loadingPersons && (
            <div style={{ fontSize: 11, color: 'var(--muted)', padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, textAlign: 'center' }}>
              No key persons data yet. Hit "Find Key Persons" to search.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PersonCard({ person }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{person.name || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--accent2)', marginTop: 2 }}>{person.title || ''}</div>
        </div>
      </div>
      {person.relevance && (
        <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 8, lineHeight: 1.6 }}>{person.relevance}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {person.email && (
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--muted)' }}>Email: </span>
            <a href={`mailto:${person.email}`}>{person.email}</a>
          </div>
        )}
        {person.linkedin && (
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--muted)' }}>LinkedIn: </span>
            <a href={person.linkedin} target="_blank" rel="noreferrer">View Profile ↗</a>
          </div>
        )}
        {person.notes && (
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
            {person.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function ReadinessTag({ label, done }) {
  return (
    <div style={{
      fontSize: 10, padding: '3px 10px', borderRadius: 3, letterSpacing: '0.06em',
      background: done ? 'rgba(64,208,168,0.12)' : 'rgba(136,136,128,0.12)',
      color: done ? 'var(--teal)' : 'var(--muted)',
      border: `1px solid ${done ? 'rgba(64,208,168,0.2)' : 'var(--border)'}`,
    }}>
      {done ? '✓' : '○'} {label}
    </div>
  );
}
