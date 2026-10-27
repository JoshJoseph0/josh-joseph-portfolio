/* Direct WebGL2 keeps the existing p5 lifecycle and point shader. At most two
 * bounded point batches; never six million draw calls or point objects. */
const FieldInk = { paper: '#fff', red: '#a52b26', grey: '#666560', opacity: 0.94,
  redRGB: new Float32Array([165 / 255, 43 / 255, 38 / 255]), greyRGB: new Float32Array([102 / 255, 101 / 255, 96 / 255]) };
class FieldLOD {
  static diameter(grid, stride) { return grid.diameter * stride; }
  static visit(grid, bounds, stride, visit) {
    if (stride === 1) return grid.visitBounds(bounds, visit);
    // Representative neighbourhood marks are illustrative. Keep their mean
    // coverage without magnifying the lattice into mechanical square rows.
    const jitter = grid.spacing * stride * 0.23;
    const expanded = { left: bounds.left - jitter, right: bounds.right + jitter,
      top: bounds.top - jitter, bottom: bounds.bottom + jitter };
    let count = 0;
    grid.visitBounds(expanded, (id, x, y) => {
      x += (FieldGrid.hash(id, stride ^ 0x452aff) / 4294967296 * 2 - 1) * jitter;
      y += (FieldGrid.hash(id, stride ^ 0x198dab) / 4294967296 * 2 - 1) * jitter;
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return;
      count++; visit(id, x, y);
    }, stride);
    return count;
  }
}
class FieldRenderer {
  constructor(grid) {
    this.grid = grid; this.points = new MemorialPoints(grid, { lod: FieldLOD, ink: FieldInk });
    this.bounds = {}; this.cache = new Map(); this.jobs = [];
    this.metrics = { frames: 0, mode: 'individual dots', dots: 0, tiles: 0, representatives: 0 };
    // Average exact circle area on the finite plane, not a repeated dot tile.
    // The fixed hash's red/grey counts were exhaustively checked for star-v1;
    // field-v1 uses those same IDs, seed and colour hash.
    const coverage = grid.count * Math.PI * (grid.diameter / 2) ** 2 / (grid.worldWidth * grid.worldHeight) * FieldInk.opacity;
    const redShare = 4999066 / grid.count;
    const rgb = [0, 1, 2].map(i => Math.round(255 * (1 - coverage) + coverage * 255 *
      (redShare * FieldInk.redRGB[i] + (1 - redShare) * FieldInk.greyRGB[i])));
    this.densityColor = 'rgb(' + rgb.join(',') + ')';
    this.overview = document.createElement('canvas'); this.overview.width = 180; this.overview.height = 104;
    const ctx = this.overview.getContext('2d'); ctx.fillStyle = this.densityColor; ctx.fillRect(0, 0, 180, 104);
    this.collectFallback = (id, x, y) => {
      const ctx = this.fallbackContext, radius = this.fallbackRadius;
      ctx.fillStyle = this.grid.isRed(id) ? FieldInk.red : FieldInk.grey;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    };
  }
  render(ctx, camera) {
    const start = performance.now(), grid = this.grid, metrics = this.metrics;
    camera.bounds(this.bounds);
    const visible = grid.visibleCount(this.bounds);
    const spacing = grid.spacing * camera.zoom;
    const level = Math.max(-1, Math.log2(Math.max(2, spacing * Math.sqrt(visible / 180000)) / spacing));
    const fine = 2 ** Math.max(0, Math.ceil(level)), coarse = fine * 2;
    const mix = level <= -1 ? 1 : Math.max(0, Math.min(1, Math.ceil(level) - level));
    const exact = level <= -1;
    // Density takes over below resolvable spacing. Smoothstep gives continuous
    // opacity and slope, with no temporal/cinematic camera animation.
    const t = Math.max(0, Math.min(1, (spacing - 0.65) / 0.85)), detail = t * t * (3 - 2 * t);
    Object.assign(metrics, { dots: 0, tiles: 0, representatives: 0, visibleSlots: visible,
      mode: exact ? 'individual dots' : detail === 0 ? 'density overview' : 'multiresolution', backend: this.points.ready ? 'WebGL2' : 'Canvas2D' });
    ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, camera.width, camera.height);
    if (detail < 1) {
      ctx.save(); camera.apply(ctx); ctx.globalAlpha = 1 - detail; ctx.fillStyle = this.densityColor;
      ctx.fillRect(grid.worldBounds.left, grid.worldBounds.top, grid.worldWidth, grid.worldHeight); ctx.restore();
    }
    if (detail > 0) {
      const pad = grid.diameter * coarse / 2;
      camera.bounds(this.bounds, pad);
      // Clip the finite true extent, including enlarged aggregate edge marks.
      ctx.save(); camera.apply(ctx); ctx.beginPath(); ctx.rect(grid.worldBounds.left, grid.worldBounds.top, grid.worldWidth, grid.worldHeight); ctx.clip();
      ctx.translate(camera.x, camera.y); ctx.scale(1 / camera.zoom, 1 / camera.zoom); ctx.translate(-camera.width / 2, -camera.height / 2);
      const draw = (stride, alpha) => {
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha * detail;
        let count = this.points.draw(ctx, camera, this.bounds, stride);
        if (count < 0) {
          metrics.backend = 'Canvas2D'; this.fallbackContext = ctx; this.fallbackRadius = FieldLOD.diameter(grid, stride) / 2;
          ctx.save(); camera.apply(ctx); ctx.globalAlpha *= FieldInk.opacity;
          count = grid.visitBounds(this.bounds, this.collectFallback, stride); ctx.restore();
        }
        if (exact) metrics.dots += Math.max(0, count); else metrics.representatives += Math.max(0, count);
      };
      if (!exact) draw(coarse, 1 - mix);
      draw(fine, exact ? 1 : mix); ctx.restore();
    }
    ctx.restore(); metrics.renderMs = performance.now() - start; metrics.frames++;
  }
  dispose() { this.points.dispose(); }
}
