/**
 * Core interface that every effect renderer should implement.
 * Renderers are responsible for both canvas rendering and exporting.
 */
export interface EffectRenderer {
  /** Render the effect onto a canvas 2D context */
  render(ctx: CanvasRenderingContext2D, sourceCanvas: HTMLCanvasElement, width: number, height: number): void;

  /** Export the current render as SVG markup (only for vector-compatible effects) */
  exportSVG?(width: number, height: number): string;

  /** Export the current render as plain text (only for character-based effects) */
  exportTXT?(width: number, height: number): string;
}

/**
 * Declares what export formats each effect supports.
 * Used to conditionally show export options in the UI.
 */
export interface EffectCapabilities {
  supportsSVG: boolean;
  supportsTXT: boolean;
}

/**
 * Registry of all effects and their export capabilities.
 * The UI reads this to decide which export buttons to show.
 */
export const EFFECT_CAPABILITIES: Record<string, EffectCapabilities> = {
  'dithering':     { supportsSVG: false, supportsTXT: false },
  'ascii':         { supportsSVG: false, supportsTXT: true  },
  'halftone':      { supportsSVG: true,  supportsTXT: false },
  'blockify':      { supportsSVG: false, supportsTXT: false },
  'dots':          { supportsSVG: true,  supportsTXT: false },
  'contour':       { supportsSVG: true,  supportsTXT: false },
  'pixel-sort':    { supportsSVG: false, supportsTXT: false },
  'threshold':     { supportsSVG: false, supportsTXT: false },
  'edge-detection':{ supportsSVG: false, supportsTXT: false },
  'crosshatch':    { supportsSVG: true,  supportsTXT: false },
  'wave-lines':    { supportsSVG: false, supportsTXT: false },
  'noise-field':   { supportsSVG: false, supportsTXT: false },
  'voronoi':       { supportsSVG: true,  supportsTXT: false },
  'vhs':           { supportsSVG: false, supportsTXT: false },
  'matrix-rain':   { supportsSVG: false, supportsTXT: true  },
};
