import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabase.js';

function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="static-page auth-page">
      <section className="page-header">
        <span className="header-tag">Authentication Module</span>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
      </section>
      <div className="auth-container">
        {children}
      </div>
    </main>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.toLowerCase().includes('invalid login credentials')) {
        setError('No account found with this email. Create a new account to continue.');
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/dashboard' } });
  };

  return (
    <AuthLayout title="Operator Login" subtitle="Access your ResuMetric Enterprise profile.">
      <form onSubmit={handleLogin} className="auth-form">
        {error && <div className="error-module">ERROR: {error}</div>}
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="operator@domain.com" />
        </div>
        <div className="input-group">
          <div className="password-header">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <button type="submit" className="primary-action" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
      
      <div className="oauth-divider"><span>OR INITIALIZE VIA</span></div>
      
      <div className="oauth-grid">
        <button className="secondary-action" onClick={() => handleOAuth('google')}>Continue with Google</button>
        <button className="secondary-action" onClick={() => handleOAuth('github')}>Continue with GitHub</button>
      </div>

      <div className="auth-footer">
        <span>NO ACTIVE CLEARANCE?</span> <Link to="/signup">CREATE ACCOUNT</Link>
      </div>
    </AuthLayout>
  );
}

export function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccess('Verification required. Check your email payload to initialize clearance.');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/dashboard' } });
  };

  return (
    <AuthLayout title="Initialize Clearance" subtitle="Create a new ResuMetric Enterprise profile.">
      <form onSubmit={handleSignUp} className="auth-form">
        {error && <div className="error-module">ERROR: {error}</div>}
        {success && <div className="success-module">STATUS: {success}</div>}
        
        <div className="input-group">
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Operator Designation" />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="operator@domain.com" />
        </div>
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <div className="input-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        
        <button type="submit" className="primary-action" disabled={loading}>
          {loading ? 'Processing...' : 'Create Account'}
        </button>
      </form>
      
      <div className="oauth-divider"><span>OR INITIALIZE VIA</span></div>
      
      <div className="oauth-grid">
        <button className="secondary-action" onClick={() => handleOAuth('google')}>Google Sign Up</button>
        <button className="secondary-action" onClick={() => handleOAuth('github')}>GitHub Sign Up</button>
      </div>

      <div className="auth-footer">
        <span>CLEARANCE GRANTED?</span> <Link to="/login">SIGN IN</Link>
      </div>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess('Recovery sequence initiated. Check your email for instructions.');
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Recover Clearance" subtitle="Request a password reset link.">
      <form onSubmit={handleReset} className="auth-form">
        {error && <div className="error-module">ERROR: {error}</div>}
        {success && <div className="success-module">STATUS: {success}</div>}
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="operator@domain.com" />
        </div>
        <button type="submit" className="primary-action" disabled={loading}>
          {loading ? 'Transmitting...' : 'Send Recovery Link'}
        </button>
      </form>
      <div className="auth-footer">
        <Link to="/login">RETURN TO LOGIN</Link>
      </div>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Clearance updated successfully.');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Update Clearance" subtitle="Enter your new security passkey.">
      <form onSubmit={handleUpdate} className="auth-form">
        {error && <div className="error-module">ERROR: {error}</div>}
        {success && <div className="success-module">STATUS: {success}</div>}
        <div className="input-group">
          <label htmlFor="password">New Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <button type="submit" className="primary-action" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
