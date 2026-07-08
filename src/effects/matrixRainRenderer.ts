import {
  MatrixCell,
  MatrixSettings,
  ColumnState,
  MATRIX_CHAR_SETS,
} from '../types/matrix';

// ---------------------------------------------------------------------------
// Stage 1 — Brightness Grid
// ---------------------------------------------------------------------------

/**
 * Downsample the source image into a brightness grid.
 * For images > MAX_SAMPLE_DIM, we sample a reduced grid so rendering
 * stays fast. Users won't see any difference because characters are
 * already a low-resolution representation.
 */
const MAX_SAMPLE_DIM = 320;

function buildBrightnessGrid(
  sourceCanvas: HTMLCanvasElement,
  cols: number,
  rows: number
): number[][] {
  const ctx = sourceCanvas.getContext('2d')!;
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;

  // Determine a reduced sample size for very large images
  const sampleW = Math.min(sw, MAX_SAMPLE_DIM);
  const sampleH = Math.min(sh, MAX_SAMPLE_DIM);

  // Create an offscreen canvas at reduced size
  const offscreen = document.createElement('canvas');
  offscreen.width = sampleW;
  offscreen.height = sampleH;
  const offCtx = offscreen.getContext('2d')!;
  offCtx.drawImage(sourceCanvas, 0, 0, sampleW, sampleH);
  const imgData = offCtx.getImageData(0, 0, sampleW, sampleH);
  const pixels = imgData.data;

  const grid: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      // Map grid position to sample position
      const sx = Math.floor((c / cols) * sampleW);
      const sy = Math.floor((r / rows) * sampleH);
      const idx = (sy * sampleW + sx) * 4;

      const red = pixels[idx];
      const green = pixels[idx + 1];
      const blue = pixels[idx + 2];

      // Perceived luminance (ITU-R BT.709)
      const luma = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      row.push(luma);
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Read the original RGB color at a grid position from the source image.
 */
function sampleColor(
  sourceCanvas: HTMLCanvasElement,
  col: number,
  row: number,
  cols: number,
  rows: number
): string {
  const ctx = sourceCanvas.getContext('2d')!;
  const sx = Math.floor((col / cols) * sourceCanvas.width);
  const sy = Math.floor((row / rows) * sourceCanvas.height);
  const p = ctx.getImageData(sx, sy, 1, 1).data;
  return `rgb(${p[0]},${p[1]},${p[2]})`;
}

// ---------------------------------------------------------------------------
// Stage 2 — Character Grid
// ---------------------------------------------------------------------------

function getCharSet(settings: MatrixSettings): string {
  if (settings.charSet === 'custom') {
    return settings.customChars || 'RETROLAB';
  }
  return MATRIX_CHAR_SETS[settings.charSet] || MATRIX_CHAR_SETS.ascii;
}

function brightnessToChar(brightness: number, charSet: string): string {
  const idx = Math.floor(brightness * (charSet.length - 1));
  return charSet[Math.min(idx, charSet.length - 1)];
}

function buildCharacterGrid(
  brightnessGrid: number[][],
  settings: MatrixSettings,
  sourceCanvas: HTMLCanvasElement,
  cols: number,
  rows: number
): MatrixCell[][] {
  const charSet = getCharSet(settings);
  const grid: MatrixCell[][] = [];

  for (let r = 0; r < rows; r++) {
    const row: MatrixCell[] = [];
    for (let c = 0; c < cols; c++) {
      let b = brightnessGrid[r][c];

      // Apply brightness / contrast adjustments
      if (settings.brightness !== 0) {
        b = Math.min(1, Math.max(0, b + settings.brightness / 100));
      }
      if (settings.contrast !== 0) {
        const factor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
        b = Math.min(1, Math.max(0, factor * (b - 0.5) + 0.5));
      }

      const color =
        settings.colorMode === 'original'
          ? sampleColor(sourceCanvas, c, r, cols, rows)
          : settings.textColor;

      row.push({
        x: c,
        y: r,
        brightness: b,
        char: brightnessToChar(b, charSet),
        color,
      });
    }
    grid.push(row);
  }

  return grid;
}

// ---------------------------------------------------------------------------
// Stage 3 — Column states for falling animation
// ---------------------------------------------------------------------------

function initColumnStates(cols: number, rows: number, speed: number): ColumnState[] {
  const states: ColumnState[] = [];
  for (let c = 0; c < cols; c++) {
    states.push({
      currentRow: -Math.floor(Math.random() * rows),
      speed: 0.5 + Math.random() * speed * 1.5,
      delay: Math.floor(Math.random() * 30),
      trailLength: 5 + Math.floor(Math.random() * 15),
    });
  }
  return states;
}

// ---------------------------------------------------------------------------
// Canvas Renderer
// ---------------------------------------------------------------------------

let _animFrame = 0;
let _columnStates: ColumnState[] | null = null;
let _prevCols = 0;

/**
 * Main render function. Called by RetroLabView's processing pipeline.
 */
export function renderMatrixRain(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  settings: MatrixSettings,
  frameCount: number
): { charGrid: MatrixCell[][] } {
  const cellW = settings.fontSize * (0.4 + settings.density * 0.6);
  const cellH = settings.fontSize * (0.8 + settings.density * 0.4);
  const cols = Math.max(1, Math.floor(width / cellW));
  const rows = Math.max(1, Math.floor(height / cellH));

  // Build brightness + character grids (cached externally for animation perf)
  const brightnessGrid = buildBrightnessGrid(sourceCanvas, cols, rows);
  const charGrid = buildCharacterGrid(brightnessGrid, settings, sourceCanvas, cols, rows);
  const charSet = getCharSet(settings);

  // Init / reset column states if needed
  if (!_columnStates || _prevCols !== cols) {
    _columnStates = initColumnStates(cols, rows, settings.speed);
    _prevCols = cols;
  }

  // Advance animation
  if (settings.animate || settings.fallingMode) {
    _animFrame = frameCount;
  }

  // --- Clear to background ---
  ctx.fillStyle = settings.bgColor;
  ctx.fillRect(0, 0, width, height);

  // --- Render characters ---
  ctx.font = `${settings.fontSize}px "JetBrains Mono", "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = charGrid[r][c];
      const px = c * cellW + cellW / 2;
      const py = r * cellH + cellH / 2;

      let ch = cell.char;
      let alpha = cell.brightness;

      // Character cycling animation
      if (settings.animate && !settings.fallingMode) {
        // Cycle characters based on frame count, offset per cell
        const cycleIdx = (_animFrame + c * 3 + r * 7) % charSet.length;
        // Only cycle if this cell has enough brightness to show
        if (cell.brightness > 0.05) {
          ch = charSet[cycleIdx];
        }
      }

      // Falling mode
      if (settings.fallingMode && _columnStates) {
        const col = _columnStates[c];
        if (_animFrame > col.delay) {
          col.currentRow += col.speed;
          if (col.currentRow > rows + col.trailLength) {
            col.currentRow = -col.trailLength;
          }
        }

        const dist = settings.direction === 'down'
          ? col.currentRow - r
          : r - (rows - col.currentRow);

        if (dist < 0 || dist > col.trailLength) {
          alpha = cell.brightness * 0.08; // Very dim background
        } else if (dist === 0) {
          alpha = 1.0; // Leading character is brightest
          ch = charSet[Math.floor(Math.random() * charSet.length)];
        } else {
          // Trail fades out
          const trailAlpha = 1.0 - dist / col.trailLength;
          alpha = cell.brightness * trailAlpha;
        }
      }

      if (alpha < 0.02) continue; // Skip nearly invisible characters

      ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
      ctx.fillStyle = cell.color;
      ctx.fillText(ch, px, py);
    }
  }

  ctx.globalAlpha = 1;

  return { charGrid };
}

// ---------------------------------------------------------------------------
// TXT Export — from the character grid, NOT the canvas
// ---------------------------------------------------------------------------

/**
 * Export the character grid as plain text.
 * Each row becomes a line. Brightness maps to character density.
 */
export function exportMatrixTXT(charGrid: MatrixCell[][]): string {
  return charGrid.map(row => row.map(cell => cell.char).join('')).join('\n');
}

// ---------------------------------------------------------------------------
// Reset animation state (called when switching effects or images)
// ---------------------------------------------------------------------------

export function resetMatrixAnimation(): void {
  _animFrame = 0;
  _columnStates = null;
  _prevCols = 0;
}
