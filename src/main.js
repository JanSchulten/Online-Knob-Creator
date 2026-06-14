/* global THREE */
import { initThree, startLoop } from "./renderer.js";
import { initControls } from "./controls.js";
import { initUI, applyMountUI, rebuild } from "./ui.js";

const canvas = document.getElementById("view");

if (typeof THREE === "undefined") {
  document.querySelector("main").innerHTML =
    '<div style="color:#bbb;font-family:monospace;padding:40px 20px">3D-Bibliothek konnte nicht geladen werden.<br>Netzwerkeinstellungen prüfen und Seite neu laden.</div>';
} else {
  initThree(canvas);
  initControls(canvas);
  initUI();
  applyMountUI();
  rebuild();
  startLoop(canvas);

  // Mobile tab bar
  const tabbar = document.getElementById("tabbar");
  tabbar?.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      tabbar.querySelectorAll("button").forEach(x => x.classList.remove("on"));
      btn.classList.add("on");
      document.body.dataset.tab = btn.dataset.tab;
    });
  });
}
