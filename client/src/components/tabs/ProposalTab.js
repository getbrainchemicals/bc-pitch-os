import React, { useState } from 'react';
import { api } from '../../utils/api';

const PROPOSAL_TYPES = [
  'Full Campaign Proposal',
  'Content Strategy Proposal',
  'Brand Film Proposal',
  'Social Media Retainer',
  'Ad Film Proposal',
  'Exploratory Pitch',
];

export default function ProposalTab({ client, onSave }) {
  const [keyPoints, setKeyPoints] = useState('');
  const [proposalType, setProposalType] = useState(PROPOSAL_TYPES[0]);
  const [generating, setGenerating] = useState(false);
  const [proposalText, setProposalText] = useState(client.latestProposal || '');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  const [editMode, setEditMode] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const { proposal } = await api.generateProposal(client, keyPoints, proposalType);
      setProposalText(proposal);
      setEditMode(false);
      const proposals = [...(client.proposals || []), {
        id: Date.now(),
        type: proposalType,
        text: proposal,
        createdAt: new Date().toISOString()
      }];
      await onSave({ ...client, latestProposal: proposal, proposals });
    } catch (e) { alert('Generation failed: ' + e.message); }
    finally { setGenerating(false); }
  }

  async function exportPdf() {
    if (!proposalText) return;
    setExportingPdf(true);
    try { await api.exportPdf(proposalText, client.name, proposalType); }
    catch (e) { alert('PDF export failed: ' + e.message); }
    finally { setExportingPdf(false); }
  }

  async function exportDocx() {
    if (!proposalText) return;
    setExportingDocx(true);
    try { await api.exportDocx(proposalText, client.name, proposalType); }
    catch (e) { alert('DOCX export failed: ' + e.message); }
    finally { setExportingDocx(false); }
  }

  async function saveEdited() {
    await onSave({ ...client, latestProposal: proposalText });
    setEditMode(false);
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Config */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Proposal Generator</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="label">Proposal Type</div>
            <select value={proposalType} onChange={e => setProposalType(e.target.value)}>
              {PROPOSAL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <div className="label">Status context</div>
            <div style={{ fontSize: 11, color: 'var(--dim)', padding: '8px 0' }}>
              {client.research ? '✓ Research available' : '✗ No research'} &nbsp;·&nbsp;
              {client.plan ? '✓ Plan available' : '✗ No plan'}
            </div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <div className="label">Key Points to Include (optional)</div>
          <textarea
            rows={3}
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            placeholder="e.g. Emphasise 3-reel series, include panchakarma documentary, budget range ₹8L, 6-week timeline..."
          />
        </div>

        <div className="row">
          <button className="btn btn-accent" onClick={generate} disabled={generating}>
            {generating ? <><div className="spinner" /> Generating proposal...</> : proposalText ? '↺ Regenerate' : 'Generate Proposal →'}
          </button>
          {proposalText && !generating && (
            <>
              <button className="btn btn-sm btn-primary" onClick={exportPdf} disabled={exportingPdf}>
                {exportingPdf ? <><div className="spinner" /> Exporting...</> : '↓ PDF'}
              </button>
              <button className="btn btn-sm btn-primary" onClick={exportDocx} disabled={exportingDocx}>
                {exportingDocx ? <><div className="spinner" /> Exporting...</> : '↓ Word Doc'}
              </button>
              <button className="btn btn-sm" onClick={() => setEditMode(e => !e)}>
                {editMode ? 'Preview' : 'Edit'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Output */}
      {generating ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--dim)', fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Writing {proposalType.toLowerCase()} for {client.name}...
        </div>
      ) : proposalText ? (
        editMode ? (
          <div>
            <textarea
              value={proposalText}
              onChange={e => setProposalText(e.target.value)}
              style={{ height: 520, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.8 }}
            />
            <button className="btn btn-accent" onClick={saveEdited} style={{ marginTop: 8 }}>Save Edits</button>
          </div>
        ) : (
          <div className="ai-output" style={{ maxHeight: 520 }}>{proposalText}</div>
        )
      ) : (
        <div className="empty">
          <div className="empty-icon">◻</div>
          <div>Configure and generate a proposal above.</div>
          <div style={{ fontSize: 11, marginTop: 6, color: 'var(--hint)' }}>Better output when Research + Plan are done first.</div>
        </div>
      )}

      {/* Proposal history */}
      {(client.proposals || []).length > 1 && (
        <div style={{ marginTop: 20 }}>
          <div className="label" style={{ marginBottom: 8 }}>Previous Proposals</div>
          {[...(client.proposals || [])].reverse().slice(1).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 6 }}>
              <span style={{ flex: 1, fontSize: 11 }}>{p.type} — {new Date(p.createdAt).toLocaleDateString('en-IN')}</span>
              <button className="btn btn-xs" onClick={() => { setProposalText(p.text); setEditMode(false); }}>Load</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
