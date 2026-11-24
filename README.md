# Angry Elīza — Interactive 3D Christmas Gift

A mobile-first, zero-build 3D web experience presenting the painting **"Angry Elīza"** by **Nicolas DIDIER**, emerging from a 3D crimson-and-gold Christmas gift box beneath falling snow and a twinkling 3D Christmas tree.

## Features

- **3D Winter Opening**: Falling snow, a decorated 3D Christmas tree with twinkling lights, and an interactive 3D gift box with a sculpted satin bow.
- **Cinematic Reveal**: Clicking **Open** lifts the lid with a golden sparkle burst, raises the 3D stretched canvas out of the box, and transitions into a softly Gaussian-blurred, warmly illuminated gallery backdrop.
- **Free 3D View**: Rotate 360°, pinch-zoom, and flip the canvas freely with touch or mouse (`OrbitControls`), revealing the recessed raw linen reverse signed by hand with **"Je t'aime"** and **"11.21.2026"** framed by 3D pinewood stretcher bars.
- **Guided Detail Tour**: Clicking **See Details** smoothly orbits and zooms across 9 curated stops (eyes, nose, beauty mark, lips, hair, ears, berry earrings, and the handwritten back) with **Next** navigation and an **EN / FR** toggle.

## Deploy to GitHub Pages

1. Push the contents of this folder (`index.html`, `style.css`, `assets/`, and `src/`) to the root of a GitHub repository.
2. Open **Settings → Pages** in your GitHub repository.
3. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, then click **Save**.
4. Your site will be live with no build step required.

## Customize Captions

Edit the coordinates or English/French descriptions in [`src/details-data.js`](./src/details-data.js).
