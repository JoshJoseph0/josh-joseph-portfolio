/* SQLite is authoritative. This cache only remembers responses in this tab;
 * clearing it or browser storage cannot change a persisted assignment. */
class SharedAssignments {
  constructor() { this.dotAssignments = new Map(); this.assignedPeople = new Set(); this.problem = ''; }
  ensureDiscovery(records) { return records.records.map(record => record.personId); }
  personForSlot(slot) { return this.dotAssignments.get(slot) || null; }
  remember(slot, personId) { this.dotAssignments.set(slot, personId); this.assignedPeople.add(personId); }
}

class SharedRecordBuffer extends HistoricalRecordBuffer {
  constructor(records, assignments, api, options = {}) {
    super(records, assignments, api, options);
    this.connection = options.connection;
  }
  async refreshStatus() {
    const response = await this.connection.request('/api/status');
    if (!response.ok) throw new Error(this.connection.unavailableMessage());
    const state = await response.json();
    if (state.layoutVersion !== 'field-v1' || state.totalDots !== 6000000 ||
        !Number.isInteger(state.assignedDots) || state.assignedDots < 0 || state.assignedDots > state.totalDots ||
        !Number.isInteger(state.availablePeople) || state.availablePeople < 0) throw new Error('The database returned an incompatible memorial layout.');
    this.availablePeople = state.availablePeople;
    this.assignedDots = state.assignedDots;
    this.exhausted = state.availablePeople === 0;
    this.status = 'ready'; this.assignments.problem = ''; this.emit();
  }
  async start() {
    await this.refreshStatus();
    this.liveRequest = this.enrich(this.records.records.slice(0, 50));
  }
  async take(slot) {
    const response = await this.connection.request('/api/dots/' + slot + '/assignment', { method: 'POST' });
    const result = await response.json();
    if (response.status === 409) { await this.refreshStatus(); return null; }
    if (!response.ok || result.slot !== slot || !this.records.byPerson.has(result.personId)) {
      throw new Error(result.error || 'The assignment could not be verified. Reload and try again.');
    }
    this.assignments.remember(slot, result.personId);
    // The saved identity remains usable even if the supplementary status fails.
    await this.refreshStatus().catch(() => {});
    return result.personId;
  }
}
