/* Bounded read-only JSON client, shared by browser and Node sync tools. */
class HistoricalApiError extends Error {
  constructor(message, code, status = 0, retryAfter = 0) {
    super(message); this.name = 'HistoricalApiError'; this.code = code;
    this.status = status; this.retryAfter = retryAfter;
  }
}
class HistoricalApiClient {
  constructor({ fetcher = (url, options) => fetch(url, options), timeoutMs = 10000,
    retries = 1, ttlMs = 300000, maxEntries = 32, now = Date.now, sleep } = {}) {
    Object.assign(this, { fetcher, timeoutMs, retries, ttlMs, maxEntries, now });
    this.cache = new Map();
    this.sleep = sleep || ((ms, signal) => new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new DOMException('Cancelled', 'AbortError'));
      const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, ms);
      signal?.addEventListener('abort', abort, { once: true });
    }));
  }
  async get(url, { signal, headers = {}, responseType = 'json' } = {}) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const cacheKey = responseType === 'text' ? 'text:' + url : url;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > this.now()) {
      this.cache.delete(cacheKey); this.cache.set(cacheKey, cached); return cached.data;
    }
    this.cache.delete(cacheKey);
    if (this.blockedUntil > this.now()) throw new HistoricalApiError('The external service is rate limited. Try again later.', 'RATE_LIMIT', 429, this.blockedUntil - this.now());
    for (let attempt = 0; ; attempt++) {
      const controller = new AbortController();
      let timedOut = false;
      const abort = () => controller.abort();
      signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
      let failure;
      try {
        const response = await this.fetcher(url, { signal: controller.signal, credentials: 'omit', headers: { Accept: 'application/json', ...headers } });
        const retry = response.headers.get('Retry-After');
        const retryDelay = Math.max(0, (retry && /^\d+(\.\d+)?$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : 0) || 0);
        if (!response.ok) {
          if (response.status === 429 || response.status === 503) this.blockedUntil = this.now() + Math.max(5000, retryDelay);
          throw new HistoricalApiError('The external service is unavailable (HTTP ' + response.status + ').', 'HTTP', response.status, retryDelay);
        }
        let data;
        try { data = responseType === 'text' ? await response.text() : await response.json(); } catch { throw new HistoricalApiError('The service returned invalid data.', 'INVALID_RESPONSE'); }
        if (responseType === 'text') {
          if (typeof data !== 'string' || !data.length || data.length > 2000000) throw new HistoricalApiError('Invalid or oversized metadata response.', 'INVALID_RESPONSE');
        } else if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HistoricalApiError('Incomplete API response.', 'INVALID_RESPONSE');
        if (data.error) {
          const temporary = /maxlag|ratelimited/.test(data.error.code);
          if (temporary) this.blockedUntil = this.now() + Math.max(5000, retryDelay);
          throw new HistoricalApiError('The API rejected the request: ' + data.error.code, 'API', temporary ? 503 : 0, retryDelay);
        }
        if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        this.cache.set(cacheKey, { data, expires: this.now() + this.ttlMs });
        while (this.cache.size > this.maxEntries) this.cache.delete(this.cache.keys().next().value);
        return data;
      } catch (error) {
        if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        failure = timedOut ? new HistoricalApiError('The external service timed out.', 'TIMEOUT')
          : error instanceof HistoricalApiError ? error : new HistoricalApiError('The external service could not be reached.', 'NETWORK');
      } finally {
        clearTimeout(timer); signal?.removeEventListener('abort', abort);
      }
      const retryable = failure.status === 429 || failure.status >= 500 || ['TIMEOUT', 'NETWORK'].includes(failure.code);
      // Never retry earlier than Retry-After. Long waits are surfaced, not capped.
      if (!retryable || attempt >= this.retries || failure.retryAfter > 30000) throw failure;
      await this.sleep(Math.max(failure.retryAfter, 5000 * 2 ** attempt), signal);
    }
  }
}
if (typeof module !== 'undefined') module.exports = { HistoricalApiClient, HistoricalApiError };
