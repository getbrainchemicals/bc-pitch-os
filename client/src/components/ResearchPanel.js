import React, { useState } from 'react';
import api from '../utils/api';
import { ClientSelector, AIOutput, ChatInput } from './Shared';

export default function ResearchPanel({ clients, activeClientId, setActiveClientId, updateActiveClient }) {
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [showSources, setShowSources] = useState(false);
  const [sources, setSources] = useState({ gemini: '', claude: '' });

  const activeClient = clients.find(c => c.id === activeClientId);

  const runResearch = async (customInstruction) => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/research', {
        client: activeClient,
        userInstructions: customInstruction || instruction || '',
      });
      await updateActiveClient({ research: data.text });
      setSources({ gemini: data.geminiRaw || '', claude: data.claudeRaw || '' });
    } catch (e) { alert('Research failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="section-label" style={{ marginBottom: 16 }}>Research & Discovery</div>
      <ClientSelector clients={clients} activeClientId={activeClientId} setActiveClientId={setActiveClientId} />

      {!activeClient ? (
        <div className="empty-state"><div className="icon">◎</div><div>Select a client to run research</div></div>
      ) : (
        <>
          {/* Source indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: 4 }}>Sources:</div>
            <SourceTag label="Gemini" color="var(--blue)" />
            <SourceTag label="Claude" color="var(--accent)" />
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>→ synthesised by Claude</div>
          </div>

          {/* Chat input */}
          <ChatInput
            client={activeClient}
            tab="research"
            onInstruction={(msg) => { setInstruction(msg); }}
            placeholder="e.g. 'Focus on their Instagram content gaps' or 'Deep dive into competitors in the Kerala market'"
          />

          {instruction && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(200,240,96,0.06)', border: '1px solid rgba(200,240,96,0.2)', borderRadius: 5, fontSize: 11, color: 'var(--accent)' }}>
              ✦ Instruction set: "{instruction}"
              <span style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--muted)' }} onClick={() => setInstruction('')}>× clear</span>
            </div>
          )}

          <div className="btn-row" style={{ marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => runResearch(instruction)} disabled={loading}>
              {loading ? 'Running Gemini + Claude...' : '✦ Generate Research'}
            </button>
            {activeClient.research && !loading && (
              <button className="btn btn-sm" onClick={() => setShowSources(s => !s)}>
                {showSources ? 'Hide Sources' : 'View Raw Sources'}
              </button>
            )}
          </div>

          {loading && (
            <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 10, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5 }}>
              Running Gemini market research + Claude brand analysis in parallel, then synthesising...
            </div>
          )}

          <AIOutput
            text={activeClient.research}
            loading={loading}
            placeholder="Hit Generate Research. Gemini and Claude will each analyse the client independently, then Claude synthesises both into one report."
          />

          {/* Raw sources */}
          {showSources && !loading && (sources.gemini || sources.claude) && (
            <>
              <div className="separator" />
              <div className="section-label">Raw Sources</div>
              {sources.gemini && (
                <details style={{ marginBottom: 10 }}>
                  <summary style={{ fontSize: 11, color: 'var(--blue)', cursor: 'pointer', marginBottom: 6 }}>Gemini — Market Research</summary>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: 'var(--dim)', whiteSpace: 'pre-wrap', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>{sources.gemini}</div>
                </details>
              )}
              {sources.claude && (
                <details>
                  <summary style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer', marginBottom: 6 }}>Claude — Creative Analysis</summary>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: 'var(--dim)', whiteSpace: 'pre-wrap', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4 }}>{sources.claude}</div>
                </details>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function SourceTag({ label, color }) {
  return (
    <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 3, border: `1px solid ${color}30`, background: `${color}10`, color }}>
      {label}
    </div>
  );
}
