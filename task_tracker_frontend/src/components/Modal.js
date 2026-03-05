import React, { useEffect } from 'react';

/**
 * PUBLIC_INTERFACE
 * Accessible modal dialog with backdrop.
 *
 * Contract:
 * - Props: open (bool), title (string), onClose (fn), children (node)
 * - Side effects: locks escape key to close when open
 */
export function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="tt-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <section className="tt-modal" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
        <header className="tt-modal-header">
          <strong>{title}</strong>
          <button className="tt-btn" onClick={onClose} type="button">
            Close
          </button>
        </header>
        <div className="tt-modal-body">{children}</div>
      </section>
    </div>
  );
}
