/* Capabilities are explicit. A discovery result is never publication approval. */
class HistoricalSourceRegistry {
  constructor() { this.providers = new Map(); }
  register(description, methods) {
    if (!description.id || this.providers.has(description.id)) throw new Error('Duplicate or invalid provider.');
    for (const key of Object.keys(methods)) if (!description.capabilities.includes(key) || typeof methods[key] !== 'function') throw new Error('Undeclared provider capability.');
    this.providers.set(description.id, { description, methods }); return this;
  }
  async invoke(id, capability, options) {
    const provider = this.providers.get(id);
    if (!provider?.methods[capability]) throw new Error('This source does not support ' + capability + '.');
    return provider.methods[capability](options);
  }
  describe() { return [...this.providers.values()].map(p => p.description); }
}
if (typeof module !== 'undefined') module.exports = { HistoricalSourceRegistry };
