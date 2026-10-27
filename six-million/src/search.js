/* Local approved search first. Explicit opt-in external discovery never links dots. */
class RecordSearch {
  constructor(records, api, { delay = 350, onState = () => {} } = {}) {
    Object.assign(this, { records, api, delay, onState });
    this.generation = 0;
  }
  static normalize(value) { return value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase(); }
  local(query) {
    const words = RecordSearch.normalize(query.trim()).split(/\s+/).filter(Boolean);
    return this.records.records.filter(record => {
      const text = RecordSearch.normalize([record.displayName, ...(record.alternativeNames || []), ...(record.searchTerms || [])].join(' '));
      return words.every(word => text.includes(word));
    });
  }
  cancel() {
    this.generation++;
    clearTimeout(this.timer);
    this.controller?.abort();
  }
  query(term, external) {
    this.cancel();
    const generation = this.generation;
    this.onState({ local: this.local(term), external: [], status: 'idle' });
    if (!external || term.trim().length < 2) return;
    this.onState({ local: this.local(term), external: [], status: 'waiting' });
    this.timer = setTimeout(async () => {
      this.controller = new AbortController();
      const signal = this.controller.signal;
      this.onState({ local: this.local(term), external: [], status: 'loading' });
      try {
        const results = await this.api.search(term, signal);
        if (generation === this.generation && !signal.aborted) this.onState({ local: this.local(term), external: results, status: 'ready' });
      } catch (error) {
        if (generation === this.generation && error.name !== 'AbortError') this.onState({ local: this.local(term), external: [], status: 'unavailable', error: error.message });
      }
    }, this.delay);
  }
}
if (typeof module !== 'undefined') module.exports = { RecordSearch };
