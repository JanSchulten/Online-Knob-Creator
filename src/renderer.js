/* global THREE */
import { P } from "./params.js";

export let renderer, scene, camera, mesh, mat;
export let lastTris = null;

const _target = { x: 0, y: 0, z: 0 };
let _camR = 60, _camTheta = 0.9, _camPhi = 1.15;

export function initThree(canvas) {
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

  scene.add(new THREE.GridHelper(120, 60, 0x2a3340, 0x20262e));

  mat = new THREE.MeshStandardMaterial({
    color: 0xff4a1c, metalness: 0.12, roughness: 0.55,
    flatShading: true, side: THREE.DoubleSide,
  });
  mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
}

export function setMesh(arr) {
  lastTris = arr;
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

export function frameCamera(g) {
  const ctr = new THREE.Vector3(), sz = new THREE.Vector3();
  g.boundingBox.getCenter(ctr);
  g.boundingBox.getSize(sz);
  _target.x = ctr.x; _target.y = ctr.z; _target.z = 0;
  _camR = Math.max(28, Math.max(sz.x, sz.y, sz.z) * 2.6);
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
  _camR = Math.max(12, Math.min(400, _camR * factor));
  updateCam();
}

export function resize(canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

export function startLoop(canvas) {
  function loop() {
    resize(canvas);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
}
