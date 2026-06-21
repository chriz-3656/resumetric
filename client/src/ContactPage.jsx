import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.js';

export function ContactPage({ session }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Support',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || ''
      }));
    }
  }, [session]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error');
      setErrorMsg('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (formData.message.length < 10) {
      setStatus('error');
      setErrorMsg('Message must be at least 10 characters long.');
      return;
    }
    if (formData.message.length > 2000) {
      setStatus('error');
      setErrorMsg('Message must be under 2000 characters.');
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          user_id: session?.user?.id || null,
          status: 'new'
        }]);

      if (error) throw error;
      
      setStatus('success');
      setFormData({ name: '', email: '', category: 'Support', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An error occurred while sending your message. Please try again.');
    }
  };

  return (
    <main className="static-page">
      <section className="page-header">
        <span className="header-tag">Get in Touch</span>
        <h1>Contact ResuMetric</h1>
        <p className="auth-subtitle">We're here to help you optimize your career trajectory.</p>
      </section>
      
      <section className="content-section" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {status === 'success' ? (
          <div className="success-module" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--panel)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Message Sent Successfully</h3>
            <p style={{ margin: 0 }}>Thank you for reaching out to ResuMetric. Our team will review your message and get back to you shortly.</p>
            <button onClick={() => setStatus('idle')} className="secondary-action" style={{ marginTop: '2rem' }}>Send Another Message</button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {status === 'error' && <div className="error-module">{errorMsg}</div>}
            
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Jane Smith" />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
            </div>

            <div className="input-group">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'var(--body)' }}>
                <option value="Support">Support</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Business Inquiry">Business Inquiry</option>
                <option value="Partnership">Partnership</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="subject">Subject</label>
              <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required placeholder="How can we help?" />
            </div>

            <div className="input-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows="6" placeholder="Please provide detailed information..." style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical', fontFamily: 'var(--body)' }}></textarea>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>{formData.message.length}/2000</small>
            </div>

            <button type="submit" className="primary-action" disabled={status === 'submitting'} style={{ width: '100%' }}>
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
