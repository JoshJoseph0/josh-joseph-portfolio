/* Per-browser identifiers only. No biographies, remote writes or accounts.
 * The layout-specific key preserves old layouts rather than reusing their slots.
 */
class BrowserAssignments {
  constructor(grid, { storage, key = 'six-million.assignments.' + grid.version, allowAllSlots = false, randomOnly = false } = {}) {
    this.grid = grid; this.allowAllSlots = allowAllSlots; this.randomOnly = randomOnly; this.key = key; this.schemaVersion = 1;
    this.dotAssignments = new Map(); this.assignedPeople = new Set();
    this.persistent = true; this.problem = '';
    try { this.storage = storage === undefined ? window.localStorage : storage; }
    catch { this.storage = null; }
    if (!this.storage) this.fail('Browser storage is unavailable. Assignments will last for this page visit.');
  }
  fail(message) { this.persistent = false; this.problem = message; }
  restore(records) {
    this.records = records;
    this.dotAssignments.clear(); this.assignedPeople.clear();
    try {
      const raw = this.storage?.getItem(this.key);
      if (!raw) return;
      if (raw.length > 1000000) throw new Error('Oversized storage');
      const saved = JSON.parse(raw);
      if (saved.schemaVersion !== this.schemaVersion || saved.layoutVersion !== this.grid.version || !Array.isArray(saved.assignments)) {
        this.fail('Saved assignments use an incompatible version. They have been left untouched.');
        this.storage = null; return;
      }
      if (saved.discovery && /^[a-f0-9]{32}$/.test(saved.discovery.seed) && Array.isArray(saved.discovery.order)) {
        this.discovery = { version: 1, seed: saved.discovery.seed,
          order: [...new Set(saved.discovery.order.filter(id => typeof id === 'string' && records.byPerson.has(id)))] };
      }
      const sources = new Set();
      for (const entry of saved.assignments.slice(0, 5000)) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const [slot, personId] = entry, record = records.byPerson.get(personId);
        if (!record || !Number.isInteger(slot) || slot < 0 || slot >= this.grid.count || (!this.allowAllSlots && !this.grid.isRed(slot)) ||
          this.dotAssignments.has(slot) || this.assignedPeople.has(personId) || sources.has(record.sourceId)) continue;
        this.dotAssignments.set(slot, personId); this.assignedPeople.add(personId); sources.add(record.sourceId);
      }
    } catch { this.fail('Saved browser memory could not be read. This visit can continue with new assignments.'); }
  }
  personForSlot(slot) { return this.dotAssignments.get(slot) || null; }
  ensureDiscovery(records = this.records) {
    const Policy = typeof module !== 'undefined' ? require('../discovery.js').VisitorDiscovery : VisitorDiscovery;
    if (!this.discovery) this.discovery = { version: 1, seed: Policy.seed(), order: [] };
    const known = new Set(this.discovery.order);
    const additions = records.records.filter(record => !known.has(record.personId));
    if (additions.length) {
      this.discovery.order.push(...Policy.order(additions, this.discovery.seed + ':additions:' + known.size, { balanceNeighbours: !this.randomOnly }));
      this.save();
    }
    return this.discovery.order;
  }
  sync() {
    if (!this.persistent || !this.storage || !this.records) return;
    const previous = new Map(this.dotAssignments), people = new Set(this.assignedPeople);
    this.restore(this.records);
    if (!this.persistent) { this.dotAssignments = previous; this.assignedPeople = people; }
  }
  slotForPerson(personId) {
    for (const [slot, id] of this.dotAssignments) if (id === personId) return slot;
    return null;
  }
  assign(slot, personId) {
    const existing = this.personForSlot(slot);
    if (existing) return existing;
    if (!Number.isInteger(slot) || slot < 0 || slot >= this.grid.count || (!this.allowAllSlots && !this.grid.isRed(slot)) ||
        !this.records?.byPerson.has(personId) || this.assignedPeople.has(personId)) throw new Error('Invalid or repeated browser assignment.');
    this.dotAssignments.set(slot, personId); this.assignedPeople.add(personId);
    this.save(); return personId;
  }
  save() {
    if (!this.storage) return;
    try {
      this.storage.setItem(this.key, JSON.stringify({ schemaVersion: this.schemaVersion, layoutVersion: this.grid.version,
        assignments: [...this.dotAssignments], ...(this.discovery ? { discovery: this.discovery } : {}) }));
      this.persistent = true; this.problem = '';
    } catch { this.fail('Browser memory could not be saved. Assignments remain consistent for this page visit.'); }
  }
}
if (typeof module !== 'undefined') module.exports = { BrowserAssignments };
