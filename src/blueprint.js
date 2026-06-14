/* global THREE */
import { P } from "./params.js";
import { isPeg } from "./profile.js";

const SVGNS = "http://www.w3.org/2000/svg";
let svg = null, on = false;

export function initBlueprint(canvas) {
  svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "dims");
  svg.style.display = "none";
  canvas.parentNode.appendChild(svg);   // sits over the canvas inside <main>
}

export function setBlueprintOverlay(v) {
  on = v;
  if (svg) svg.style.display = v ? "block" : "none";
}

// Project a world point to canvas pixel coordinates.
function project(x, y, z, camera, W, H) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z];
}

// One linear dimension: line a→b with end ticks and a centered label.
function dimSVG(a, b, text) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len * 5, py = dx / len * 5;      // perpendicular tick
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const lx = mx + px * 2.2, ly = my + py * 2.2;     // label offset off the line
  return (
    `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="dl"/>` +
    `<line x1="${a[0]-px}" y1="${a[1]-py}" x2="${a[0]+px}" y2="${a[1]+py}" class="dl"/>` +
    `<line x1="${b[0]-px}" y1="${b[1]-py}" x2="${b[0]+px}" y2="${b[1]+py}" class="dl"/>` +
    `<text x="${lx}" y="${ly}" class="dt">${text}</text>`
  );
}

// A simple leader + label anchored at a single world point.
function noteSVG(p, text, off = 26) {
  const x2 = p[0] + off, y2 = p[1] + off;
  return (
    `<line x1="${p[0]}" y1="${p[1]}" x2="${x2}" y2="${y2}" class="dl"/>` +
    `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" class="dp"/>` +
    `<text x="${x2 + 3}" y="${y2 + 3}" class="dt">${text}</text>`
  );
}

function mountLabel() {
  const m = P.mount;
  if (m === "lego_hole_cross" || m === "lego_peg_cross") return `cross ${P.span.toFixed(2)}/${P.arm.toFixed(2)}`;
  if (m === "lego_hole_round" || m === "lego_peg_round") return `round Ø${P.rdia.toFixed(2)}`;
  if (m === "pot_d") return `pot D Ø${P.rdia.toFixed(2)}`;
  return `pot spline Ø${P.rdia.toFixed(2)}`;
}

export function updateBlueprint(camera, canvas) {
  if (!on || !svg) return;
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  // World axes after the mesh's -90° X rotation: vertical = world Y (0..H).
  const Hh = P.H, Rb = P.Dbot / 2, Rt = P.Dtop / 2;
  const Rref = Math.max(Rb, Rt) + 3;
  const P3 = (x, y, z) => project(x, y, z, camera, W, H);

  let s = "";
  // Height — vertical, offset to the +x side.
  s += dimSVG(P3(Rref, 0, 0), P3(Rref, Hh, 0), `H ${Hh.toFixed(1)}`);
  // Bottom diameter — across the base.
  s += dimSVG(P3(-Rb, 0, 0), P3(Rb, 0, 0), `Ø ${P.Dbot.toFixed(1)}`);
  // Top diameter — across the top.
  s += dimSVG(P3(-Rt, Hh, 0), P3(Rt, Hh, 0), `Ø ${P.Dtop.toFixed(1)}`);
  // Mount note at the bore opening (bottom centre, or top for a peg).
  const my = isPeg() ? Hh : 0;
  s += noteSVG(P3(0, my, 0), mountLabel());
  // Hole depth (blind hole only).
  if (!isPeg() && P.through !== "on") {
    s += dimSVG(P3(-Rref, 0, 0), P3(-Rref, P.depth, 0), `depth ${P.depth.toFixed(1)}`);
  } else if (P.through === "on" && !isPeg()) {
    s += noteSVG(P3(0, Hh, 0), "through", 22);
  }

  svg.innerHTML = s;
}
