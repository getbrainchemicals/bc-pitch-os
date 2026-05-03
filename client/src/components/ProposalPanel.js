import React, { useState } from 'react';
import api from '../utils/api';
import { ClientSelector, AIOutput } from './Shared';

export default function ProposalPanel({ clients, activeClientId, setActiveClientId, updateActiveClient }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState('');
  const [links, setLinks] = useState({ doc: null, pdf: null });
  const activeClient = clients.find(c => c.id === activeClientId);

  const generate = async () => {
    if (!activeClient) return;
    setLoading(true);
    setLinks({ doc: null, pdf: null });
    try {
      const { data } = await api.post('/proposal/generate', { client: activeClient });
      await updateActiveClient({ proposal: data.text });
    } catch (e) { alert('Generation failed: ' + e.message); }
    setLoading(false);
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

      {!activeClient && (
        <div className="empty-state"><div className="icon">◎</div><div>Select a client to build a proposal</div></div>
      )}

      {activeClient && (
        <>
          {/* Readiness checks */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <ReadinessTag label="Brief" done={!!activeClient.brief} />
            <ReadinessTag label="Research" done={!!activeClient.research} />
            <ReadinessTag label="Plan" done={!!activeClient.plan} />
          </div>

          <div className="btn-row" style={{ marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={generate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Proposal ↗'}
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
            <div style={{ background: 'var(--surface)', border: '1px solid var(--teal)', borderRadius: 6, padding: '12px 14px', marginBottom: 14, fontSize: 12 }}>
              <div style={{ color: 'var(--teal)', marginBottom: 6, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Saved to Google Drive</div>
              {links.doc && <div style={{ marginBottom: 4 }}><a href={links.doc} target="_blank" rel="noreferrer">Open Google Doc ↗</a></div>}
              {links.pdf && <div><a href={links.pdf} target="_blank" rel="noreferrer">Open PDF ↗</a></div>}
            </div>
          )}

          <AIOutput
            text={activeClient.proposal}
            loading={loading}
            placeholder="Generate a proposal. Add Research and Plan first for the best output — the proposal pulls from both."
          />
        </>
      )}
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
