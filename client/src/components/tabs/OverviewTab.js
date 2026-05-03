import React, { useState, useEffect } from 'react';

export default function OverviewTab({ client, onSave }) {
  const [form, setForm] = useState(client);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(client); }, [client]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    await onSave(form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <div className="label">Client Name</div>
          <input type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="field">
          <div className="label">Status</div>
          <select value={form.status || 'prospect'} onChange={e => set('status', e.target.value)}>
            <option value="prospect">Prospect</option>
            <option value="active">Active</option>
            <option value="pitched">Pitched</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>
      <div className="field">
        <div className="label">Industry</div>
        <input type="text" value={form.industry || ''} onChange={e => set('industry', e.target.value)} />
      </div>
      <div className="field">
        <div className="label">Website</div>
        <input type="url" value={form.website || ''} onChange={e => set('website', e.target.value)} />
      </div>
      <div className="field">
        <div className="label">Social / Other Links</div>
        <input type="text" value={form.social || ''} onChange={e => set('social', e.target.value)} />
      </div>
      <div className="field">
        <div className="label">Brief / Context</div>
        <textarea rows={5} value={form.brief || ''} onChange={e => set('brief', e.target.value)} placeholder="Everything we know about this client and what they need." />
      </div>
      <div className="field">
        <div className="label">Contact Name</div>
        <input type="text" value={form.contactName || ''} onChange={e => set('contactName', e.target.value)} placeholder="Point of contact at the brand" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field">
          <div className="label">Contact Email</div>
          <input type="email" value={form.contactEmail || ''} onChange={e => set('contactEmail', e.target.value)} />
        </div>
        <div className="field">
          <div className="label">Budget Range</div>
          <input type="text" value={form.budget || ''} onChange={e => set('budget', e.target.value)} placeholder="e.g. ₹5–10L" />
        </div>
      </div>

      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn btn-accent" onClick={save} disabled={saving}>
          {saving ? <><div className="spinner" /> Saving...</> : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
