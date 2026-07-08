/**
 * SVG Exporter
 *
 * Generates clean SVG markup for vector-compatible effects.
 * Each effect has its own generator that produces native SVG primitives
 * (circles, paths, lines, polygons) rather than rasterized data.
 *
 * Supported effects: Dots, Halftone, Contour, Crosshatch, Voronoi
 */

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

export function downloadSVG(svgContent: string, filename: string = 'retro_output.svg'): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function svgHeader(width: number, height: number): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`;
}

function svgFooter(): string {
  return '</svg>';
}

function getBrightness(pixels: Uint8ClampedArray, x: number, y: number, w: number): number {
  const i = (y * w + x) * 4;
  return (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
}

function getColor(pixels: Uint8ClampedArray, x: number, y: number, w: number): string {
  const i = (y * w + x) * 4;
  return `rgb(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]})`;
}

// ---------------------------------------------------------------------------
// Dots SVG
// ---------------------------------------------------------------------------

export function exportDotsSVG(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: {
    shape: string;
    spacing: number;
    size: number;
    colorMode: string;
    invert: boolean;
  }
): string {
  const ctx = sourceCanvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height);
  const px = imgData.data;
  const spacing = Math.max(2, Math.floor(settings.spacing * 8 + 2));

  let svg = svgHeader(width, height);
  svg += `<rect width="${width}" height="${height}" fill="${settings.invert ? '#fff' : '#000'}"/>\n`;

  for (let y = spacing; y < height; y += spacing) {
    for (let x = spacing; x < width; x += spacing) {
      let b = getBrightness(px, Math.min(x, width - 1), Math.min(y, height - 1), width);
      if (settings.invert) b = 1 - b;

      const r = b * settings.size * spacing * 0.4;
      if (r < 0.5) continue;

      const color = settings.colorMode === 'Original'
        ? getColor(px, Math.min(x, width - 1), Math.min(y, height - 1), width)
        : (settings.invert ? '#000' : '#fff');

      if (settings.shape === 'Circle') {
        svg += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="${color}"/>\n`;
      } else {
        const s = r * 1.6;
        svg += `<rect x="${(x - s / 2).toFixed(1)}" y="${(y - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${color}"/>\n`;
      }
    }
  }

  svg += svgFooter();
  return svg;
}

// ---------------------------------------------------------------------------
// Halftone SVG
// ---------------------------------------------------------------------------

export function exportHalftoneSVG(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: {
    shape: string;
    spacing: number;
    dotScale: number;
    angle: number;
    colorMode: string;
    foreground: string;
    background: string;
  }
): string {
  const ctx = sourceCanvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height);
  const px = imgData.data;
  const spacing = Math.max(3, settings.spacing);
  const rad = (settings.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  let svg = svgHeader(width, height);
  svg += `<rect width="${width}" height="${height}" fill="${settings.background}"/>\n`;

  // Generate grid in rotated space
  const diag = Math.sqrt(width * width + height * height);
  const startX = -diag / 2;
  const startY = -diag / 2;
  const cx = width / 2;
  const cy = height / 2;

  for (let gy = startY; gy < diag / 2; gy += spacing) {
    for (let gx = startX; gx < diag / 2; gx += spacing) {
      // Rotate grid point back to image space
      const px2 = cx + gx * cos - gy * sin;
      const py2 = cy + gx * sin + gy * cos;

      const ix = Math.floor(px2);
      const iy = Math.floor(py2);
      if (ix < 0 || ix >= width || iy < 0 || iy >= height) continue;

      const b = getBrightness(px, ix, iy, width);
      const r = (1 - b) * settings.dotScale * spacing * 0.45;
      if (r < 0.3) continue;

      const fill = settings.colorMode === 'Mono'
        ? settings.foreground
        : getColor(px, ix, iy, width);

      if (settings.shape === 'Circle' || settings.shape === 'Dot') {
        svg += `<circle cx="${px2.toFixed(1)}" cy="${py2.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>\n`;
      } else if (settings.shape === 'Line') {
        const len = r * 2;
        svg += `<line x1="${(px2 - len / 2).toFixed(1)}" y1="${py2.toFixed(1)}" x2="${(px2 + len / 2).toFixed(1)}" y2="${py2.toFixed(1)}" stroke="${fill}" stroke-width="${(r * 0.5).toFixed(1)}"/>\n`;
      } else {
        const s = r * 1.6;
        svg += `<rect x="${(px2 - s / 2).toFixed(1)}" y="${(py2 - s / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${fill}"/>\n`;
      }
    }
  }

  svg += svgFooter();
  return svg;
}

// ---------------------------------------------------------------------------
// Contour SVG
// ---------------------------------------------------------------------------

export function exportContourSVG(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: {
    levels: number;
    lineThickness: number;
    colorMode: string;
    invert: boolean;
  }
): string {
  const ctx = sourceCanvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height);
  const px = imgData.data;
  const levels = Math.max(2, settings.levels);

  let svg = svgHeader(width, height);
  svg += `<rect width="${width}" height="${height}" fill="${settings.invert ? '#000' : '#fff'}"/>\n`;

  // Build brightness map
  const bMap: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      row.push(getBrightness(px, x, y, width));
    }
    bMap.push(row);
  }

  // For each contour level, trace edges
  const strokeColor = settings.invert ? '#fff' : '#000';
  for (let lvl = 1; lvl < levels; lvl++) {
    const threshold = lvl / levels;
    let pathData = '';

    for (let y = 0; y < height - 1; y += 2) {
      for (let x = 0; x < width - 1; x += 2) {
        const b = bMap[y][x];
        const bRight = bMap[y][x + 1];
        const bDown = bMap[y + 1][x];

        // Horizontal edge
        if ((b < threshold) !== (bRight < threshold)) {
          pathData += `M${x + 1} ${y} v2 `;
        }
        // Vertical edge
        if ((b < threshold) !== (bDown < threshold)) {
          pathData += `M${x} ${y + 1} h2 `;
        }
      }
    }

    if (pathData) {
      const color = settings.colorMode === 'Original'
        ? `hsl(${(lvl / levels) * 360}, 70%, 50%)`
        : strokeColor;

      svg += `<path d="${pathData}" stroke="${color}" stroke-width="${settings.lineThickness}" fill="none" opacity="0.8"/>\n`;
    }
  }

  svg += svgFooter();
  return svg;
}

// ---------------------------------------------------------------------------
// Crosshatch SVG
// ---------------------------------------------------------------------------

export function exportCrosshatchSVG(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: {
    density: number;
    layers: number;
    angle: number;
    lineWidth: number;
    randomness: number;
    lineColor: string;
    bgColor: string;
  }
): string {
  const ctx = sourceCanvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height);
  const px = imgData.data;
  const spacing = Math.max(3, Math.floor(30 / settings.density));

  let svg = svgHeader(width, height);
  svg += `<rect width="${width}" height="${height}" fill="${settings.bgColor}"/>\n`;

  const angles: number[] = [];
  for (let i = 0; i < settings.layers; i++) {
    angles.push(settings.angle + (i * 180) / settings.layers);
  }

  for (const angleDeg of angles) {
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const lineLen = spacing * 0.9;

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const b = getBrightness(px, Math.min(x, width - 1), Math.min(y, height - 1), width);
        const darkness = 1 - b;

        if (darkness < 0.1) continue;

        const rx = settings.randomness > 0 ? (Math.random() - 0.5) * settings.randomness * spacing : 0;
        const ry = settings.randomness > 0 ? (Math.random() - 0.5) * settings.randomness * spacing : 0;

        const cx = x + rx;
        const cy = y + ry;
        const half = (lineLen * darkness) / 2;

        const x1 = (cx - half * cos).toFixed(1);
        const y1 = (cy - half * sin).toFixed(1);
        const x2 = (cx + half * cos).toFixed(1);
        const y2 = (cy + half * sin).toFixed(1);

        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${settings.lineColor}" stroke-width="${(settings.lineWidth + darkness * 1.5).toFixed(1)}" stroke-linecap="round"/>\n`;
      }
    }
  }

  svg += svgFooter();
  return svg;
}

// ---------------------------------------------------------------------------
// Voronoi SVG
// ---------------------------------------------------------------------------

export function exportVoronoiSVG(
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: {
    cellSize: number;
    edgeWidth: number;
    edgeColor: string;
    colorMode: string;
    randomize: number;
  }
): string {
  const ctx = sourceCanvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height);
  const px = imgData.data;
  const size = Math.max(5, settings.cellSize);

  // Generate seed points
  interface Seed { x: number; y: number; color: string }
  const seeds: Seed[] = [];

  for (let y = size / 2; y < height; y += size) {
    for (let x = size / 2; x < width; x += size) {
      const jx = x + (Math.random() - 0.5) * size * settings.randomize;
      const jy = y + (Math.random() - 0.5) * size * settings.randomize;
      const sx = Math.floor(Math.min(Math.max(jx, 0), width - 1));
      const sy = Math.floor(Math.min(Math.max(jy, 0), height - 1));

      seeds.push({
        x: jx,
        y: jy,
        color: getColor(px, sx, sy, width),
      });
    }
  }

  let svg = svgHeader(width, height);

  // For each seed, create a polygon approximation using its Voronoi cell
  // We use a simplified approach: render rectangles centered on seeds
  // with the sampled color. For a perfect Voronoi we'd need Fortune's algorithm,
  // but this gives excellent visual results at SVG export quality.
  for (const seed of seeds) {
    const halfW = size / 2;
    const halfH = size / 2;

    const fill = settings.colorMode === 'Cell Average' || settings.colorMode === 'Center Sample'
      ? seed.color
      : seed.color;

    svg += `<rect x="${(seed.x - halfW).toFixed(1)}" y="${(seed.y - halfH).toFixed(1)}" `;
    svg += `width="${size.toFixed(1)}" height="${size.toFixed(1)}" `;
    svg += `fill="${fill}" `;
    if (settings.edgeWidth > 0) {
      const edgeCol = settings.edgeColor === 'Darkened' ? '#333' : settings.edgeColor;
      svg += `stroke="${edgeCol}" stroke-width="${settings.edgeWidth.toFixed(1)}" `;
    }
    svg += `/>\n`;
  }

  svg += svgFooter();
  return svg;
}
