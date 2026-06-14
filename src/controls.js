import { orbitDelta, zoomBy, reframe } from "./renderer.js";

export function initControls(canvas) {
  // Track active pointers for multi-touch detection
  const pointers = new Map(); // pointerId -> {x, y}
  let drag = false, px = 0, py = 0;
  let pinchDist = 0;

  function getPinchDist() {
    const pts = [...pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  canvas.addEventListener("pointerdown", e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);

    if (pointers.size === 1) {
      drag = true;
      px = e.clientX; py = e.clientY;
    } else {
      // Multi-touch: disable orbit, init pinch
      drag = false;
      pinchDist = getPinchDist();
    }
  });

  canvas.addEventListener("pointermove", e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2) {
      // Pinch zoom
      const d = getPinchDist();
      if (pinchDist > 0) zoomBy(pinchDist / d);
      pinchDist = d;
      drag = false;
    } else if (drag) {
      // Single-finger orbit
      orbitDelta(e.clientX - px, e.clientY - py);
      px = e.clientX; py = e.clientY;
    }
  });

  const onPointerUp = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (pointers.size === 0) drag = false;
    // Resume single-finger orbit if one pointer remains
    if (pointers.size === 1) {
      const [remaining] = pointers.values();
      drag = true;
      px = remaining.x; py = remaining.y;
    }
  };
  canvas.addEventListener("pointerup",     onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);

  // Mouse wheel zoom (desktop)
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    zoomBy(1 + Math.sign(e.deltaY) * 0.08);
  }, { passive: false });

  // Double-click / double-tap re-fits the object to the viewport
  canvas.addEventListener("dblclick", e => { e.preventDefault(); reframe(); });

  // Prevent context menu on long-press (mobile)
  canvas.addEventListener("contextmenu", e => e.preventDefault());
}
