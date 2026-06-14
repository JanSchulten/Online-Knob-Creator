import { P } from "./params.js";
import { lastTris, lastStickStart, lastStickDx } from "./renderer.js";

function serializeSTL(v, header) {
  const n = v.length / 9;
  const buf = new ArrayBuffer(84 + n * 50);
  const dv  = new DataView(buf);

  for (let i = 0; i < 80; i++) dv.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  dv.setUint32(80, n, true);

  let o = 84;
  for (let t = 0; t < n; t++) {
    const i = t * 9;
    const x1 = v[i], y1 = v[i+1], z1 = v[i+2];
    const x2 = v[i+3], y2 = v[i+4], z2 = v[i+5];
    const x3 = v[i+6], y3 = v[i+7], z3 = v[i+8];
    const ux = x2-x1, uy = y2-y1, uz = z2-z1;
    const wx = x3-x1, wy = y3-y1, wz = z3-z1;
    let nx = uy*wz - uz*wy, ny = uz*wx - ux*wz, nz = ux*wy - uy*wx;
    const ln = Math.hypot(nx, ny, nz) || 1;
    nx /= ln; ny /= ln; nz /= ln;
    dv.setFloat32(o,    nx, true); dv.setFloat32(o+4,  ny, true); dv.setFloat32(o+8,  nz, true);
    dv.setFloat32(o+12, x1, true); dv.setFloat32(o+16, y1, true); dv.setFloat32(o+20, z1, true);
    dv.setFloat32(o+24, x2, true); dv.setFloat32(o+28, y2, true); dv.setFloat32(o+32, z2, true);
    dv.setFloat32(o+36, x3, true); dv.setFloat32(o+40, y3, true); dv.setFloat32(o+44, z3, true);
    dv.setUint16(o+48, 0, true);
    o += 50;
  }

  return new Blob([buf], { type: "application/octet-stream" });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
}

export function exportSTL() {
  const v = lastTris;
  if (!v) return;

  const baseName = "knob_" + P.mount + "_" + P.Dtop.toFixed(0) + "x" + P.H.toFixed(0);

  if (lastStickStart !== null) {
    // Knob-only triangles
    const knobBlob = serializeSTL(
      v.subarray(0, lastStickStart),
      "KNOB.WORKS parametric knob - mm - binary STL"
    );
    triggerDownload(knobBlob, baseName + ".stl");

    // Stick triangles centered at origin (subtract x-offset)
    const stickRaw = v.subarray(lastStickStart);
    const stickCentered = new Float32Array(stickRaw.length);
    for (let i = 0; i < stickRaw.length; i++) {
      stickCentered[i] = (i % 3 === 0) ? stickRaw[i] - lastStickDx : stickRaw[i];
    }
    const stickBlob = serializeSTL(
      stickCentered,
      "KNOB.WORKS stick - mm - binary STL"
    );
    setTimeout(() => triggerDownload(stickBlob, baseName + "_stick.stl"), 300);
  } else {
    triggerDownload(
      serializeSTL(v, "KNOB.WORKS parametric knob - mm - binary STL"),
      baseName + ".stl"
    );
  }
}
