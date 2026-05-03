import React, { useState } from 'react';

const STATUS_OPTIONS = ['prospect', 'active', 'pitched', 'won', 'lost'];

function statusDot(s) {
  return { prospect: 'dot-prospect', active: 'dot-active', pitched: 'dot-pitched', won: 'dot-won', lost: 'dot-lost' }[s] || 'dot-prospect';
}

const EMPTY_FORM = { name: '', status: 'prospect', website: '', social: '', industry: '', brief: '' };

export default function ClientsPanel({ clients, activeClientId, setActiveClientId, saveClient, deleteClient, loading, setTab }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editMode, setEditMode] = useState(false);

  const activeClient = clients.find(c => c.id === activeClientId);

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await saveClient({ ...form });
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleEdit = async () => {
    await saveClient({ ...activeClient, ...form });
    setEditMode(false);
  };

  const startEdit = () => {
    setForm({ name: activeClient.name, status: activeClient.status, website: activeClient.website || '',
      social: activeClient.social || '', industry: activeClient.industry || '', brief: activeClient.brief || '' });
    setEditMode(true);
  };

  return (
    <div className="panel-split">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="section-label">Client Roster</div>
        {loading && <div className="loading-text" style={{ fontSize: 11 }}>Loading...</div>}
        {clients.map(c => (
          <div key={c.id} className={`client-card${activeClientId === c.id ? ' active' : ''}`}
            onClick={() => { setActiveClientId(c.id); setEditMode(false); }}>
            <div className="client-name-sm">{c.name}</div>
            <div className="client-meta-sm">
              <span className={`status-dot ${statusDot(c.status)}`} />
              {c.status} {c.industry ? `· ${c.industry}` : ''}
            </div>
          </div>
        ))}
        <button className="btn btn-sm" style={{ width: '100%', marginTop: 8 }}
          onClick={() => { setShowForm(true); setEditMode(false); setActiveClientId(null); }}>
          + New Client
        </button>
      </div>

      {/* Main content */}
      <div className="panel-content">
        {showForm && (
          <ClientForm form={form} setForm={setForm}
            onSubmit={handleAdd} onCancel={() => setShowForm(false)} title="New Client" />
        )}

        {!showForm && !activeClient && (
          <div className="empty-state">
            <div className="icon">◎</div>
            <div>Select a client or add a new one</div>
          </div>
        )}

        {!showForm && activeClient && !editMode && (
          <ClientDetail client={activeClient} onEdit={startEdit}
            onDelete={() => deleteClient(activeClient)} setTab={setTab} setActiveClientId={setActiveClientId} />
        )}

        {!showForm && activeClient && editMode && (
          <ClientForm form={form} setForm={setForm}
            onSubmit={handleEdit} onCancel={() => setEditMode(false)} title={`Edit — ${activeClient.name}`} />
        )}
      </div>
    </div>
  );
}

function ClientForm({ form, setForm, onSubmit, onCancel, title }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div>
      <div className="section-label" style={{ marginBottom: 16 }}>{title}</div>
      <div className="grid2">
        <div className="field-group">
          <div className="field-label">Brand / Client Name</div>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Malabar Gold" />
        </div>
        <div className="field-group">
          <div className="field-label">Status</div>
          <select value={form.status} onChange={e => set('status', e.target.value)}>
            {['prospect','active','pitched','won','lost'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="field-group">
        <div className="field-label">Website</div>
        <input type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
      </div>
      <div className="field-group">
        <div className="field-label">Social / Other Links (comma separated)</div>
        <input type="text" value={form.social} onChange={e => set('social', e.target.value)} placeholder="https://instagram.com/..., https://youtube.com/..." />
      </div>
      <div className="field-group">
        <div className="field-label">Industry</div>
        <input type="text" value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Jewellery, F&B, Wellness" />
      </div>
      <div className="field-group">
        <div className="field-label">Brief / Context</div>
        <textarea rows={4} value={form.brief} onChange={e => set('brief', e.target.value)} placeholder="What do we know? What are they asking for?" />
      </div>
      <div className="btn-row">
        <button className="btn btn-primary" onClick={onSubmit}>Save →</button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function ClientDetail({ client, onEdit, onDelete, setTab, setActiveClientId }) {
  const goTo = (tab) => { setTab(tab); };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{client.name}</div>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`status-dot ${({ prospect:'dot-prospect',active:'dot-active',pitched:'dot-pitched',won:'dot-won',lost:'dot-lost' }[client.status])}`} />
            {client.status} {client.industry ? `· ${client.industry}` : ''}
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div className="separator" />

      {client.website && (
        <div className="field-group">
          <div className="field-label">Website</div>
          <a href={client.website} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>{client.website}</a>
        </div>
      )}
      {client.social && (
        <div className="field-group">
          <div className="field-label">Links</div>
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>{client.social}</div>
        </div>
      )}
      {client.brief && (
        <div className="field-group">
          <div className="field-label">Brief</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>{client.brief}</div>
        </div>
      )}

      <div className="separator" />

      <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: 'var(--dim)', marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quick Access</div>
      <div className="btn-row">
        <button className="btn btn-sm" onClick={() => goTo('research')}>Research ↗</button>
        <button className="btn btn-sm" onClick={() => goTo('plan')}>Marketing Plan ↗</button>
        <button className="btn btn-sm" onClick={() => goTo('proposal')}>Proposal ↗</button>
        <button className="btn btn-sm" onClick={() => goTo('progress')}>Progress ↗</button>
        <button className="btn btn-sm" onClick={() => goTo('notes')}>Notes ↗</button>
      </div>

      {(client.research || client.plan) && (
        <>
          <div className="separator" />
          <div className="section-label">Snapshot</div>
          {client.research && (
            <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 8 }}>
              ✓ Research generated
            </div>
          )}
          {client.plan && (
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>
              ✓ Marketing plan ready
            </div>
          )}
        </>
      )}
    </div>
  );
}
