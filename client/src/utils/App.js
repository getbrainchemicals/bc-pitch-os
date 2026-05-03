import React, { useState, useEffect, useCallback } from 'react';
import api from './utils/api';
import ClientsPanel from './components/ClientsPanel';
import ResearchPanel from './components/ResearchPanel';
import PlanPanel from './components/PlanPanel';
import ProgressPanel from './components/ProgressPanel';
import NotesPanel from './components/NotesPanel';
import ProposalPanel from './components/ProposalPanel';
import './App.css';

const TABS = [
  { id: 'clients', label: 'Clients' },
  { id: 'research', label: 'Research' },
  { id: 'plan', label: 'Plan' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'progress', label: 'Progress' },
  { id: 'notes', label: 'Notes' },
];

export default function App() {
  const [tab, setTab] = useState('clients');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/status');
      setUser(data.authenticated ? data.user : null);
      if (data.authenticated) fetchClients();
    } catch { setUser(null); }
    setAuthChecked(true);
  }, [fetchClients]);

  useEffect(() => {
    checkAuth();
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/');
    }
  }, [checkAuth]);

  const saveClient = async (client) => {
    try {
      if (client._fileId) {
        await api.put(`/clients/${client._fileId}`, client);
        setClients(prev => prev.map(c => c._fileId === client._fileId ? client : c));
      } else {
        const { data } = await api.post('/clients', client);
        setClients(prev => [...prev, data]);
        setActiveClientId(data.id);
      }
    } catch (e) { alert('Save failed: ' + e.message); }
  };

  const deleteClient = async (client) => {
    if (!window.confirm(`Delete ${client.name}?`)) return;
    try {
      await api.delete(`/clients/${client._fileId}`);
      setClients(prev => prev.filter(c => c._fileId !== client._fileId));
      if (activeClientId === client.id) setActiveClientId(null);
    } catch (e) { alert('Delete failed: ' + e.message); }
  };

  const activeClient = clients.find(c => c.id === activeClientId) || null;

  const updateActiveClient = async (updates) => {
    if (!activeClient) return;
    const updated = { ...activeClient, ...updates };
    await saveClient(updated);
  };

  const login = () => { window.location.href = \`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/google\`; };
  const logout = async () => { await api.post('/auth/logout'); setUser(null); setClients([]); };

  if (!authChecked) return (
    <div className="splash">
      <div className="splash-logo">BC</div>
      <div className="splash-sub">loading...</div>
    </div>
  );

  if (!user) return (
    <div className="splash">
      <div className="splash-logo">BRAIN CHEMICALS</div>
      <div className="splash-product">Pitch OS</div>
      <p className="splash-tagline">Client research. Marketing plans. Proposals.<br/>All in one place. All in your Drive.</p>
      <button className="btn btn-primary splash-btn" onClick={login}>
        Connect Google Drive →
      </button>
      <div className="splash-note">Your data lives in your own Google Drive. Nothing stored elsewhere.</div>
    </div>
  );

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-left">
          <div className="logo">BC <span>/ Pitch OS</span></div>
          <nav className="nav">
            {TABS.map(t => (
              <button key={t.id} className={`nav-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="topbar-right">
          {activeClient && (
            <div className="active-client-badge">
              <span className="badge-dot" />
              {activeClient.name}
            </div>
          )}
          {user.picture && <img src={user.picture} alt="" className="user-avatar" />}
          <button className="btn btn-sm" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="main">
        {tab === 'clients' && (
          <ClientsPanel clients={clients} activeClientId={activeClientId}
            setActiveClientId={setActiveClientId} saveClient={saveClient}
            deleteClient={deleteClient} loading={loading} setTab={setTab} />
        )}
        {tab === 'research' && (
          <ResearchPanel clients={clients} activeClientId={activeClientId}
            setActiveClientId={setActiveClientId} updateActiveClient={updateActiveClient} />
        )}
        {tab === 'plan' && (
          <PlanPanel clients={clients} activeClientId={activeClientId}
            setActiveClientId={setActiveClientId} updateActiveClient={updateActiveClient} />
        )}
        {tab === 'proposal' && (
          <ProposalPanel clients={clients} activeClientId={activeClientId}
            setActiveClientId={setActiveClientId} updateActiveClient={updateActiveClient} />
        )}
        {tab === 'progress' && (
          <ProgressPanel clients={clients} activeClientId={activeClientId}
            setActiveClientId={setActiveClientId} updateActiveClient={updateActiveClient} />
        )}
        {tab === 'notes' && (
          <NotesPanel clients={clients} activeClientId={activeClientId}
            setActiveClientId={setActiveClientId} updateActiveClient={updateActiveClient} />
        )}
      </div>
    </div>
  );
}
