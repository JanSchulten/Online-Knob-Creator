import { P } from "./params.js";
import { isPeg, stickAllowed, maxInnerR } from "./profile.js";
import { buildTriangles } from "./geometry.js";
import { drawGauge } from "./gauge.js";
import { setMesh, frameCamera } from "./renderer.js";

// ---- Validation ----
export function validate() {
  const warn = document.getElementById("warnBox");
  const msgs = [];
  if (!isPeg()) {
    const maxRoof = P.H - 0.6;
    if (P.depth > maxRoof) {
      P.depth = Math.max(1, maxRoof);
      syncDepth();
      msgs.push("Lochtiefe auf " + P.depth.toFixed(1) + " mm begrenzt (min. 0,6 mm Decke).");
    }
  }
  const minOuter = (P.Dbot / 2) * (1 - P.fd / 100), mi = maxInnerR();
  if (mi > minOuter - 0.4) {
    msgs.push("Aufnahme fast so breit wie der Körper unten — Wand sehr dünn. ⌀ unten vergrößern oder Aufnahme verkleinern.");
  }
  if (msgs.length) {
    warn.innerHTML = msgs.join("<br>");
    warn.classList.add("show");
  } else {
    warn.classList.remove("show");
  }
}

export function syncDepth() {
  document.getElementById("depth").value = P.depth;
  document.getElementById("vDepth").innerHTML = P.depth.toFixed(1) + '<span class="u">mm</span>';
}

// ---- Rebuild ----
export function rebuild() {
  validate();
  const arr = buildTriangles();
  const g = setMesh(arr);
  frameCamera(g);
  drawGauge();
}

// ---- Format helpers ----
const mm   = v => v.toFixed(1) + '<span class="u">mm</span>';
const mm2  = v => v.toFixed(2) + '<span class="u">mm</span>';
const pct  = v => v.toFixed(0) + '<span class="u">%</span>';
const num  = v => v.toFixed(0);

function bindRangeL(id, key, labId, fmt) {
  const el  = document.getElementById(id);
  const lab = document.getElementById(labId);
  el.addEventListener("input", () => {
    P[key] = parseFloat(el.value);
    if (lab) lab.innerHTML = fmt(P[key]);
    rebuild();
  });
}

function bindSeg(wrapId, key, cb) {
  const wrap = document.getElementById(wrapId);
  wrap.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      wrap.querySelectorAll("button").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      P[key] = b.dataset.v;
      if (cb) cb();
      rebuild();
    });
  });
}

function bindSegNum(wrapId, key, cb) {
  const wrap = document.getElementById(wrapId);
  wrap.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      wrap.querySelectorAll("button").forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      P[key] = parseInt(b.dataset.v, 10);
      if (cb) cb();
      rebuild();
    });
  });
}

function setRange(id, val, labId, fmt) {
  const el = document.getElementById(id);
  el.value = val;
  const l = document.getElementById(labId);
  if (l) l.innerHTML = fmt(val);
}

function syncSeg(wrapId, val) {
  document.getElementById(wrapId)
    .querySelectorAll("button")
    .forEach(x => x.classList.toggle("on", x.dataset.v === val));
}

export function applyMountUI() {
  const cr = P.mount.includes("cross");
  document.getElementById("crossParams").style.display  = cr ? "block" : "none";
  document.getElementById("roundParams").style.display  = cr ? "none" : "block";
  document.getElementById("flatsWrap").style.display    = P.mount === "pot_d" ? "block" : "none";
  document.getElementById("flatWrap").style.display     = (P.mount === "pot_d" && P.flats >= 1) ? "block" : "none";
  document.getElementById("teethWrap").style.display    = P.mount === "pot_spline" ? "block" : "none";
  document.getElementById("depthLab").textContent       = isPeg() ? "Länge des Zapfens" : "Tiefe des Lochs";

  const showGrip = !isPeg();
  document.getElementById("gripHead").style.display     = showGrip ? "block" : "none";
  document.getElementById("gripSegWrap").style.display  = showGrip ? "block" : "none";
  document.getElementById("ribsWrap").style.display     = (showGrip && P.grip === "on") ? "block" : "none";

  const sa = stickAllowed();
  document.getElementById("stickHead").style.display    = sa ? "block" : "none";
  document.getElementById("stickSegWrap").style.display = sa ? "block" : "none";
  document.getElementById("stickWrap").style.display    = (sa && P.stick === "on") ? "block" : "none";
  document.getElementById("stickCross").style.display   = P.mount === "lego_hole_cross" ? "block" : "none";
  document.getElementById("stickRound").style.display   = P.mount === "lego_hole_round" ? "block" : "none";

  const note = document.getElementById("mountNote"), m = P.mount;
  if (m === "lego_hole_cross")
    note.innerHTML = "<b>Kreuz-Loch:</b> Lego-Technic-Achse wird von unten reingesteckt. Echte Achse = 4,8/1,8 mm. Standard 4,75/2,0 = ~-0,025 mm Spiel pro Seite (FDM-Druck verengt Löcher). Klemmsitz unten für wackelfreien Halt.";
  else if (m === "lego_hole_round")
    note.innerHTML = "<b>Rund-Loch:</b> für runden Lego-Pin (Ø 4,8). 4,9 = leichtes Spiel.";
  else if (m === "lego_peg_cross")
    note.innerHTML = "<b>Kreuz-Zapfen:</b> Knob steckt in ein Lego-Kreuzloch. Echte Achse = 4,8/1,8. Bei oversize-Druck 4,7/1,7 testen.";
  else if (m === "lego_peg_round")
    note.innerHTML = "<b>Rund-Zapfen:</b> steckt in rundes Lego-Loch (Ø 4,8).";
  else if (m === "pot_d")
    note.innerHTML = "<b>Poti rund/D:</b> direkt auf 6-mm-Potiachse. Flachseiten 1 = D-Welle, 2 = beidseitig abgeflacht.";
  else
    note.innerHTML = "<b>Poti geriffelt:</b> für geriffelte 6-mm-Splined-Achsen (T18/T20).";
}

// ---- Presets ----
const PRESETS = {
  koii:   { H:9,  Dtop:11, Dbot:12, top:"flat",  fn:0,  fd:0, ind:"line" },
  po400:  { H:12, Dtop:13, Dbot:14, top:"flat",  fn:28, fd:7, ind:"line" },
  small:  { H:8,  Dtop:9,  Dbot:10, top:"flat",  fn:20, fd:6, ind:"line" },
  medium: { H:14, Dtop:14, Dbot:16, top:"dome",  topParam:2.5, fn:24, fd:6, ind:"line" },
  large:  { H:18, Dtop:22, Dbot:24, top:"flat",  fn:40, fd:8, ind:"dot"  },
};

// ---- Init all UI bindings ----
export function initUI() {
  bindRangeL("H",         "H",         "vH",         mm);
  bindRangeL("Dtop",      "Dtop",      "vDtop",      mm);
  bindRangeL("Dbot",      "Dbot",      "vDbot",      mm);
  bindRangeL("topParam",  "topParam",  "vTopParam",  mm);
  bindRangeL("Fn",        "fn",        "vFn",        num);
  bindRangeL("Fd",        "fd",        "vFd",        pct);
  bindRangeL("beak",      "beakLen",   "vBeak",      mm);
  bindRangeL("depth",     "depth",     "vDepth",     mm);
  bindRangeL("span",      "span",      "vSpan",      mm2);
  bindRangeL("arm",       "arm",       "vArm",       mm2);
  bindRangeL("rdia",      "rdia",      "vRdia",      mm2);
  bindRangeL("flat",      "flat",      "vFlat",      mm2);
  bindRangeL("teeth",     "teeth",     "vTeeth",     num);
  bindRangeL("ribs",      "ribs",      "vRibs",      num);
  bindRangeL("ribDepth",  "ribDepth",  "vRibDepth",  mm2);
  bindRangeL("stickLen",  "stickLen",  "vStickLen",  mm);
  bindRangeL("stickSpan", "stickSpan", "vStickSpan", mm2);
  bindRangeL("stickArm",  "stickArm",  "vStickArm",  mm2);
  bindRangeL("stickDia",  "stickDia",  "vStickDia",  mm2);

  bindSeg("topStyle", "top", () => {
    const wrap = document.getElementById("topParamWrap");
    const lab  = document.getElementById("topParamLab");
    if (P.top === "flat") { wrap.style.display = "none"; }
    else { wrap.style.display = "block"; lab.textContent = P.top === "dome" ? "Wölbung" : "Fasenbreite"; }
  });
  bindSeg("indStyle", "ind");
  bindSeg("ptrStyle", "pointer", () => {
    document.getElementById("beakWrap").style.display = P.pointer === "on" ? "block" : "none";
  });
  bindSeg("gripSeg", "grip", () => {
    document.getElementById("ribsWrap").style.display = (P.grip === "on" && !isPeg()) ? "block" : "none";
  });
  bindSeg("stickSeg", "stick", () => {
    document.getElementById("stickWrap").style.display = (P.stick === "on" && stickAllowed()) ? "block" : "none";
  });
  bindSegNum("flatsSeg", "flats", () => {
    document.getElementById("flatWrap").style.display = (P.mount === "pot_d" && P.flats >= 1) ? "block" : "none";
  });

  const mountSel = document.getElementById("mount");
  mountSel.addEventListener("change", () => {
    P.mount = mountSel.value;
    if (P.mount === "lego_hole_cross") { P.span = 4.75; P.arm = 2.0; setRange("span", 4.75, "vSpan", mm2); setRange("arm", 2.0, "vArm", mm2); }
    if (P.mount === "lego_peg_cross")  { P.span = 4.8;  P.arm = 1.8; setRange("span", 4.8,  "vSpan", mm2); setRange("arm", 1.8, "vArm", mm2); }
    if (P.mount === "lego_hole_round") { P.rdia = 4.9;  setRange("rdia", 4.9, "vRdia", mm2); }
    if (P.mount === "lego_peg_round")  { P.rdia = 4.8;  setRange("rdia", 4.8, "vRdia", mm2); }
    if (P.mount === "pot_d")           { P.rdia = 6.2; P.flats = 1; P.flat = 0.8; setRange("rdia", 6.2, "vRdia", mm2); setRange("flat", 0.8, "vFlat", mm2); document.getElementById("flatsSeg").querySelectorAll("button").forEach(x => x.classList.toggle("on", x.dataset.v === "1")); }
    if (P.mount === "pot_spline")      { P.rdia = 6.3; P.teeth = 20; setRange("rdia", 6.3, "vRdia", mm2); setRange("teeth", 20, "vTeeth", num); }
    applyMountUI(); rebuild();
  });

  document.getElementById("presets").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      const pr = PRESETS[b.dataset.preset];
      if (!pr) return;
      Object.assign(P, pr);
      setRange("H",      P.H,      "vH",      mm);
      setRange("Dtop",   P.Dtop,   "vDtop",   mm);
      setRange("Dbot",   P.Dbot,   "vDbot",   mm);
      setRange("Fn",     P.fn,     "vFn",     num);
      setRange("Fd",     P.fd,     "vFd",     pct);
      if (P.topParam) setRange("topParam", P.topParam, "vTopParam", mm);
      syncSeg("topStyle", P.top);
      syncSeg("indStyle", P.ind);
      const wrap = document.getElementById("topParamWrap");
      const lab  = document.getElementById("topParamLab");
      if (P.top === "flat") { wrap.style.display = "none"; }
      else { wrap.style.display = "block"; lab.textContent = P.top === "dome" ? "Wölbung" : "Fasenbreite"; }
      rebuild();
    });
  });

  document.getElementById("btnExport").addEventListener("click", async () => {
    const { exportSTL } = await import("./stl.js");
    exportSTL();
  });
}
