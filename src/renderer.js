/* global THREE */
import { P } from "./params.js";
import { initBlueprint, updateBlueprint, setBlueprintOverlay } from "./blueprint.js";

export let renderer, scene, camera, mesh, mat;
export let lastTris = null;
export let lastStickStart = null;
export let lastStickDx = 0;

const _target = { x: 0, y: 0, z: 0 };
let _camR = 60, _camTheta = 0.9, _camPhi = 1.15;
let _canvas = null;
let _objH = 16, _objW = 16;          // last object extents, for re-fitting on resize
let _userZoom = false;               // true once the user manually zoomed
let _lastW = 0, _lastH = 0;
let _blueprint = false;
let _grid = null;
const BG_DEFAULT = 0x15171c, BG_BLUEPRINT = 0x0a2440;

export function initThree(canvas) {
  _canvas = canvas;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x15171c);
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);

  scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x202329, 0.85));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.85);
  d1.position.set(1, 1.4, 0.8); scene.add(d1);
  const d2 = new THREE.DirectionalLight(0xffe2cf, 0.35);
  d2.position.set(-1, 0.4, -1); scene.add(d2);
  const d3 = new THREE.DirectionalLight(0x8fb6ff, 0.25);
  d3.position.set(0.2, -1, 0.6); scene.add(d3);

  _grid = new THREE.GridHelper(120, 60, 0x2a3340, 0x20262e);
  scene.add(_grid);

  mat = new THREE.MeshStandardMaterial({
    color: 0xff4a1c, metalness: 0.12, roughness: 0.55,
    flatShading: true, side: THREE.DoubleSide,
  });
  mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  initBlueprint(canvas);
}

// Blueprint mode: navy background, light wireframe model, dimension overlay.
export function toggleBlueprint(viewOn) {
  _blueprint = viewOn;
  scene.background = new THREE.Color(viewOn ? BG_BLUEPRINT : BG_DEFAULT);
  // Solid muted-blue model (not wireframe — the dimension overlay sits on top
  // and a dense fluted wireframe would just be visual noise).
  mat.color.set(viewOn ? 0x3f608f : 0xff4a1c);
  mat.metalness = viewOn ? 0.0 : 0.12;
  mat.roughness = viewOn ? 0.85 : 0.55;
  mat.wireframe = false;
  if (_grid) _grid.visible = !viewOn;
  setBlueprintOverlay(viewOn);
}

export function setMesh(arr, stickStart, stickDx) {
  lastTris = arr;
  lastStickStart = stickStart ?? null;
  lastStickDx = stickDx ?? 0;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  g.computeVertexNormals();
  g.computeBoundingBox();
  mesh.geometry.dispose();
  mesh.geometry = g;

  document.getElementById("roTop").textContent  = P.Dtop.toFixed(1);
  document.getElementById("roH").textContent    = P.H.toFixed(1);
  document.getElementById("roTris").textContent = (arr.length / 9).toLocaleString("de-DE");

  const sz = new THREE.Vector3();
  g.boundingBox.getSize(sz);
  document.getElementById("bboxTag").textContent =
    "BBOX  Ø" + Math.max(sz.x, sz.y).toFixed(1) + " × " + sz.z.toFixed(1) + " mm";

  return g;
}

// Distance at which an object of extents (_objH × _objW) fills the viewport
// for the given aspect ratio, leaving a small margin for orbiting.
function fitDistance(aspect) {
  const vFov  = camera.fov * Math.PI / 180;
  const hFov  = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const distH = (_objH / 2) / Math.tan(vFov / 2);
  const distW = (_objW / 2) / Math.tan(hFov / 2);
  return Math.max(14, Math.max(distH, distW) * 1.15);
}

function currentAspect() {
  return (_canvas && _canvas.clientHeight)
    ? _canvas.clientWidth / _canvas.clientHeight
    : (camera.aspect || 1);
}

// refit=true re-fits the zoom distance (initial load, presets, reset, mount
// change). refit=false only tracks the object's bounds/center so editing
// values keeps the user's current zoom instead of snapping back every time.
export function frameCamera(g, refit = false) {
  const ctr = new THREE.Vector3(), sz = new THREE.Vector3();
  g.boundingBox.getCenter(ctr);
  g.boundingBox.getSize(sz);
  // mesh is rotated -90° about X: geometry (x,y,z) -> world (x, z, -y)
  _target.x = ctr.x; _target.y = ctr.z; _target.z = -ctr.y;

  _objH = sz.z;                     // world-vertical extent
  _objW = Math.max(sz.x, sz.y);     // world-horizontal extent
  if (refit) { _userZoom = false; _camR = fitDistance(currentAspect()); }
  updateCam();
}

// Re-fit the current object to the viewport (used by double-click).
export function reframe() {
  _userZoom = false;
  _camR = fitDistance(currentAspect());
  updateCam();
}

export function updateCam() {
  _camPhi = Math.max(0.15, Math.min(Math.PI - 0.15, _camPhi));
  camera.position.set(
    _target.x + _camR * Math.sin(_camPhi) * Math.cos(_camTheta),
    _target.y + _camR * Math.cos(_camPhi),
    _target.z + _camR * Math.sin(_camPhi) * Math.sin(_camTheta),
  );
  camera.lookAt(_target.x, _target.y, _target.z);
}

export function orbitDelta(dx, dy) {
  _camTheta -= dx * 0.01;
  _camPhi   -= dy * 0.01;
  updateCam();
}

export function zoomBy(factor) {
  _userZoom = true;
  _camR = Math.max(12, Math.min(400, _camR * factor));
  updateCam();
}

export function resize(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  if (w === _lastW && h === _lastH) return;   // only act on real size changes
  _lastW = w; _lastH = h;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // Re-fit the object to the new viewport, unless the user zoomed manually.
  if (!_userZoom) { _camR = fitDistance(w / h); updateCam(); }
}

export function startLoop(canvas) {
  function loop() {
    resize(canvas);
    renderer.render(scene, camera);
    if (_blueprint) updateBlueprint(camera, canvas);
    requestAnimationFrame(loop);
  }
  loop();
}
