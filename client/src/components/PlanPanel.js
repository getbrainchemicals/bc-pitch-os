import React, { useState } from 'react';
import api from '../utils/api';
import { ClientSelector, AIOutput, ChatInput } from './Shared';

const DEL_TYPES = ['Ad Film', 'Reel', 'Social', 'Brand Film', 'Podcast', 'OOH', 'Other'];

export default function PlanPanel({ clients, activeClientId, setActiveClientId, updateActiveClient }) {
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [delName, setDelName] = useState('');
  const [delType, setDelType] = useState('Ad Film');

  const activeClient = clients.find(c => c.id === activeClientId);

  const runPlan = async (customInstruction) => {
    if (!activeClient) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/plan', {
        client: activeClient,
        userInstructions: customInstruction || instruction || '',
      });
      await updateActiveClient({ plan: data.text });
    } catch (e) { alert('Plan generation failed: ' + e.message); }
    setLoading(false);
  };

  const addDeliverable = async () => {
    if (!delName.trim() || !activeClient) return;
    const deliverables = [...(activeClient.deliverables || []), { name: delName, type: delType, progress: 0 }];
    await updateActiveClient({ deliverables });
    setDelName('');
  };

  const updateProgress = async (idx, val) => {
    const deliverables = [...(activeClient.deliverables || [])];
    deliverables[idx] = { ...deliverables[idx], progress: parseInt(val) };
    await updateActiveClient({ deliverables });
  };

  const removeDeliverable = async (idx) => {
    const deliverables = (activeClient.deliverables || []).filter((_, i) => i !== idx);
    await updateActiveClient({ deliverables });
  };

  const typeClass = t => ({ 'Ad Film': 'del-film', 'Reel': 'del-reel', 'Social': 'del-social', 'Brand Film': 'del-brand' }[t] || 'del-film');

  return (
    <div className="panel">
      <div className="section-label" style={{ marginBottom: 16 }}>Marketing Plan</div>
      <ClientSelector clients={clients} activeClientId={activeClientId} setActiveClientId={setActiveClientId} />

      {!activeClient ? (
        <div className="empty-state"><div className="icon">◎</div><div>Select a client to build a plan</div></div>
      ) : (
        <>
          {!activeClient.research && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(240,160,64,0.08)', border: '1px solid rgba(240,160,64,0.2)', borderRadius: 5, fontSize: 11, color: 'var(--accent2)' }}>
              ⚠ Run Research first for a sharper plan
            </div>
          )}

          {/* Chat */}
          <ChatInput
            client={activeClient}
            tab="plan"
            onInstruction={setInstruction}
            placeholder="e.g. 'Focus on Instagram Reels and short-form content' or 'Budget is small, prioritise 2 hero pieces'"
          />

          {instruction && (
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(200,240,96,0.06)', border: '1px solid rgba(200,240,96,0.2)', borderRadius: 5, fontSize: 11, color: 'var(--accent)' }}>
              ✦ Instruction: "{instruction}"
              <span style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--muted)' }} onClick={() => setInstruction('')}>× clear</span>
            </div>
          )}

          <div className="btn-row" style={{ marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => runPlan(instruction)} disabled={loading}>
              {loading ? 'Building Plan...' : '✦ Generate Plan'}
            </button>
          </div>

          <AIOutput
            text={activeClient.plan}
            loading={loading}
            placeholder="Generate a marketing plan. Add Research first for a sharper output. Use the chat to give specific instructions before generating."
          />

          <div className="separator" />

          {/* Deliverables */}
          <div className="section-label">Deliverables</div>
          {activeClient.deliverables?.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 12 }}>
              {activeClient.deliverables.map((d, i) => (
                <div key={i} className="del-row">
                  <span className={`del-tag ${typeClass(d.type)}`}>{d.type}</span>
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <div className="prog-bar-wrap" style={{ maxWidth: 80 }}>
                    <div className="prog-bar" style={{ width: `${d.progress}%` }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--dim)', minWidth: 30 }}>{d.progress}%</span>
                  <input type="range" min="0" max="100" value={d.progress}
                    onChange={e => updateProgress(i, e.target.value)}
                    style={{ width: 60, accentColor: 'var(--accent)' }} />
                  <button className="btn btn-sm btn-danger" onClick={() => removeDeliverable(i)} style={{ padding: '2px 7px' }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className="btn-row">
            <input type="text" value={delName} onChange={e => setDelName(e.target.value)}
              placeholder="Deliverable name..." style={{ flex: 2, minWidth: 160 }}
              onKeyDown={e => e.key === 'Enter' && addDeliverable()} />
            <select value={delType} onChange={e => setDelType(e.target.value)} style={{ flex: 1, minWidth: 100 }}>
              {DEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-sm" onClick={addDeliverable}>+ Add</button>
          </div>
        </>
      )}
    </div>
  );
}
