/* Approved local snapshot only. External discovery cannot mutate these maps. */
class RecordStore {
  constructor(grid, fetcher = (url, options) => fetch(url, options)) {
    this.grid = grid;
    this.fetcher = fetcher;
    this.records = [];
    this.byPerson = new Map();
    this.cache = new Map();
  }
  static sourceValid(source) {
    if (!source || typeof source.institution !== 'string' || !source.institution.trim()) return false;
    try { return new URL(source.url).protocol === 'https:'; } catch { return false; }
  }
  static verified(record) {
    return record.verificationStatus === 'verified' && record.publicationStatus === 'approved' &&
      record.rights?.status === 'cleared' && ['CC0-1.0', 'original-factual-summary'].includes(record.rights?.license) && Array.isArray(record.sources) &&
      record.sources.length > 0 && record.sources.every(RecordStore.sourceValid);
  }
  static displayableMedia(item) {
    // A source biography's approval does not clear its photographs. Store the
    // separately reviewed licence/permission evidence and serve local assets.
    const rights = item?.rights;
    if (rights?.publicDisplayAllowed !== true || !rights.attribution || !rights.rightsholder ||
        !rights.reviewedAt || !rights.permissionReference ||
        !['public-domain', 'open-license', 'written-permission', 'source-terms'].includes(rights.basis) ||
        !/^assets\/[a-zA-Z0-9_./-]+$/.test(item.url || '') || item.url.includes('..')) return false;
    try {
      const source = new URL(item.sourceUrl);
      if (source.protocol !== 'https:') return false;
      if (rights.basis === 'source-terms') {
        return source.hostname === 'encyclopedia.ushmm.org' && source.pathname.startsWith('/content/en/id-card/') &&
          rights.permissionReference === 'https://www.ushmm.org/copyright-and-legal-information/terms-of-use' &&
          typeof rights.usageConditions === 'string' && rights.usageConditions.includes('noncommercial educational website');
      }
      return true;
    } catch { return false; }
  }
  async loadIndex() {
    const response = await this.fetcher('data/linked-records.json');
    if (!response.ok) throw new Error('Record index unavailable.');
    this.setIndex(await response.json());
  }
  setIndex(index) {
    if (index.layoutVersion !== (this.grid.recordLayoutVersion || this.grid.version) || index.cohortId !== this.grid.cohortId || !Array.isArray(index.records)) {
      throw new Error('Record index does not match the layout.');
    }
    const people = new Map(), sourceIds = new Set();
    for (const record of index.records) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(record.personId) || typeof record.displayName !== 'string' ||
          !record.displayName.trim() || !RecordStore.verified(record) ||
          people.has(record.personId) || !record.sourceId ||
          sourceIds.has(record.sourceId)) throw new Error('Invalid or duplicate approved record.');
      people.set(record.personId, record);
      if (record.sourceId) sourceIds.add(record.sourceId);
    }
    this.records = [...people.values()];
    this.byPerson = people;
    this.cache.clear();
  }
  async biography(personId, signal) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const index = this.byPerson.get(personId);
    if (!index) throw new Error('No verified record is linked to this slot.');
    if (this.cache.has(personId)) {
      const person = this.cache.get(personId);
      this.cache.delete(personId);
      this.cache.set(personId, person);
      return person;
    }
    const response = await this.fetcher('data/people/' + encodeURIComponent(personId) + '.json', { signal });
    if (!response.ok) throw new Error('The archival record could not be loaded. Please try again.');
    const person = await response.json();
    if (person.id !== personId || person.sourceId !== index.sourceId || !RecordStore.verified(person) || person.displayName !== index.displayName ||
        person.fate?.status !== 'murdered') throw new Error('This record is not ready for public display.');
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    this.cache.set(personId, person);
    if (this.cache.size > 32) this.cache.delete(this.cache.keys().next().value);
    return person;
  }
}
if (typeof module !== 'undefined') module.exports = { RecordStore };
