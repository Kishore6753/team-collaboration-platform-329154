import React, { useState } from 'react';
import { api } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * Authentication page providing login and registration.
 */
export function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.register({ name, email, password });

      api.setToken(res.token);
      onAuthed?.(res.user);
    } catch (error) {
      setErr(error.message || 'Auth failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tt-page">
      <div className="tt-card" style={{ maxWidth: 520, margin: '40px auto' }}>
        <h2 style={{ marginTop: 0 }}>Team Task Tracker</h2>
        <p style={{ color: 'var(--tt-muted)', marginTop: -6 }}>
          Sign in to manage projects, tasks, and comments.
        </p>

        <div className="tt-row" style={{ justifyContent: 'space-between' }}>
          <div className="tt-row">
            <button
              className={`tt-btn ${mode === 'login' ? 'primary' : ''}`}
              type="button"
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`tt-btn ${mode === 'register' ? 'primary' : ''}`}
              type="button"
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>
          <span className="tt-badge">API: {process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}</span>
        </div>

        <form onSubmit={submit} className="tt-grid" style={{ marginTop: 14 }}>
          {mode === 'register' ? (
            <div>
              <label className="tt-label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="tt-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          ) : null}

          <div>
            <label className="tt-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="tt-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              type="email"
              required
            />
          </div>

          <div>
            <label className="tt-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="tt-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              required
            />
          </div>

          {err ? <div style={{ color: 'var(--tt-danger)' }}>{err}</div> : null}

          <button className="tt-btn primary" disabled={busy} type="submit">
            {busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>

          <small style={{ color: 'var(--tt-muted)' }}>
            Tip: Register a new user or update the demo user's password via registration.
          </small>
        </form>
      </div>
    </div>
  );
}
