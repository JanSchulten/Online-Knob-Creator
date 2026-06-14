import { P } from "./params.js";

const KEY = "knobworks.settings.v1";

// Copy known keys from a plain object into P, with light type-guards so a
// corrupt or hand-edited file can't poison the model.
export function applyData(data) {
  if (!data || typeof data !== "object") return false;
  let any = false;
  for (const k of Object.keys(P)) {
    if (k in data && typeof data[k] === typeof P[k]) { P[k] = data[k]; any = true; }
  }
  return any;
}

// ---- localStorage (last session) ----
export function saveState() {
  try { localStorage.setItem(KEY, JSON.stringify(P)); } catch { /* quota / private mode */ }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    return applyData(JSON.parse(raw));
  } catch { return false; }
}

// ---- JSON file (manual export / import) ----
export function exportJSON() {
  const blob = new Blob([JSON.stringify(P, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "knob-settings.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importJSON(file, done) {
  const reader = new FileReader();
  reader.onload  = () => { try { done(applyData(JSON.parse(reader.result))); } catch { done(false); } };
  reader.onerror = () => done(false);
  reader.readAsText(file);
}
