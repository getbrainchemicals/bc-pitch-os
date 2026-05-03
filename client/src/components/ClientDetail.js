import React, { useState } from 'react';
import OverviewTab from './tabs/OverviewTab';
import ResearchTab from './tabs/ResearchTab';
import PlanTab from './tabs/PlanTab';
import ProposalTab from './tabs/ProposalTab';
import ProgressTab from './tabs/ProgressTab';
import NotesTab from './tabs/NotesTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'research', label: 'Research' },
  { id: 'plan', label: 'Plan' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'progress', label: 'Progress' },
  { id: 'notes', label: 'Notes' },
];

export default function ClientDetail({ client, onSave, onDelete, onRefresh }) {
  const [tab, setTab] = useState('overview');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Client Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>{client.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
              <span className={`tag tag-${client.status}`}>{client.status}</span>
              {client.industry && <span style={{ fontSize: 11, color: 'var(--dim)' }}>{client.industry}</span>}
              {client.website && (
                <a href={client.website} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--blue)', textDecoration: 'none' }}>
                  {client.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
          <div className="row">
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(client.id)}>Delete</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', background: 'none',
              border: 'none', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
              color: tab === t.id ? 'var(--accent)' : 'var(--dim)',
              cursor: 'pointer', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'color 0.15s', fontFamily: 'var(--font-mono)'
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {tab === 'overview' && <OverviewTab client={client} onSave={onSave} />}
        {tab === 'research' && <ResearchTab client={client} onSave={onSave} />}
        {tab === 'plan' && <PlanTab client={client} onSave={onSave} />}
        {tab === 'proposal' && <ProposalTab client={client} onSave={onSave} />}
        {tab === 'progress' && <ProgressTab client={client} onSave={onSave} />}
        {tab === 'notes' && <NotesTab client={client} onSave={onSave} />}
      </div>
    </div>
  );
}
