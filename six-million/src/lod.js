/* Nested subsets of existing stable slots act as aggregate neighbourhood marks.
 * Enlarged representatives are illustrative, not six million resolved people.
 * The exact grid, ID mapping and stored browser assignments never change.
 */
class MemorialLOD {
  static levels(grid, camera, out) {
    // Start on a complete hierarchy level, keeping the opening view strongly
    // stippled rather than permanently halfway between two faded layers.
    const initialSpacing = grid.spacing * camera.minZoom;
    const phase = 2 ** Math.round(Math.log2(2 / initialSpacing));
    const baseTarget = initialSpacing * phase;
    const bounds = out.bounds || (out.bounds = {}); camera.bounds(bounds);
    const visible = MemorialLOD.estimate(grid, bounds);
    // Count short row spans, not millions of points. Budget increases smoothly
    // in dense regions; the finer simultaneous batch remains below capacity.
    const target = Math.max(baseTarget, grid.spacing * camera.zoom * Math.sqrt(visible / 235000));
    const level = Math.max(-1, Math.log2(target / (grid.spacing * camera.zoom)));
    out.fine = 2 ** Math.max(0, Math.ceil(level)); out.coarse = out.fine * 2;
    out.mix = level <= -1 ? 1 : Math.max(0, Math.min(1, Math.ceil(level) - level));
    out.exact = level <= -1;
    return out;
  }
  static diameter(grid, stride) { return grid.diameter * stride * (1 + 0.5 * (1 - 1 / stride)); }
  static estimate(grid, bounds) {
    const firstRow = Math.max(0, Math.floor(bounds.top / grid.rowHeight + grid.halfRows));
    const lastRow = Math.min(grid.rowOffsets.length - 2, Math.ceil(bounds.bottom / grid.rowHeight + grid.halfRows));
    let count = 0;
    for (let row = firstRow; row <= lastRow; row++) for (let span = grid.rowOffsets[row]; span < grid.rowOffsets[row + 1]; span++) {
      const offset = (row & 1) * 0.5;
      const first = Math.max(grid.firstColumns[span], Math.floor(bounds.left / grid.spacing - offset));
      const last = Math.min(grid.firstColumns[span] + grid.spanStarts[span + 1] - grid.spanStarts[span] - 1, Math.ceil(bounds.right / grid.spacing - offset));
      count += Math.max(0, last - first + 1);
    }
    return count;
  }
  static visit(grid, bounds, stride, visit) {
    if (stride === 1) return grid.visitBounds(bounds, visit);
    const jitter = grid.spacing * stride * 0.24;
    const pad = grid.jitter + jitter;
    const firstRow = Math.max(0, Math.ceil((bounds.top - pad) / grid.rowHeight + grid.halfRows));
    const lastRow = Math.min(grid.rowOffsets.length - 2, Math.floor((bounds.bottom + pad) / grid.rowHeight + grid.halfRows));
    const point = grid.samplePoint || (grid.samplePoint = {}); let count = 0;
    for (let row = Math.ceil(firstRow / stride) * stride; row <= lastRow; row += stride) {
      const offset = (row & 1) * 0.5;
      for (let span = grid.rowOffsets[row]; span < grid.rowOffsets[row + 1]; span++) {
        const first = Math.max(grid.firstColumns[span], Math.ceil((bounds.left - pad) / grid.spacing - offset));
        const last = Math.min(grid.firstColumns[span] + grid.spanStarts[span + 1] - grid.spanStarts[span] - 1,
          Math.floor((bounds.right + pad) / grid.spacing - offset));
        for (let col = Math.ceil(first / stride) * stride; col <= last; col += stride) {
          const id = grid.slotForCandidate(grid.spanStarts[span] + col - grid.firstColumns[span]);
          if (id < 0) continue;
          grid.position(id, row, col, point);
          // Aggregate-only jitter is proportional to its neighbourhood. Without
          // it, subsampling magnifies the underlying lattice into obvious rows.
          // Exact stride-1 coordinates above are untouched.
          const x = point.x + (grid.constructor.hash(id ^ stride ^ 0x452aff) * 2 - 1) * jitter;
          const y = point.y + (grid.constructor.hash(id ^ stride ^ 0x198dab) * 2 - 1) * jitter;
          if (grid.geometry.contains(x, y)) { point.x = x; point.y = y; }
          if (point.x < bounds.left || point.x > bounds.right || point.y < bounds.top || point.y > bounds.bottom) continue;
          count++; visit(id, point.x, point.y);
        }
      }
    }
    return count;
  }
}
if (typeof module !== 'undefined') module.exports = { MemorialLOD };
