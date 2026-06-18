import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase.js';

export function DashboardPage({ session }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    
    async function fetchHistory() {
      try {
        const apiRoot = window.location.hostname === 'localhost' ? import.meta.env.VITE_API_BASE_URL : '';
        const response = await fetch(`${apiRoot}/api/history`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to load history');
        const data = await response.json();
        setHistory(data.analyses);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [session, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this analysis?')) return;
    
    try {
      const apiRoot = window.location.hostname === 'localhost' ? import.meta.env.VITE_API_BASE_URL : '';
      const response = await fetch(`${apiRoot}/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete record');
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!session) return null;

  return (
    <main className="static-page dashboard-page">
      <section className="page-header">
        <span className="header-tag">Operator Profile</span>
        <h1>Control Panel</h1>
        <div className="dashboard-actions">
          <span className="operator-id">{session.user.email}</span>
          <button className="secondary-action" onClick={handleSignOut}>Terminate Session</button>
        </div>
      </section>

      {error && <div className="error-module">ERROR: {error}</div>}

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>Analysis Archive</h2>
          {loading ? (
            <div className="system-status"><span className="pulse-dot" /><span>Retrieving records...</span></div>
          ) : history.length === 0 ? (
            <p className="empty-state">No historical data found. Initialize a new scan to begin tracking.</p>
          ) : (
            <ul className="history-list">
              {history.map(item => (
                <li key={item.id} className="history-item">
                  <div className="history-meta">
                    <strong>{item.file_name}</strong>
                    <span>{new Date(item.created_at).toLocaleDateString()} | {item.industry}</span>
                  </div>
                  <div className="history-actions">
                    <div className="history-score">
                      <span>ATS Index:</span>
                      <strong>{item.analysis?.scores?.atsScore || 'N/A'}</strong>
                    </div>
                    <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Purge Record">✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel side-panel">
          <h2>Security Clearance</h2>
          <div className="profile-details">
            <div className="profile-header">
              {session.user.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="Operator Avatar" className="operator-avatar" />
              ) : (
                <div className="operator-avatar fallback">{session.user.email?.charAt(0).toUpperCase()}</div>
              )}
              <div className="profile-identity">
                <span className="spec-label">Operator</span>
                <span className="spec-value">{session.user.user_metadata?.full_name || session.user.email}</span>
              </div>
            </div>
            <div className="spec-item"><span className="spec-label">User ID</span><span className="spec-value">{session.user.id.split('-')[0]}***</span></div>
            <div className="spec-item"><span className="spec-label">Status</span><span className="spec-value" style={{color: 'var(--signal-green)'}}>ACTIVE</span></div>
            <div className="spec-item"><span className="spec-label">Storage</span><span className="spec-value">Permanent (Auth)</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
