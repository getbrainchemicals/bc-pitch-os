import React, { useState } from 'react';
import api from '../utils/api';
import { ClientSelector, AIOutput } from './Shared';

export default function ResearchPanel({ clients, activeClientId, setActiveClientId, updateActiveClient }) {
  const [loading, setLoading] = useState(false);
  const activeClient = clients.find(c => c.id === activeClientId);

  const runResearch = async () => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/research', { client: activeClient });
      await updateActiveClient({ research: data.text });
    } catch (e) { alert('Research failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="section-label" style={{ marginBottom: 16 }}>Research & Discovery</div>
      <ClientSelector clients={clients} activeClientId={activeClientId} setActiveClientId={setActiveClientId} />

      {!activeClient && (
        <div className="empty-state"><div className="icon">◎</div><div>Select a client to run research</div></div>
      )}

      {activeClient && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={runResearch} disabled={loading}>
              {loading ? 'Running...' : 'Run AI Research ↗'}
            </button>
            {activeClient.research && (
              <button className="btn btn-sm" onClick={runResearch} disabled={loading}>
                Regenerate
              </button>
            )}
          </div>

          <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--dim)' }}>
            Based on: {[activeClient.industry, activeClient.website, activeClient.brief].filter(Boolean).join(' · ') || 'Brief only — add website and links for better results'}
          </div>

          <AIOutput text={activeClient.research} loading={loading} placeholder="Hit Run AI Research to generate a brand and competitive analysis." />

          {activeClient.research && (
            <div style={{ marginTop: 14, padding: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--dim)' }}>
              Research saved to client. Use it to generate a Marketing Plan.
            </div>
          )}
        </>
      )}
    </div>
  );
}
