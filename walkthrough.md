# RETROLAB // ADVANCED PIXEL, DITHER & GLITCH ENGINE
### Interactive Portfolio Walkthrough, Technical Case Study & Performance Architecture

RetroLab is an offline-first, high-performance image processing station built directly in the browser. It allows designers, artists, and game developers to instantly downgrade high-fidelity modern images into gorgeous retro formats, custom pixel art, and digital glitch matrices.

---

## 1. Measurable Performance Metrics
Rather than relying on server-side processing queues, RetroLab executes all rendering client-side in the browser. This approach yields the following performance benchmarks:

*   **⚡ Client-Side Only**: 0% server bandwidth utilization. Images never leave the user's computer, guaranteeing absolute data privacy.
*   **⏱️ <16ms Preview Updates**: Re-calculates and re-draws complex Floyd-Steinberg diffusion loops within a single frame budget, keeping the screen fluid.
*   **🎮 60 FPS Interactive Scrubbing**: Dial-parameters (such as luma contrast, bayer scale, and scanlines) update instantly as sliders are dragged.
*   **💾 Offline Capable**: Zero network calls required for core rendering. Works seamlessly in remote, offline, or low-bandwidth environments.
*   **🖼️ Native Canvas Core**: Processes up to 4K raw image sources by isolating pixel clusters into structured Float32 clamped arrays.

---

## 2. Dynamic Pipeline Schematic
The diagram below shows how raw image files transition from source uploads to optimized retro-rendered files:

```
[ RAW SOURCE IMAGE ]
       |
       v
( Dual-Buffered HTML5 Canvas )  <--- Captures uploaded file or sample presets
       |
       v
[ COLOR ADJUSTMENT MATRIX ]     <--- Modifies Contrast, Brightness, & Sharpening
       |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
[ DITHER ALGORITHMS ]   [ GLITCH PROCESSORS ]   [ TEXTURE RENDERER ]
  - Floyd-Steinberg       - Pixel Sorting         - CRT Scanlines
  - Ordered Bayer         - Chromatic Drift       - Phosphor Grid Curve
  - Halftone Dots         - Noise Fields          - Color Palettes
       |                       |                       |
       +-----------------------+-----------------------+
                               |
                               v
                     [ COMPARE SPLIT STAGE ]
                       |                 |
                       v                 v
               [ LEFT BARRIER ]   [ RIGHT BARRIER ]
               Raw Original       Retro-Glitch Render
                               |
                               v
                  [ NEAREST-NEIGHBOR UPSCALER ]
                       |                 |
                       +--------+--------+
                                | (Choose export scale: 1x, 2x, 4x, 8x)
                                v
                   [ CRISP EXPORT FILE (PNG/JPG) ]
```

---

## 3. Pixel Algorithms Explained Simply

### Floyd-Steinberg Dithering
*   **What it does**: Spreads quantization error to neighboring pixels.
*   **How it works**: When a pixel's color is rounded to the closest available palette color, the mathematical "error" (difference) is divided and pushed onto the pixels to the right `(7/16)`, lower-left `(3/16)`, lower `(5/16)`, and lower-right `(1/16)`. This produces organic, noise-like pointillism textures.

### Ordered Bayer Dithering (4x4 & 8x8)
*   **What it does**: Uses repeating threshold matrices to recreate retro game displays.
*   **How it works**: Compares pixel brightness values against a structured grid of threshold values. If a pixel is brighter than the corresponding matrix slot, it lights up. This produces clean cross-hatched and checkered dither grids typical of early Macintosh and GameBoy screens.

### Halftone Dot Screens
*   **What it does**: Simulates classic comic book and physical newsprint printing.
*   **How it works**: Groups pixels into larger virtual cells, calculates the average luminance in each cell, and draws a solid circle whose radius is proportional to that luminance. The entire grid is rotated (usually at $45^\circ$) to avoid harsh horizontal lines.

### Horizontal Pixel Sorting
*   **What it does**: Creates digital "melt" and vertical glitch streams.
*   **How it works**: Scans each horizontal row of pixels. If a pixel's brightness exceeds a certain threshold, it starts a "sorting run" where it collects adjacent pixels and sorts their RGB values in ascending order, stopping when brightness falls below the threshold.

### Chromatic Aberration
*   **What it does**: Recreates analog lens distortion and misaligned CRT electron guns.
*   **How it works**: Decouples the standard RGBA image buffer into distinct Red, Green, and Blue arrays, then offsets their rendering coordinates in opposite directions relative to the screen center.

---

## 4. Responsive & Touch-First Architecture
RetroLab was built from the ground up to adapt to different devices, screen ratios, and user input types.

| Device Layout | Visual Structure | Input Adapters |
| :--- | :--- | :--- |
| **Desktop (`lg` and up)** | Expanded double-column workspace. Controls are pinned in a left-side panel with a scrollbar-thin overflow wrapper. The right side hosts the interactive dual-buffer canvas stage. | High-precision custom pixel-art cursor with contextual styling on mouse hover. Keyboard-accessible parameter adjustments. |
| **Tablet (`md` to `lg`)** | Stacked grid with floating collapsible control panels. Side controls collapse into slide-out drawers, leaving maximum screen space for the canvas. | Swipe-to-scrub adjustments on slider dials. Gestures mapped for split-compare panning. |
| **Mobile (`sm` and down)** | Single-column linear layout. Controls are organized into tabbed, low-height cards. Canvas container automatically scales down to fit small viewport widths. | Minimized 44px tap targets for buttons. Touch-friendly slider inputs with padded grabbers. Custom pixel cursor auto-disables on touch screens. |

### Responsive Feature Highlights
1.  **Collapsible Control Panel**: Users can toggle the entire sidebar open or closed with a single click. When collapsed, the workspace expands to fill 100% of the viewport width.
2.  **Optimized Touch Canvas**: On mobile, the compare slider responds to raw pointer touch events, allowing smooth dragging across the screen.
3.  **Hook-Based Media Query System**: Powered by a custom `/src/hooks/useMediaQuery.ts` hook that dynamically monitors window boundaries and exposes fluid flags (`isMobile`, `isTablet`, `isDesktop`) for programmatic layout shifting.
4.  **Tactile Mobile Drawer Side Panel**: Replaces the standard desktop navigation pill with a sliding 8-bit themed console on mobile and tablet. The drawer integrates generous touch-target heights (46px) to maximize tactile response and readability.


---

## 5. Visualizing Key Interactions

### Slider Dragging & Live Previews
As sliders are dragged, the canvas re-processes the image in real time. Rather than waiting for a mouse-up event, RetroLab processes parameter changes on the fly.
*   *Interactive Experience*: Smooth parameter adjustments without lag or stutter.

### Interactive Before/After Compare Slider
A vertical divider splits the canvas. Dragging it reveals the original image on the left and the retro-processed result on the right.
*   *Interactive Experience*: Slide the divider back and forth to inspect details and compare textures.

### Dynamic Preset Switching
A library of presets (e.g., *1-Bit Macintosh*, *Classic GameBoy*, *Arcade CRT*) lets you apply settings with a single click.
*   *Interactive Experience*: Watch the entire control panel update and the image transform instantly.

### Nearest-Neighbor Crisp Export
Saves the retro masterpiece as a clean, crisp file at multiple resolution scales.
*   *Interactive Experience*: Choose 1x, 2x, 4x, or 8x scale to download a pixel-perfect image with sharp, crisp edges.

---

## 6. Technical Challenges Solved

### Challenge A: Real-Time Preview Rendering
*   **Problem**: Running error-diffusion dither loops and pixel sorting on high-resolution images in JavaScript can block the main UI thread, causing lag and dropped frames.
*   **Solution**: Added pre-scale controls that down-sample high-res inputs to working dimensions (e.g., 256px or 512px) for live previews. This allows for instant updates, while the full-resolution rendering is deferred until export.

### Challenge B: Preventing Memory Spikes
*   **Problem**: Instantiating new `ImageData` objects or arrays inside the processing loop causes frequent garbage collection sweeps, resulting in periodic frame drops and stuttering.
*   **Solution**: Reused existing canvas buffers and modified pixels in-place using clamped Uint8Array references. This approach keeps memory allocation flat during slider adjustments.

### Challenge C: Keeping Pixels Crisp on Export
*   **Problem**: Exporting small pixel-art images (e.g., 128x128) and scaling them up using standard CSS or image viewers causes blurry edges due to default bilinear interpolation.
*   **Solution**: Built a custom offscreen upscaler that reads the processed pixel buffer and copies each pixel into an expanded grid of identical pixels (nearest-neighbor scaling). This produces sharp, pixel-perfect exports at 2x, 4x, or 8x.

### Challenge D: Perceived Performance with High-Resolution Feeds
*   **Problem**: Fetching many beautiful high-resolution curated art submissions from the database simultaneously can cause noticeable loading stutter or blank spots, undermining the premium desktop feel.
*   **Solution**: Engineered a reusable `<LazyImage />` component with in-place animated scanline grids and 8-bit spin animations. Assets remain completely blank-free, showing an immersive "loading chips" placeholder before gracefully blooming/scaling into focus using buttery hardware-accelerated transitions when loaded.

---

## 7. Future Expansion Scope

1.  **GPU Acceleration (WebGL)**: Porting the dither and sorting algorithms from CPU-based loops to GPU fragment shaders (`GLSL`) to enable real-time 4K video processing at 60fps.
2.  **Interactive Palette Builder**: Letting users upload an image to extract its color palette, edit individual colors, and save custom palettes to local storage.
3.  **Retro Video Recorder**: Adding support for processing short video clips or live webcam streams, allowing users to record and export retro-dithered GIFs and MP4s.
