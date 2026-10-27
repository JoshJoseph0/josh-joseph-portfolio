/* Approved local evidence supplies eligibility; live API claims never grant it.
 * Refill is single-flight and bounded. An exhausted approved index is not polled.
 */
class HistoricalRecordBuffer {
  constructor(records, assignments, api, { target = 50, threshold = 5, onState = () => {} } = {}) {
    Object.assign(this, { records, assignments, api, target, threshold, onState });
    this.available = new Map(); this.attempted = new Set();
    this.order = assignments.ensureDiscovery(records);
    this.live = new Map(); this.liveAttempted = new Set(); this.liveStatus = 'idle';
    this.status = 'idle'; this.exhausted = false; this.controller = new AbortController();
  }
  emit() { this.onState(this); }
  start() { return this.refill(); }
  refill() {
    if (this.refilling) return this.refilling;
    if (this.exhausted || this.available.size >= this.target) return Promise.resolve();
    this.status = 'loading'; this.emit();
    this.refilling = this.prepare().finally(() => { this.refilling = null; });
    return this.refilling;
  }
  async prepare() {
    this.order = this.assignments.ensureDiscovery(this.records);
    const eligible = this.order.map(id => this.records.byPerson.get(id)).filter(record => record &&
      !this.assignments.assignedPeople.has(record.personId) && !this.attempted.has(record.personId));
    const batch = [];
    for (const record of eligible) {
      if (this.available.size >= this.target || this.controller.signal.aborted) break;
      this.attempted.add(record.personId);
      // The publication-gated index is the prepared pool. Full biographies
      // load only on selection, rather than downloading fifty at entry.
      this.available.set(record.personId, record); batch.push(record);
    }
    this.exhausted = !this.records.records.some(record => !this.assignments.assignedPeople.has(record.personId) && !this.attempted.has(record.personId));
    this.status = this.available.size ? 'ready' : 'unavailable'; this.emit();
    // Enrichment runs independently of rendering and local profile availability.
    this.liveRequest = (this.liveRequest || Promise.resolve()).then(() => this.enrich(batch));
  }
  async enrich(batch) {
    const records = batch.filter(record => /^Q[1-9]\d*$/.test(record.sourceId || '') && !this.liveAttempted.has(record.sourceId)).slice(0, 50);
    if (!records.length || this.controller.signal.aborted) return;
    for (const record of records) this.liveAttempted.add(record.sourceId);
    this.liveStatus = 'loading'; this.emit();
    try {
      const entities = await this.api.entities(records.map(record => record.sourceId), { signal: this.controller.signal });
      const Normalizer = typeof module !== 'undefined' ? require('./wikidata.js').WikidataApi : WikidataApi;
      for (const record of records) {
        try {
          this.live.set(record.personId, Normalizer.normalize(entities[record.sourceId]));
          while (this.live.size > this.target) this.live.delete(this.live.keys().next().value);
        }
        catch { /* Missing/non-human results stay outside the approved data. */ }
      }
      this.liveStatus = 'ready';
    } catch (error) { if (error.name !== 'AbortError') this.liveStatus = 'unavailable'; }
    this.emit();
  }
  take(slot, requestedPersonId) {
    // Re-read lightweight storage for sequential exploration in another tab.
    this.assignments.sync();
    for (const id of this.available.keys()) if (this.assignments.assignedPeople.has(id)) this.available.delete(id);
    const previous = this.assignments.personForSlot(slot);
    if (previous) return previous;
    const personId = requestedPersonId || this.available.keys().next().value;
    if (!personId || !this.available.has(personId)) return null;
    const assigned = this.assignments.assign(slot, personId);
    this.available.delete(personId);
    if (this.available.size <= this.threshold) this.refill();
    this.status = this.available.size ? 'ready' : this.refilling ? 'loading' : 'unavailable';
    this.emit(); return assigned;
  }
  // Explicitly recheck newly approved metadata; biography retries belong to UI.
  retry() {
    this.exhausted = false;
    return this.refill();
  }
  dispose() { this.controller.abort(); }
}
if (typeof module !== 'undefined') module.exports = { HistoricalRecordBuffer };
