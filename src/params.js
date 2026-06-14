export const LEGO_SPAN = 4.8;
export const LEGO_ARM  = 1.8;

// Reduce geometry segments on mobile to cut CPU/memory load
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
export const A = isMobileDevice ? 96 : 196;

export const P = {
  H: 14, Dtop: 14, Dbot: 16, top: "flat", topParam: 2,
  fn: 24, fd: 6, ind: "line",
  pointer: "off", beakLen: 5,
  mount: "lego_hole_cross", depth: 8, span: 4.75, arm: 2.0,
  rdia: 4.9, flats: 1, flat: 0.8, teeth: 20,
  grip: "off", ribs: 3, ribDepth: 0.15,
  stick: "off", stickLen: 20, stickSpan: 4.8, stickArm: 1.8, stickDia: 4.8,
};

export const TWO = Math.PI * 2;
