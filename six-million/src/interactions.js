/* Pointer Events unify mouse dragging and touch pinch. No decorative inertia. */
function attachMemorialInteractions(app, canvas) {
  const pointers = new Map();
  const keys = new Set();
  let gesture = null, dragged = false, keyFrame = 0, previousTime = 0;
  const local = event => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const snapshot = () => {
    const points = [...pointers.values()];
    if (points.length === 1) return { x: points[0].x, y: points[0].y, distance: 0 };
    if (points.length >= 2) return {
      x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2,
      distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
    };
    return null;
  };
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, local(event));
    dragged = pointers.size > 1;
    gesture = snapshot();
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, local(event));
    const next = snapshot();
    if (gesture && next) {
      const dx = next.x - gesture.x, dy = next.y - gesture.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.5) dragged = true;
      app.camera.pan(dx, dy);
      if (next.distance && gesture.distance) {
        app.camera.zoomAt(next.distance / gesture.distance, next.x, next.y);
        dragged = true;
      }
      app.invalidate();
    }
    gesture = next;
  });
  const release = event => {
    if (!pointers.has(event.pointerId)) return;
    const position = local(event);
    if (!dragged && pointers.size === 1 && event.type === 'pointerup') app.selectAt(position.x, position.y);
    pointers.delete(event.pointerId);
    gesture = snapshot();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', event => {
    pointers.delete(event.pointerId); gesture = snapshot();
  });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    const p = local(event);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? app.camera.height : 1;
    const delta = Math.max(-240, Math.min(240, event.deltaY * unit));
    app.camera.zoomAt(Math.exp(-delta * (event.ctrlKey ? 0.009 : 0.002)), p.x, p.y);
    app.invalidate();
  }, { passive: false });
  const navigation = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd']);
  function step(time) {
    if (!keys.size) { keyFrame = 0; return; }
    const elapsed = previousTime ? Math.min(32, time - previousTime) : 16;
    previousTime = time;
    const amount = 0.55 * elapsed;
    const dx = (keys.has('ArrowLeft') || keys.has('a') ? amount : 0) - (keys.has('ArrowRight') || keys.has('d') ? amount : 0);
    const dy = (keys.has('ArrowUp') || keys.has('w') ? amount : 0) - (keys.has('ArrowDown') || keys.has('s') ? amount : 0);
    app.camera.pan(dx, dy);
    app.invalidate();
    keyFrame = requestAnimationFrame(step);
  }
  canvas.addEventListener('keydown', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (navigation.has(key)) {
      event.preventDefault(); keys.add(key);
      if (!keyFrame) { previousTime = 0; keyFrame = requestAnimationFrame(step); }
    } else if (key === '+' || key === '=') { event.preventDefault(); app.zoom(1.3); }
    else if (key === '-') { event.preventDefault(); app.zoom(1 / 1.3); }
    else if (key === 'r' || key === 'Home') { event.preventDefault(); app.camera.reset(); app.invalidate(); }
    else if (key === 'Enter') app.selectAt(app.camera.width / 2, app.camera.height / 2);
  });
  canvas.addEventListener('keyup', event => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
  const stopKeys = () => { keys.clear(); cancelAnimationFrame(keyFrame); keyFrame = 0; };
  canvas.addEventListener('blur', stopKeys);
  window.addEventListener('blur', stopKeys);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopKeys(); });
}
