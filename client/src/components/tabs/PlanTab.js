import React, { useState } from 'react';
import { api } from '../../utils/api';

const DEL_TYPES = ['Ad Film', 'Reel', 'Social Series', 'Brand Film', 'Documentary', 'Podcast', 'Campaign'];

export default function PlanTab({ client, onSave }) {
  const [running, setRunning] = useState(false);
  const [newDel, setNewDel] = useState({ name: '', type: 'Ad Film' });

  async function runPlan() {
    setRunning(true);
    try {
      const { plan } = await api.runPlan(client);
      await onSave({ ...client, plan });
    } catch (e) { alert('Plan generation failed: ' + e.message); }
    finally { setRunning(false); }
  }

  async function addDeliverable() {
    if (!newDel.name.trim()) return;
    const deliverables = [...(client.deliverables || []), { ...newDel, id: Date.now(), progress: 0 }];
    setNewDel({ name: '', type: 'Ad Film' });
    await onSave({ ...client, deliverables });
  }

  async function updateProgress(id, progress) {
    const deliverables = (client.deliverables || []).map(d => d.id === id ? { ...d, progress } : d);
    await onSave({ ...client, deliverables });
  }

  async function removeDeliverable(id) {
    const deliverables = (client.deliverables || []).filter(d => d.id !== id);
    await onSave({ ...client, deliverables });
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Marketing Plan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Marketing Plan</div>
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>Campaign direction, formats, platform strategy</div>
        </div>
        <button className="btn btn-primary" onClick={runPlan} disabled={running}>
          {running ? <><div className="spinner" /> Generating...</> : client.plan ? '↺ Regenerate Plan' : 'Generate Plan →'}
        </button>
      </div>

      {running ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dim)', fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 24 }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          Building campaign strategy...
        </div>
      ) : client.plan ? (
        <div className="ai-output" style={{ marginBottom: 24 }}>{client.plan}</div>
      ) : (
        <div className="empty" style={{ marginBottom: 24 }}>
          <div className="empty-icon">⊙</div>
          <div>No plan yet. Run research first for better results.</div>
        </div>
      )}

      <div className="separator" />

      {/* Deliverables */}
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Deliverables</div>

      {(client.deliverables || []).map(d => (
        <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)', whiteSpace: 'nowrap' }}>{d.type}</span>
          <span style={{ flex: 1, fontSize: 12 }}>{d.name}</span>
          <div style={{ width: 80, height: 3, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${d.progress}%`, background: 'var(--accent)', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--dim)', width: 32 }}>{d.progress}%</span>
          <input type="range" min={0} max={100} value={d.progress} onChange={e => updateProgress(d.id, +e.target.value)} style={{ width: 60 }} />
          <button onClick={() => removeDeliverable(d.id)} style={{ background: 'none', border: 'none', color: 'var(--hint)', cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      ))}

      <div className="row" style={{ marginTop: 10 }}>
        <input type="text" placeholder="Deliverable name..." value={newDel.name} onChange={e => setNewDel(n => ({ ...n, name: e.target.value }))} style={{ flex: 2 }} onKeyDown={e => e.key === 'Enter' && addDeliverable()} />
        <select value={newDel.type} onChange={e => setNewDel(n => ({ ...n, type: e.target.value }))} style={{ flex: 1 }}>
          {DEL_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="btn btn-primary" onClick={addDeliverable}>+ Add</button>
      </div>
    </div>
  );
}
