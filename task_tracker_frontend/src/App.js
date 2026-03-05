import React, { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { api } from './api/client';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';

// PUBLIC_INTERFACE
function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    let active = true;
    setBootError('');

    // Attempt to restore session if a token exists.
    api
      .me()
      .then((res) => {
        if (!active) return;
        setUser(res.user);
      })
      .catch(() => {
        // Not logged in is OK; stay on auth.
      });

    return () => {
      active = false;
    };
  }, []);

  function logout() {
    api.setToken(null);
    setUser(null);
    navigate('/');
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
