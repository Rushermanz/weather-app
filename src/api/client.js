/**
 * Resilient HTTP Client with AbortController, 8-second Timeout,
 * and Rate-Limit (HTTP 429) Retry-After parsing.
 */

export class ApiError extends Error {
  constructor(message, status = 0, type = 'GENERIC', retryAfterSec = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = type; // 'TIMEOUT' | 'NETWORK' | 'RATE_LIMITED' | 'NOT_FOUND' | 'GENERIC' | 'ABORTED'
    this.retryAfterSec = retryAfterSec;
  }
}

/**
 * Executes a fetch request with an 8-second timeout and AbortController integration.
 * @param {string} url - Target URL
 * @param {object} options - Fetch options + external signal
 * @returns {Promise<any>}
 */
export async function requestJson(url, options = {}) {
  const timeoutMs = options.timeoutMs || 8000;
  const timeoutController = new AbortController();
  let timerId = null;

  // Combine external abort signal if provided
  let combinedSignal = timeoutController.signal;
  if (options.signal) {
    const handleExternalAbort = () => timeoutController.abort(options.signal.reason);
    if (options.signal.aborted) {
      timeoutController.abort(options.signal.reason);
    } else {
      options.signal.addEventListener('abort', handleExternalAbort, { once: true });
    }
  }

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      timeoutController.abort();
      reject(new ApiError('Telemetry network timeout (8s elapsed).', 408, 'TIMEOUT'));
    }, timeoutMs);
  });

  try {
    const fetchPromise = fetch(url, {
      ...options,
      signal: combinedSignal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {})
      }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    clearTimeout(timerId);

    // Handle HTTP 429 Rate Limiting
    if (response.status === 429) {
      const retryHeader = response.headers?.get('Retry-After');
      const retrySec = retryHeader ? parseInt(retryHeader, 10) || 60 : 60;
      throw new ApiError(
        `Atmospheric API rate limit reached. Retry after ${retrySec}s.`,
        429,
        'RATE_LIMITED',
        retrySec
      );
    }

    if (response.status === 404) {
      throw new ApiError('Location telemetry not found.', 404, 'NOT_FOUND');
    }

    if (!response.ok) {
      throw new ApiError(
        `Meteorological service returned error (HTTP ${response.status}).`,
        response.status,
        'GENERIC'
      );
    }

    const data = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timerId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError('Request superseded or canceled.', 0, 'ABORTED');
    }

    // Network disconnection or DNS failure
    if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
      throw new ApiError('Offline: No internet connectivity.', 0, 'OFFLINE');
    }

    throw new ApiError(err.message || 'Network communication failed.', 0, 'NETWORK');
  }
}
