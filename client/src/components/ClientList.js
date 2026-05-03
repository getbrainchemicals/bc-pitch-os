import React, { useState } from 'react';

const STATUS_ORDER = ['active', 'pitched', 'prospect', 'won', 'lost'];

export default function ClientList({ clients, loading, selectedId, onSelect, onAdd }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = clients
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.industry || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));

  return (
    <div style={{
      width: 240, flexShrink: 0, borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'var(--surface)'
    }}>
      {/* Search */}
      <div style={{ padding: '12px 12px 8px' }}>
        <input
          type="text" placeholder="Search clients..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ fontSize: 11 }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 12px 10px', flexWrap: 'wrap' }}>
        {['all', 'active', 'pitched', 'prospect', 'won', 'lost'].map(s => (
          <button
            key={s} onClick={() => setFilter(s)}
            style={{
              fontSize: 10, padding: '3px 8px', border: '1px solid',
              borderColor: filter === s ? 'var(--accent)' : 'var(--border)',
              background: 'transparent',
              color: filter === s ? 'var(--accent)' : 'var(--hint)',
              borderRadius: 3, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}
          >{s}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--hint)', fontSize: 11 }}>
            {clients.length === 0 ? 'No clients yet' : 'No matches'}
          </div>
        ) : filtered.map(c => (
          <div
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              padding: '10px 10px', marginBottom: 4, borderRadius: 'var(--radius)',
              cursor: 'pointer', transition: 'background 0.1s',
              background: selectedId === c.id ? 'var(--surface2)' : 'transparent',
              border: `1px solid ${selectedId === c.id ? 'var(--border2)' : 'transparent'}`
            }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text)' }}>
              {c.name}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className={`tag tag-${c.status}`}>{c.status}</span>
              {c.industry && <span style={{ fontSize: 10, color: 'var(--hint)' }}>{c.industry}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--hint)', textAlign: 'center' }}>
          {clients.length} client{clients.length !== 1 ? 's' : ''} · Synced to Drive
        </div>
      </div>
    </div>
  );
}
