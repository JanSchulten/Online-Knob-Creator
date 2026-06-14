import { P, DEFAULTS } from "./params.js";
import { isPeg, stickAllowed, maxInnerR } from "./profile.js";
import { buildTriangles } from "./geometry.js";
import { drawGauge } from "./gauge.js";
import { setMesh, frameCamera, toggleBlueprint } from "./renderer.js";
import { saveState, clearState, exportJSON, importJSON } from "./storage.js";

// ---- Validation ----
export function validate() {
  const warn = document.getElementById("warnBox");
  const msgs = [];
  if (!isPeg() && P.through !== "on") {
    const maxRoof = P.H - 0.6;
    if (P.depth > maxRoof) {
      P.depth = Math.max(1, maxRoof);
      syncDepth();
      msgs.push("Hole depth limited to " + P.depth.toFixed(1) + " mm (min. 0.6 mm ceiling).");
    }
  }
  const minOuter = (P.Dbot / 2) * (1 - P.fd / 100), mi = maxInnerR();
  if (mi > minOuter - 0.4) {
    msgs.push("Mount almost as wide as the body bottom — wall very thin. Increase bottom Ø or shrink the mount.");
  }
  if (msgs.length) {
    warn.innerHTML = msgs.join("<br>");
    warn.classList.add("show");
  } else {
    warn.classList.remove("show");
  }
}

export function syncDepth() {
  setRange("depth", P.depth, "vDepth", mm);
}

// ---- Rebuild ----
// refit=true re-fits the camera zoom (initial/preset/load/reset/mount change);
// the default keeps the user's current zoom while editing values.
export function rebuild(refit = false) {
  validate();
  const { all, stickStart, stickDx } = buildTriangles();
  const g = setMesh(all, stickStart, stickDx);
  frameCamera(g, refit);
  drawGauge();
  saveState();
}

// ---- Format helpers ----
const mm   = v => v.toFixed(1) + '<span class="u">mm</span>';
const mm2  = v => v.toFixed(2) + '<span class="u">mm</span>';
const pct  = v => v.toFixed(0) + '<span class="u">%</span>';
const num  = v => v.toFixed(0);

// Decimal precision + unit per formatter, for the editable number inputs.
const FMT_META = new Map([
  [mm,  { prec: 1, unit: "mm" }],
  [mm2, { prec: 2, unit: "mm" }],
  [pct, { prec: 0, unit: "%"  }],
  [num, { prec: 0, unit: ""   }],
]);

// All range sliders: [inputId, P-key, labelId, formatter]
const RANGES = [
  ["H",        "H",         "vH",         mm ],
  ["Dtop",     "Dtop",      "vDtop",      mm ],
  ["Dbot",     "Dbot",      "vDbot",      mm ],
  ["topParam", "topParam",  "vTopParam",  mm ],
  ["Fn",       "fn",        "vFn",        num],
  ["Fd",       "fd",        "vFd",        pct],
  ["indW",     "indW",      "vIndW",      mm ],
  ["indLen",   "indLen",    "vIndLen",    mm ],
  ["indH",     "indH",      "vIndH",      mm ],
  ["beak",     "beakLen",   "vBeak",      mm ],
  ["depth",    "depth",     "vDepth",     mm ],
  ["span",     "span",      "vSpan",      mm2],
  ["arm",      "arm",       "vArm",       mm2],
  ["rdia",     "rdia",      "vRdia",      mm2],
  ["flat",     "flat",      "vFlat",      mm2],
  ["teeth",    "teeth",     "vTeeth",     num],
  ["ribs",     "ribs",      "vRibs",      num],
  ["ribDepth", "ribDepth",  "vRibDepth",  mm2],
  ["stickLen", "stickLen",  "vStickLen",  mm ],
  ["stickSpan","stickSpan", "vStickSpan", mm2],
  ["stickArm", "stickArm",  "vStickArm",  mm2],
  ["stickDia", "stickDia",  "vStickDia",  mm2],
];

function bindRangeL(id, key, labId, fmt) {
  const el   = document.getElementById(id);
  const lab  = document.getElementById(labId);
  const meta = FMT_META.get(fmt) || { prec: 2, unit: "" };

  // Replace the static value display with an editable number input + unit,
  // so values can be typed precisely (this is a measuring tool).
  const numEl = document.createElement("input");
  numEl.type = "number";
  numEl.className = "valnum";
  numEl.id = "n" + id;
  numEl.min = el.min; numEl.max = el.max; numEl.step = el.step;
  numEl.inputMode = "decimal";
  numEl.value = (+P[key]).toFixed(meta.prec);
  lab.textContent = "";
  lab.appendChild(numEl);
  if (meta.unit) {
    const u = document.createElement("span");
    u.className = "u"; u.textContent = meta.unit;
    lab.appendChild(u);
  }

  el.addEventListener("input", () => {
    P[key] = parseFloat(el.value);
    numEl.value = (+P[key]).toFixed(meta.prec);
    rebuild();
  });

  const commit = () => {
    let v = parseFloat(numEl.value);
    if (isNaN(v)) { numEl.value = (+P[key]).toFixed(meta.prec); return; }
    v = Math.min(parseFloat(el.max), Math.max(parseFloat(el.min), v));
    P[key] = v;
    el.value = v;
    numEl.value = (+v).toFixed(meta.prec);
    rebuild();
  };
  numEl.addEventListener("change", commit);
  numEl.addEventListener("keydown", e => { if (e.key === "Enter") numEl.blur(); });
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
  const numEl = document.getElementById("n" + id);
  if (numEl) {
    const meta = FMT_META.get(fmt) || { prec: 2 };
    numEl.value = (+val).toFixed(meta.prec);
  }
}

function syncSeg(wrapId, val) {
  document.getElementById(wrapId)
    .querySelectorAll("button")
    .forEach(x => x.classList.toggle("on", x.dataset.v === String(val)));
}

// Conditional fields that depend on the top-style / pointer toggles.
function applyTopUI() {
  const wrap = document.getElementById("topParamWrap");
  const lab  = document.getElementById("topParamLab");
  if (P.top === "flat") { wrap.style.display = "none"; }
  else { wrap.style.display = "block"; lab.textContent = P.top === "dome" ? "Dome" : "Chamfer width"; }
}
function applyBeakUI() {
  document.getElementById("beakWrap").style.display = P.pointer === "on" ? "block" : "none";
}
function applyIndUI() {
  const has = P.ind !== "none";
  document.getElementById("indModeWrap").style.display = has ? "block" : "none";
  document.getElementById("indSizeWrap").style.display = has ? "block" : "none";
  // Length only matters for the line mark; the dot is sized by width alone.
  document.getElementById("indLenWrap").style.display = (P.ind === "line") ? "block" : "none";
  // Engraving only applies on a flat top — hint when it won't take effect.
  document.getElementById("indModeNote").style.display =
    (has && P.indMode === "engraved" && P.top !== "flat") ? "block" : "none";
}

// Push the entire P model into every control + label (used after load/import).
export function syncAllUI() {
  for (const [id, key, labId, fmt] of RANGES) setRange(id, P[key], labId, fmt);
  syncSeg("topStyle", P.top);
  syncSeg("indStyle", P.ind);
  syncSeg("indModeSeg", P.indMode);
  syncSeg("ptrStyle", P.pointer);
  syncSeg("gripSeg",  P.grip);
  syncSeg("stickSeg", P.stick);
  syncSeg("throughSeg", P.through);
  syncSeg("flatsSeg", P.flats);
  document.getElementById("mount").value = P.mount;
  applyTopUI();
  applyBeakUI();
  applyIndUI();
  applyMountUI();
}

export function applyMountUI() {
  const cr = P.mount.includes("cross");
  document.getElementById("crossParams").style.display  = cr ? "block" : "none";
  document.getElementById("roundParams").style.display  = cr ? "none" : "block";
  document.getElementById("flatsWrap").style.display    = P.mount === "pot_d" ? "block" : "none";
  document.getElementById("flatWrap").style.display     = (P.mount === "pot_d" && P.flats >= 1) ? "block" : "none";
  document.getElementById("teethWrap").style.display    = P.mount === "pot_spline" ? "block" : "none";
  document.getElementById("depthLab").textContent       = isPeg() ? "Peg length" : "Hole depth";

  // Through-hole: only for hole-type mounts; it makes the depth slider moot.
  const through = (P.through === "on" && !isPeg());
  document.getElementById("throughWrap").style.display  = isPeg() ? "none" : "block";
  document.getElementById("depthField").style.display   = (isPeg() || !through) ? "block" : "none";
  document.getElementById("throughNote").style.display  = (through && P.top !== "flat") ? "block" : "none";

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
    note.innerHTML = "<b>Cross hole:</b> a Lego Technic axle inserts from below. Real axle = 4.8/1.8 mm. Default 4.75/2.0 = ~-0.025 mm clearance per side (FDM printing narrows holes). Use the press fit below for a wobble-free hold.";
  else if (m === "lego_hole_round")
    note.innerHTML = "<b>Round hole:</b> for a round Lego pin (Ø 4.8). 4.9 = slight clearance.";
  else if (m === "lego_peg_cross")
    note.innerHTML = "<b>Cross peg:</b> the knob plugs into a Lego cross hole. Real axle = 4.8/1.8. For oversize printing, try 4.7/1.7.";
  else if (m === "lego_peg_round")
    note.innerHTML = "<b>Round peg:</b> plugs into a round Lego hole (Ø 4.8).";
  else if (m === "pot_d")
    note.innerHTML = "<b>Pot round/D:</b> directly on a 6 mm pot shaft. Flats 1 = D-shaft, 2 = flattened on both sides.";
  else
    note.innerHTML = "<b>Pot splined:</b> for knurled 6 mm splined shafts (T18/T20).";
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
  for (const [id, key, labId, fmt] of RANGES) bindRangeL(id, key, labId, fmt);

  bindSeg("topStyle", "top", () => { applyTopUI(); applyIndUI(); });
  bindSeg("indStyle", "ind", applyIndUI);
  bindSeg("indModeSeg", "indMode", applyIndUI);
  bindSeg("ptrStyle", "pointer", applyBeakUI);
  bindSeg("throughSeg", "through", applyMountUI);
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
    applyMountUI(); rebuild(true);
  });

  document.getElementById("presets").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      const pr = PRESETS[b.dataset.preset];
      if (!pr) return;
      Object.assign(P, pr);
      syncAllUI();
      rebuild(true);
    });
  });

  document.getElementById("btnExport").addEventListener("click", async () => {
    const { exportSTL } = await import("./stl.js");
    exportSTL();
  });

  // ---- Blueprint view toggle ----
  const bpBtn = document.getElementById("btnBlueprint");
  let bpOn = false;
  bpBtn.addEventListener("click", () => {
    bpOn = !bpOn;
    bpBtn.classList.toggle("on", bpOn);
    toggleBlueprint(bpOn);
  });
  // Allow opening straight into blueprint view via #blueprint.
  if (location.hash.toLowerCase().includes("blueprint")) bpBtn.click();

  // ---- Reset to defaults ----
  document.getElementById("btnReset").addEventListener("click", () => {
    if (!confirm("Reset all settings to defaults?")) return;
    clearState();
    Object.assign(P, DEFAULTS);
    syncAllUI();
    rebuild(true);
  });

  // ---- Settings as JSON: save to file / load from file ----
  document.getElementById("btnSaveJSON").addEventListener("click", exportJSON);

  const fileInput = document.getElementById("fileJSON");
  document.getElementById("btnLoadJSON").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const f = fileInput.files[0];
    if (!f) return;
    importJSON(f, ok => {
      if (ok) { syncAllUI(); rebuild(true); }
      else    { alert("Could not read the JSON file."); }
      fileInput.value = "";
    });
  });
}
