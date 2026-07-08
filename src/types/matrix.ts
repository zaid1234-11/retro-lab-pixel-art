/**
 * A single cell in the Matrix Rain character grid.
 * Pre-computed from the source image brightness so animation
 * only needs to mutate char/opacity/offset — never re-sample pixels.
 */
export interface MatrixCell {
  /** Grid column index */
  x: number;
  /** Grid row index */
  y: number;
  /** Normalised brightness 0–1 sampled from the source image */
  brightness: number;
  /** The character currently displayed */
  char: string;
  /** RGB color string for this cell */
  color: string;
}

/**
 * Per-column state for the falling rain animation.
 * Each column cascades independently, exactly like the original Matrix effect.
 */
export interface ColumnState {
  /** Current leading row of the falling stream */
  currentRow: number;
  /** Vertical speed in rows-per-frame */
  speed: number;
  /** Number of frames to wait before this column starts falling */
  delay: number;
  /** Trail length behind the leading character */
  trailLength: number;
}

/**
 * All settings for the Matrix Rain effect, stored as a single state object.
 */
export interface MatrixSettings {
  // --- Content ---
  charSet: 'binary' | 'katakana' | 'ascii' | 'hex' | 'custom';
  customChars: string;

  // --- Appearance ---
  fontSize: number;
  density: number;
  textColor: string;
  bgColor: string;
  colorMode: 'mono' | 'original';

  // --- Animation ---
  animate: boolean;
  fallingMode: boolean;
  direction: 'down' | 'up';
  speed: number;

  // --- Image adjustments ---
  brightness: number;
  contrast: number;
}

/**
 * Default settings for a fresh Matrix Rain effect.
 */
export const DEFAULT_MATRIX_SETTINGS: MatrixSettings = {
  charSet: 'katakana',
  customChars: 'RETROLAB',
  fontSize: 12,
  density: 0.5,
  textColor: '#00FF00',
  bgColor: '#000000',
  colorMode: 'mono',
  animate: false,
  fallingMode: false,
  direction: 'down',
  speed: 1.0,
  brightness: 0,
  contrast: 0,
};

/**
 * Character sets available for Matrix Rain rendering.
 */
export const MATRIX_CHAR_SETS: Record<string, string> = {
  binary:   '01',
  katakana: 'ァアィイゥウェエォオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
  ascii:    ' .:-=+*#%@',
  hex:      '0123456789ABCDEF',
};
