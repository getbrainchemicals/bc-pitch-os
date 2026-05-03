import React from 'react';

export function ClientSelector({ clients, activeClientId, setActiveClientId, label = 'Client' }) {
  return (
    <div className="field-group" style={{ maxWidth: 300 }}>
      <div className="field-label">{label}</div>
      <select value={activeClientId || ''} onChange={e => setActiveClientId(e.target.value || null)}>
        <option value="">— select client —</option>
        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );
}

export function AIOutput({ text, loading, placeholder = 'Nothing generated yet.' }) {
  if (loading) return (
    <div className="ai-box">
      <span className="loading-text">Thinking</span>
      <span className="cursor-blink" />
    </div>
  );
  if (!text) return <div className="ai-box"><span className="loading-text">{placeholder}</span></div>;

  // Highlight ALL CAPS headers
  const lines = text.split('\n');
  return (
    <div className="ai-box">
      {lines.map((line, i) => {
        const isHeader = line.trim() && line.trim() === line.trim().toUpperCase()
          && line.trim().replace(/[^A-Z&]/g, '').length > 3;
        return (
          <React.Fragment key={i}>
            {isHeader
              ? <span className="section-head">{line}</span>
              : <span>{line}</span>}
            {'\n'}
          </React.Fragment>
        );
      })}
    </div>
  );
}
