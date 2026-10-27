/* Shared, versioned geometry for the overview, tiles, points and hit testing.
 * A band is an outer equilateral triangle minus its concentric inner triangle.
 * Horizontal intervals are unioned before slot IDs are allocated: overlaps count once.
 */
class StarOfDavid {
  constructor(radius, innerRatio = 0.62) {
    this.radius = radius;
    this.innerRatio = innerRatio;
    this.outer = [StarOfDavid.triangleVertices(radius, -Math.PI / 2), StarOfDavid.triangleVertices(radius, Math.PI / 2)];
    this.inner = [StarOfDavid.triangleVertices(radius * innerRatio, -Math.PI / 2), StarOfDavid.triangleVertices(radius * innerRatio, Math.PI / 2)];
    this.bounds = { left: -radius * Math.sqrt(3) / 2, right: radius * Math.sqrt(3) / 2, top: -radius, bottom: radius };
  }
  static triangleVertices(radius, rotation) {
    return Array.from({ length: 3 }, (_, i) => ({ x: Math.cos(rotation + i * Math.PI * 2 / 3) * radius,
      y: Math.sin(rotation + i * Math.PI * 2 / 3) * radius }));
  }
  static pointInTriangle(x, y, vertices) {
    let positive = false, negative = false;
    for (let i = 0; i < 3; i++) {
      const a = vertices[i], b = vertices[(i + 1) % 3];
      const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
      positive ||= cross > 1e-7; negative ||= cross < -1e-7;
    }
    return !(positive && negative);
  }
  contains(x, y) {
    for (let i = 0; i < 2; i++) {
      if (StarOfDavid.pointInTriangle(x, y, this.outer[i]) && !StarOfDavid.pointInTriangle(x, y, this.inner[i])) return true;
    }
    return false;
  }
  static horizontalInterval(vertices, y) {
    const intersections = [];
    for (let i = 0; i < 3; i++) {
      const a = vertices[i], b = vertices[(i + 1) % 3];
      if (y < Math.min(a.y, b.y) - 1e-8 || y > Math.max(a.y, b.y) + 1e-8) continue;
      if (Math.abs(a.y - b.y) < 1e-8) { intersections.push(a.x, b.x); continue; }
      intersections.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y));
    }
    return intersections.length ? [Math.min(...intersections), Math.max(...intersections)] : null;
  }
  // Padding shrinks outer edges and expands inner edges by a perpendicular distance.
  // This reserves room for the full jitter disk and dot radius, keeping edges crisp.
  scanlines(padding = 0) {
    return [0, 1].map(i => ({
      outer: StarOfDavid.triangleVertices(this.radius - padding * 2, i ? Math.PI / 2 : -Math.PI / 2),
      inner: StarOfDavid.triangleVertices(this.radius * this.innerRatio + padding * 2, i ? Math.PI / 2 : -Math.PI / 2)
    }));
  }
  rowIntervals(y, bands = this.scanlines()) {
    const intervals = [];
    for (const band of bands) {
      const outer = StarOfDavid.horizontalInterval(band.outer, y);
      if (!outer) continue;
      const inner = StarOfDavid.horizontalInterval(band.inner, y);
      if (!inner || inner[1] <= outer[0] || inner[0] >= outer[1]) intervals.push(outer);
      else {
        if (outer[0] < inner[0]) intervals.push([outer[0], inner[0]]);
        if (inner[1] < outer[1]) intervals.push([inner[1], outer[1]]);
      }
    }
    intervals.sort((a, b) => a[0] - b[0]);
    const union = [];
    for (const interval of intervals) {
      const previous = union.at(-1);
      if (previous && interval[0] <= previous[1]) previous[1] = Math.max(previous[1], interval[1]);
      else union.push(interval);
    }
    return union;
  }
}
if (typeof module !== 'undefined') module.exports = { StarOfDavid };
