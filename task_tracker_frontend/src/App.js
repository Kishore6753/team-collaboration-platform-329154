import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { api } from './api/client';
import { createApiFlow } from './api/flow';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';

// PUBLIC_INTERFACE
function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState('');

  function handleUnauthorized() {
    // Centralized auth failure behavior: clear token and send user to auth.
    api.setToken(null);
    setUser(null);
    navigate('/');
  }

  const bootFlow = useMemo(
    () =>
      createApiFlow({
        operation: 'auth.me',
        setBusy: setBooting,
        setError: setBootError,
        onUnauthorized: handleUnauthorized,
        call: () => api.me(),
        onSuccess: (res) => {
          setUser(res?.user || null);
        },
        onError: () => {
          // Not logged in is OK; keep user null.
          setUser(null);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    bootFlow.run();
  }, [bootFlow]);

  function logout() {
    api.setToken(null);
    setUser(null);
    navigate('/');
  }

  if (booting) {
    return (
      <div className="tt-page">
        <div className="tt-card" style={{ maxWidth: 520, margin: '40px auto' }}>
          <h2 style={{ marginTop: 0 }}>Team Task Tracker</h2>
          <p style={{ color: 'var(--tt-muted)' }}>Restoring session…</p>
          {bootError ? <div style={{ color: 'var(--tt-danger)' }}>{bootError}</div> : null}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onAuthed={(u) => {
          setUser(u);
          navigate('/dashboard');
        }}
      />
    );
  }

  return (
    <div className="tt-shell">
      <aside className="tt-sidebar">
        <div className="tt-brand">Team Task Tracker</div>
        <div className="tt-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
        </div>
        <div style={{ marginTop: 16, color: 'var(--tt-muted)', fontSize: 12 }}>
          Signed in as <strong style={{ color: 'var(--tt-text)' }}>{user.email}</strong>
        </div>
      </aside>

      <main className="tt-main">
        <header className="tt-header">
          <div className="tt-row" style={{ gap: 12 }}>
            <span className="tt-badge">light theme</span>
            {bootError ? <span style={{ color: 'var(--tt-danger)' }}>{bootError}</span> : null}
          </div>
          <div className="tt-row">
            <button className="tt-btn" type="button" onClick={() => navigate('/projects')}>
              Open projects
            </button>
            <button className="tt-btn primary" type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <div className="tt-page">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="*" element={<div className="tt-card">Not found.</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
