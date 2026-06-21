import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabase.js';

function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="static-page auth-page">
      <section className="page-header">
        <span className="header-tag">Account</span>
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
    <AuthLayout title="Welcome back" subtitle="Sign in to access your dashboard and analysis history.">
      <form onSubmit={handleLogin} className="auth-form">
        {error && <div className="error-module">{error}</div>}
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div className="input-group">
          <div className="password-header">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <button type="submit" className="primary-action" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className="oauth-divider"><span>or continue with</span></div>
      
      <div className="oauth-grid">
        <button className="secondary-action" onClick={() => handleOAuth('google')}>Continue with Google</button>
        <button className="secondary-action" onClick={() => handleOAuth('github')}>Continue with GitHub</button>
      </div>

      <div className="auth-footer">
        <span>Don't have an account?</span> <Link to="/signup">Create one</Link>
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
      setSuccess('Check your email to verify your account before signing in.');
    }
    setLoading(false);
  };

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/dashboard' } });
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start analyzing your resume and track your progress over time.">
      <form onSubmit={handleSignUp} className="auth-form">
        {error && <div className="error-module">{error}</div>}
        {success && <div className="success-module">{success}</div>}
        
        <div className="input-group">
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Smith" />
        </div>
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      
      <div className="oauth-divider"><span>or sign up with</span></div>
      
      <div className="oauth-grid">
        <button className="secondary-action" onClick={() => handleOAuth('google')}>Google</button>
        <button className="secondary-action" onClick={() => handleOAuth('github')}>GitHub</button>
      </div>

      <div className="auth-footer">
        <span>Already have an account?</span> <Link to="/login">Sign in</Link>
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
      setSuccess('Password reset link sent. Check your email for instructions.');
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleReset} className="auth-form">
        {error && <div className="error-module">{error}</div>}
        {success && <div className="success-module">{success}</div>}
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <button type="submit" className="primary-action" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <div className="auth-footer">
        <Link to="/login">← Back to sign in</Link>
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
      setSuccess('Password updated successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Set new password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleUpdate} className="auth-form">
        {error && <div className="error-module">{error}</div>}
        {success && <div className="success-module">{success}</div>}
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
