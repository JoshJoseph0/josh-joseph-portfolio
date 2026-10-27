/* Persistent personal order. Canonical input IDs only make a set reproducible;
 * they are never a ranking. Fisher-Yates assigns every input equal random chance.
 * Soft adjacency costs use documented metadata, never fame or inferred identity.
 */
class VisitorDiscovery {
  static seed() {
    const words = new Uint32Array(4);
    if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(words);
    else for (let i = 0; i < words.length; i++) words[i] = Math.floor(Math.random() * 4294967296);
    return [...words].map(n => n.toString(16).padStart(8, '0')).join('');
  }
  static random(seed) {
    let state = 2166136261;
    for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
    return () => {
      state = (state + 0x6d2b79f5) | 0;
      let n = Math.imul(state ^ state >>> 15, 1 | state);
      n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
      return ((n ^ n >>> 14) >>> 0) / 4294967296;
    };
  }
  // Editorial pacing, separate from historical metadata. These profiles remain
  // searchable, but do not enter early dot discovery.
  static laterProfiles = Object.freeze(['wikidata-Q4583', 'wikidata-Q7339', 'wikidata-Q7337',
    'wikidata-Q69984', 'wikidata-Q559674', 'wikidata-Q4256516', 'wikidata-Q63477',
    'wikidata-Q152441', 'wikidata-Q707554', 'wikidata-Q215572']);
  static order(records, seed, { balanceNeighbours = true } = {}) {
    const pool = [...records].sort((a, b) => a.personId.localeCompare(b.personId, 'en'));
    const random = VisitorDiscovery.random(seed);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (!balanceNeighbours) return pool.map(record => record.personId);
    const order = [], weights = [['household', 8], ['collection', 2], ['residence', 1], ['country', 0.5], ['period', 0.25]];
    let previous;
    for (let next = 0; next < pool.length; next++) {
      let best = next, cost = Infinity;
      // Bounded lookahead keeps a very large approved index inexpensive. There
      // are no demographic quotas, and unknown attributes incur no penalty.
      for (let i = next; i < Math.min(pool.length, next + 64); i++) {
        const a = previous?.discovery || {}, b = pool[i].discovery || {};
        let score = 0;
        for (const [key, weight] of weights) {
          if (a[key] && b[key] && a[key] === b[key]) score += weight;
        }
        if (score < cost) { best = i; cost = score; if (score === 0) break; }
      }
      // Swap into the consumed prefix rather than repeatedly shifting the array.
      [pool[next], pool[best]] = [pool[best], pool[next]];
      previous = pool[next]; order.push(previous.personId);
    }
    return order;
  }
}
if (typeof module !== 'undefined') module.exports = { VisitorDiscovery };
