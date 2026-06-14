import { P, A, TWO } from "./params.js";
import { outerRfn, innerRFinal, rOuterBase, fluteFactor, beakExtra, isPeg, maxInnerR, stickEnabled, stickRfn, stickMaxR } from "./profile.js";

export function buildTriangles() {
  const tris = [];
  const push = (a, b, c) => {
    tris.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  };

  function makeRing(z, rfn) {
    const r = new Array(A);
    for (let i = 0; i < A; i++) {
      const th = i / A * TWO, rad = rfn(th);
      r[i] = [rad * Math.cos(th), rad * Math.sin(th), z];
    }
    return r;
  }

  function stitch(lo, hi, outward) {
    for (let i = 0; i < A; i++) {
      const j = (i + 1) % A, a = lo[i], b = lo[j], c = hi[i], d = hi[j];
      if (outward) { push(a, b, c); push(b, d, c); }
      else         { push(a, c, b); push(b, c, d); }
    }
  }

  function capFan(ring, apex, up) {
    for (let i = 0; i < A; i++) {
      const j = (i + 1) % A;
      if (up) push(ring[i], ring[j], apex);
      else    push(ring[i], apex, ring[j]);
    }
  }

  function annulus(outer, inner, down) {
    for (let i = 0; i < A; i++) {
      const j = (i + 1) % A, o = outer[i], o2 = outer[j], ii = inner[i], ii2 = inner[j];
      if (down) { push(o, ii, o2); push(o2, ii, ii2); }
      else      { push(o, o2, ii); push(o2, ii2, ii); }
    }
  }

  const ringBot = makeRing(0, outerRfn(0));

  // ---- position-mark footprint (shared by raised box & engraved pocket) ----
  const markH = 0.8;
  let markInside = null, markBox = null;
  if (P.ind === "line") {
    const w = Math.min(1.4, P.Dtop * 0.12) / 2;
    const r1 = Math.max(maxInnerR() + 1, P.Dtop * 0.18), r2 = P.Dtop / 2 * 0.92;
    markInside = (x, y) => x >= r1 && x <= r2 && Math.abs(y) <= w;
    markBox = [r1, r2, -w, w];
  } else if (P.ind === "dot") {
    const r0 = P.Dtop / 2 * 0.62, w = Math.min(1.5, P.Dtop * 0.12) / 2;
    markInside = (x, y) => Math.abs(x - r0) <= w && Math.abs(y) <= w;
    markBox = [r0 - w, r0 + w, -w, w];
  }
  // Engraving is carved into the flat top; on dome/chamfer it falls back to raised.
  const engraveFlat = (P.ind !== "none" && P.indMode === "engraved" && P.top === "flat");

  if (P.top === "dome") {
    const rim = makeRing(P.H, outerRfn(P.H));
    stitch(ringBot, rim, true);
    const steps = 10, domeH = P.topParam;
    let prev = rim;
    for (let s = 1; s <= steps; s++) {
      const phi = (s / steps) * (Math.PI / 2);
      const zz = P.H + domeH * Math.sin(phi), k = Math.cos(phi);
      if (s === steps) {
        capFan(prev, [0, 0, P.H + domeH], true);
      } else {
        const ring = makeRing(zz, th => rOuterBase(P.H) * k * fluteFactor(th) + beakExtra(th) * k);
        stitch(prev, ring, true);
        prev = ring;
      }
    }
  } else if (P.top === "chamfer") {
    const c = Math.min(P.topParam, P.H * 0.45, (P.Dtop / 2) * 0.6);
    const wallTop = makeRing(P.H - c, outerRfn(P.H - c));
    stitch(ringBot, wallTop, true);
    const bevel = makeRing(P.H, th => Math.max(0.1, (rOuterBase(P.H - c) - c)) * fluteFactor(th) + beakExtra(th));
    stitch(wallTop, bevel, true);
    capFan(bevel, [0, 0, P.H], true);
  } else {
    const rim = makeRing(P.H, outerRfn(P.H));
    stitch(ringBot, rim, true);
    if (engraveFlat) {
      // Flat top as a polar grid; vertices inside the mark are pushed down,
      // forming a real recessed pocket that stays watertight.
      const R = P.Dtop / 2;
      const K = Math.max(6, Math.ceil(R / 0.5));   // radial steps (~0.5 mm cells)
      const rfn = outerRfn(P.H);
      const ringAt = frac => {
        const r = new Array(A);
        for (let i = 0; i < A; i++) {
          const th = i / A * TWO, rad = rfn(th) * frac;
          const x = rad * Math.cos(th), y = rad * Math.sin(th);
          r[i] = [x, y, P.H - (markInside(x, y) ? markH : 0)];
        }
        return r;
      };
      let prev = ringAt(1 / K);
      capFan(prev, [0, 0, P.H], true);
      for (let k = 2; k < K; k++) { const ring = ringAt(k / K); annulus(ring, prev, false); prev = ring; }
      annulus(rim, prev, false);
    } else {
      capFan(rim, [0, 0, P.H], true);
    }
  }

  const inner0 = makeRing(0, innerRFinal);
  if (isPeg()) {
    const L = P.depth, innerBot = makeRing(-L, innerRFinal);
    stitch(innerBot, inner0, true);
    capFan(innerBot, [0, 0, -L], false);
    annulus(ringBot, inner0, true);
  } else {
    const d = P.depth, innerTop = makeRing(d, innerRFinal);
    stitch(inner0, innerTop, false);
    capFan(innerTop, [0, 0, d], false);
    annulus(ringBot, inner0, true);
  }

  if (P.ind !== "none" && !engraveFlat) {
    const zBase = P.H, zTop = zBase + markH;
    const box = (x0, x1, y0, y1, z0, z1) => {
      const v = [
        [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
        [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],
      ];
      const f = [[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,5,1],[0,4,5],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]];
      for (const t of f) push(v[t[0]], v[t[1]], v[t[2]]);
    };
    box(markBox[0], markBox[1], markBox[2], markBox[3], zBase - 0.2, zTop);
  }

  if (stickEnabled()) {
    const L = P.stickLen, mr = stickMaxR();
    const knobR = Math.max(P.Dtop, P.Dbot) / 2 + (P.pointer === "on" ? P.beakLen : 0);
    const dx = knobR + mr + 5;
    const ch = Math.min(0.6, L * 0.2);
    const ringOff = (z, rf) => {
      const r = new Array(A);
      for (let i = 0; i < A; i++) {
        const th = i / A * TWO, rad = rf(th);
        r[i] = [dx + rad * Math.cos(th), rad * Math.sin(th), z];
      }
      return r;
    };
    const tip = th => stickRfn(th) * 0.5;
    const b0 = ringOff(0, tip), b1 = ringOff(ch, stickRfn);
    const t1 = ringOff(L - ch, stickRfn), t0 = ringOff(L, tip);
    capFan(b0, [dx, 0, 0], false);
    stitch(b0, b1, true); stitch(b1, t1, true); stitch(t1, t0, true);
    capFan(t0, [dx, 0, L], true);
  }

  return new Float32Array(tris);
}
