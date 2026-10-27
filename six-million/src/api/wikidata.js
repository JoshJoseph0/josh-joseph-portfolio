/* Documented Wikibase Action API. Retrieval never implies historical approval. */
class WikidataApi {
  constructor(client, headers = {}) {
    this.client = client;
    this.headers = { 'Api-User-Agent': 'SixMillion/0.3 (https://github.com/JoshJoseph0/Six-million-memorial)', ...headers };
  }
  url(parameters) {
    return 'https://www.wikidata.org/w/api.php?' + new URLSearchParams({
      format: 'json', origin: '*', ...parameters
    });
  }
  async search(term, signal) {
    const query = term.trim();
    if (query.length < 2) return [];
    const data = await this.client.get(this.url({
      action: 'wbsearchentities', search: query.slice(0, 120), language: 'en', uselang: 'en', type: 'item', limit: '10'
    }), { signal, headers: this.headers });
    if (!Array.isArray(data.search)) throw new Error('Invalid Wikidata search response.');
    return data.search.map(item => {
      if (!/^Q[1-9]\d*$/.test(item.id) || typeof item.label !== 'string') throw new Error('Incomplete Wikidata search result.');
      return { id: item.id, displayName: item.label, description: item.description || '',
        originalUrl: 'https://www.wikidata.org/wiki/' + item.id,
        verificationStatus: 'awaiting-verification', publicationStatus: 'not-approved' };
    });
  }
  async entities(ids, { signal, props = 'info|labels|aliases|claims', interactive = false } = {}) {
    if (!ids.length || ids.length > 50 || new Set(ids).size !== ids.length || !ids.every(id => /^Q[1-9]\d*$/.test(id))) throw new Error('Invalid Wikidata IDs.');
    const data = await this.client.get(this.url({ action: 'wbgetentities', ids: ids.join('|'),
      props, languages: 'en|mul', languagefallback: '1', ...(interactive ? {} : { maxlag: '5' }) }), { signal, headers: this.headers });
    if (!data.entities || Array.isArray(data.entities)) throw new Error('Invalid Wikidata entity response.');
    for (const id of ids) {
      if (!data.entities[id] || data.entities[id].id !== id || data.entities[id].missing !== undefined) throw new Error('Wikidata item is missing or mismatched: ' + id);
    }
    return data.entities;
  }
  static values(entity, property) {
    return (entity.claims?.[property] || []).filter(statement => statement.rank !== 'deprecated' &&
      statement.mainsnak?.snaktype === 'value').map(statement => ({
        value: statement.mainsnak.datavalue?.value, rank: statement.rank,
        datatype: statement.mainsnak.datatype, references: statement.references || [],
        qualifiers: statement.qualifiers || {}, statementId: statement.id
      }));
  }
  static date(value) {
    const match = /^\+(\d{4})-(\d{2})-(\d{2})T/.exec(value?.time || '');
    if (!match) return { display: 'Date not established', raw: value || null };
    if (!Number.isInteger(value.precision) || value.precision < 9) return { display: 'Source date is not resolved to a year', raw: value };
    const [, year, month, day] = match;
    let display = year;
    if (value.precision >= 10 && month !== '00') display = year + '-' + month;
    if (value.precision >= 11 && month !== '00' && day !== '00') display += '-' + day;
    // Calendar/precision/before/after are retained; no guessed day or conversion.
    if (value.calendarmodel && !value.calendarmodel.endsWith('Q1985727')) display += ' (source calendar)';
    return { display, raw: value };
  }
  static normalize(entity, labels = {}, retrievedAt = new Date().toISOString()) {
    const label = entity?.labels?.en?.value || entity?.labels?.mul?.value;
    if (!entity || !/^Q[1-9]\d*$/.test(entity.id) || !label ||
        !WikidataApi.values(entity, 'P31').some(claim => claim.value?.id === 'Q5')) throw new Error('Missing human identity or English name.');
    const dates = property => WikidataApi.values(entity, property).map(claim => ({ ...WikidataApi.date(claim.value), ...claim }));
    const places = property => WikidataApi.values(entity, property).map(claim => ({
      id: claim.value?.id, display: labels[claim.value?.id]?.labels?.en?.value || claim.value?.id, ...claim
    }));
    const identifiers = {};
    for (const property of Object.keys(entity.claims || {})) {
      const values = WikidataApi.values(entity, property).filter(claim => claim.datatype === 'external-id');
      if (values.length) identifiers[property] = values;
    }
    return {
      sourceId: entity.id, originalUrl: 'https://www.wikidata.org/wiki/' + entity.id,
      sourceInstitution: 'Wikidata contributors', revision: entity.lastrevid,
      displayName: label,
      alternativeNames: [...new Set((entity.aliases?.en || []).map(alias => alias.value))],
      birthClaims: dates('P569'), deathClaims: dates('P570'),
      birthPlaces: places('P19'), deathPlaces: places('P20'), identifiers,
      retrievedAt, verificationStatus: 'awaiting-verification', publicationStatus: 'not-approved',
      rights: { status: 'cleared', license: 'CC0-1.0', scope: 'Wikidata structured data only',
        url: 'https://www.wikidata.org/wiki/Wikidata:Data_access', attribution: 'Structured data from Wikidata contributors.' }
    };
  }
}
if (typeof module !== 'undefined') module.exports = { WikidataApi };
