/* Finite population math: no drawing, no per-person coordinate objects.
 * Stable row-major IDs, staggered rows and bounded disk jitter. Layout field-v1
 * deliberately differs from star-v1; canonical population IDs/colours survive.
 */
class FieldGrid {
  constructor() {
    this.version = 'field-v1'; this.recordLayoutVersion = 'star-v1'; this.cohortId = 'jewish-victims';
    this.columns = 3000; this.rows = 2000; this.count = this.columns * this.rows;
    this.spacing = 6; this.rowHeight = this.spacing * Math.sqrt(3) / 2;
    this.diameter = 2.3; this.jitter = 1.8; this.seed = 0x06194b37; this.redShare = 5 / 6;
    this.margin = this.jitter + this.diameter / 2;
    this.worldWidth = (this.columns - 0.5) * this.spacing + this.margin * 2;
    this.worldHeight = (this.rows - 1) * this.rowHeight + this.margin * 2;
    this.worldBounds = { left: -this.worldWidth / 2, right: this.worldWidth / 2,
      top: -this.worldHeight / 2, bottom: this.worldHeight / 2 };
    this.radius = Math.max(this.worldWidth, this.worldHeight) / 2;
    this.originX = this.worldBounds.left + this.margin;
    this.originY = this.worldBounds.top + this.margin;
  }
  static hash(value, seed) {
    let n = (value ^ seed) >>> 0;
    n = Math.imul(n ^ n >>> 16, 0x7feb352d); n = Math.imul(n ^ n >>> 15, 0x846ca68b);
    return (n ^ n >>> 16) >>> 0;
  }
  isRed(id) { return FieldGrid.hash(id, this.seed ^ 0x73ab9) / 4294967296 < this.redShare; }
  getPosition(id, out) {
    if (!Number.isInteger(id) || id < 0 || id >= this.count) throw new RangeError('Invalid statistical slot.');
    const row = Math.floor(id / this.columns), column = id - row * this.columns;
    const angle = FieldGrid.hash(id, this.seed) / 4294967296 * Math.PI * 2;
    const radius = Math.sqrt(FieldGrid.hash(id, this.seed ^ 0x9e3779b9) / 4294967296) * this.jitter;
    out.x = this.originX + (column + (row & 1) * 0.5) * this.spacing + Math.cos(angle) * radius;
    out.y = this.originY + row * this.rowHeight + Math.sin(angle) * radius;
    return out;
  }
  range(bounds, out) {
    out.firstRow = Math.max(0, Math.ceil((bounds.top - this.jitter - this.originY) / this.rowHeight));
    out.lastRow = Math.min(this.rows - 1, Math.floor((bounds.bottom + this.jitter - this.originY) / this.rowHeight));
    out.firstColumn = Math.max(0, Math.ceil((bounds.left - this.jitter - this.originX) / this.spacing - 0.5));
    out.lastColumn = Math.min(this.columns - 1, Math.floor((bounds.right + this.jitter - this.originX) / this.spacing));
    return out;
  }
  visitBounds(bounds, visit, stride = 1) {
    const range = this.range(bounds, {}), p = {}; let count = 0;
    const firstRow = Math.ceil(range.firstRow / stride) * stride;
    const firstColumn = Math.ceil(range.firstColumn / stride) * stride;
    for (let row = firstRow; row <= range.lastRow; row += stride) for (let column = firstColumn; column <= range.lastColumn; column += stride) {
      const id = row * this.columns + column; this.getPosition(id, p);
      if (p.x < bounds.left || p.x > bounds.right || p.y < bounds.top || p.y > bounds.bottom) continue;
      count++; visit(id, p.x, p.y);
    }
    return count;
  }
  visibleCount(bounds) {
    // Entire interior columns/rows are guaranteed inside by the jitter bound.
    // Only a narrow perimeter needs exact position checks, even at overview.
    const outer = this.range(bounds, {}), p = {}; let count = 0;
    for (let row = outer.firstRow; row <= outer.lastRow; row++) {
      const y = this.originY + row * this.rowHeight, offset = (row & 1) * 0.5;
      const first = Math.max(outer.firstColumn, Math.ceil((bounds.left + this.jitter - this.originX) / this.spacing - offset));
      const last = Math.min(outer.lastColumn, Math.floor((bounds.right - this.jitter - this.originX) / this.spacing - offset));
      const fullRow = y - this.jitter >= bounds.top && y + this.jitter <= bounds.bottom;
      if (fullRow && first <= last) count += last - first + 1;
      for (let column = outer.firstColumn; column <= outer.lastColumn; column++) {
        if (fullRow && column === first) { column = last; continue; }
        this.getPosition(row * this.columns + column, p);
        if (p.x >= bounds.left && p.x <= bounds.right && p.y >= bounds.top && p.y <= bounds.bottom) count++;
      }
    }
    return count;
  }
  nearest(x, y, tolerance) {
    let nearest = null, distance = tolerance * tolerance;
    this.visitBounds({ left: x - tolerance, right: x + tolerance, top: y - tolerance, bottom: y + tolerance }, (id, px, py) => {
      const d = (x - px) ** 2 + (y - py) ** 2; if (d <= distance) { distance = d; nearest = id; }
    });
    return nearest;
  }
}
if (typeof module !== 'undefined') module.exports = { FieldGrid };
