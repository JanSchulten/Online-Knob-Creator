import { P, A, TWO } from "./params.js";

export function fluteFactor(th) {
  if (P.fn <= 0) return 1;
  const d = P.fd / 100;
  return 1 - d * (0.5 + 0.5 * Math.cos(P.fn * th));
}

export function rOuterBase(z) {
  const t = P.H <= 0 ? 0 : Math.min(1, Math.max(0, z / P.H));
  return (P.Dbot / 2) * (1 - t) + (P.Dtop / 2) * t;
}

export function rOuterAt(th, z) {
  return rOuterBase(z) * fluteFactor(th);
}

export function beakExtra(th) {
  if (P.pointer !== "on" || P.beakLen <= 0) return 0;
  let a = th;
  while (a > Math.PI) a -= TWO;
  while (a < -Math.PI) a += TWO;
  const bw = 0.55;
  return Math.abs(a) <= bw ? P.beakLen * 0.5 * (1 + Math.cos(Math.PI * a / bw)) : 0;
}

export function outerRfn(z) {
  return th => rOuterAt(th, z) + beakExtra(th);
}

export function crossR(th, span, arm) {
  const L2 = span / 2, W2 = arm / 2;
  const c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th));
  const big = 1e9;
  const r1 = Math.min(c < 1e-7 ? big : L2 / c, s < 1e-7 ? big : W2 / s);
  const r2 = Math.min(c < 1e-7 ? big : W2 / c, s < 1e-7 ? big : L2 / s);
  return Math.max(r1, r2);
}

export function innerR(th) {
  switch (P.mount) {
    case "lego_hole_cross":
    case "lego_peg_cross":
      return crossR(th, P.span, P.arm);
    case "lego_hole_round":
    case "lego_peg_round":
      return P.rdia / 2;
    case "pot_d": {
      const R = P.rdia / 2;
      let r = R;
      const dirs = [];
      if (P.flats >= 1) dirs.push(0);
      if (P.flats >= 2) dirs.push(Math.PI);
      for (const phi of dirs) {
        const cc = Math.cos(th - phi);
        if (cc > 1e-6) r = Math.min(r, (R - P.flat) / cc);
      }
      return r;
    }
    case "pot_spline": {
      const R = P.rdia / 2;
      return R * (1 - 0.05 * (0.5 + 0.5 * Math.cos(P.teeth * th)));
    }
  }
  return P.rdia / 2;
}

export function isPeg() {
  return P.mount === "lego_peg_cross" || P.mount === "lego_peg_round";
}

export function ribBump(th) {
  if (P.grip !== "on" || isPeg() || P.ribs <= 0) return 0;
  const seg = TWO / P.ribs;
  const a = ((th % seg) + seg) % seg;
  const dd = Math.min(a, seg - a);
  const rw = seg * 0.16;
  return dd < rw ? P.ribDepth * 0.5 * (1 + Math.cos(Math.PI * dd / rw)) : 0;
}

export function innerRFinal(th) {
  return Math.max(0.3, innerR(th) - ribBump(th));
}

export function maxInnerR() {
  let m = 0;
  for (let i = 0; i < A; i++) m = Math.max(m, innerR(i / A * TWO));
  return m;
}

export function stickAllowed() {
  return P.mount === "lego_hole_cross" || P.mount === "lego_hole_round";
}

export function stickEnabled() {
  return P.stick === "on" && stickAllowed();
}

export function stickRfn(th) {
  return P.mount === "lego_hole_cross"
    ? crossR(th, P.stickSpan, P.stickArm)
    : P.stickDia / 2;
}

export function stickMaxR() {
  return P.mount === "lego_hole_cross" ? P.stickSpan / 2 : P.stickDia / 2;
}
