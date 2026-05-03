import React, { useState } from 'react';
import api from '../utils/api';

// ─── Chat Input Box ───────────────────────────────────────────────────────
export function ChatInput({ client, tab, onInstruction, placeholder }) {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const clientContext = client ? `Client: ${client.name}\nIndustry: ${client.industry || ''}\nBrief: ${client.brief || ''}\nResearch: ${client.research || '(not yet generated)'}\nPlan: ${client.plan || '(not yet generated)'}` : '';

  const send = async (asInstruction = false) => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    if (asInstruction) { onInstruction(msg); return; }

    const newChat = [...chat, { role: 'user', content: msg }];
    setChat(newChat);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { message: msg, clientContext, tab, history: chat });
      setChat([...newChat, { role: 'assistant', content: data.text }]);
    } catch (e) {
      setChat([...newChat, { role: 'assistant', content: 'Error: ' + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <button className="btn btn-sm"
        style={{ marginBottom: open ? 10 : 0, borderColor: open ? 'var(--accent2)' : undefined, color: open ? 'var(--accent2)' : undefined }}
        onClick={() => setOpen(o => !o)}>
        {open ? '↑ Close' : '💬 Chat with Claude'}
      </button>

      {open && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          {chat.length > 0 && (
            <div style={{ maxHeight: 260, overflowY: 'auto', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              {chat.map((m, i) => (
                <div key={i} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', fontSize: 12, lineHeight: 1.7, padding: '7px 11px', borderRadius: 5,
                    background: m.role === 'user' ? 'rgba(200,240,96,0.08)' : 'var(--surface2)',
                    border: `1px solid ${m.role === 'user' ? 'rgba(200,240,96,0.15)' : 'var(--border)'}`,
                    color: m.role === 'user' ? 'var(--accent)' : 'var(--text)', whiteSpace: 'pre-wrap',
                  }}>{m.content}</div>
                </div>
              ))}
              {loading && <div style={{ fontSize: 11, color: 'var(--dim)', fontStyle: 'italic' }}>Thinking<span className="cursor-blink" /></div>}
            </div>
          )}
          <div style={{ padding: '10px 12px' }}>
            <textarea rows={3} value={input} onChange={e => setInput(e.target.value)}
              placeholder={placeholder || 'Ask Claude anything, or give specific instructions for the output...'}
              style={{ marginBottom: 8 }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) { e.preventDefault(); send(false); } }} />
            <div className="btn-row">
              <button className="btn btn-sm" onClick={() => send(false)} disabled={loading || !input.trim()}>Chat ↵</button>
              <button className="btn btn-sm btn-primary" onClick={() => send(true)} disabled={!input.trim()}>✦ Use as Instruction →</button>
              {chat.length > 0 && (
                <button className="btn btn-sm" style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }} onClick={() => setChat([])}>Clear</button>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>⌘+Enter to chat · "Use as Instruction" feeds your message into the next Generate</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client Selector ──────────────────────────────────────────────────────
export function ClientSelector({ clients, activeClientId, setActiveClientId }) {
  return (
    <div className="field-group" style={{ maxWidth: 300 }}>
      <div className="field-label">Client</div>
      <select value={activeClientId || ''} onChange={e => setActiveClientId(e.target.value || null)}>
        <option value="">— select client —</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}

// ─── AI Output ────────────────────────────────────────────────────────────
export function AIOutput({ text, loading, placeholder }) {
  if (loading) return (
    <div className="ai-box"><span className="loading-text">Thinking</span><span className="cursor-blink" /></div>
  );
  if (!text) return <div className="ai-box"><span className="loading-text">{placeholder || 'Nothing generated yet.'}</span></div>;

  return (
    <div className="ai-box">
      {text.split('\n').map((line, i) => {
        const isHeader = line.trim() && line.trim() === line.trim().toUpperCase()
          && line.trim().replace(/[^A-Z&() /]/g, '').length > 3;
        return <React.Fragment key={i}>{isHeader ? <span className="section-head">{line}</span> : <span>{line}</span>}{'\n'}</React.Fragment>;
      })}
    </div>
  );
}
