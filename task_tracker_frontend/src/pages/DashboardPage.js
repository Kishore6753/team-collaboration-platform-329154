import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * Dashboard showing task stats and recent tasks.
 */
export function DashboardPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getDashboard()
      .then((d) => {
        if (active) setData(d.stats);
      })
      .catch((e) => {
        if (active) setErr(e.message || 'Failed to load dashboard.');
      });
    return () => {
      active = false;
    };
  }, []);

  if (err) return <div className="tt-card">{err}</div>;
  if (!data) return <div className="tt-card">Loading…</div>;

  const counts = data.assignedToMeByStatus || {};

  return (
    <div className="tt-grid">
      <div className="tt-card">
        <h3 style={{ marginTop: 0 }}>Assigned to me</h3>
        <div className="tt-row" style={{ flexWrap: 'wrap' }}>
          {['todo', 'in_progress', 'blocked', 'done'].map((k) => (
            <span key={k} className={`tt-badge ${k === 'done' ? 'success' : ''}`}>
              {k}: {counts[k] || 0}
            </span>
          ))}
        </div>
      </div>

      <div className="tt-card">
        <h3 style={{ marginTop: 0 }}>Recent updates</h3>
        <div className="tt-grid">
          {(data.recentTasks || []).map((t) => (
            <div key={t.id} className="tt-row" style={{ justifyContent: 'space-between' }}>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.title}
                </strong>
                <small style={{ color: 'var(--tt-muted)' }}>
                  {t.status} · {t.priority}
                  {t.due_date ? ` · due ${t.due_date}` : ''}
                </small>
              </div>
              <span className="tt-badge">updated {new Date(t.updated_at).toLocaleString()}</span>
            </div>
          ))}
          {(!data.recentTasks || data.recentTasks.length === 0) ? (
            <small style={{ color: 'var(--tt-muted)' }}>No recent tasks assigned to you.</small>
          ) : null}
        </div>
      </div>
    </div>
  );
}
