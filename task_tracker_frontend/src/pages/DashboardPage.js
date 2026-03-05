import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { createApiFlow } from '../api/flow';

/**
 * PUBLIC_INTERFACE
 * Dashboard showing task stats and recent tasks.
 */
export function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const flow = useMemo(
    () =>
      createApiFlow({
        operation: 'dashboard.get',
        setBusy,
        setError: setErr,
        call: () => api.getDashboard(),
        onSuccess: (d) => setStats(d?.stats || null),
      }),
    []
  );

  useEffect(() => {
    flow.run();
  }, [flow]);

  if (err) return <div className="tt-card">{err}</div>;
  if (busy || !stats) return <div className="tt-card">Loading…</div>;

  const counts = stats.assignedToMeByStatus || {};

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
          {(stats.recentTasks || []).map((t) => (
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
          {!stats.recentTasks || stats.recentTasks.length === 0 ? (
            <small style={{ color: 'var(--tt-muted)' }}>No recent tasks assigned to you.</small>
          ) : null}
        </div>
      </div>
    </div>
  );
}
