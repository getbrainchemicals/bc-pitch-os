import React, { useState } from 'react';

export default function AddClientModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: '', status: 'prospect', website: '', social: '', industry: '', brief: '' });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd(form);
    setSaving(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>New Client</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field grow">
            <div className="label">Client / Brand Name *</div>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Malabar Gold" autoFocus />
          </div>
          <div className="field">
            <div className="label">Status</div>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="pitched">Pitched</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <div className="field">
          <div className="label">Industry / Category</div>
          <input type="text" value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Jewellery, F&B, Ayurveda" />
        </div>
        <div className="field">
          <div className="label">Website URL</div>
          <input type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <div className="label">Social / Other Links (comma separated)</div>
          <input type="text" value={form.social} onChange={e => set('social', e.target.value)} placeholder="https://instagram.com/..., https://youtube.com/..." />
        </div>
        <div className="field">
          <div className="label">Initial Brief</div>
          <textarea value={form.brief} onChange={e => set('brief', e.target.value)} rows={3} placeholder="What do we know? What are they asking for?" />
        </div>

        <div className="row" style={{ marginTop: 4 }}>
          <button className="btn btn-accent" onClick={submit} disabled={!form.name.trim() || saving}>
            {saving ? <><div className="spinner" /> Saving...</> : 'Add Client →'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
