class FieldCamera extends MemorialCamera {
  resize(width, height, reset = false) {
    const preset = this.viewPreset;
    const atOverview = this.zoom !== undefined && this.zoom <= this.minZoom * (1 + 1e-9);
    this.width = width; this.height = height;
    // Bound the possible centres, including staggered edge columns and jitter.
    // This guarantees <= 27,000 (0.45%) at every pan position, not just home.
    const spacing = 6, rowHeight = spacing * Math.sqrt(3) / 2, jitter = 1.8;
    const limit = 27000;
    let low = 0, high = Math.max(24, width, height);
    for (let i = 0; i < 48; i++) {
      const zoom = (low + high) / 2;
      const columns = Math.ceil((width / zoom + jitter * 2) / spacing + 1.5);
      const rows = Math.ceil((height / zoom + jitter * 2) / rowHeight + 1);
      if (columns * rows > limit) low = zoom; else high = zoom;
    }
    this.minZoom = high;
    if (reset || preset === 'arrival') this.reset();
    else if (preset === 'field-overview' || atOverview) this.fit();
    else { this.zoom = Math.max(this.minZoom, this.zoom); this.constrain(); }
  }
  reset() {
    this.zoom = Math.max(this.minZoom, 0.85);
    this.x = this.y = 0; this.viewPreset = 'arrival';
  }
  fit() { this.zoom = this.minZoom; this.constrain(); this.viewPreset = 'field-overview'; }
  zoomAt(factor, sx, sy) {
    super.zoomAt(factor, sx, sy);
    if (this.zoom === this.minZoom) this.viewPreset = 'field-overview';
  }
}
if (typeof module !== 'undefined') module.exports = { FieldCamera };
