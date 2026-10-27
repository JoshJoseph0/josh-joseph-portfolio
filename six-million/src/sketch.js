/* p5 global-mode entry point. Render only after navigation or new tile data. */
let memorial = null;
let pendingRedraw = false;
function memorialPixelDensity(w, h) {
  return Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4000000 / (w * h))));
}
function invalidateMemorial() {
  if (pendingRedraw) return;
  pendingRedraw = true;
  requestAnimationFrame(() => { pendingRedraw = false; redraw(); });
}
function setup() {
  const host = document.getElementById('canvas-host');
  pixelDensity(memorialPixelDensity(host.clientWidth, host.clientHeight));
  const surface = createCanvas(host.clientWidth, host.clientHeight);
  surface.parent(host);
  surface.elt.tabIndex = 0;
  surface.elt.setAttribute('role', 'img');
  surface.elt.setAttribute('aria-label', 'Six Million interactive statistical memorial');
  surface.elt.setAttribute('aria-describedby', 'canvas-description');
  noLoop();
  initializeMemorial(surface.elt);
}
async function initializeMemorial(canvas) {
  try {
    const response = await fetch('data/cohorts.json');
    if (!response.ok) throw new Error('The historical configuration could not load.');
    const data = await response.json(), cohort = data.cohorts[0];
    const grid = new GridModel(cohort);
    const [overview, metadata] = await Promise.all([
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The overview image could not load.'));
        image.src = cohort.visualization.overview;
      }),
      fetch(cohort.visualization.overview.replace('.png', '.json')).then(r => {
        if (!r.ok) throw new Error('The overview manifest could not load.');
        return r.json();
      })
    ]);
    if (metadata.layoutVersion !== grid.version || metadata.slotCount !== grid.count || metadata.radius !== grid.radius ||
        metadata.seed !== grid.seed || metadata.redShare !== grid.redShare || metadata.spacing !== grid.spacing ||
        metadata.diameter !== grid.diameter || metadata.jitter !== grid.jitter || metadata.innerTriangleRatio !== grid.geometry.innerRatio) {
      throw new Error('The overview asset does not match the layout. Regenerate assets.');
    }
    const camera = new MemorialCamera(grid, width, height);
    camera.opening();
    const records = new RecordStore(grid);
    const assignments = new BrowserAssignments(grid);
    const app = {
      grid, cohort, camera, records, assignments, api: new WikidataApi(new HistoricalApiClient()), point: {}, bounds: {},
      invalidate: invalidateMemorial,
      zoom(factor) {
        // Toolbar/keyboard zoom starts inside a band; pointer zoom keeps its
        // existing cursor anchor. Otherwise the overview's central hole fills
        // the screen before any individual dots can be explored.
        if (factor > 1 && !grid.geometry.contains(camera.x, camera.y)) {
          let slot = Math.floor(grid.count / 2);
          for (let attempt = 0; attempt < 32 && slot < grid.count - 1 && !grid.isRed(slot); attempt++) slot++;
          grid.getPosition(slot, app.point); camera.x = app.point.x; camera.y = app.point.y;
        }
        camera.zoomAt(factor, camera.width / 2, camera.height / 2); invalidateMemorial();
      },
      selectAt(sx, sy) {
        if (camera.zoom < 0.75) return;
        const p = camera.screenToWorld(sx, sy, app.point);
        const slot = grid.nearest(p.x, p.y, Math.max(grid.diameter / 2, Math.min(grid.spacing * 0.65, 10 / camera.zoom)));
        if (slot === null) return;
        if (!grid.isRed(slot)) { app.ui.openUnavailable('This grey dot is part of the aggregate estimate. Its colour does not establish whether a victim is historically unidentified. Use Explore documented lives to read available profiles.'); return; }
        const personId = app.buffer?.take(slot) || assignments.personForSlot(slot);
        if (personId) app.ui.openPerson(personId);
        else app.ui.openUnavailable(app.buffer?.status === 'loading'
          ? 'Approved historical profiles are being prepared. Please try again shortly.'
          : 'No further approved profile is available for this dot. Existing biographies remain available through Explore documented lives. No identity has been invented or assigned.');
      }
    };
    app.renderer = new MemorialRenderer(grid, cohort, overview, invalidateMemorial);
    app.ui = new MemorialUI(app);
    memorial = app;
    app.ui.status.textContent = '';
    attachMemorialInteractions(app, canvas);
    new ResizeObserver(() => {
      // A hidden host (or page teardown) has no drawable backing dimensions.
      if (canvas.parentElement.clientWidth < 1 || canvas.parentElement.clientHeight < 1) return;
      if (width === canvas.parentElement.clientWidth && height === canvas.parentElement.clientHeight) return;
      const density = memorialPixelDensity(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
      if (pixelDensity() !== density) pixelDensity(density);
      resizeCanvas(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight, true);
      camera.resize(width, height);
      invalidateMemorial();
    }).observe(canvas.parentElement);
    records.loadIndex().then(() => {
      assignments.restore(records);
      app.buffer = new HistoricalRecordBuffer(records, assignments, app.api, { onState: () => app.ui.bufferChanged() });
      app.ui.recordsReady();
      app.buffer.start(); invalidateMemorial();
    }).catch(() => app.ui.recordsReady(true));
    invalidateMemorial();
  } catch (error) {
    document.getElementById('status').textContent = error.message + ' Reload to try again.';
    document.getElementById('record-state').textContent = 'The memorial could not finish loading.';
  }
}
function draw() {
  if (!memorial) { background(247, 246, 242); return; }
  memorial.renderer.render(drawingContext, memorial.camera);
  memorial.ui.update();
}
