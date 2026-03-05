/* eslint-disable no-console */

/**
 * PUBLIC_INTERFACE
 * createApiFlow
 *
 * A small, reusable orchestration layer for calling ApiClient methods with:
 * - consistent loading and error state management
 * - consistent auth failure handling (401 / "Unauthorized" style)
 * - lightweight structured logging for debuggability
 *
 * Contract:
 * Inputs:
 * - opts.operation (string): stable operation name for logs/debugging
 * - opts.call (function): async function that performs the API call
 * - opts.onSuccess (function | undefined): called with resolved value
 * - opts.onError (function | undefined): called with (error)
 * - opts.onUnauthorized (function | undefined): called when the error indicates auth failure
 * - opts.setBusy (function | undefined): React setState for busy flag
 * - opts.setError (function | undefined): React setState for error message
 *
 * Outputs:
 * - run(): Promise<value | undefined> returns the resolved value (also passed to onSuccess)
 *
 * Errors:
 * - Does not throw by default; surfaces error via setError/onError.
 *   (Callers can still await run() and inspect return value.)
 *
 * Side effects:
 * - Calls setBusy and setError, and may call onUnauthorized.
 */
export function createApiFlow(opts) {
  const {
    operation,
    call,
    onSuccess,
    onError,
    onUnauthorized,
    setBusy,
    setError,
  } = opts || {};

  if (!operation) throw new Error('createApiFlow: opts.operation is required');
  if (typeof call !== 'function') throw new Error('createApiFlow: opts.call must be a function');

  function isUnauthorizedError(err) {
    const msg = (err?.message || '').toLowerCase();
    return msg.includes('unauthorized') || msg.includes('jwt') || msg.includes('token') || msg.includes('forbidden');
  }

  async function run() {
    const startedAt = Date.now();
    setError?.('');
    setBusy?.(true);

    console.info(`[ApiFlow:${operation}] start`);
    try {
      const value = await call();
      console.info(`[ApiFlow:${operation}] success in ${Date.now() - startedAt}ms`);
      onSuccess?.(value);
      return value;
    } catch (err) {
      const message = err?.message || 'Request failed.';
      console.error(`[ApiFlow:${operation}] failed in ${Date.now() - startedAt}ms: ${message}`, err);

      // If auth failed, notify boundary so it can clear token + route to login.
      if (isUnauthorizedError(err)) {
        onUnauthorized?.(err);
      }

      setError?.(message);
      onError?.(err);
      return undefined;
    } finally {
      setBusy?.(false);
    }
  }

  return { run };
}
