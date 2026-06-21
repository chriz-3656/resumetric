import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabase.js';

export function AdminMessagesPage({ session }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Protect route. Only users with role 'founder' or 'admin' can access.
  const isAdmin = session?.user?.user_metadata?.role === 'admin' || session?.user?.user_metadata?.role === 'founder';

  useEffect(() => {
    if (session && isAdmin) {
      fetchMessages();
    }
  }, [session, isAdmin]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
      setError('Access denied or failed to load messages. Make sure Row Level Security policies allow you to view messages.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      setMessages(messages.map(m => m.id === id ? { ...m, status } : m));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setMessages(messages.filter(m => m.id !== id));
    } catch (err) {
      alert('Failed to delete message.');
    }
  };

  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return (
    <main className="static-page">
      <div className="error-module" style={{ margin: '4rem auto', maxWidth: '400px', textAlign: 'center' }}>
        <h3>403 Forbidden</h3>
        <p>You do not have permission to access the founder dashboard.</p>
      </div>
    </main>
  );

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
    closed: messages.filter(m => m.status === 'closed').length,
  };

  return (
    <main className="static-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <section className="page-header" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
        <span className="header-tag">Founder Dashboard</span>
        <h1>Message Management</h1>
      </section>

      {error ? (
        <div className="error-module">{error}</div>
      ) : loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading messages securely...</div>
      ) : (
        <>
          <div className="section-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginBottom: '3rem' }}>
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--text)' }}>{stats.total}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Total</p>
            </div>
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--danger)' }}>{stats.new}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>New</p>
            </div>
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--amber)' }}>{stats.read}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Read</p>
            </div>
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--success)' }}>{stats.replied}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Replied</p>
            </div>
            <div className="stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-dim)' }}>{stats.closed}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Closed</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {messages.map(msg => (
              <div key={msg.id} className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {msg.status === 'new' && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span>}
                      {msg.subject}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <span><strong>From:</strong> {msg.name} ({msg.email})</span>
                      <span><strong>Category:</strong> <span style={{ background: 'var(--panel)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>{msg.category}</span></span>
                      <span><strong>Date:</strong> {new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select 
                      value={msg.status} 
                      onChange={(e) => updateStatus(msg.id, e.target.value)}
                      style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'var(--body)' }}
                    >
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button onClick={() => deleteMessage(msg.id)} style={{ padding: '0.4rem 0.75rem', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--body)' }}>Delete</button>
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem', background: 'var(--panel)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', fontFamily: 'var(--body)', lineHeight: '1.6', color: 'var(--text)' }}>
                  {msg.message}
                </div>
                
                {msg.user_id && (
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                    Registered Account ID: <code style={{ fontFamily: 'var(--mono)' }}>{msg.user_id}</code>
                  </div>
                )}
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                No messages found.
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
