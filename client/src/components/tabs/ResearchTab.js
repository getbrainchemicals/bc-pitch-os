import React, { useState } from 'react';
import { api } from '../../utils/api';

export default function ResearchTab({ client, onSave }) {
  const [running, setRunning] = useState(false);

  async function runResearch() {
    setRunning(true);
    try {
      const { research } = await api.runResearch(client);
      await onSave({ ...client, research });
    } catch (e) { alert('Research failed: ' + e.message); }
    finally { setRunning(false); }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Brand Research</div>
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>AI-generated research based on brief, industry, and links</div>
        </div>
        <button className="btn btn-primary" onClick={runResearch} disabled={running}>
          {running ? <><div className="spinner" /> Researching...</> : client.research ? '↺ Re-run Research' : 'Run Research →'}
        </button>
      </div>

      {running && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dim)', fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Analysing brand, audience, and opportunities...
        </div>
      )}

      {!running && client.research && (
        <div className="ai-output">{client.research}</div>
      )}

      {!running && !client.research && (
        <div className="empty">
          <div className="empty-icon">⊙</div>
          <div>No research yet. Add a brief in Overview first, then run research.</div>
        </div>
      )}
    </div>
  );
}
