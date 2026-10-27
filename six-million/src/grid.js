/* Compact statistical slots, independent of biographies and browser memory.
 * star-v1 fixes the seed, spacing, jitter and band ratio. Change the version if
 * any of those change. Only short row/span descriptors are retained in memory.
 */
const StarGeometry = typeof module !== 'undefined' ? require('./geometry/star-of-david.js').StarOfDavid : StarOfDavid;
class GridModel {
  constructor(cohort) {
    this.cohortId = cohort.id;
    this.count = cohort.visualization.slotCount;
    this.version = cohort.visualization.layoutVersion;
    if (!Number.isSafeInteger(this.count) || this.count < 1 || this.count > 10000000) throw new Error('Unsupported slot count.');
    if (this.version !== 'star-v1') throw new Error('Unsupported layout version.');
    this.spacing = 6;
    this.diameter = 2.3;
    this.rowHeight = this.spacing * Math.sqrt(3) / 2;
    this.jitter = this.spacing * 0.30; // bounded disk; minimum centre separation >= 2.4
    this.seed = 0x6194b37;
    this.redShare = cohort.visualization.documentedNameShare ?? 5 / 6;
    this.red = '#9d3732'; this.grey = '#4b4e4c'; this.opacity = 0.82;
    // Integrate the unit band's union once, then reserve the edge padding.
    const unit = new StarGeometry(1), bands = unit.scanlines();
    let area = 0;
    for (let i = 0; i < 2048; i++) for (const [left, right] of unit.rowIntervals(-1 + (i + 0.5) / 1024, bands)) area += (right - left) / 1024;
    this.radius = Math.ceil(Math.sqrt(this.count * this.spacing * this.rowHeight / area)) + 32;
    do {
      this.geometry = new StarGeometry(this.radius);
      this.buildRows();
      if (this.candidates < this.count) this.radius++;
    } while (this.candidates < this.count);
    this.worldBounds = this.geometry.bounds;
    this.descriptorBytes = this.rowOffsets.byteLength + this.spanStarts.byteLength + this.spanRows.byteLength + this.firstColumns.byteLength;
  }
  buildRows() {
    this.halfRows = Math.ceil(this.radius / this.rowHeight);
    const rows = this.halfRows * 2 + 1;
    const bands = this.geometry.scanlines(this.jitter + this.diameter / 2 + 0.001);
    const starts = [0], spanRows = [], columns = [], offsets = new Uint32Array(rows + 1);
    for (let row = 0; row < rows; row++) {
      offsets[row] = columns.length;
      const offset = (row & 1) * 0.5;
      let previousLast = -Infinity;
      for (const [left, right] of this.geometry.rowIntervals((row - this.halfRows) * this.rowHeight, bands)) {
        const first = Math.max(previousLast + 1, Math.ceil(left / this.spacing - offset));
        const last = Math.floor(right / this.spacing - offset);
        if (last < first) continue;
        columns.push(first); spanRows.push(row); starts.push(starts.at(-1) + last - first + 1);
        previousLast = last;
      }
    }
    offsets[rows] = columns.length;
    this.rowOffsets = offsets;
    this.spanStarts = Float64Array.from(starts);
    this.spanRows = Int32Array.from(spanRows);
    this.firstColumns = Int32Array.from(columns);
    this.candidates = starts.at(-1);
  }
  static hash(value) {
    value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
    value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }
  isRed(id) { return GridModel.hash(id ^ this.seed ^ 0x73ab9) < this.redShare; }
  candidateForSlot(id) { return Math.floor(id * this.candidates / this.count); }
  slotForCandidate(candidate) {
    const id = Math.ceil(candidate * this.count / this.candidates);
    return id >= 0 && id < this.count && this.candidateForSlot(id) === candidate ? id : -1;
  }
  position(id, row, col, out) {
    let dx = (GridModel.hash(id ^ this.seed ^ 0x12345) * 2 - 1) * this.jitter;
    let dy = (GridModel.hash(id ^ this.seed ^ 0xabcde) * 2 - 1) * this.jitter;
    const length2 = dx * dx + dy * dy;
    if (length2 > this.jitter * this.jitter) {
      const scale = this.jitter / Math.sqrt(length2); dx *= scale; dy *= scale;
    }
    out.x = (col + (row & 1) * 0.5) * this.spacing + dx;
    out.y = (row - this.halfRows) * this.rowHeight + dy;
    return out;
  }
  getPosition(id, out) {
    if (!Number.isInteger(id) || id < 0 || id >= this.count) throw new RangeError('Invalid slot ID.');
    const candidate = this.candidateForSlot(id);
    let low = 0, high = this.firstColumns.length;
    while (low + 1 < high) {
      const mid = (low + high) >>> 1;
      if (this.spanStarts[mid] <= candidate) low = mid; else high = mid;
    }
    return this.position(id, this.spanRows[low], this.firstColumns[low] + candidate - this.spanStarts[low], out);
  }
  visitBounds(bounds, visit) {
    const pad = this.jitter, point = this.visitPoint || (this.visitPoint = {});
    const firstRow = Math.max(0, Math.ceil((bounds.top - pad) / this.rowHeight + this.halfRows));
    const lastRow = Math.min(this.rowOffsets.length - 2, Math.floor((bounds.bottom + pad) / this.rowHeight + this.halfRows));
    let visible = 0;
    for (let row = firstRow; row <= lastRow; row++) {
      const offset = (row & 1) * 0.5;
      for (let span = this.rowOffsets[row]; span < this.rowOffsets[row + 1]; span++) {
        const first = Math.max(this.firstColumns[span], Math.ceil((bounds.left - pad) / this.spacing - offset));
        const last = Math.min(this.firstColumns[span] + this.spanStarts[span + 1] - this.spanStarts[span] - 1,
          Math.floor((bounds.right + pad) / this.spacing - offset));
        for (let col = first; col <= last; col++) {
          const id = this.slotForCandidate(this.spanStarts[span] + col - this.firstColumns[span]);
          if (id < 0) continue;
          this.position(id, row, col, point);
          const x = point.x, y = point.y;
          if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) continue;
          visible++; visit(id, x, y);
        }
      }
    }
    return visible;
  }
  nearest(x, y, radius, redOnly = false) {
    let result = null, best = radius * radius;
    this.visitBounds({ left: x - radius, right: x + radius, top: y - radius, bottom: y + radius }, (id, px, py) => {
      const distance = (px - x) ** 2 + (py - y) ** 2;
      if (distance <= best && (!redOnly || this.isRed(id))) { best = distance; result = id; }
    });
    return result;
  }
}
if (typeof module !== 'undefined') module.exports = { GridModel };
