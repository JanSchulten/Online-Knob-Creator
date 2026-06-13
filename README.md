# KNOB.WORKS — Online Knob Creator

🎛️ **Live-Demo:** [janschulten.github.io/Online-Knob-Creator](https://janschulten.github.io/Online-Knob-Creator/)

Parametrischer 3D-Knob-Designer für Synthesizer-Regler und Lego-Technic-Verbindungen. Direkt im Browser — kein Download, kein Plugin.

## Features

- **Echtzeit-3D-Vorschau** mit Three.js (WebGL)
- **Vollständig parametrisch:** Höhe, Durchmesser, Riffelungen, Wölbung, Fase
- **Aufnahme-Typen:** Lego-Technic-Achse (Kreuz/Rund), Loch oder Zapfen, Poti-Achse (D-Form, Spline)
- **Querschnitt-Gauge** zum visuellen Prüfen des Passsitzes vs. Lego-Referenz (4,8/1,8 mm)
- **STL-Export** (binär, druckfertig)
- **Geräte-Presets:** KO II, PO-400, Klein, Mittel, Groß
- Responsive (Desktop + Mobil)

## Verwendung

1. Parameter im linken Panel einstellen
2. 3D-Vorschau per Maus drehen/zoomen
3. "STL exportieren" klicken → direkt in Slicer laden

## Technologien

- Vanilla HTML/CSS/JS (kein Framework)
- [Three.js r128](https://threejs.org/) für 3D-Rendering
- Prozedurales Mesh-Building (CSG-frei)

## Lizenz

MIT © Jan Schulten
