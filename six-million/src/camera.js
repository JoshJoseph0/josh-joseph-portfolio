/* Pure camera math shared by pointer, touch, keyboard and accessible controls. */
class MemorialCamera {
  constructor(world, width, height) {
    this.radius = typeof world === 'number' ? world : world.radius;
    this.world = typeof world === 'number'
      ? { left: -world, right: world, top: -world, bottom: world } : world.worldBounds;
    this.maxZoom = 24;
    this.resize(width, height, true);
  }
  resize(width, height, reset = false) {
    const wasOpening = !reset && this.viewPreset === 'opening' && Math.abs(this.zoom - this.openingZoom) < 1e-8;
    const wasOverview = reset || Math.abs(this.zoom - this.minZoom) < 1e-8;
    this.width = width;
    this.height = height;
    this.minZoom = Math.max(0.001, Math.min((width - 32) / (this.world.right - this.world.left),
      (height - 32) / (this.world.bottom - this.world.top)));
    if (wasOpening) this.opening();
    else if (wasOverview) this.reset();
    else { this.zoom = Math.max(this.minZoom, this.zoom); this.constrain(); }
  }
  reset() { this.x = 0; this.y = 0; this.zoom = this.minZoom; this.viewPreset = 'overview'; }
  opening() {
    // Latest supplied opening reference intentionally crops the vertical tips.
    // Narrow screens retain the silhouette so touch exploration stays legible.
    const narrow = this.width < 650;
    this.zoom = Math.min(this.maxZoom, this.minZoom * (narrow ? 1.05 : 1.5));
    this.x = 0; this.y = narrow ? 0 : this.height * 0.11 / this.zoom;
    this.constrain(); this.openingZoom = this.zoom; this.viewPreset = 'opening';
  }
  screenToWorld(x, y, out) {
    out.x = this.x + (x - this.width / 2) / this.zoom;
    out.y = this.y + (y - this.height / 2) / this.zoom;
    return out;
  }
  zoomAt(factor, sx, sy) {
    this.viewPreset = null;
    const old = this.zoom;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, old * factor));
    this.x += (sx - this.width / 2) * (1 / old - 1 / this.zoom);
    this.y += (sy - this.height / 2) * (1 / old - 1 / this.zoom);
    this.constrain();
  }
  pan(dx, dy) { this.viewPreset = null; this.x -= dx / this.zoom; this.y -= dy / this.zoom; this.constrain(); }
  constrain() {
    const limitX = Math.max(0, this.world.right - this.width / (2 * this.zoom));
    const limitY = Math.max(0, this.world.bottom - this.height / (2 * this.zoom));
    this.x = Math.max(-limitX, Math.min(limitX, this.x));
    this.y = Math.max(-limitY, Math.min(limitY, this.y));
    // Rectangular star bounds allow navigation through the central opening and
    // into all six tips. A disk constraint would make the outer points unreachable.
  }
  bounds(out, padding = 0) {
    out.left = this.x - this.width / (2 * this.zoom) - padding;
    out.right = this.x + this.width / (2 * this.zoom) + padding;
    out.top = this.y - this.height / (2 * this.zoom) - padding;
    out.bottom = this.y + this.height / (2 * this.zoom) + padding;
    return out;
  }
  apply(context) {
    context.translate(this.width / 2, this.height / 2);
    context.scale(this.zoom, this.zoom);
    context.translate(-this.x, -this.y);
  }
}
if (typeof module !== 'undefined') module.exports = { MemorialCamera };
