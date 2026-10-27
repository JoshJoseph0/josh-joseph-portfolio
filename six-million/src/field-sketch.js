/* The Field is the main p5 global-mode entry. Historical data is shared with the
 * star comparison; population layout and GPU drawing are independent modules. */
let memorial = null, pendingRedraw = false;
function invalidateMemorial() {
  if (pendingRedraw) return; pendingRedraw = true;
  requestAnimationFrame(() => { pendingRedraw = false; redraw(); });
}
function fieldPixelDensity(w, h) { return Math.max(1, Math.min(devicePixelRatio || 1, 2, Math.sqrt(4000000 / (w * h)))); }
function setup() {
  const host = document.getElementById('canvas-host');
  pixelDensity(fieldPixelDensity(host.clientWidth, host.clientHeight));
  const surface = createCanvas(host.clientWidth, host.clientHeight); surface.parent(host); noLoop();
  surface.elt.tabIndex = 0; surface.elt.setAttribute('role', 'img');
  surface.elt.setAttribute('aria-label', 'The Field: Six Million interactive statistical memorial');
  surface.elt.setAttribute('aria-describedby', 'canvas-description');
  const grid = new FieldGrid(), camera = new FieldCamera(grid, width, height);
  const connection = new MemorialConnection(window.MEMORIAL_CONFIG);
  const records = new RecordStore(grid, (url, options) => connection.record(url, options));
  const assignments = new SharedAssignments();
  const app = { variant: 'field', grid, camera, records, assignments, connection, point: {}, bounds: {},
    api: new WikidataApi(new HistoricalApiClient()), invalidate: invalidateMemorial,
    zoom(factor) { camera.zoomAt(factor, camera.width / 2, camera.height / 2); invalidateMemorial(); },
    selectAt(sx, sy) {
      const p = camera.screenToWorld(sx, sy, app.point);
      const slot = grid.nearest(p.x, p.y, Math.max(grid.diameter / 2, Math.min(grid.spacing * 0.65, 10 / camera.zoom)));
      if (slot === null) return;
      app.ui.openSharedSlot(slot);
    }
  };
  app.renderer = new FieldRenderer(grid); app.ui = new MemorialUI(app); memorial = app;
  app.ui.status.textContent = '';
  document.getElementById('fit-field').onclick = () => { camera.fit(); invalidateMemorial(); };
  attachMemorialInteractions(app, surface.elt);
  new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h || (width === w && height === h)) return;
    pixelDensity(fieldPixelDensity(w, h)); resizeCanvas(w, h, true); camera.resize(w, h); invalidateMemorial();
  }).observe(host);
  records.loadIndex().then(async () => {
    app.buffer = new SharedRecordBuffer(records, assignments, app.api, { onState: () => app.ui.bufferChanged(), connection });
    try { await app.buffer.start(); }
    catch {
      assignments.problem = connection.unavailableMessage();
      app.buffer.status = 'unavailable';
    }
    app.ui.recordsReady(); invalidateMemorial();
  }).catch(() => {
    assignments.problem = 'The approved record collection could not load. Please reload to try again.';
    app.ui.recordsReady(true);
  });
  invalidateMemorial();
}
function draw() {
  if (!memorial) return; memorial.renderer.render(drawingContext, memorial.camera); memorial.ui.update();
}
