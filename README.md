# Knob Generator — Online Knob Creator

🎛️ **Live demo:** [janschulten.github.io/Online-Knob-Creator](https://janschulten.github.io/Online-Knob-Creator/)

Parametric 3D knob designer for synthesizer controls and Lego Technic connections. Right in the browser — no download, no plugin.

## Features

- **Real-time 3D preview** with Three.js (WebGL)
- **Fully parametric:** height, diameter, knurling, dome, chamfer
- **Mount types:** Lego Technic axle (cross/round), hole or peg, pot shaft (D-shape, spline)
- **Cross-section gauge** to visually check the fit vs. the Lego reference (4.8/1.8 mm)
- **STL export** (binary, print-ready)
- **Settings persistence:** last session is remembered automatically; save/load settings as a JSON file
- **Device presets:** KO II, PO-400, Small, Medium, Large
- Responsive (desktop + mobile)

## Usage

1. Adjust parameters in the left panel
2. Rotate/zoom the 3D preview with the mouse (or touch)
3. Click "STL ↓" → load straight into your slicer

## Technologies

- Vanilla HTML/CSS/JS (no framework)
- [Three.js r128](https://threejs.org/) for 3D rendering
- Procedural mesh building (CSG-free)

## License

MIT © Jan Schulten
