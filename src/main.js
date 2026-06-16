/* global THREE */
import { initThree, startLoop } from "./renderer.js";
import { initControls } from "./controls.js";
import { initUI, syncAllUI, rebuild } from "./ui.js";
import { loadState } from "./storage.js";

const canvas = document.getElementById("view");

if (typeof THREE === "undefined") {
  document.querySelector("main").innerHTML =
    '<div style="color:#bbb;font-family:monospace;padding:40px 20px">Could not load the 3D library.<br>Check your network settings and reload the page.</div>';
} else {
  initThree(canvas);
  initControls(canvas);
  loadState();      // restore last session from localStorage (if any)
  initUI();
  syncAllUI();      // push restored/default values into all controls
  rebuild(true);    // initial build frames the camera
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
