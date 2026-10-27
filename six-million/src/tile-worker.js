/* One bounded job in flight; unwanted results are discarded by the renderer. */
importScripts('geometry/star-of-david.js', 'grid.js', 'ink.js', 'raster.js');
let grid;
self.onmessage = event => {
  const job = event.data;
  if (job.type === 'configure') { grid = new GridModel(job.cohort); return; }
  try {
    const canvas = new OffscreenCanvas(job.pixels, job.pixels);
    paintMemorialTile(canvas.getContext('2d'), grid, job);
    const bitmap = canvas.transferToImageBitmap();
    self.postMessage({ key: job.key, bitmap }, [bitmap]);
  } catch (error) { self.postMessage({ key: job.key, error: error.message }); }
};
