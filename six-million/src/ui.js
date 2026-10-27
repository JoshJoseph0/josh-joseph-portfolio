/* Accessible HTML stays outside the canvas; no historical content via innerHTML. */
class MemorialUI {
  constructor(app) {
    this.app = app;
    this.status = document.getElementById('status');
    this.caption = document.getElementById('view-caption');
    this.minimap = document.getElementById('minimap').getContext('2d');
    if (app.connection && !app.connection.configured) {
      document.getElementById('assignment-explanation').textContent = 'This viewing edition provides the statistical field and the approved profile collection. No dot-to-person associations are saved here; use Sources to read individual biographies and photographs. Colours remain aggregate statistical proportions.';
      const hint = document.getElementById('selection-hint');
      if (hint) hint.textContent = 'Explore lives in Sources';
    }
    document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.dialog === 'records-dialog') this.search.query(document.getElementById('record-search').value, document.getElementById('external-search').checked);
      document.getElementById(button.dataset.dialog).showModal();
    }));
    document.querySelectorAll('dialog').forEach(dialog => {
      dialog.querySelector('.close').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        // A queued close event from a previous selection must not cancel a
        // biography that has already reopened this same dialog.
        if (dialog.open) return;
        if (dialog.id === 'person-dialog') { this.abort?.abort(); this.slotRequest = (this.slotRequest || 0) + 1; }
        if (dialog.id === 'records-dialog') this.search.cancel();
      });
    });
    document.getElementById('zoom-in').onclick = () => app.zoom(1.7);
    document.getElementById('zoom-out').onclick = () => app.zoom(1 / 1.7);
    document.getElementById('overview').onclick = () => { app.camera.reset(); app.invalidate(); };
    const home = document.getElementById('home');
    if (home) home.onclick = () => { app.camera.reset(); app.invalidate(); };
    this.search = new RecordSearch(app.records, app.api, { onState: state => this.renderSearch(state) });
    const query = () => this.search.query(document.getElementById('record-search').value, document.getElementById('external-search').checked);
    document.getElementById('record-search').addEventListener('input', query);
    document.getElementById('external-search').addEventListener('change', query);
    document.getElementById('archival-sources').addEventListener('toggle', async event => {
      if (!event.target.open || this.archiveLoaded) return;
      this.archiveLoaded = true;
      const status = document.getElementById('archival-state');
      status.textContent = 'Loading archival references…';
      try {
        const response = await fetch('data/archival-collections.json');
        if (!response.ok) throw new Error('Archival references are unavailable.');
        const data = await response.json(), list = document.getElementById('archival-list');
        if (!Array.isArray(data.records)) throw new Error('Invalid archival index.');
        for (const record of data.records) {
          const url = new URL(record.originalUrl);
          if (url.protocol !== 'https:' || url.hostname !== 'portal.ehri-project.eu') continue;
          const li = document.createElement('li'), link = document.createElement('a');
          link.href = url.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.textContent = record.title; li.append(link);
          if (record.repository) li.append(document.createTextNode(' — ' + record.repository));
          list.append(li);
        }
        status.textContent = 'Saved EHRI metadata retrieved ' + new Date(data.retrievedAt).toLocaleDateString('en-GB') + '. Collection references are not verified individual biographies.';
      } catch (error) { this.archiveLoaded = false; status.textContent = error.message; }
    });
  }
  recordsReady(error = false) {
    this.indexError = error;
    this.search.query(document.getElementById('record-search').value, document.getElementById('external-search').checked);
    const note = document.getElementById('collection-note');
    note.textContent = error ? 'The local record index is unavailable; the statistical memorial remains available.'
      : this.app.records.records.length + ' source-checked profiles are approved in this version. This small selection is not representative of the six million. Institutional identity and fate evidence is linked; imported Wikidata claims are labelled separately.';
    this.bufferChanged();
  }
  bufferChanged() {
    const buffer = this.app.buffer;
    const connectionNotice = document.getElementById('connection-notice');
    if (connectionNotice) {
      connectionNotice.hidden = !this.app.assignments.problem;
      connectionNotice.textContent = this.app.assignments.problem;
    }
    document.getElementById('buffer-state').textContent = !buffer ? 'The approved record collection is loading.'
      : buffer.status === 'loading' ? 'Preparing approved profiles…'
      : 'This edition contains ' + this.app.records.records.length + ' approved profiles. ' +
        (buffer.exhausted ? 'The approved collection is limited to these profiles; no unreviewed results will be substituted. ' : '') +
        (buffer.liveStatus === 'loading' ? 'Checking supplementary Wikidata statements…'
          : buffer.liveStatus === 'unavailable' ? 'Live Wikidata is unavailable. Approved local biographies still work.'
          : buffer.liveStatus === 'ready' ? 'Live Wikidata statements have been retrieved and remain separate from historical approval.' : '');
    document.getElementById('memory-state').textContent = this.app.assignments.problem ||
      (this.app.variant === 'field'
        ? 'Dot-to-person associations are permanently saved in the shared database. Every visitor sees the same person at the same dot. Colour remains an aggregate statistical proportion.'
        : 'Dot-to-person associations are saved only in this browser. Clearing site storage removes them. Other visitors may encounter a different person at the same dot.');
    if (this.app.variant === 'field' && buffer?.availablePeople !== undefined) {
      document.getElementById('buffer-state').textContent = buffer.availablePeople + ' approved people await a dot. ' +
        buffer.assignedDots + ' dots have permanent assignments. New approved people can be added to the database.';
    }
    this.updateLiveProfile();
  }
  updateLiveProfile() {
    const output = document.querySelector('[data-live-person]');
    if (!output) return;
    const buffer = this.app.buffer, candidate = buffer?.live.get(output.dataset.livePerson);
    output.textContent = candidate
      ? 'Live Wikidata statements (supplementary, awaiting historical review): ' + candidate.displayName +
        '; birth: ' + (candidate.birthClaims.map(c => c.display).join('; ') || 'not given') +
        '; death: ' + (candidate.deathClaims.map(c => c.display).join('; ') || 'not given') +
        '. Checked ' + new Date(candidate.retrievedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '. These statements do not change the approved profile.'
      : buffer?.liveStatus === 'loading' ? 'Checking supplementary Wikidata statements…'
      : 'No current live supplementary statements are available. The approved source-linked profile remains available.';
  }
  openUnavailable(message) {
    this.abort?.abort();
    document.getElementById('person-heading').textContent = 'Historical profiles';
    const content = document.getElementById('person-content');
    content.textContent = message;
    const button = document.createElement('button');
    button.className = 'text-button'; button.textContent = 'Explore documented lives';
    button.onclick = () => {
      document.getElementById('person-dialog').close();
      this.search.query('', false); document.getElementById('records-dialog').showModal();
    };
    content.append(document.createElement('br'), button);
    const dialog = document.getElementById('person-dialog');
    if (!dialog.open) dialog.showModal();
  }
  async openSharedSlot(slot) {
    if (this.app.connection && !this.app.connection.configured) {
      this.openUnavailable('This viewing edition does not save dot assignments. Explore the approved biographies and photographs through Sources.');
      return;
    }
    this.abort?.abort();
    const request = this.slotRequest = (this.slotRequest || 0) + 1;
    const dialog = document.getElementById('person-dialog');
    document.getElementById('person-heading').textContent = 'Historical record';
    document.getElementById('person-content').textContent = 'Checking this dot in the shared database…';
    if (!dialog.open) dialog.showModal();
    try {
      if (!this.app.buffer || this.indexError) throw new Error(this.app.connection.unavailableMessage());
      if (this.app.buffer.status === 'unavailable') await this.app.buffer.start();
      const person = await this.app.buffer.take(slot);
      if (request !== this.slotRequest || !dialog.open) return;
      if (person) this.openPerson(person);
      else this.openUnavailable('No further approved profile is available for this dot yet. This dot remains unassigned until more approved people are added to the database. Existing assignments are permanent.');
    } catch (error) {
      if (request === this.slotRequest && dialog.open) this.openUnavailable(error.message + ' Click this dot again to retry; any saved assignment is preserved.');
    }
  }
  renderSearch(state) {
    const list = document.getElementById('record-list');
    list.replaceChildren();
    document.getElementById('record-state').textContent = this.indexError
      ? 'The local index could not load. Reload to try again; the statistical memorial still works.'
      : state.local.length + ' approved profiles match. Select a name to read its evidence.';
    for (const record of state.local) {
      const li = document.createElement('li'), button = document.createElement('button');
      button.textContent = record.displayName;
      button.onclick = () => {
        document.getElementById('records-dialog').close();
        this.openPerson(record.personId);
      };
      li.append(button); list.append(li);
    }
    const external = document.getElementById('external-results');
    external.hidden = !document.getElementById('external-search').checked;
    const output = document.getElementById('external-list');
    output.replaceChildren();
    const messages = { idle: 'Type at least two characters to search Wikidata.',
      waiting: 'Waiting for typing to finish…', loading: 'Searching Wikidata…',
      ready: state.external.length + ' external results. These are not approved memorial profiles.',
      unavailable: 'Wikidata is unavailable. Approved local profiles still work. ' + (state.error || '') };
    document.getElementById('external-state').textContent = messages[state.status];
    for (const candidate of state.external) {
      const li = document.createElement('li'), link = document.createElement('a');
      link.textContent = candidate.displayName + (candidate.description ? ' — ' + candidate.description : '') + ' (unverified)';
      link.href = candidate.originalUrl; link.target = '_blank'; link.rel = 'noopener noreferrer';
      li.append(link); output.append(li);
    }
  }
  async openPerson(id) {
    this.abort?.abort();
    const controller = new AbortController();
    this.abort = controller;
    const dialog = document.getElementById('person-dialog');
    const content = document.getElementById('person-content');
    document.getElementById('person-heading').textContent = 'Historical record';
    content.textContent = 'Loading the source-linked record…';
    if (!dialog.open) dialog.showModal();
    try {
      const person = await this.app.records.biography(id, controller.signal);
      if (controller.signal.aborted) return;
      document.getElementById('person-heading').textContent = person.displayName;
      content.replaceChildren();
      const paragraph = text => {
        const p = document.createElement('p'); p.textContent = text; content.append(p);
      };
      const media = (person.media || []).filter(RecordStore.displayableMedia);
      for (const item of media) {
        const image = document.createElement('img');
        image.src = item.url;
        image.alt = item.alt || 'Portrait of ' + person.displayName;
        image.loading = 'eager'; image.decoding = 'async';
        if (item.width && item.height) { image.width = item.width; image.height = item.height; }
        const figure = document.createElement('figure'), caption = document.createElement('figcaption');
        figure.className = 'biography-portrait';
        const source = document.createElement('a');
        source.href = item.sourceUrl; source.target = '_blank'; source.rel = 'noopener noreferrer';
        source.textContent = 'Photograph source';
        caption.append(document.createTextNode(item.rights.attribution + ' '), source);
        figure.append(image, caption); content.append(figure);
        image.addEventListener('error', () => {
          const note = document.createElement('p');
          note.className = 'portrait-unavailable'; note.textContent = 'The photograph could not load. ';
          note.append(source); figure.replaceWith(note);
        }, { once: true });
      }
      if (person.birth?.display) paragraph('Born: ' + person.birth.display);
      paragraph('Death or fate: ' + (person.fate?.display || 'Details not established in this record.'));
      if (person.alternativeNames?.length) paragraph((person.apiClaims ? 'Wikidata name variants: ' : 'Documented alternative names: ') + person.alternativeNames.join('; '));
      paragraph(person.biography || 'No editorial biography is available. Consult the source records below.');
      if (person.uncertainty) paragraph(person.uncertainty);
      if (person.verification?.method) paragraph('Verification: ' + person.verification.method + '. Source check: ' + person.verification.reviewedAt + '.');
      const live = document.createElement('p');
      live.dataset.livePerson = id; live.setAttribute('role', 'status'); content.append(live);
      this.updateLiveProfile();
      if (person.apiClaims) {
        const details = document.createElement('details'), summary = document.createElement('summary');
        summary.textContent = 'Wikidata source claims — not independent historical verification';
        details.append(summary);
        const line = (title, claims) => {
          const p = document.createElement('p');
          p.textContent = title + ': ' + (claims?.map(claim => claim.display).join('; ') || 'No statement available.');
          details.append(p);
        };
        line('Birth date statements', person.apiClaims.birth);
        line('Death date statements (may conflict)', person.apiClaims.death);
        line('Birth place statements', person.apiClaims.birthPlaces);
        line('Death place statements', person.apiClaims.deathPlaces);
        const note = document.createElement('p');
        note.textContent = 'Imported ' + person.retrievedAt + '. Structured data from Wikidata contributors (CC0). Institutional evidence above governs this profile’s fate description; conflicting API claims have not been silently resolved.';
        details.append(note); content.append(details);
      }
      if (person.places?.length) paragraph('Places: ' + person.places.map(place => place.display).join('; '));
      for (const fact of person.facts || []) {
        if (typeof fact.text === 'string') paragraph(fact.text);
      }
      for (const source of person.sources) {
        const p = document.createElement('p'), link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = source.institution + (source.role === 'CC0 structured data' ? ' — data record ↗' : ' — historical evidence ↗');
        p.append(link); content.append(p);
      }
      if (!media.length) paragraph('No verified portrait is available in this collection.');
      if (/^Q[1-9]\d*$/.test(person.sourceId || '')) {
        const refresh = document.createElement('button'), result = document.createElement('p');
        refresh.className = 'text-button';
        refresh.textContent = 'Check current Wikidata details';
        result.setAttribute('role', 'status');
        refresh.onclick = async () => {
          refresh.disabled = true; result.textContent = 'Checking Wikidata…';
          try {
            const entities = await this.app.api.entities([person.sourceId], { signal: controller.signal, interactive: true });
            if (controller.signal.aborted) return;
            const candidate = WikidataApi.normalize(entities[person.sourceId]);
            result.textContent = 'Current Wikidata statements (supplementary, unreviewed): ' + candidate.displayName +
              '; birth: ' + (candidate.birthClaims.map(c => c.display).join('; ') || 'not given') +
              '; death: ' + (candidate.deathClaims.map(c => c.display).join('; ') || 'not given') +
              '. The approved local profile has not changed.';
          } catch (error) {
            if (error.name !== 'AbortError') result.textContent = 'Wikidata could not be reached. The approved local profile remains available. ' + error.message;
          } finally { refresh.disabled = false; }
        };
        content.append(refresh, result);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      content.textContent = error.message;
      const retry = document.createElement('button');
      retry.textContent = 'Try again';
      retry.onclick = () => this.openPerson(id);
      content.append(document.createElement('br'), retry);
    }
  }
  update() {
    const { camera, grid, renderer } = this.app;
    const metrics = renderer.metrics;
    this.caption.textContent = metrics.representatives ? 'Stippled representation of the six-million-slot memorial. Zoom closer to resolve exact dots.' : metrics.mode === 'individual dots' || metrics.mode === 'crossfade'
      ? metrics.dots.toLocaleString() + ' statistical dots intersect this view.'
      : camera.zoom === camera.minZoom
        ? grid.count.toLocaleString() + ' stable slots · cached overview'
        : 'Cached representation · zoom closer to distinguish individual dots.';
    document.getElementById('zoom-out').disabled = camera.zoom <= camera.minZoom;
    document.getElementById('zoom-in').disabled = camera.zoom >= camera.maxZoom;
    if (this.app.variant === 'field') {
      const visible = renderer.metrics.visibleSlots;
      const precision = visible < 6000 ? 3 : 2;
      document.getElementById('field-scale').textContent = 'In view: ' +
        (visible / grid.count * 100).toFixed(precision) + '% of the field.';
      this.caption.textContent = visible.toLocaleString() + ' of six million statistical centres intersect the canvas viewport. ' +
        (renderer.metrics.mode === 'individual dots' ? 'Exact individual positions.' : 'Density or aggregate representation; individual dots are not all resolved.');
      const ctx = this.minimap, b = camera.bounds(this.app.bounds), w = 304, h = w * grid.worldHeight / grid.worldWidth;
      const left = 8, top = (192 - h) / 2;
      ctx.clearRect(0, 0, 320, 192); ctx.fillStyle = renderer.densityColor; ctx.fillRect(left, top, w, h);
      const scale = w / grid.worldWidth;
      const x = left + Math.max(0, b.left - grid.worldBounds.left) * scale;
      const y = top + Math.max(0, b.top - grid.worldBounds.top) * scale;
      const right = left + Math.min(grid.worldWidth, b.right - grid.worldBounds.left) * scale;
      const bottom = top + Math.min(grid.worldHeight, b.bottom - grid.worldBounds.top) * scale;
      ctx.save(); ctx.beginPath(); ctx.rect(left, top, w, h); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x, y, right - x, bottom - y);
      ctx.strokeStyle = '#202020'; ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, Math.max(2, right - x - 2), Math.max(2, bottom - y - 2));
      ctx.fillStyle = '#202020'; ctx.beginPath();
      ctx.arc(160 + camera.x * scale, 96 + camera.y * scale, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.canvas.setAttribute('aria-label', 'Your position within the six-million-position field. ' +
        (visible / grid.count * 100).toFixed(precision) + '% is in view.');
      return;
    }
    const ctx = this.minimap, cx = 52, cy = 38, radius = 30;
    ctx.clearRect(0, 0, 104, 76);
    ctx.drawImage(renderer.overview, cx - radius, cy - radius, radius * 2, radius * 2);
    const b = camera.bounds(this.app.bounds);
    const scale = radius / (grid.radius + grid.spacing * 2);
    ctx.save();
    ctx.beginPath(); ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2); ctx.clip();
    ctx.strokeStyle = '#626763'; ctx.lineWidth = 1;
    ctx.strokeRect(cx + b.left * scale, cy + b.top * scale,
      (b.right - b.left) * scale, (b.bottom - b.top) * scale);
    ctx.restore();
  }
}
