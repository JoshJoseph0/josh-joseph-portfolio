/* LOD compositor. p5 owns the visible Canvas2D canvas and redraw scheduling.
 * Statistical slots, archived identities and screen UI remain independent.
 */
class MemorialRenderer {
  constructor(grid, cohort, overview, invalidate) {
    this.grid = grid;
    this.overview = overview;
    this.invalidate = invalidate;
    this.tileSize = 1024;
    this.tilePixels = 512;
    this.maxTiles = 48; // ~48 MiB decoded pixels + overview and screen buffers.
    this.cache = new Map();
    this.wanted = new Set();
    this.jobs = [];
    this.bounds = {};
    this.points = new MemorialPoints(grid);
    this.lod = {};
    this.starPath = new Path2D();
    for (let i = 0; i < 2; i++) {
      for (const vertices of [grid.geometry.outer[i], [...grid.geometry.inner[i]].reverse()]) {
        this.starPath.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < 3; j++) this.starPath.lineTo(vertices[j].x, vertices[j].y);
        this.starPath.closePath();
      }
    }
    this.metrics = { mode: 'overview', dots: 0, tiles: 0, renderMs: 0, frames: 0 };
    this.raster = document.createElement('canvas');
    this.rasterContext = this.raster.getContext('2d');
    if (typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
      try {
        this.worker = new Worker('src/tile-worker.js');
        this.worker.postMessage({ type: 'configure', cohort });
        this.worker.onmessage = event => this.finishTile(event.data);
        this.worker.onerror = () => {
          this.worker.terminate();
          this.worker = null;
          this.busy = false;
          this.signature = '';
          this.invalidate();
        };
      } catch { this.worker = null; }
    }
  }
  static blend(a, b, value) {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  prepareTiles(camera) {
    // Overview is enough for subpixel spacing. Stop queuing as exact dots take over.
    if (camera.zoom < 0.24 || camera.zoom >= 1.1) {
      this.wanted.clear();
      this.jobs.length = 0;
      this.signature = '';
      return;
    }
    const b = camera.bounds(this.bounds);
    const size = this.tileSize;
    const minX = Math.floor(b.left / size), maxX = Math.floor(b.right / size);
    const minY = Math.floor(b.top / size), maxY = Math.floor(b.bottom / size);
    const signature = [minX, maxX, minY, maxY].join(',');
    if (signature === this.signature) return;
    this.signature = signature;
    const jobs = [];
    const r = this.grid.radius;
    for (let iy = minY; iy <= maxY; iy++) {
      for (let ix = minX; ix <= maxX; ix++) {
        const x = ix * size, y = iy * size;
        const nearX = Math.max(x, Math.min(x + size, 0));
        const nearY = Math.max(y, Math.min(y + size, 0));
        if (nearX * nearX + nearY * nearY > r * r) continue;
        jobs.push({ key: ix + ',' + iy, x, y, size, pixels: this.tilePixels,
          distance: (x + size / 2 - camera.x) ** 2 + (y + size / 2 - camera.y) ** 2 });
      }
    }
    jobs.sort((a, b) => a.distance - b.distance);
    jobs.length = Math.min(jobs.length, this.maxTiles);
    this.wanted = new Set(jobs.map(job => job.key));
    this.jobs = jobs.filter(job => !this.cache.has(job.key));
    this.pump();
  }
  pump() {
    if (this.busy || !this.jobs.length) return;
    const job = this.jobs.shift();
    this.busy = true;
    if (this.worker) this.worker.postMessage(job);
    else {
      // Older browser fallback: one bounded tile in an idle task, never all slots.
      const render = () => {
        if (!this.wanted.has(job.key)) { this.busy = false; this.pump(); return; }
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = job.pixels;
        paintMemorialTile(canvas.getContext('2d'), this.grid, job);
        this.finishTile({ key: job.key, bitmap: canvas });
      };
      if ('requestIdleCallback' in window) requestIdleCallback(render, { timeout: 120 });
      else setTimeout(render, 0);
    }
  }
  finishTile({ key, bitmap, error }) {
    this.busy = false;
    if (!error && this.wanted.has(key)) {
      this.cache.delete(key);
      this.cache.set(key, bitmap);
      while (this.cache.size > this.maxTiles) {
        const oldest = [...this.cache.keys()].find(k => !this.wanted.has(k)) || this.cache.keys().next().value;
        this.cache.get(oldest).close?.();
        this.cache.delete(oldest);
      }
    } else bitmap?.close?.();
    this.pump();
    this.invalidate();
  }
  render(ctx, camera) {
    if (camera.width < 1 || camera.height < 1 || !ctx.canvas.width || !ctx.canvas.height) return;
    if (this.points.ready && !this.points.gl.isContextLost()) return this.renderMultiscale(ctx, camera);
    const start = performance.now();
    this.prepareTiles(camera);
    const detail = MemorialRenderer.blend(0.75, 1.1, camera.zoom);
    const tileBlend = MemorialRenderer.blend(0.24, 0.4, camera.zoom);
    const w = camera.width, h = camera.height;
    this.metrics.dots = 0;
    this.metrics.tiles = 0;
    this.metrics.backend = 'raster';
    this.metrics.mode = detail === 1 ? 'individual dots' : detail > 0 ? 'crossfade' : tileBlend > 0 ? 'cached tiles' : 'overview';
    ctx.save();
    ctx.fillStyle = MemorialInk.paper;
    ctx.fillRect(0, 0, w, h);
    if (detail < 1) {
      if (this.raster.width !== w || this.raster.height !== h) {
        this.raster.width = w;
        this.raster.height = h;
      }
      const raster = this.rasterContext;
      raster.setTransform(1, 0, 0, 1, 0, 0);
      raster.fillStyle = MemorialInk.paper;
      raster.fillRect(0, 0, w, h);
      raster.save();
      camera.apply(raster);
      const extent = this.grid.radius + this.grid.spacing * 2;
      raster.drawImage(this.overview, -extent, -extent, extent * 2, extent * 2);
      raster.globalAlpha = tileBlend;
      for (const key of this.wanted) {
        const tile = this.cache.get(key);
        if (!tile) continue;
        // Touch used entries so eviction follows least-recently-used order.
        this.cache.delete(key);
        this.cache.set(key, tile);
        const comma = key.indexOf(',');
        const x = Number(key.slice(0, comma)) * this.tileSize;
        const y = Number(key.slice(comma + 1)) * this.tileSize;
        raster.drawImage(tile, x, y, this.tileSize, this.tileSize);
        this.metrics.tiles++;
      }
      raster.restore();
      ctx.globalAlpha = 1 - detail;
      ctx.drawImage(this.raster, 0, 0);
    }
    if (detail > 0) {
      ctx.globalAlpha = detail;
      camera.bounds(this.bounds, this.grid.diameter / 2);
      const count = this.points.draw(ctx, camera, this.bounds);
      this.metrics.backend = count < 0 ? 'Canvas2D' : 'WebGL2';
      if (count >= 0) this.metrics.dots = count;
      else {
        ctx.save();
        camera.apply(ctx);
        this.metrics.dots = paintMemorialDots(ctx, this.grid, this.bounds);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    this.metrics.renderMs = performance.now() - start;
    this.metrics.frames++;
  }
  renderMultiscale(ctx, camera) {
    const start = performance.now(), metrics = this.metrics;
    const overview = (camera.zoom === camera.minZoom && camera.x === 0 && camera.y === 0) ||
      (camera.viewPreset === 'opening' && Math.abs(camera.zoom - camera.openingZoom) < 1e-10);
    const key = [ctx.canvas.width, ctx.canvas.height, camera.width, camera.height, camera.zoom, camera.x, camera.y].join(',');
    metrics.dots = 0; metrics.tiles = 0; metrics.backend = 'WebGL2'; metrics.representatives = 0;
    metrics.mode = overview ? 'overview' : 'aggregate points';
    ctx.save(); ctx.fillStyle = MemorialInk.paper; ctx.fillRect(0, 0, camera.width, camera.height);
    if (overview && this.cachedOverviewKey === key) {
      ctx.drawImage(this.cachedOverview, 0, 0, camera.width, camera.height);
      metrics.representatives = this.cachedRepresentatives;
    } else {
      const lod = MemorialLOD.levels(this.grid, camera, this.lod);
      metrics.mode = lod.exact ? 'individual dots' : overview ? 'overview' : 'crossfade';
      camera.bounds(this.bounds, MemorialLOD.diameter(this.grid, lod.coarse) / 2);
      // Nonzero winding unions the two bands, including their overlap. Inflated
      // aggregate marks are clipped, so no mark spills into holes or outside.
      camera.apply(ctx); ctx.clip(this.starPath);
      ctx.translate(camera.x, camera.y); ctx.scale(1 / camera.zoom, 1 / camera.zoom);
      ctx.translate(-camera.width / 2, -camera.height / 2);
      if (!lod.exact && lod.mix < 1) {
        ctx.globalAlpha = 1 - lod.mix;
        const count = this.points.draw(ctx, camera, this.bounds, lod.coarse);
        if (count >= 0) metrics.representatives += count;
      }
      if (lod.exact || lod.mix > 0) {
        ctx.globalAlpha = lod.exact ? 1 : lod.mix;
        const count = this.points.draw(ctx, camera, this.bounds, lod.fine);
        if (count >= 0) { if (lod.exact) metrics.dots = count; else metrics.representatives += count; }
      }
    }
    ctx.restore();
    if (overview && this.cachedOverviewKey !== key) {
      this.cachedOverview ||= document.createElement('canvas');
      this.cachedOverview.width = ctx.canvas.width; this.cachedOverview.height = ctx.canvas.height;
      this.cachedOverview.getContext('2d').drawImage(ctx.canvas, 0, 0);
      this.cachedOverviewKey = key; this.cachedRepresentatives = metrics.representatives;
    }
    metrics.renderMs = performance.now() - start; metrics.frames++;
  }
  dispose() {
    this.worker?.terminate();
    this.points.dispose();
    for (const bitmap of this.cache.values()) bitmap.close?.();
    this.cache.clear();
  }
}
