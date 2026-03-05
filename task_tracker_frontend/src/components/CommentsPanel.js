import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { createApiFlow } from '../api/flow';

/**
 * PUBLIC_INTERFACE
 * CommentsPanel
 *
 * Contract:
 * Inputs:
 * - taskId (string): selected task ID. When falsy, panel shows an empty state.
 *
 * Behavior:
 * - Loads comments for the taskId
 * - Allows posting a new comment
 *
 * Errors:
 * - Shows error message inline; does not throw.
 */
export function CommentsPanel({ taskId }) {
  const [comments, setComments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const [newBody, setNewBody] = useState('');

  const canLoad = Boolean(taskId);

  const loadFlow = useMemo(
    () =>
      createApiFlow({
        operation: 'comments.list',
        setBusy,
        setError: setErr,
        call: async () => {
          if (!taskId) return { comments: [] };
          return api.listComments(taskId);
        },
        onSuccess: (res) => setComments(res?.comments || []),
      }),
    [taskId]
  );

  const createFlow = useMemo(
    () =>
      createApiFlow({
        operation: 'comments.create',
        setBusy,
        setError: setErr,
        call: async () => {
          if (!taskId) throw new Error('Select a task to comment on.');
          if (!newBody.trim()) throw new Error('Comment cannot be empty.');
          return api.createComment({ taskId, body: newBody.trim() });
        },
        onSuccess: () => {
          setNewBody('');
          // Reload to show server timestamps/user, keep flow consistent.
          loadFlow.run();
        },
      }),
    [taskId, newBody, loadFlow]
  );

  useEffect(() => {
    let active = true;
    setErr('');
    setComments([]);

    if (!canLoad) return () => {};

    loadFlow.run().then(() => {
      // no-op; flow handles state
    });

    return () => {
      active = false;
      void active;
    };
  }, [canLoad, loadFlow]);

  return (
    <div className="tt-card">
      <div className="tt-row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Comments</h3>
        {taskId ? <span className="tt-badge">task {taskId}</span> : <span className="tt-badge">no task selected</span>}
      </div>

      {!taskId ? (
        <small style={{ color: 'var(--tt-muted)' }}>
          Select a task to view and add comments.
        </small>
      ) : null}

      {err ? <div style={{ color: 'var(--tt-danger)', marginTop: 10 }}>{err}</div> : null}

      {taskId ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createFlow.run();
          }}
          className="tt-grid"
          style={{ marginTop: 12 }}
        >
          <div>
            <label className="tt-label" htmlFor="cbody">
              New comment
            </label>
            <textarea
              id="cbody"
              className="tt-textarea"
              rows={3}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Write an update…"
              disabled={busy}
            />
          </div>
          <button className="tt-btn primary" disabled={busy} type="submit">
            {busy ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      ) : null}

      <div className="tt-grid" style={{ marginTop: 12 }}>
        {(comments || []).map((c) => (
          <div key={c.id} className="tt-card" style={{ padding: 12 }}>
            <div className="tt-row" style={{ justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 13 }}>{c.author_email || c.authorEmail || 'Unknown user'}</strong>
              <small style={{ color: 'var(--tt-muted)' }}>
                {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
              </small>
            </div>
            <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{c.body}</div>
          </div>
        ))}

        {(!comments || comments.length === 0) && taskId ? (
          <small style={{ color: 'var(--tt-muted)' }}>No comments yet.</small>
        ) : null}
      </div>
    </div>
  );
}
