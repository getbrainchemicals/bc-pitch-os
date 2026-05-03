import React, { useState } from 'react';
import { ClientSelector } from './Shared';

export default function NotesPanel({ clients, activeClientId, setActiveClientId, updateActiveClient }) {
  const [text, setText] = useState('');
  const activeClient = clients.find(c => c.id === activeClientId);

  const addNote = async () => {
    if (!text.trim() || !activeClient) return;
    const note = {
      text: text.trim(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      ts: Date.now(),
    };
    const notes = [...(activeClient.notes || []), note];
    await updateActiveClient({ notes });
    setText('');
  };

  const deleteNote = async (ts) => {
    const notes = (activeClient.notes || []).filter(n => n.ts !== ts);
    await updateActiveClient({ notes });
  };

  const notes = [...(activeClient?.notes || [])].reverse();

  return (
    <div className="panel">
      <div className="section-label" style={{ marginBottom: 16 }}>Notes & Observations</div>
      <ClientSelector clients={clients} activeClientId={activeClientId} setActiveClientId={setActiveClientId} />

      {!activeClient && (
        <div className="empty-state"><div className="icon">◎</div><div>Select a client to view notes</div></div>
      )}

      {activeClient && (
        <>
          <div className="field-group">
            <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
              placeholder="Write a note — call recap, brief update, idea, direction change, anything..."
              onKeyDown={e => e.key === 'Enter' && e.metaKey && addNote()} />
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>⌘ + Enter to save</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={addNote} style={{ marginBottom: 20 }}>
            Save Note →
          </button>

          {notes.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>No notes yet.</div>
          )}

          {notes.map(n => (
            <div key={n.ts} className="note-card">
              <div style={{ whiteSpace: 'pre-wrap' }}>{n.text}</div>
              <div className="note-meta">
                <span>{n.date}</span>
                <span style={{ cursor: 'pointer', color: 'var(--red)' }} onClick={() => deleteNote(n.ts)}>delete</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
