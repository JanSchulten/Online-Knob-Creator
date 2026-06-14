import { P, TWO, LEGO_SPAN, LEGO_ARM } from "./params.js";
import { crossR, innerRFinal, stickRfn, stickEnabled, isPeg, maxInnerR } from "./profile.js";

export function drawGauge() {
  const gc  = document.getElementById("gaugeCanvas");
  const ctx = gc.getContext("2d");
  const W = gc.width, H = gc.height, cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);

  const refMax = Math.max(P.Dbot / 2, maxInnerR(), LEGO_SPAN / 2) * 2.3;
  const sc = (W * 0.5) / refMax;

  ctx.strokeStyle = "#1c2027"; ctx.lineWidth = 1;
  for (let mm = -8; mm <= 8; mm += 2) {
    const p = cx + mm * sc;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy + mm * sc); ctx.lineTo(W, cy + mm * sc); ctx.stroke();
  }

  ctx.strokeStyle = "#3a414b"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, (P.Dbot / 2) * sc, 0, TWO); ctx.stroke();

  // Lego reference
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const th = i / 240 * TWO, r = crossR(th, LEGO_SPAN, LEGO_ARM) * sc;
    const x = cx + r * Math.cos(th), y = cy - r * Math.sin(th);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = "#5a93e0"; ctx.lineWidth = 1.4;
  ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);

  // User shape
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const th = i / 360 * TWO, r = innerRFinal(th) * sc;
    const x = cx + r * Math.cos(th), y = cy - r * Math.sin(th);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(255,74,28,0.16)"; ctx.fill();
  ctx.strokeStyle = "#ff4a1c"; ctx.lineWidth = 1.8; ctx.stroke();

  if (stickEnabled()) {
    ctx.beginPath();
    for (let i = 0; i <= 360; i++) {
      const th = i / 360 * TWO, r = stickRfn(th) * sc;
      const x = cx + r * Math.cos(th), y = cy - r * Math.sin(th);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "#7fd6a4"; ctx.lineWidth = 1.5; ctx.stroke();
  }

  const ft = document.getElementById("fitText");
  if (P.mount.includes("cross")) {
    const dSpan = P.span - LEGO_SPAN, dArm = P.arm - LEGO_ARM;
    if (isPeg()) {
      ft.innerHTML = "Zapfen vs. Lego-Loch (4,8): Tip <b>" + dSpan.toFixed(2) + "</b>, Arm <b>" + dArm.toFixed(2) + "</b> mm";
      ft.style.color = (P.span <= 4.8 && P.arm <= 1.8) ? "#7fd6a4" : "#e0a36a";
    } else {
      ft.innerHTML = "Spiel zur Achse: Tip <b>" + (dSpan / 2).toFixed(2) + "</b>, Arm <b>" + (dArm / 2).toFixed(2) + "</b> mm/Seite";
      ft.style.color = (dSpan >= 0.05 && dArm >= 0.05) ? "#7fd6a4" : "#e0a36a";
    }
  } else if (P.mount.includes("round")) {
    ft.innerHTML = isPeg()
      ? "Rund-Zapfen Ø <b>" + P.rdia.toFixed(2) + "</b> (Lego-Loch 4,8)"
      : "Rund-Loch Ø <b>" + P.rdia.toFixed(2) + "</b> (Lego-Pin 4,8)";
    ft.style.color = "#9aa3ad";
  } else {
    ft.innerHTML = "Poti-Aufnahme Ø <b>" + P.rdia.toFixed(2) + "</b> · Flachseiten " + (P.mount === "pot_d" ? P.flats : 0);
    ft.style.color = "#9aa3ad";
  }

  if (stickEnabled()) {
    const extra = P.mount === "lego_hole_cross"
      ? "Stift→Loch Spiel: " + ((P.span - P.stickSpan) / 2).toFixed(2) + " / " + ((P.arm - P.stickArm) / 2).toFixed(2) + " mm"
      : "Stift→Loch Spiel: " + ((P.rdia - P.stickDia) / 2).toFixed(2) + " mm";
    ft.innerHTML += '<br><span style="color:#7fd6a4">' + extra + "</span>";
  }
}
