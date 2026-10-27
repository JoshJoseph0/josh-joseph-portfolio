/* Same geometry and ink in both main-thread fallback and tile worker. */
function paintMemorialTile(ctx, grid, job) {
  ctx.fillStyle = MemorialInk.paper;
  ctx.fillRect(0, 0, job.pixels, job.pixels);
  ctx.scale(job.pixels / job.size, job.pixels / job.size);
  ctx.translate(-job.x, -job.y);
  paintMemorialDots(ctx, grid, { left: job.x - grid.diameter / 2, right: job.x + job.size + grid.diameter / 2,
    top: job.y - grid.diameter / 2, bottom: job.y + job.size + grid.diameter / 2 });
}
function paintMemorialDots(ctx, grid, bounds) {
  const opacity = ctx.globalAlpha;
  ctx.globalAlpha *= MemorialInk.opacity;
  const r = grid.diameter / 2;
  let total = 0;
  for (const red of [false, true]) {
    ctx.fillStyle = red ? MemorialInk.red : MemorialInk.grey;
    let batch = 0;
    ctx.beginPath();
    grid.visitBounds(bounds, (id, x, y) => {
      if (grid.isRed(id) !== red) return;
      total++; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
      if (++batch % 2048 === 0) { ctx.fill(); ctx.beginPath(); }
    });
    ctx.fill();
  }
  ctx.globalAlpha = opacity;
  return total;
}
