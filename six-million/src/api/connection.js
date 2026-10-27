/* The public site can live under a GitHub Pages subdirectory. Only the API
 * uses an absolute origin; portraits and approved snapshots stay relative. */
class MemorialConnection {
  constructor(config = {}, pageUrl = window.location.href, fetcher = (url, options) => fetch(url, options)) {
    this.fetcher = fetcher;
    this.configured = config.apiBase !== null;
    this.problem = '';
    if (!this.configured) return;
    const base = new URL(config.apiBase || '/', pageUrl);
    if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname))) {
      throw new Error('The shared database requires a secure HTTPS address.');
    }
    if (base.username || base.password || base.search || base.hash) throw new Error('Invalid database address.');
    this.base = base.href.replace(/\/$/, '');
  }
  unavailableMessage() {
    return this.configured
      ? 'The shared database is temporarily unavailable. Saved assignments have not been changed. You can still read the approved profiles in Sources.'
      : 'Viewing edition: explore biographies and photographs in Sources. Dot assignments are not saved.';
  }
  async request(path, options = {}) {
    if (!this.configured) throw new Error(this.unavailableMessage());
    if (!/^\/api\//.test(path)) throw new Error('Invalid API path.');
    const controller = new AbortController(), abort = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, 12000);
    try {
      return await this.fetcher(this.base + path, { ...options, signal: controller.signal, cache: 'no-store', credentials: 'omit' });
    } finally {
      clearTimeout(timer); options.signal?.removeEventListener('abort', abort);
    }
  }
  async record(url, options = {}) {
    const endpoint = url === 'data/linked-records.json' ? '/api/people'
      : /^data\/people\/[a-zA-Z0-9_-]+\.json$/.test(url) ? '/api/people/' + url.slice(12, -5) : null;
    if (endpoint && this.configured) {
      try {
        const response = await this.request(endpoint, options);
        if (response.ok) return response;
      } catch (error) { if (options.signal?.aborted) throw error; }
    }
    // This is a read-only approved edition, never a substitute assignment DB.
    return this.fetcher(url, { ...options, cache: 'no-store', credentials: 'omit' });
  }
}
if (typeof module !== 'undefined') module.exports = { MemorialConnection };
