import React, { useState } from 'react';
import { ClientSelector } from './Shared';

const PHASES = [
  { key: 'discovery', label: 'Discovery & Research' },
  { key: 'strategy', label: 'Strategy & Planning' },
  { key: 'preproduction', label: 'Pre-Production' },
  { key: 'production', label: 'Production / Shoot' },
  { key: 'postproduction', label: 'Post-Production' },
  { key: 'delivery', label: 'Delivery & Review' },
];

export default function ProgressPanel({ clients, activeClientId, setActiveClientId, updateActiveClient }) {
  const [inputs, setInputs] = useState({});
  const activeClient = clients.find(c => c.id === activeClientId);

  const tasks = activeClient?.tasks || {};

  const toggleTask = async (phase, idx) => {
    const phaseTasks = [...(tasks[phase] || [])];
    phaseTasks[idx] = { ...phaseTasks[idx], done: !phaseTasks[idx].done };
    await updateActiveClient({ tasks: { ...tasks, [phase]: phaseTasks } });
  };

  const addTask = async (phase) => {
    const text = (inputs[phase] || '').trim();
    if (!text) return;
    const phaseTasks = [...(tasks[phase] || []), { text, done: false }];
    await updateActiveClient({ tasks: { ...tasks, [phase]: phaseTasks } });
    setInputs(i => ({ ...i, [phase]: '' }));
  };

  const removeTask = async (phase, idx) => {
    const phaseTasks = (tasks[phase] || []).filter((_, i) => i !== idx);
    await updateActiveClient({ tasks: { ...tasks, [phase]: phaseTasks } });
  };

  const phaseStatus = (phase) => {
    const t = tasks[phase] || [];
    if (!t.length) return 'todo';
    const done = t.filter(x => x.done).length;
    if (done === t.length) return 'done';
    if (done > 0) return 'inprogress';
    return 'todo';
  };

  const overallProgress = () => {
    const all = PHASES.flatMap(p => tasks[p.key] || []);
    if (!all.length) return 0;
    return Math.round(all.filter(t => t.done).length / all.length * 100);
  };

  return (
    <div className="panel">
      <div className="section-label" style={{ marginBottom: 16 }}>Production Progress</div>
      <ClientSelector clients={clients} activeClientId={activeClientId} setActiveClientId={setActiveClientId} />

      {!activeClient && (
        <div className="empty-state"><div className="icon">◎</div><div>Select a client to track progress</div></div>
      )}

      {activeClient && (
        <>
          {/* Overall progress */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 11 }}>
              <span style={{ color: 'var(--dim)' }}>Overall Progress</span>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{overallProgress()}%</span>
            </div>
            <div className="prog-bar-wrap" style={{ maxWidth: '100%' }}>
              <div className="prog-bar" style={{ width: `${overallProgress()}%` }} />
            </div>
          </div>

          {PHASES.map(ph => {
            const phaseTasks = tasks[ph.key] || [];
            const done = phaseTasks.filter(t => t.done).length;
            const status = phaseStatus(ph.key);
            return (
              <div key={ph.key} className="phase-block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="phase-title">{ph.label}</span>
                    <span className={`phase-badge badge-${status}`}>
                      {status === 'inprogress' ? 'In progress' : status}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--dim)' }}>{done}/{phaseTasks.length}</span>
                </div>

                {phaseTasks.map((t, i) => (
                  <div key={i} className="task-row">
                    <div className={`task-cb${t.done ? ' checked' : ''}`} onClick={() => toggleTask(ph.key, i)}>
                      {t.done && '✓'}
                    </div>
                    <span className={`task-text${t.done ? ' done' : ''}`}>{t.text}</span>
                    <button onClick={() => removeTask(ph.key, i)}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>×</button>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <input type="text" value={inputs[ph.key] || ''} placeholder="Add task..."
                    style={{ flex: 1, fontSize: 11, padding: '5px 8px' }}
                    onChange={e => setInputs(i => ({ ...i, [ph.key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addTask(ph.key)} />
                  <button className="btn btn-sm" onClick={() => addTask(ph.key)}>+</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
