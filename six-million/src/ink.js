/* One palette shared by aggregate marks, exact points and raster fallbacks. */
const MemorialInk = Object.freeze({ paper: '#ffffff', red: '#d51f1b', grey: '#515653', opacity: 0.94,
  redRGB: [213 / 255, 31 / 255, 27 / 255], greyRGB: [81 / 255, 86 / 255, 83 / 255] });
if (typeof module !== 'undefined') module.exports = { MemorialInk };
