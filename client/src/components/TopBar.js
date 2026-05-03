import React from 'react';

export default function TopBar({ onAdd, onLogout }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 52,
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--accent)', letterSpacing: '0.05em' }}>
          BRAIN CHEMICALS
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 12 }}>/</span>
        <span style={{ color: 'var(--dim)', fontSize: 12 }}>Pitch OS</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>+ New Client</button>
        <button className="btn btn-sm" onClick={onLogout} title="Disconnect Drive">⊗ Drive</button>
      </div>
    </div>
  );
}
