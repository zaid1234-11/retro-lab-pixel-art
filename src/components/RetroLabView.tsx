import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Image as ImageIcon, Sliders, Download, RefreshCw, Eye, 
  Settings, Zap, Sparkles, Palette, Check, Info, Tv, FileText, 
  Layers, Sun, Contrast, Type, Move, Heart, RefreshCw as ResetIcon,
  Undo, Redo, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelArt } from '../types';
import { EFFECT_CAPABILITIES } from '../types/effectRenderer';
import { MatrixSettings, DEFAULT_MATRIX_SETTINGS } from '../types/matrix';
import { renderMatrixRain, exportMatrixTXT, resetMatrixAnimation } from '../effects/matrixRainRenderer';
import { downloadTXT, charGridToTXT } from '../exports/txtExporter';
import { downloadSVG, exportDotsSVG, exportHalftoneSVG, exportContourSVG, exportCrosshatchSVG, exportVoronoiSVG } from '../exports/svgExporter';

// Preset sample images for quick testing
const SAMPLE_IMAGES = [
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'nature',
    name: 'Mountain Lake',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'retro-vinyl',
    name: 'Retro Stereo',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'anime-sky',
    name: 'Anime Dream Sky',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'tokyo-alley',
    name: 'Rainy Tokyo Alley',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'retro-deck',
    name: 'Hacker Cyber Deck',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'game-console',
    name: 'Classic Console',
    url: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&w=600&q=80',
  }
];

// Bayer Matrices for Ordered Dithering
const BAYER_2X2 = [
  [0, 2],
  [3, 1]
];

const BAYER_4X4 = [
  [0,  8,  2,  10],
  [12, 4,  14, 6],
  [3,  11, 1,  9],
  [15, 7,  13, 5]
];

const BAYER_8X8 = [
  [0,  48, 12, 60, 3,  51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8,  56, 4,  52, 11, 59, 7,  55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2,  50, 14, 62, 1,  49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6,  54, 9,  57, 5,  53],
  [42, 26, 38, 22, 41, 25, 37, 21]
];

// Predefined Retro Color Palettes
const RETRO_PALETTES = [
  { name: 'GameBoy Green', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
  { name: 'Cyberpunk Neon', colors: ['#03001e', '#7303c0', '#ec38bc', '#fdeff9'] },
  { name: 'CGA Mode 4', colors: ['#000000', '#55ffff', '#ff55ff', '#ffffff'] },
  { name: 'PICO-8', colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8'] },
  { name: 'Classic Amber CRT', colors: ['#000000', '#4d1e00', '#993d00', '#ff8000', '#ffb366'] },
  { name: 'Toxic Matrix', colors: ['#000000', '#002600', '#005900', '#00b300', '#4dff4d'] }
];

// High-impact effect presets for instant "various effects output" previews
const RETRO_PRESETS = [
  {
    name: '1-Bit Macintosh',
    effect: 'dithering',
    algorithm: 'floyd-steinberg',
    colorMode: 'mono',
    foreground: '#FAF6F2',
    background: '#121214',
    intensity: 1.0,
    brightness: 12,
    contrast: 25,
    scanlines: false,
    crtCurve: false,
    phosphor: false,
    chromaticEnabled: false,
    grainEnabled: false,
    description: 'Crisp error diffusion on high-contrast 1-bit mono canvas.'
  },
  {
    name: 'Classic GameBoy',
    effect: 'dithering',
    algorithm: 'bayer-8x8',
    colorMode: 'palette',
    paletteIndex: 0, // GameBoy Green
    intensity: 1.0,
    brightness: 8,
    contrast: 18,
    scanlines: true,
    crtCurve: true,
    phosphor: true,
    chromaticEnabled: false,
    grainEnabled: true,
    description: 'Nostalgic 4-shade green matrix LCD.'
  },
  {
    name: '80s Arcade CRT',
    effect: 'noise-field',
    colorMode: 'full',
    intensity: 0.75,
    brightness: -5,
    contrast: 30,
    scanlines: true,
    crtCurve: true,
    phosphor: true,
    chromaticEnabled: true,
    maxDisplace: 6,
    grainEnabled: true,
    description: 'Curved phosphor CRT with RGB offsets.'
  },
  {
    name: 'Halftone PopArt',
    effect: 'halftone',
    halftoneShape: 'Circle',
    halftoneSpacing: 10,
    halftoneDotScale: 1.2,
    colorMode: 'palette',
    paletteIndex: 2, // CGA Mode 4
    scanlines: false,
    crtCurve: false,
    chromaticEnabled: false,
    description: 'Rotated dot screens in vivid CGA colors.'
  },
  {
    name: 'Digital Glitch Sort',
    effect: 'pixel-sort',
    colorMode: 'full',
    intensity: 0.85,
    brightness: 6,
    contrast: 20,
    chromaticEnabled: true,
    maxDisplace: 9,
    scanlines: true,
    crtCurve: false,
    description: 'Extreme digital sorting & chromatic drifts.'
  },
  {
    name: 'Terminal ASCII',
    effect: 'ascii',
    asciiCharSet: 'STANDARD',
    colorMode: 'palette',
    paletteIndex: 4, // Classic Amber CRT
    asciiColorMode: 'Palette',
    asciiScale: 2,
    scanlines: true,
    crtCurve: true,
    description: 'Vintage phosphor text console.'
  }
];

// Noise Generation Utilities for Noise Field Effect
const valueNoise2D = (x: number, y: number, t: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const u = xf * xf * (3.0 - 2.0 * xf);
  const v = yf * yf * (3.0 - 2.0 * yf);

  const hash = (i: number, j: number) => {
    const val = Math.sin(i * 12.9898 + j * 78.233 + t * 2.14) * 43758.5453123;
    return val - Math.floor(val);
  };

  const n00 = hash(xi, yi);
  const n10 = hash(xi + 1, yi);
  const n01 = hash(xi, yi + 1);
  const n11 = hash(xi + 1, yi + 1);

  const x1 = n00 * (1.0 - u) + n10 * u;
  const x2 = n01 * (1.0 - u) + n11 * u;

  return x1 * (1.0 - v) + x2 * v;
};

const dotGridGradient = (ix: number, iy: number, x: number, y: number, t: number) => {
  const angle = Math.sin(ix * 12.9898 + iy * 78.233 + t * 0.17) * 43758.5453123;
  const gx = Math.cos(angle);
  const gy = Math.sin(angle);

  const dx = x - ix;
  const dy = y - iy;

  return dx * gx + dy * gy;
};

const perlinNoise2D = (x: number, y: number, t: number) => {
  const x0 = Math.floor(x);
  const x1 = x0 + 1;
  const y0 = Math.floor(y);
  const y1 = y0 + 1;

  const sx = x - x0;
  const sy = y - y0;

  const u = sx * sx * sx * (sx * (sx * 6 - 15) + 10);
  const v = sy * sy * sy * (sy * (sy * 6 - 15) + 10);

  const n0 = dotGridGradient(x0, y0, x, y, t);
  const n1 = dotGridGradient(x1, y0, x, y, t);
  const ix0 = n0 * (1 - u) + n1 * u;

  const n2 = dotGridGradient(x0, y1, x, y, t);
  const n3 = dotGridGradient(x1, y1, x, y, t);
  const ix1 = n2 * (1 - u) + n3 * u;

  return ix0 * (1 - v) + ix1 * v;
};

const simplexNoise2D = (x: number, y: number, t: number) => {
  const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  const s = (x + y) * F2;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);

  const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  const t2 = (i + j) * G2;
  const X0 = i - t2;
  const Y0 = j - t2;
  const x0 = x - X0;
  const y0 = y - Y0;

  let i1, j1;
  if (x0 > y0) {
    i1 = 1;
    j1 = 0;
  } else {
    i1 = 0;
    j1 = 1;
  }

  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1.0 + 2.0 * G2;
  const y2 = y0 - 1.0 + 2.0 * G2;

  const hashSimplex = (ix: number, iy: number) => {
    const val = Math.sin(ix * 127.1 + iy * 311.7 + t * 0.3) * 43758.5453123;
    return val - Math.floor(val);
  };

  const getWeightAndGrad = (cx: number, cy: number, pX: number, pY: number) => {
    const t_val = 0.5 - pX * pX - pY * pY;
    if (t_val < 0) return 0;
    const h = hashSimplex(cx, cy) * Math.PI * 2;
    const gx = Math.cos(h);
    const gy = Math.sin(h);
    return Math.pow(t_val, 4) * (pX * gx + pY * gy);
  };

  const n0 = getWeightAndGrad(i, j, x0, y0);
  const n1 = getWeightAndGrad(i + i1, j + j1, x1, y1);
  const n2 = getWeightAndGrad(i + 1, j + 1, x2, y2);

  return 70.0 * (n0 + n1 + n2);
};

const whiteNoise2D = (x: number, y: number, t: number) => {
  const val = Math.sin(x * 12.9898 + y * 78.233 + t * 9.13) * 43758.5453123;
  return (val - Math.floor(val)) * 2.0 - 1.0;
};

const getNoiseValue = (nx: number, ny: number, nt: number, type: string, octaves: number) => {
  let val = 0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let maxValue = 0;

  for (let o = 0; o < octaves; o++) {
    let sample = 0;
    const ox = nx * frequency;
    const oy = ny * frequency;
    const ot = nt * frequency;

    if (type === 'Perlin') {
      sample = perlinNoise2D(ox, oy, ot);
    } else if (type === 'Simplex') {
      sample = simplexNoise2D(ox, oy, ot);
    } else if (type === 'Value') {
      sample = valueNoise2D(ox, oy, ot) * 2.0 - 1.0;
    } else {
      sample = whiteNoise2D(ox, oy, ot);
    }

    val += sample * amplitude;
    maxValue += amplitude;

    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return val / maxValue;
};

const hexToRgbHelper = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
};

const applyEdgeDetectionPipeline = (
  width: number,
  height: number,
  rBuffer: Float32Array,
  gBuffer: Float32Array,
  bBuffer: Float32Array,
  params: {
    edgeAlgorithm: string;
    edgeThreshold: number;
    edgeLineWidth: number;
    edgeInvert: boolean;
    edgeBrightness: number;
    edgeContrast: number;
    edgeColorMode: string;
    edgeColor: string;
    edgeBgColor: string;
  },
  getClosestPaletteColor: (gray: number) => { r: number; g: number; b: number }
): Uint8ClampedArray => {
  const size = width * height;
  const outData = new Uint8ClampedArray(size * 4);
  const {
    edgeAlgorithm,
    edgeThreshold,
    edgeLineWidth,
    edgeInvert,
    edgeBrightness,
    edgeContrast,
    edgeColorMode,
    edgeColor,
    edgeBgColor
  } = params;

  const contrastFactor = (259 * (edgeContrast + 255)) / (255 * (259 - edgeContrast));
  const edgeCol = hexToRgbHelper(edgeColor);
  const edgeBgCol = hexToRgbHelper(edgeBgColor);

  // Pass 1: Compute adjusted grayscale buffer in a single flat array
  const grayBuffer = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    let r = rBuffer[i] + edgeBrightness;
    let g = gBuffer[i] + edgeBrightness;
    let b = bBuffer[i] + edgeBrightness;

    if (edgeContrast !== 0) {
      r = (r - 128) * contrastFactor + 128;
      g = (g - 128) * contrastFactor + 128;
      b = (b - 128) * contrastFactor + 128;
    }

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    grayBuffer[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Pass 2: Edge intensity calculation with safe boundary clamps
  const edgeBuffer = new Float32Array(size);
  const stride = width;

  for (let y = 0; y < height; y++) {
    const yStride = y * stride;
    const prevYStride = Math.max(0, y - 1) * stride;
    const nextYStride = Math.min(height - 1, y + 1) * stride;

    for (let x = 0; x < width; x++) {
      const prevX = Math.max(0, x - 1);
      const nextX = Math.min(width - 1, x + 1);

      // Fetch 3x3 grid directly using optimized strides
      const val00 = grayBuffer[prevYStride + prevX];
      const val01 = grayBuffer[prevYStride + x];
      const val02 = grayBuffer[prevYStride + nextX];
      const val10 = grayBuffer[yStride + prevX];
      const val11 = grayBuffer[yStride + x];
      const val12 = grayBuffer[yStride + nextX];
      const val20 = grayBuffer[nextYStride + prevX];
      const val21 = grayBuffer[nextYStride + x];
      const val22 = grayBuffer[nextYStride + nextX];

      let intensity = 0;
      if (edgeAlgorithm === 'Sobel') {
        const gx = -val00 + val02 - 2 * val10 + 2 * val12 - val20 + val22;
        const gy = -val00 - 2 * val01 - val02 + val20 + 2 * val21 + val22;
        intensity = Math.sqrt(gx * gx + gy * gy) / 4;
      } else if (edgeAlgorithm === 'Prewitt') {
        const gx = -val00 + val02 - val10 + val12 - val20 + val22;
        const gy = -val00 - val01 - val02 + val20 + val21 + val22;
        intensity = Math.sqrt(gx * gx + gy * gy) / 3;
      } else if (edgeAlgorithm === 'Scharr') {
        const gx = -3 * val00 + 3 * val02 - 10 * val10 + 10 * val12 - 3 * val20 + 3 * val22;
        const gy = -3 * val00 - 10 * val01 - 3 * val02 + 3 * val20 + 10 * val21 + 3 * val22;
        intensity = Math.sqrt(gx * gx + gy * gy) / 16;
      } else if (edgeAlgorithm === 'Laplacian') {
        const sum = val00 + val01 + val02 + val10 + val12 + val20 + val21 + val22;
        intensity = Math.abs(sum - 8 * val11) / 8;
      } else if (edgeAlgorithm === 'Roberts Cross') {
        const gx = val11 - val22;
        const gy = val12 - val21;
        intensity = Math.sqrt(gx * gx + gy * gy);
      }

      edgeBuffer[yStride + x] = Math.max(0, Math.min(255, intensity));
    }
  }

  // Pass 3: Dilation (Only if edgeLineWidth > 1)
  let finalEdgeBuffer = edgeBuffer;
  if (edgeLineWidth > 1.0) {
    const dilatedBuffer = new Float32Array(size);
    const radius = Math.max(1, Math.round((edgeLineWidth - 1) / 2));
    
    for (let y = 0; y < height; y++) {
      const yStride = y * stride;
      const minY = Math.max(0, y - radius);
      const maxY = Math.min(height - 1, y + radius);

      for (let x = 0; x < width; x++) {
        const minX = Math.max(0, x - radius);
        const maxX = Math.min(width - 1, x + radius);

        let maxVal = 0;
        for (let py = minY; py <= maxY; py++) {
          const pyStride = py * stride;
          for (let px = minX; px <= maxX; px++) {
            const val = edgeBuffer[pyStride + px];
            if (val > maxVal) maxVal = val;
          }
        }
        dilatedBuffer[yStride + x] = maxVal;
      }
    }
    finalEdgeBuffer = dilatedBuffer;
  }

  // Pass 4: Render colors output buffer
  const threshVal = edgeThreshold * 255;
  for (let i = 0; i < size; i++) {
    const edgeVal = finalEdgeBuffer[i];
    const isEdge = edgeVal >= threshVal;
    const drawEdge = isEdge !== edgeInvert;

    let r = edgeBgCol.r;
    let g = edgeBgCol.g;
    let b = edgeBgCol.b;

    if (drawEdge) {
      if (edgeColorMode === 'Mono') {
        r = edgeCol.r;
        g = edgeCol.g;
        b = edgeCol.b;
      } else if (edgeColorMode === 'Original') {
        r = rBuffer[i];
        g = gBuffer[i];
        b = bBuffer[i];
      } else if (edgeColorMode === 'Palette') {
        const col = getClosestPaletteColor(edgeVal);
        r = col.r;
        g = col.g;
        b = col.b;
      }
    }

    const outIdx = i * 4;
    outData[outIdx] = Math.max(0, Math.min(255, Math.round(r)));
    outData[outIdx+1] = Math.max(0, Math.min(255, Math.round(g)));
    outData[outIdx+2] = Math.max(0, Math.min(255, Math.round(b)));
    outData[outIdx+3] = 255;
  }

  return outData;
};

const applyWaveLinesPipeline = (
  width: number,
  height: number,
  rBuffer: Float32Array,
  gBuffer: Float32Array,
  bBuffer: Float32Array,
  outCtx: CanvasRenderingContext2D,
  params: {
    waveLineCount: number;
    waveAmplitude: number;
    waveFrequency: number;
    waveLineThickness: number;
    waveDirection: string;
    waveAnimate: boolean;
    waveBrightness: number;
    waveContrast: number;
    waveColorMode: string;
    waveLineColor: string;
    waveBgColor: string;
  },
  getClosestPaletteColor: (gray: number) => { r: number; g: number; b: number }
) => {
  const {
    waveLineCount: lines,
    waveAmplitude,
    waveFrequency,
    waveLineThickness,
    waveDirection,
    waveAnimate,
    waveBrightness,
    waveContrast,
    waveColorMode,
    waveLineColor,
    waveBgColor
  } = params;

  outCtx.fillStyle = waveBgColor;
  outCtx.fillRect(0, 0, width, height);

  const stepSize = 2; // high performance step
  const timeOffset = waveAnimate ? (Date.now() / 1000) * 5 * waveFrequency : 0;
  const wContrastFactor = (259 * (waveContrast + 255)) / (255 * (259 - waveContrast));

  const runHorizontal = waveDirection === 'Horizontal';

  if (runHorizontal) {
    for (let i = 0; i < lines; i++) {
      const y_base = (i + 0.5) * (height / lines);

      if (waveColorMode === 'Mono') {
        outCtx.beginPath();
        outCtx.lineWidth = waveLineThickness;
        outCtx.strokeStyle = waveLineColor;
        outCtx.lineCap = 'round';
        outCtx.lineJoin = 'round';

        for (let x = 0; x <= width; x += stepSize) {
          const sampleX = Math.max(0, Math.min(width - 1, x));
          const sampleY = Math.max(0, Math.min(height - 1, Math.round(y_base)));
          const sampleIdx = sampleY * width + sampleX;

          let r = rBuffer[sampleIdx] + waveBrightness;
          let g = gBuffer[sampleIdx] + waveBrightness;
          let b = bBuffer[sampleIdx] + waveBrightness;

          if (waveContrast !== 0) {
            r = (r - 128) * wContrastFactor + 128;
            g = (g - 128) * wContrastFactor + 128;
            b = (b - 128) * wContrastFactor + 128;
          }

          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));

          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const sine = Math.sin(x * waveFrequency * 0.05 + timeOffset);
          const displacement = (sine * waveAmplitude) - ((255 - gray) / 255 * waveAmplitude * 1.5);
          
          const px = x;
          const py = y_base + displacement;

          if (x === 0) outCtx.moveTo(px, py);
          else outCtx.lineTo(px, py);
        }
        outCtx.stroke();
      } else {
        // Multi-colored segment style-batching state machine
        let currentR = 0, currentG = 0, currentB = 0;
        let currentThickness = waveLineThickness;
        let activePath = false;

        for (let x = 0; x <= width; x += stepSize) {
          const sampleX = Math.max(0, Math.min(width - 1, x));
          const sampleY = Math.max(0, Math.min(height - 1, Math.round(y_base)));
          const sampleIdx = sampleY * width + sampleX;

          let r_val = rBuffer[sampleIdx] + waveBrightness;
          let g_val = gBuffer[sampleIdx] + waveBrightness;
          let b_val = bBuffer[sampleIdx] + waveBrightness;

          if (waveContrast !== 0) {
            r_val = (r_val - 128) * wContrastFactor + 128;
            g_val = (g_val - 128) * wContrastFactor + 128;
            b_val = (b_val - 128) * wContrastFactor + 128;
          }

          r_val = Math.max(0, Math.min(255, r_val));
          g_val = Math.max(0, Math.min(255, g_val));
          b_val = Math.max(0, Math.min(255, b_val));

          const gray_val = 0.299 * r_val + 0.587 * g_val + 0.114 * b_val;
          const sine = Math.sin(x * waveFrequency * 0.05 + timeOffset);
          const displacement = (sine * waveAmplitude) - ((255 - gray_val) / 255 * waveAmplitude * 1.5);

          const px = x;
          const py = y_base + displacement;
          const dynamicThickness = waveLineThickness * (1.0 + (255 - gray_val) / 255 * 1.5);

          const colorChanged = Math.abs(r_val - currentR) > 15 || Math.abs(g_val - currentG) > 15 || Math.abs(b_val - currentB) > 15;
          const thicknessChanged = Math.abs(dynamicThickness - currentThickness) > 0.4;

          if (!activePath) {
            outCtx.beginPath();
            outCtx.moveTo(px, py);
            currentR = r_val; currentG = g_val; currentB = b_val;
            currentThickness = dynamicThickness;
            activePath = true;
          } else if (colorChanged || thicknessChanged || x >= width) {
            outCtx.lineTo(px, py);

            let strokeStyle = waveLineColor;
            if (waveColorMode === 'Original') {
              strokeStyle = `rgb(${Math.round(currentR)}, ${Math.round(currentG)}, ${Math.round(currentB)})`;
            } else if (waveColorMode === 'Palette') {
              const palCol = getClosestPaletteColor(0.299 * currentR + 0.587 * currentG + 0.114 * currentB);
              strokeStyle = `rgb(${palCol.r}, ${palCol.g}, ${palCol.b})`;
            }

            outCtx.strokeStyle = strokeStyle;
            outCtx.lineWidth = currentThickness;
            outCtx.lineCap = 'round';
            outCtx.lineJoin = 'round';
            outCtx.stroke();

            outCtx.beginPath();
            outCtx.moveTo(px, py);
            currentR = r_val; currentG = g_val; currentB = b_val;
            currentThickness = dynamicThickness;
          } else {
            outCtx.lineTo(px, py);
          }
        }
      }
    }
  } else {
    // Vertical lines
    for (let i = 0; i < lines; i++) {
      const x_base = (i + 0.5) * (width / lines);

      if (waveColorMode === 'Mono') {
        outCtx.beginPath();
        outCtx.lineWidth = waveLineThickness;
        outCtx.strokeStyle = waveLineColor;
        outCtx.lineCap = 'round';
        outCtx.lineJoin = 'round';

        for (let y = 0; y <= height; y += stepSize) {
          const sampleX = Math.max(0, Math.min(width - 1, Math.round(x_base)));
          const sampleY = Math.max(0, Math.min(height - 1, y));
          const sampleIdx = sampleY * width + sampleX;

          let r = rBuffer[sampleIdx] + waveBrightness;
          let g = gBuffer[sampleIdx] + waveBrightness;
          let b = bBuffer[sampleIdx] + waveBrightness;

          if (waveContrast !== 0) {
            r = (r - 128) * wContrastFactor + 128;
            g = (g - 128) * wContrastFactor + 128;
            b = (b - 128) * wContrastFactor + 128;
          }

          r = Math.max(0, Math.min(255, r));
          g = Math.max(0, Math.min(255, g));
          b = Math.max(0, Math.min(255, b));

          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const sine = Math.sin(y * waveFrequency * 0.05 + timeOffset);
          const displacement = (sine * waveAmplitude) - ((255 - gray) / 255 * waveAmplitude * 1.5);

          const px = x_base + displacement;
          const py = y;

          if (y === 0) outCtx.moveTo(px, py);
          else outCtx.lineTo(px, py);
        }
        outCtx.stroke();
      } else {
        // Multi-colored segment style-batching state machine
        let currentR = 0, currentG = 0, currentB = 0;
        let currentThickness = waveLineThickness;
        let activePath = false;

        for (let y = 0; y <= height; y += stepSize) {
          const sampleX = Math.max(0, Math.min(width - 1, Math.round(x_base)));
          const sampleY = Math.max(0, Math.min(height - 1, y));
          const sampleIdx = sampleY * width + sampleX;

          let r_val = rBuffer[sampleIdx] + waveBrightness;
          let g_val = gBuffer[sampleIdx] + waveBrightness;
          let b_val = bBuffer[sampleIdx] + waveBrightness;

          if (waveContrast !== 0) {
            r_val = (r_val - 128) * wContrastFactor + 128;
            g_val = (g_val - 128) * wContrastFactor + 128;
            b_val = (b_val - 128) * wContrastFactor + 128;
          }

          r_val = Math.max(0, Math.min(255, r_val));
          g_val = Math.max(0, Math.min(255, g_val));
          b_val = Math.max(0, Math.min(255, b_val));

          const gray_val = 0.299 * r_val + 0.587 * g_val + 0.114 * b_val;
          const sine = Math.sin(y * waveFrequency * 0.05 + timeOffset);
          const displacement = (sine * waveAmplitude) - ((255 - gray_val) / 255 * waveAmplitude * 1.5);

          const px = x_base + displacement;
          const py = y;
          const dynamicThickness = waveLineThickness * (1.0 + (255 - gray_val) / 255 * 1.5);

          const colorChanged = Math.abs(r_val - currentR) > 15 || Math.abs(g_val - currentG) > 15 || Math.abs(b_val - currentB) > 15;
          const thicknessChanged = Math.abs(dynamicThickness - currentThickness) > 0.4;

          if (!activePath) {
            outCtx.beginPath();
            outCtx.moveTo(px, py);
            currentR = r_val; currentG = g_val; currentB = b_val;
            currentThickness = dynamicThickness;
            activePath = true;
          } else if (colorChanged || thicknessChanged || y >= height) {
            outCtx.lineTo(px, py);

            let strokeStyle = waveLineColor;
            if (waveColorMode === 'Original') {
              strokeStyle = `rgb(${Math.round(currentR)}, ${Math.round(currentG)}, ${Math.round(currentB)})`;
            } else if (waveColorMode === 'Palette') {
              const palCol = getClosestPaletteColor(0.299 * currentR + 0.587 * currentG + 0.114 * currentB);
              strokeStyle = `rgb(${palCol.r}, ${palCol.g}, ${palCol.b})`;
            }

            outCtx.strokeStyle = strokeStyle;
            outCtx.lineWidth = currentThickness;
            outCtx.lineCap = 'round';
            outCtx.lineJoin = 'round';
            outCtx.stroke();

            outCtx.beginPath();
            outCtx.moveTo(px, py);
            currentR = r_val; currentG = g_val; currentB = b_val;
            currentThickness = dynamicThickness;
          } else {
            outCtx.lineTo(px, py);
          }
        }
      }
    }
  }
};

const applyPixelSortPipeline = (
  width: number,
  height: number,
  rBuffer: Float32Array,
  gBuffer: Float32Array,
  bBuffer: Float32Array,
  outCtx: CanvasRenderingContext2D,
  params: {
    sortDirection: string;
    sortMode: string;
    sortThreshold: number;
    sortStreakLength: number;
    sortIntensity: number;
    sortRandomness: number;
    sortReverse: boolean;
    sortBrightness: number;
    sortContrast: number;
  }
): void => {
  const {
    sortDirection,
    sortMode,
    sortThreshold,
    sortStreakLength,
    sortIntensity,
    sortRandomness,
    sortReverse,
    sortBrightness,
    sortContrast
  } = params;

  const outData = outCtx.createImageData(width, height);
  const out = outData.data;

  const size = width * height;
  const sContrastFactor = (259 * (sortContrast + 255)) / (255 * (259 - sortContrast));

  // Initialize output buffer with adjusted source pixels
  for (let i = 0; i < size; i++) {
    let r = rBuffer[i] + sortBrightness;
    let g = gBuffer[i] + sortBrightness;
    let b = bBuffer[i] + sortBrightness;

    if (sortContrast !== 0) {
      r = (r - 128) * sContrastFactor + 128;
      g = (g - 128) * sContrastFactor + 128;
      b = (b - 128) * sContrastFactor + 128;
    }

    out[i * 4] = Math.min(255, Math.max(0, r));
    out[i * 4 + 1] = Math.min(255, Math.max(0, g));
    out[i * 4 + 2] = Math.min(255, Math.max(0, b));
    out[i * 4 + 3] = 255;
  }

  const getMetricValue = (sr: number, sg: number, sb: number) => {
    if (sortMode === 'Brightness') {
      return 0.299 * sr + 0.587 * sg + 0.114 * sb;
    } else if (sortMode === 'Hue' || sortMode === 'Saturation') {
      const maxVal = Math.max(sr, sg, sb) / 255;
      const minVal = Math.min(sr, sg, sb) / 255;
      const d = maxVal - minVal;
      const l = (maxVal + minVal) / 2;
      if (maxVal === minVal) return 0;
      const s = l > 0.5 ? d / (2 - maxVal - minVal) : d / (maxVal + minVal);
      if (sortMode === 'Saturation') return s * 255;

      let h = 0;
      if (maxVal === sr / 255) h = (sg - sb) / 255 / d + (sg < sb ? 6 : 0);
      else if (maxVal === sg / 255) h = (sb - sr) / 255 / d + 2;
      else if (maxVal === sb / 255) h = (sr - sg) / 255 / d + 4;
      return (h / 6) * 255;
    } else {
      const gr = 0.299 * sr + 0.587 * sg + 0.114 * sb;
      return Math.abs(gr - 128) * 2;
    }
  };

  const thresholdVal = sortThreshold * 255;
  const maxDim = Math.max(width, height);
  const indices = new Int32Array(maxDim);
  const segmentPixels32 = new Uint32Array(maxDim);
  const segmentMetrics = new Float32Array(maxDim);

  const getPixelPacked = (idx: number) => {
    const offset = idx * 4;
    return out[offset] | (out[offset + 1] << 8) | (out[offset + 2] << 16);
  };

  const setPixelPackedAndBlend = (idx: number, packed: number, origR: number, origG: number, origB: number) => {
    const offset = idx * 4;
    const sortedR = packed & 0xFF;
    const sortedG = (packed >> 8) & 0xFF;
    const sortedB = (packed >> 16) & 0xFF;

    if (sortIntensity >= 0.99) {
      out[offset] = sortedR;
      out[offset + 1] = sortedG;
      out[offset + 2] = sortedB;
    } else {
      out[offset] = Math.round(sortedR * sortIntensity + origR * (1 - sortIntensity));
      out[offset + 1] = Math.round(sortedG * sortIntensity + origG * (1 - sortIntensity));
      out[offset + 2] = Math.round(sortedB * sortIntensity + origB * (1 - sortIntensity));
    }
  };

  if (sortDirection === 'Horizontal') {
    for (let y = 0; y < height; y++) {
      let x = 0;
      const yWidth = y * width;
      while (x < width) {
        const idx = yWidth + x;
        const metric = getMetricValue(out[idx * 4], out[idx * 4 + 1], out[idx * 4 + 2]);

        if (metric > thresholdVal) {
          const startX = x;
          let endX = x;
          const randOffset = (Math.random() - 0.5) * sortRandomness * sortStreakLength;
          const currentStreakMax = Math.max(5, Math.round(sortStreakLength + randOffset));

          while (endX < width && endX - startX < currentStreakMax) {
            const checkIdx = yWidth + endX;
            const cMetric = getMetricValue(out[checkIdx * 4], out[checkIdx * 4 + 1], out[checkIdx * 4 + 2]);
            if (cMetric <= thresholdVal) break;
            endX++;
          }

          const len = endX - startX;
          if (len > 1) {
            for (let i = 0; i < len; i++) {
              const sIdx = yWidth + (startX + i);
              const packed = getPixelPacked(sIdx);
              segmentPixels32[i] = packed;
              segmentMetrics[i] = getMetricValue(packed & 0xFF, (packed >> 8) & 0xFF, (packed >> 16) & 0xFF);
              indices[i] = i;
            }

            const activeIndices = indices.subarray(0, len);
            activeIndices.sort((a, b) => {
              return sortReverse ? segmentMetrics[a] - segmentMetrics[b] : segmentMetrics[b] - segmentMetrics[a];
            });

            for (let i = 0; i < len; i++) {
              const sx = startX + i;
              const sIdx = yWidth + sx;
              const sortedPixelPacked = segmentPixels32[activeIndices[i]];

              let origR = rBuffer[sIdx] + sortBrightness;
              let origG = gBuffer[sIdx] + sortBrightness;
              let origB = bBuffer[sIdx] + sortBrightness;

              if (sortContrast !== 0) {
                origR = (origR - 128) * sContrastFactor + 128;
                origG = (origG - 128) * sContrastFactor + 128;
                origB = (origB - 128) * sContrastFactor + 128;
              }

              origR = Math.min(255, Math.max(0, origR));
              origG = Math.min(255, Math.max(0, origG));
              origB = Math.min(255, Math.max(0, origB));

              setPixelPackedAndBlend(sIdx, sortedPixelPacked, origR, origG, origB);
            }
          }
          x = endX;
        } else {
          x++;
        }
      }
    }
  } else {
    // Vertical
    for (let x = 0; x < width; x++) {
      let y = 0;
      while (y < height) {
        const idx = y * width + x;
        const metric = getMetricValue(out[idx * 4], out[idx * 4 + 1], out[idx * 4 + 2]);

        if (metric > thresholdVal) {
          const startY = y;
          let endY = y;
          const randOffset = (Math.random() - 0.5) * sortRandomness * sortStreakLength;
          const currentStreakMax = Math.max(5, Math.round(sortStreakLength + randOffset));

          while (endY < height && endY - startY < currentStreakMax) {
            const checkIdx = endY * width + x;
            const cMetric = getMetricValue(out[checkIdx * 4], out[checkIdx * 4 + 1], out[checkIdx * 4 + 2]);
            if (cMetric <= thresholdVal) break;
            endY++;
          }

          const len = endY - startY;
          if (len > 1) {
            for (let i = 0; i < len; i++) {
              const sIdx = (startY + i) * width + x;
              const packed = getPixelPacked(sIdx);
              segmentPixels32[i] = packed;
              segmentMetrics[i] = getMetricValue(packed & 0xFF, (packed >> 8) & 0xFF, (packed >> 16) & 0xFF);
              indices[i] = i;
            }

            const activeIndices = indices.subarray(0, len);
            activeIndices.sort((a, b) => {
              return sortReverse ? segmentMetrics[a] - segmentMetrics[b] : segmentMetrics[b] - segmentMetrics[a];
            });

            for (let i = 0; i < len; i++) {
              const sy = startY + i;
              const sIdx = sy * width + x;
              const sortedPixelPacked = segmentPixels32[activeIndices[i]];

              let origR = rBuffer[sIdx] + sortBrightness;
              let origG = gBuffer[sIdx] + sortBrightness;
              let origB = bBuffer[sIdx] + sortBrightness;

              if (sortContrast !== 0) {
                origR = (origR - 128) * sContrastFactor + 128;
                origG = (origG - 128) * sContrastFactor + 128;
                origB = (origB - 128) * sContrastFactor + 128;
              }

              origR = Math.min(255, Math.max(0, origR));
              origG = Math.min(255, Math.max(0, origG));
              origB = Math.min(255, Math.max(0, origB));

              setPixelPackedAndBlend(sIdx, sortedPixelPacked, origR, origG, origB);
            }
          }
          y = endY;
        } else {
          y++;
        }
      }
    }
  }

  outCtx.putImageData(outData, 0, 0);
};

export default function RetroLabView() {
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_IMAGES[0].url);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [activeEffect, setActiveEffect] = useState<string>('dithering');
  const [previewMode, setPreviewMode] = useState<string>('processed'); // 'processed' | 'original' | 'split-vertical' | 'split-horizontal'
  const [compareSplit, setCompareSplit] = useState<number>(50); // percentage slider
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // --- CONTROLS STATE ---
  // Dithering Settings
  const [algorithm, setAlgorithm] = useState<string>('bayer-8x8');
  const [intensity, setIntensity] = useState<number>(1.0);
  const [matrixSize, setMatrixSize] = useState<string>('8x8');
  const [modulation, setModulation] = useState<number>(0.5);

  // Adjustments
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [gamma, setGamma] = useState<number>(1.0);
  const [sharpen, setSharpen] = useState<number>(0.0);

  // Color Mode
  const [colorMode, setColorMode] = useState<string>('mono'); // 'mono', 'palette', 'full'
  const [foreground, setForeground] = useState<string>('#FFFFFF');
  const [background, setBackground] = useState<string>('#000000');
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number>(0);

  // Chromatic Effects
  const [chromaticEnabled, setChromaticEnabled] = useState<boolean>(false);
  const [maxDisplace, setMaxDisplace] = useState<number>(4);
  const [redChannelOffset, setRedChannelOffset] = useState<number>(23);
  const [greenChannelOffset, setGreenChannelOffset] = useState<number>(50);
  const [blueChannelOffset, setBlueChannelOffset] = useState<number>(80);

  // Processing Adjustments
  const [invert, setInvert] = useState<boolean>(false);
  const [brightnessMap, setBrightnessMap] = useState<number>(1.0);
  const [edgeEnhance, setEdgeEnhance] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0.0);
  const [quantizeColors, setQuantizeColors] = useState<number>(0);
  const [shapeMatching, setShapeMatching] = useState<number>(0.0);

  // --- ASCII Effect State ---
  const [asciiScale, setAsciiScale] = useState<number>(2);
  const [asciiSpacing, setAsciiSpacing] = useState<number>(0.0);
  const [asciiOutputWidth, setAsciiOutputWidth] = useState<number>(0);
  const [asciiCharSet, setAsciiCharSet] = useState<string>('STANDARD');
  const [asciiColorMode, setAsciiColorMode] = useState<string>('Original');
  const [asciiBgColor, setAsciiBgColor] = useState<string>('#000000');
  const [asciiIntensity, setAsciiIntensity] = useState<number>(1.0);
  const [asciiBrightness, setAsciiBrightness] = useState<number>(0);
  const [asciiContrast, setAsciiContrast] = useState<number>(0);
  const [asciiSaturation, setAsciiSaturation] = useState<number>(0);
  const [asciiHueRotation, setAsciiHueRotation] = useState<number>(0);
  const [asciiSharpness, setAsciiSharpness] = useState<number>(0);
  const [asciiGamma, setAsciiGamma] = useState<number>(1.0);

  // --- Halftone Effect State ---
  const [halftoneShape, setHalftoneShape] = useState<string>('Circle');
  const [halftoneDotScale, setHalftoneDotScale] = useState<number>(1.0);
  const [halftoneSpacing, setHalftoneSpacing] = useState<number>(8);
  const [halftoneAngle, setHalftoneAngle] = useState<number>(45);
  const [halftoneInvert, setHalftoneInvert] = useState<boolean>(false);
  const [halftoneBrightness, setHalftoneBrightness] = useState<number>(0);
  const [halftoneContrast, setHalftoneContrast] = useState<number>(0);
  const [halftoneColorMode, setHalftoneColorMode] = useState<string>('Mono');
  const [halftoneForeground, setHalftoneForeground] = useState<string>('#FFFFFF');
  const [halftoneBackground, setHalftoneBackground] = useState<string>('#000000');

  // --- Blockify Effect State ---
  const [blockifyStyle, setBlockifyStyle] = useState<string>('Full Blocks');
  const [blockifySize, setBlockifySize] = useState<number>(10);
  const [blockifyBorderWidth, setBlockifyBorderWidth] = useState<number>(3.0);
  const [blockifyBrightness, setBlockifyBrightness] = useState<number>(0);
  const [blockifyContrast, setBlockifyContrast] = useState<number>(0);
  const [blockifyColorMode, setBlockifyColorMode] = useState<string>('Preserve Colors');
  const [blockifyBorderColor, setBlockifyBorderColor] = useState<string>('#000000');

  // --- Dots Effect State ---
  const [dotsShape, setDotsShape] = useState<string>('Circle');
  const [dotsGridType, setDotsGridType] = useState<string>('Square Grid');
  const [dotsSize, setDotsSize] = useState<number>(1.0);
  const [dotsSpacing, setDotsSpacing] = useState<number>(1.0);
  const [dotsInvert, setDotsInvert] = useState<boolean>(false);
  const [dotsBrightness, setDotsBrightness] = useState<number>(0);
  const [dotsContrast, setDotsContrast] = useState<number>(0);
  const [dotsColorMode, setDotsColorMode] = useState<string>('Original');

  // --- Contour Effect State ---
  const [contourFillMode, setContourFillMode] = useState<string>('Filled Bands');
  const [contourLevels, setContourLevels] = useState<number>(8);
  const [contourLineThickness, setContourLineThickness] = useState<number>(1.0);
  const [contourInvert, setContourInvert] = useState<boolean>(false);
  const [contourBrightness, setContourBrightness] = useState<number>(0);
  const [contourContrast, setContourContrast] = useState<number>(0);
  const [contourColorMode, setContourColorMode] = useState<string>('Original');

  // --- Pixel Sort Effect State ---
  const [sortDirection, setSortDirection] = useState<string>('Horizontal');
  const [sortMode, setSortMode] = useState<string>('Brightness');
  const [sortThreshold, setSortThreshold] = useState<number>(0.3);
  const [sortStreakLength, setSortStreakLength] = useState<number>(100);
  const [sortIntensity, setSortIntensity] = useState<number>(0.8);
  const [sortRandomness, setSortRandomness] = useState<number>(0.3);
  const [sortReverse, setSortReverse] = useState<boolean>(false);
  const [sortBrightness, setSortBrightness] = useState<number>(0);
  const [sortContrast, setSortContrast] = useState<number>(0);

  // --- Threshold Effect State ---
  const [thresholdLevels, setThresholdLevels] = useState<number>(2);
  const [thresholdPoint, setThresholdPoint] = useState<number>(0.5);
  const [thresholdDither, setThresholdDither] = useState<boolean>(false);
  const [thresholdInvert, setThresholdInvert] = useState<boolean>(false);
  const [thresholdBrightness, setThresholdBrightness] = useState<number>(0);
  const [thresholdContrast, setThresholdContrast] = useState<number>(0);
  const [thresholdColorMode, setThresholdColorMode] = useState<string>('Mono');
  const [thresholdForeground, setThresholdForeground] = useState<string>('#FFFFFF');
  const [thresholdBackground, setThresholdBackground] = useState<string>('#000000');

  // --- Edge Detection Effect State ---
  const [edgeAlgorithm, setEdgeAlgorithm] = useState<string>('Sobel');
  const [edgeThreshold, setEdgeThreshold] = useState<number>(0.3);
  const [edgeLineWidth, setEdgeLineWidth] = useState<number>(1.0);
  const [edgeInvert, setEdgeInvert] = useState<boolean>(false);
  const [edgeBrightness, setEdgeBrightness] = useState<number>(0);
  const [edgeContrast, setEdgeContrast] = useState<number>(0);
  const [edgeColorMode, setEdgeColorMode] = useState<string>('Mono');
  const [edgeColor, setEdgeColor] = useState<string>('#FFFFFF');
  const [edgeBgColor, setEdgeBgColor] = useState<string>('#000000');

  // --- Crosshatch Effect State ---
  const [crosshatchDensity, setCrosshatchDensity] = useState<number>(6);
  const [crosshatchLayers, setCrosshatchLayers] = useState<number>(3);
  const [crosshatchAngle, setCrosshatchAngle] = useState<number>(45);
  const [crosshatchLineWidth, setCrosshatchLineWidth] = useState<number>(0.1);
  const [crosshatchRandomness, setCrosshatchRandomness] = useState<number>(0.0);
  const [crosshatchInvert, setCrosshatchInvert] = useState<boolean>(false);
  const [crosshatchBrightness, setCrosshatchBrightness] = useState<number>(0);
  const [crosshatchContrast, setCrosshatchContrast] = useState<number>(0);
  const [crosshatchLineColor, setCrosshatchLineColor] = useState<string>('#000000');
  const [crosshatchBgColor, setCrosshatchBgColor] = useState<string>('#FFFFFF');

  // --- Wave Lines Effect State ---
  const [waveLineCount, setWaveLineCount] = useState<number>(50);
  const [waveAmplitude, setWaveAmplitude] = useState<number>(20);
  const [waveFrequency, setWaveFrequency] = useState<number>(1.0);
  const [waveLineThickness, setWaveLineThickness] = useState<number>(0.4);
  const [waveDirection, setWaveDirection] = useState<string>('Horizontal');
  const [waveAnimate, setWaveAnimate] = useState<boolean>(false);
  const [waveBrightness, setWaveBrightness] = useState<number>(0);
  const [waveContrast, setWaveContrast] = useState<number>(0);
  const [waveColorMode, setWaveColorMode] = useState<string>('Original');
  const [waveLineColor, setWaveLineColor] = useState<string>('#000000');
  const [waveBgColor, setWaveBgColor] = useState<string>('#FFFFFF');

  // --- Noise Field Effect State ---
  const [noiseType, setNoiseType] = useState<string>('Perlin');
  const [noiseScale, setNoiseScale] = useState<number>(50);
  const [noiseIntensity, setNoiseIntensity] = useState<number>(1.0);
  const [noiseOctaves, setNoiseOctaves] = useState<number>(4);
  const [noiseSpeed, setNoiseSpeed] = useState<number>(1.0);
  const [noiseAnimate, setNoiseAnimate] = useState<boolean>(false);
  const [noiseDistortOnly, setNoiseDistortOnly] = useState<boolean>(false);
  const [noiseBrightness, setNoiseBrightness] = useState<number>(0);
  const [noiseContrast, setNoiseContrast] = useState<number>(0);

  // --- Voronoi Effect State ---
  const [voronoiCellSize, setVoronoiCellSize] = useState<number>(30);
  const [voronoiEdgeWidth, setVoronoiEdgeWidth] = useState<number>(0.3);
  const [voronoiEdgeColor, setVoronoiEdgeColor] = useState<string>('#000000');
  const [voronoiColorMode, setVoronoiColorMode] = useState<string>('Cell Average');
  const [voronoiRandomize, setVoronoiRandomize] = useState<number>(0.8);
  const [voronoiBrightness, setVoronoiBrightness] = useState<number>(0);
  const [voronoiContrast, setVoronoiContrast] = useState<number>(0);

  // --- VHS Effect State ---
  const [vhsDistortion, setVhsDistortion] = useState<number>(0.5);
  const [vhsNoise, setVhsNoise] = useState<number>(0.3);
  const [vhsColorBleed, setVhsColorBleed] = useState<number>(0.5);
  const [vhsScanlines, setVhsScanlines] = useState<number>(0.3);
  const [vhsTrackingError, setVhsTrackingError] = useState<number>(0.2);
  const [vhsBrightness, setVhsBrightness] = useState<number>(0);
  const [vhsContrast, setVhsContrast] = useState<number>(0);

  // Post-Processing Overlays
  const [bloomEnabled, setBloomEnabled] = useState<boolean>(false);
  const [grainEnabled, setGrainEnabled] = useState<boolean>(false);
  const [grainIntensity, setGrainIntensity] = useState<number>(35);
  const [grainSize, setGrainSize] = useState<number>(2);
  const [grainSpeed, setGrainSpeed] = useState<number>(50);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(false);
  const [vignetteEnabled, setVignetteEnabled] = useState<boolean>(false);
  const [crtCurveEnabled, setCrtCurveEnabled] = useState<boolean>(false);
  const [phosphorEnabled, setPhosphorEnabled] = useState<boolean>(false);

  // Export Settings
  const [exportFormat, setExportFormat] = useState<string>('png');
  const [exportScale, setExportScale] = useState<number>(1); // 1x, 2x, 4x, 8x upscaling for crisp pixel rendering

  const [matrixSettings, setMatrixSettings] = useState<MatrixSettings>(DEFAULT_MATRIX_SETTINGS);
  const matrixCharGridRef = useRef<any>(null); // To store the matrix char grid for TXT export
  const asciiCharGridRef = useRef<any>(null); // To store ASCII grid for TXT export
  const matrixFrameCountRef = useRef<number>(0);

  // Canvas Refs
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // --- IMAGE PRELOAD / CACHE SYSTEM ---
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!selectedImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.src = selectedImage;
    img.onload = () => {
      setLoadedImage(img);
      setImageLoaded(true);
    };
  }, [selectedImage]);

  // --- UNDO / REDO HISTORY STACK ---
  const [history, setHistory] = useState<{
    past: any[];
    future: any[];
  }>({ past: [], future: [] });

  const isUndoingRedoingRef = useRef<boolean>(false);
  const lastSavedStateRef = useRef<any>(null);

  const getCurrentState = () => ({
    algorithm, intensity, matrixSize, modulation,
    brightness, contrast, gamma, sharpen,
    colorMode, foreground, background, selectedPaletteIndex,
    chromaticEnabled, maxDisplace, redChannelOffset, greenChannelOffset, blueChannelOffset,
    invert, brightnessMap, edgeEnhance, blur, quantizeColors, shapeMatching,
    asciiScale, asciiSpacing, asciiOutputWidth, asciiCharSet, asciiColorMode, asciiBgColor,
    asciiIntensity, asciiBrightness, asciiContrast, asciiSaturation, asciiHueRotation, asciiSharpness, asciiGamma,
    halftoneShape, halftoneDotScale, halftoneSpacing, halftoneAngle, halftoneInvert, halftoneBrightness, halftoneContrast, halftoneColorMode, halftoneForeground, halftoneBackground,
    blockifyStyle, blockifySize, blockifyBorderWidth, blockifyBrightness, blockifyContrast, blockifyColorMode, blockifyBorderColor,
    dotsShape, dotsGridType, dotsSize, dotsSpacing, dotsInvert, dotsBrightness, dotsContrast, dotsColorMode,
    contourFillMode, contourLevels, contourLineThickness, contourInvert, contourBrightness, contourContrast, contourColorMode,
    sortDirection, sortMode, sortThreshold, sortStreakLength, sortIntensity, sortRandomness, sortReverse, sortBrightness, sortContrast,
    thresholdLevels, thresholdPoint, thresholdDither, thresholdInvert, thresholdBrightness, thresholdContrast, thresholdColorMode, thresholdForeground, thresholdBackground,
    edgeAlgorithm, edgeThreshold, edgeLineWidth, edgeInvert, edgeBrightness, edgeContrast, edgeColorMode, edgeColor, edgeBgColor,
    crosshatchDensity, crosshatchLayers, crosshatchAngle, crosshatchLineWidth, crosshatchRandomness, crosshatchInvert, crosshatchBrightness, crosshatchContrast, crosshatchLineColor, crosshatchBgColor,
    waveLineCount, waveAmplitude, waveFrequency, waveLineThickness, waveDirection, waveAnimate, waveBrightness, waveContrast, waveColorMode, waveLineColor, waveBgColor,
    noiseType, noiseScale, noiseIntensity, noiseOctaves, noiseSpeed, noiseAnimate, noiseDistortOnly, noiseBrightness, noiseContrast,
    voronoiCellSize, voronoiEdgeWidth, voronoiEdgeColor, voronoiColorMode, voronoiRandomize, voronoiBrightness, voronoiContrast,
    vhsDistortion, vhsNoise, vhsColorBleed, vhsScanlines, vhsTrackingError, vhsBrightness, vhsContrast,
    bloomEnabled, grainEnabled, grainIntensity, grainSize, grainSpeed, scanlinesEnabled, vignetteEnabled, crtCurveEnabled, phosphorEnabled,
    activeEffect, matrixSettings
  });

  const restoreState = (state: any) => {
    if (!state) return;
    if (state.algorithm !== undefined) setAlgorithm(state.algorithm);
    if (state.intensity !== undefined) setIntensity(state.intensity);
    if (state.matrixSize !== undefined) setMatrixSize(state.matrixSize);
    if (state.modulation !== undefined) setModulation(state.modulation);
    if (state.brightness !== undefined) setBrightness(state.brightness);
    if (state.contrast !== undefined) setContrast(state.contrast);
    if (state.gamma !== undefined) setGamma(state.gamma);
    if (state.sharpen !== undefined) setSharpen(state.sharpen);
    if (state.colorMode !== undefined) setColorMode(state.colorMode);
    if (state.foreground !== undefined) setForeground(state.foreground);
    if (state.background !== undefined) setBackground(state.background);
    if (state.selectedPaletteIndex !== undefined) setSelectedPaletteIndex(state.selectedPaletteIndex);
    if (state.chromaticEnabled !== undefined) setChromaticEnabled(state.chromaticEnabled);
    if (state.maxDisplace !== undefined) setMaxDisplace(state.maxDisplace);
    if (state.redChannelOffset !== undefined) setRedChannelOffset(state.redChannelOffset);
    if (state.greenChannelOffset !== undefined) setGreenChannelOffset(state.greenChannelOffset);
    if (state.blueChannelOffset !== undefined) setBlueChannelOffset(state.blueChannelOffset);
    if (state.invert !== undefined) setInvert(state.invert);
    if (state.brightnessMap !== undefined) setBrightnessMap(state.brightnessMap);
    if (state.edgeEnhance !== undefined) setEdgeEnhance(state.edgeEnhance);
    if (state.blur !== undefined) setBlur(state.blur);
    if (state.quantizeColors !== undefined) setQuantizeColors(state.quantizeColors);
    if (state.shapeMatching !== undefined) setShapeMatching(state.shapeMatching);
    if (state.asciiScale !== undefined) setAsciiScale(state.asciiScale);
    if (state.asciiSpacing !== undefined) setAsciiSpacing(state.asciiSpacing);
    if (state.asciiOutputWidth !== undefined) setAsciiOutputWidth(state.asciiOutputWidth);
    if (state.asciiCharSet !== undefined) setAsciiCharSet(state.asciiCharSet);
    if (state.asciiColorMode !== undefined) setAsciiColorMode(state.asciiColorMode);
    if (state.asciiBgColor !== undefined) setAsciiBgColor(state.asciiBgColor);
    if (state.asciiIntensity !== undefined) setAsciiIntensity(state.asciiIntensity);
    if (state.asciiBrightness !== undefined) setAsciiBrightness(state.asciiBrightness);
    if (state.asciiContrast !== undefined) setAsciiContrast(state.asciiContrast);
    if (state.asciiSaturation !== undefined) setAsciiSaturation(state.asciiSaturation);
    if (state.asciiHueRotation !== undefined) setAsciiHueRotation(state.asciiHueRotation);
    if (state.asciiSharpness !== undefined) setAsciiSharpness(state.asciiSharpness);
    if (state.asciiGamma !== undefined) setAsciiGamma(state.asciiGamma);
    if (state.halftoneShape !== undefined) setHalftoneShape(state.halftoneShape);
    if (state.halftoneDotScale !== undefined) setHalftoneDotScale(state.halftoneDotScale);
    if (state.halftoneSpacing !== undefined) setHalftoneSpacing(state.halftoneSpacing);
    if (state.halftoneAngle !== undefined) setHalftoneAngle(state.halftoneAngle);
    if (state.halftoneInvert !== undefined) setHalftoneInvert(state.halftoneInvert);
    if (state.halftoneBrightness !== undefined) setHalftoneBrightness(state.halftoneBrightness);
    if (state.halftoneContrast !== undefined) setHalftoneContrast(state.halftoneContrast);
    if (state.halftoneColorMode !== undefined) setHalftoneColorMode(state.halftoneColorMode);
    if (state.halftoneForeground !== undefined) setHalftoneForeground(state.halftoneForeground);
    if (state.halftoneBackground !== undefined) setHalftoneBackground(state.halftoneBackground);
    if (state.blockifyStyle !== undefined) setBlockifyStyle(state.blockifyStyle);
    if (state.blockifySize !== undefined) setBlockifySize(state.blockifySize);
    if (state.blockifyBorderWidth !== undefined) setBlockifyBorderWidth(state.blockifyBorderWidth);
    if (state.blockifyBrightness !== undefined) setBlockifyBrightness(state.blockifyBrightness);
    if (state.blockifyContrast !== undefined) setBlockifyContrast(state.blockifyContrast);
    if (state.blockifyColorMode !== undefined) setBlockifyColorMode(state.blockifyColorMode);
    if (state.blockifyBorderColor !== undefined) setBlockifyBorderColor(state.blockifyBorderColor);
    if (state.dotsShape !== undefined) setDotsShape(state.dotsShape);
    if (state.dotsGridType !== undefined) setDotsGridType(state.dotsGridType);
    if (state.dotsSize !== undefined) setDotsSize(state.dotsSize);
    if (state.dotsSpacing !== undefined) setDotsSpacing(state.dotsSpacing);
    if (state.dotsInvert !== undefined) setDotsInvert(state.dotsInvert);
    if (state.dotsBrightness !== undefined) setDotsBrightness(state.dotsBrightness);
    if (state.dotsContrast !== undefined) setDotsContrast(state.dotsContrast);
    if (state.dotsColorMode !== undefined) setDotsColorMode(state.dotsColorMode);
    if (state.contourFillMode !== undefined) setContourFillMode(state.contourFillMode);
    if (state.contourLevels !== undefined) setContourLevels(state.contourLevels);
    if (state.contourLineThickness !== undefined) setContourLineThickness(state.contourLineThickness);
    if (state.contourInvert !== undefined) setContourInvert(state.contourInvert);
    if (state.contourBrightness !== undefined) setContourBrightness(state.contourBrightness);
    if (state.contourContrast !== undefined) setContourContrast(state.contourContrast);
    if (state.contourColorMode !== undefined) setContourColorMode(state.contourColorMode);
    if (state.sortDirection !== undefined) setSortDirection(state.sortDirection);
    if (state.sortMode !== undefined) setSortMode(state.sortMode);
    if (state.sortThreshold !== undefined) setSortThreshold(state.sortThreshold);
    if (state.sortStreakLength !== undefined) setSortStreakLength(state.sortStreakLength);
    if (state.sortIntensity !== undefined) setSortIntensity(state.sortIntensity);
    if (state.sortRandomness !== undefined) setSortRandomness(state.sortRandomness);
    if (state.sortReverse !== undefined) setSortReverse(state.sortReverse);
    if (state.sortBrightness !== undefined) setSortBrightness(state.sortBrightness);
    if (state.sortContrast !== undefined) setSortContrast(state.sortContrast);
    if (state.thresholdLevels !== undefined) setThresholdLevels(state.thresholdLevels);
    if (state.thresholdPoint !== undefined) setThresholdPoint(state.thresholdPoint);
    if (state.thresholdDither !== undefined) setThresholdDither(state.thresholdDither);
    if (state.thresholdInvert !== undefined) setThresholdInvert(state.thresholdInvert);
    if (state.thresholdBrightness !== undefined) setThresholdBrightness(state.thresholdBrightness);
    if (state.thresholdContrast !== undefined) setThresholdContrast(state.thresholdContrast);
    if (state.thresholdColorMode !== undefined) setThresholdColorMode(state.thresholdColorMode);
    if (state.thresholdForeground !== undefined) setThresholdForeground(state.thresholdForeground);
    if (state.thresholdBackground !== undefined) setThresholdBackground(state.thresholdBackground);
    if (state.edgeAlgorithm !== undefined) setEdgeAlgorithm(state.edgeAlgorithm);
    if (state.edgeThreshold !== undefined) setEdgeThreshold(state.edgeThreshold);
    if (state.edgeLineWidth !== undefined) setEdgeLineWidth(state.edgeLineWidth);
    if (state.edgeInvert !== undefined) setEdgeInvert(state.edgeInvert);
    if (state.edgeBrightness !== undefined) setEdgeBrightness(state.edgeBrightness);
    if (state.edgeContrast !== undefined) setEdgeContrast(state.edgeContrast);
    if (state.edgeColorMode !== undefined) setEdgeColorMode(state.edgeColorMode);
    if (state.edgeColor !== undefined) setEdgeColor(state.edgeColor);
    if (state.edgeBgColor !== undefined) setEdgeBgColor(state.edgeBgColor);
    if (state.crosshatchDensity !== undefined) setCrosshatchDensity(state.crosshatchDensity);
    if (state.crosshatchLayers !== undefined) setCrosshatchLayers(state.crosshatchLayers);
    if (state.crosshatchAngle !== undefined) setCrosshatchAngle(state.crosshatchAngle);
    if (state.crosshatchLineWidth !== undefined) setCrosshatchLineWidth(state.crosshatchLineWidth);
    if (state.crosshatchRandomness !== undefined) setCrosshatchRandomness(state.crosshatchRandomness);
    if (state.crosshatchInvert !== undefined) setCrosshatchInvert(state.crosshatchInvert);
    if (state.crosshatchBrightness !== undefined) setCrosshatchBrightness(state.crosshatchBrightness);
    if (state.crosshatchContrast !== undefined) setCrosshatchContrast(state.crosshatchContrast);
    if (state.crosshatchLineColor !== undefined) setCrosshatchLineColor(state.crosshatchLineColor);
    if (state.crosshatchBgColor !== undefined) setCrosshatchBgColor(state.crosshatchBgColor);
    if (state.waveLineCount !== undefined) setWaveLineCount(state.waveLineCount);
    if (state.waveAmplitude !== undefined) setWaveAmplitude(state.waveAmplitude);
    if (state.waveFrequency !== undefined) setWaveFrequency(state.waveFrequency);
    if (state.waveLineThickness !== undefined) setWaveLineThickness(state.waveLineThickness);
    if (state.waveDirection !== undefined) setWaveDirection(state.waveDirection);
    if (state.waveAnimate !== undefined) setWaveAnimate(state.waveAnimate);
    if (state.waveBrightness !== undefined) setWaveBrightness(state.waveBrightness);
    if (state.waveContrast !== undefined) setWaveContrast(state.waveContrast);
    if (state.waveColorMode !== undefined) setWaveColorMode(state.waveColorMode);
    if (state.waveLineColor !== undefined) setWaveLineColor(state.waveLineColor);
    if (state.waveBgColor !== undefined) setWaveBgColor(state.waveBgColor);
    if (state.noiseType !== undefined) setNoiseType(state.noiseType);
    if (state.noiseScale !== undefined) setNoiseScale(state.noiseScale);
    if (state.noiseIntensity !== undefined) setNoiseIntensity(state.noiseIntensity);
    if (state.noiseOctaves !== undefined) setNoiseOctaves(state.noiseOctaves);
    if (state.noiseSpeed !== undefined) setNoiseSpeed(state.noiseSpeed);
    if (state.noiseAnimate !== undefined) setNoiseAnimate(state.noiseAnimate);
    if (state.noiseDistortOnly !== undefined) setNoiseDistortOnly(state.noiseDistortOnly);
    if (state.noiseBrightness !== undefined) setNoiseBrightness(state.noiseBrightness);
    if (state.noiseContrast !== undefined) setNoiseContrast(state.noiseContrast);
    if (state.voronoiCellSize !== undefined) setVoronoiCellSize(state.voronoiCellSize);
    if (state.voronoiEdgeWidth !== undefined) setVoronoiEdgeWidth(state.voronoiEdgeWidth);
    if (state.voronoiEdgeColor !== undefined) setVoronoiEdgeColor(state.voronoiEdgeColor);
    if (state.voronoiColorMode !== undefined) setVoronoiColorMode(state.voronoiColorMode);
    if (state.voronoiRandomize !== undefined) setVoronoiRandomize(state.voronoiRandomize);
    if (state.voronoiBrightness !== undefined) setVoronoiBrightness(state.voronoiBrightness);
    if (state.voronoiContrast !== undefined) setVoronoiContrast(state.voronoiContrast);
    if (state.vhsDistortion !== undefined) setVhsDistortion(state.vhsDistortion);
    if (state.vhsNoise !== undefined) setVhsNoise(state.vhsNoise);
    if (state.vhsColorBleed !== undefined) setVhsColorBleed(state.vhsColorBleed);
    if (state.vhsScanlines !== undefined) setVhsScanlines(state.vhsScanlines);
    if (state.vhsTrackingError !== undefined) setVhsTrackingError(state.vhsTrackingError);
    if (state.vhsBrightness !== undefined) setVhsBrightness(state.vhsBrightness);
    if (state.vhsContrast !== undefined) setVhsContrast(state.vhsContrast);
    if (state.bloomEnabled !== undefined) setBloomEnabled(state.bloomEnabled);
    if (state.grainEnabled !== undefined) setGrainEnabled(state.grainEnabled);
    if (state.grainIntensity !== undefined) setGrainIntensity(state.grainIntensity);
    if (state.grainSize !== undefined) setGrainSize(state.grainSize);
    if (state.grainSpeed !== undefined) setGrainSpeed(state.grainSpeed);
    if (state.scanlinesEnabled !== undefined) setScanlinesEnabled(state.scanlinesEnabled);
    if (state.vignetteEnabled !== undefined) setVignetteEnabled(state.vignetteEnabled);
    if (state.crtCurveEnabled !== undefined) setCrtCurveEnabled(state.crtCurveEnabled);
    if (state.phosphorEnabled !== undefined) setPhosphorEnabled(state.phosphorEnabled);
    if (state.activeEffect !== undefined) setActiveEffect(state.activeEffect);
    if (state.matrixSettings !== undefined) setMatrixSettings(state.matrixSettings);
  };

  // Push initial state once loadedImage is set
  useEffect(() => {
    if (loadedImage && !lastSavedStateRef.current) {
      const initialState = getCurrentState();
      lastSavedStateRef.current = initialState;
      setHistory({ past: [initialState], future: [] });
    }
  }, [loadedImage]);

  // Debounce state changes and push to history
  useEffect(() => {
    if (isUndoingRedoingRef.current) return;

    const currentState = getCurrentState();

    if (lastSavedStateRef.current) {
      let hasChanged = false;
      for (const key of Object.keys(currentState)) {
        if ((currentState as any)[key] !== lastSavedStateRef.current[key]) {
          hasChanged = true;
          break;
        }
      }
      if (!hasChanged) return;
    }

    const timer = setTimeout(() => {
      const freshState = getCurrentState();
      setHistory(prev => {
        const lastInPast = prev.past[prev.past.length - 1];
        let isDuplicate = true;
        if (lastInPast) {
          for (const key of Object.keys(freshState)) {
            if ((freshState as any)[key] !== lastInPast[key]) {
              isDuplicate = false;
              break;
            }
          }
        } else {
          isDuplicate = false;
        }

        if (isDuplicate) return prev;

        const newPast = [...prev.past, freshState];
        if (newPast.length > 50) {
          newPast.shift();
        }
        lastSavedStateRef.current = freshState;
        return {
          past: newPast,
          future: []
        };
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    algorithm, intensity, matrixSize, modulation,
    brightness, contrast, gamma, sharpen,
    colorMode, foreground, background, selectedPaletteIndex,
    chromaticEnabled, maxDisplace, redChannelOffset, greenChannelOffset, blueChannelOffset,
    invert, brightnessMap, edgeEnhance, blur, quantizeColors, shapeMatching,
    asciiScale, asciiSpacing, asciiOutputWidth, asciiCharSet, asciiColorMode, asciiBgColor,
    asciiIntensity, asciiBrightness, asciiContrast, asciiSaturation, asciiHueRotation, asciiSharpness, asciiGamma,
    halftoneShape, halftoneDotScale, halftoneSpacing, halftoneAngle, halftoneInvert, halftoneBrightness, halftoneContrast, halftoneColorMode, halftoneForeground, halftoneBackground,
    blockifyStyle, blockifySize, blockifyBorderWidth, blockifyBrightness, blockifyContrast, blockifyColorMode, blockifyBorderColor,
    dotsShape, dotsGridType, dotsSize, dotsSpacing, dotsInvert, dotsBrightness, dotsContrast, dotsColorMode,
    contourFillMode, contourLevels, contourLineThickness, contourInvert, contourBrightness, contourContrast, contourColorMode,
    sortDirection, sortMode, sortThreshold, sortStreakLength, sortIntensity, sortRandomness, sortReverse, sortBrightness, sortContrast,
    bloomEnabled, grainEnabled, grainIntensity, grainSize, grainSpeed, scanlinesEnabled, vignetteEnabled, crtCurveEnabled, phosphorEnabled,
    crosshatchDensity, crosshatchLayers, crosshatchAngle, crosshatchLineWidth, crosshatchRandomness, crosshatchInvert, crosshatchBrightness, crosshatchContrast, crosshatchLineColor, crosshatchBgColor,
    waveLineCount, waveAmplitude, waveFrequency, waveLineThickness, waveDirection, waveAnimate, waveBrightness, waveContrast, waveColorMode, waveLineColor, waveBgColor,
    noiseType, noiseScale, noiseIntensity, noiseOctaves, noiseSpeed, noiseAnimate, noiseDistortOnly, noiseBrightness, noiseContrast,
    voronoiCellSize, voronoiEdgeWidth, voronoiEdgeColor, voronoiColorMode, voronoiRandomize, voronoiBrightness, voronoiContrast,
    vhsDistortion, vhsNoise, vhsColorBleed, vhsScanlines, vhsTrackingError, vhsBrightness, vhsContrast,
    activeEffect, matrixSettings
  ]);

  const undo = () => {
    if (history.past.length <= 1) return;
    
    isUndoingRedoingRef.current = true;
    const current = history.past[history.past.length - 1];
    const previous = history.past[history.past.length - 2];

    const newPast = history.past.slice(0, -1);
    const newFuture = [current, ...history.future];

    restoreState(previous);
    lastSavedStateRef.current = previous;

    setHistory({
      past: newPast,
      future: newFuture
    });

    setTimeout(() => {
      isUndoingRedoingRef.current = false;
    }, 50);
  };

  const redo = () => {
    if (history.future.length === 0) return;

    isUndoingRedoingRef.current = true;
    const nextState = history.future[0];
    const newPast = [...history.past, nextState];
    const newFuture = history.future.slice(1);

    restoreState(nextState);
    lastSavedStateRef.current = nextState;

    setHistory({
      past: newPast,
      future: newFuture
    });

    setTimeout(() => {
      isUndoingRedoingRef.current = false;
    }, 50);
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleUndoRedoShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleUndoRedoShortcuts);
    return () => {
      window.removeEventListener('keydown', handleUndoRedoShortcuts);
    };
  }, [history.past, history.future]);

  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isHoveringContainer, setIsHoveringContainer] = useState<boolean>(false);

  // Refs for high-performance slider dragging (bypassing React re-renders)
  const comparePctRef = useRef<number>(50);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const splitDividerRef = useRef<HTMLDivElement>(null);
  const splitHandleRef = useRef<HTMLDivElement>(null);
  const splitTextRef = useRef<HTMLSpanElement>(null);
  const splitInputRef = useRef<HTMLInputElement>(null);

  // Global event listeners to handle smooth dragging when mouse leaves the image container
  useEffect(() => {
    const updateDOM = (pct: number) => {
      comparePctRef.current = pct;
      if (splitContainerRef.current) {
        splitContainerRef.current.style.clipPath = previewMode === 'split-vertical' 
          ? `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`
          : `polygon(0 0, 100% 0, 100% ${pct}%, 0 ${pct}%)`;
      }
      if (splitDividerRef.current) {
        if (previewMode === 'split-vertical') {
          splitDividerRef.current.style.left = `${pct}%`;
          splitDividerRef.current.style.top = '';
        } else {
          splitDividerRef.current.style.top = `${pct}%`;
          splitDividerRef.current.style.left = '';
        }
      }
      if (splitHandleRef.current) {
        if (previewMode === 'split-vertical') {
          splitHandleRef.current.style.left = `${pct}%`;
          splitHandleRef.current.style.top = '50%';
        } else {
          splitHandleRef.current.style.top = `${pct}%`;
          splitHandleRef.current.style.left = '50%';
        }
      }
      if (splitTextRef.current) splitTextRef.current.innerText = `${Math.round(pct)}%`;
      if (splitInputRef.current) splitInputRef.current.value = pct.toString();
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      
      if (previewMode === 'split-vertical') {
        const x = e.clientX - rect.left;
        const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
        updateDOM(pct);
      } else if (previewMode === 'split-horizontal') {
        const y = e.clientY - rect.top;
        const pct = Math.min(100, Math.max(0, (y / rect.height) * 100));
        updateDOM(pct);
      }
    };
    
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isDraggingSplit || !containerRef.current || !e.touches[0]) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      
      if (previewMode === 'split-vertical') {
        const x = touch.clientX - rect.left;
        const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
        updateDOM(pct);
      } else if (previewMode === 'split-horizontal') {
        const y = touch.clientY - rect.top;
        const pct = Math.min(100, Math.max(0, (y / rect.height) * 100));
        updateDOM(pct);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingSplit) {
        setCompareSplit(comparePctRef.current);
        setIsDraggingSplit(false);
      }
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
      window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDraggingSplit, previewMode]);

  const handleContainerMouseDownOrTouch = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!previewMode.startsWith('split') || !containerRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    
    let pct;
    if (previewMode === 'split-vertical') {
      const x = clientX - rect.left;
      pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    } else {
      const y = clientY - rect.top;
      pct = Math.min(100, Math.max(0, (y / rect.height) * 100));
    }
    
    setCompareSplit(pct);
    comparePctRef.current = pct;
    
    // Explicitly update DOM to avoid waiting for state if needed
    if (splitContainerRef.current) {
      splitContainerRef.current.style.clipPath = previewMode === 'split-vertical' 
        ? `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`
        : `polygon(0 0, 100% 0, 100% ${pct}%, 0 ${pct}%)`;
    }
    if (splitDividerRef.current) {
      if (previewMode === 'split-vertical') {
        splitDividerRef.current.style.left = `${pct}%`;
        splitDividerRef.current.style.top = '';
      } else {
        splitDividerRef.current.style.top = `${pct}%`;
        splitDividerRef.current.style.left = '';
      }
    }
    if (splitHandleRef.current) {
      if (previewMode === 'split-vertical') {
        splitHandleRef.current.style.left = `${pct}%`;
        splitHandleRef.current.style.top = '50%';
      } else {
        splitHandleRef.current.style.top = `${pct}%`;
        splitHandleRef.current.style.left = '50%';
      }
    }

    setIsDraggingSplit(true);
  };

  const handleContainerDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewMode.startsWith('split')) return;
    setCompareSplit(50);
    comparePctRef.current = 50;
    
    // Explicitly update DOM
    if (splitContainerRef.current) {
      splitContainerRef.current.style.clipPath = previewMode === 'split-vertical' 
        ? `polygon(0 0, 50% 0, 50% 100%, 0 100%)`
        : `polygon(0 0, 100% 0, 100% 50%, 0 50%)`;
    }
    if (splitDividerRef.current) {
      if (previewMode === 'split-vertical') {
        splitDividerRef.current.style.left = '50%';
        splitDividerRef.current.style.top = '';
      } else {
        splitDividerRef.current.style.top = '50%';
        splitDividerRef.current.style.left = '';
      }
    }
    if (splitHandleRef.current) {
      if (previewMode === 'split-vertical') {
        splitHandleRef.current.style.left = '50%';
        splitHandleRef.current.style.top = '50%';
      } else {
        splitHandleRef.current.style.top = '50%';
        splitHandleRef.current.style.left = '50%';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!previewMode.startsWith('split')) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setCompareSplit(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setCompareSplit(prev => Math.min(100, prev + 1));
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toLowerCase();
      if (key === ' ') {
        e.preventDefault();
        setPreviewMode(prev => prev === 'original' ? 'processed' : 'original');
      } else if (key === 'v') {
        setPreviewMode('split-vertical');
      } else if (key === 'h') {
        setPreviewMode('split-horizontal');
      } else if (key === 'r') {
        if (previewMode.startsWith('split')) {
          setCompareSplit(50);
          comparePctRef.current = 50;
          
          // Explicitly update DOM to snap immediately
          if (splitContainerRef.current) {
            splitContainerRef.current.style.clipPath = previewMode === 'split-vertical' 
              ? `polygon(0 0, 50% 0, 50% 100%, 0 100%)`
              : `polygon(0 0, 100% 0, 100% 50%, 0 50%)`;
          }
          if (splitDividerRef.current) {
            if (previewMode === 'split-vertical') {
              splitDividerRef.current.style.left = '50%';
              splitDividerRef.current.style.top = '';
            } else {
              splitDividerRef.current.style.top = '50%';
              splitDividerRef.current.style.left = '';
            }
          }
          if (splitHandleRef.current) {
            splitHandleRef.current.style.left = '50%';
            splitHandleRef.current.style.top = '50%';
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [previewMode]);

  // Sidebar menus
  const [sidebarExpanded, setSidebarExpanded] = useState<Record<string, boolean>>({
    effects: true,
    dithering: true,
    adjustments: true,
    colorMode: true,
    chromatic: false,
    processing: false,
    postProcessing: false,
    export: true
  });

  const toggleSection = (section: string) => {
    setSidebarExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag-and-drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Utility to convert Hex color to RGB
  const hexToRgb = (hex: string): {r: number, g: number, b: number} => {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  };

  // Reset Adjustments
  const resetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setGamma(1.0);
    setSharpen(0.0);
  };

  // Set precise values for instant retro presets
  const applyEffectPreset = (preset: typeof RETRO_PRESETS[0]) => {
    // We update multiple state variables. The useEffect will automatically re-process.
    setActiveEffect(preset.effect);

    if (preset.algorithm !== undefined) setAlgorithm(preset.algorithm);
    if (preset.intensity !== undefined) setIntensity(preset.intensity);
    if (preset.brightness !== undefined) setBrightness(preset.brightness);
    if (preset.contrast !== undefined) setContrast(preset.contrast);
    if (preset.colorMode !== undefined) setColorMode(preset.colorMode);
    
    if (preset.foreground !== undefined) setForeground(preset.foreground);
    if (preset.background !== undefined) setBackground(preset.background);
    if (preset.paletteIndex !== undefined) setSelectedPaletteIndex(preset.paletteIndex);

    setScanlinesEnabled(!!preset.scanlines);
    setCrtCurveEnabled(!!preset.crtCurve);
    setPhosphorEnabled(!!preset.phosphor);
    setChromaticEnabled(!!preset.chromaticEnabled);
    if (preset.maxDisplace !== undefined) setMaxDisplace(preset.maxDisplace);
    setGrainEnabled(!!preset.grainEnabled);

    // If specific settings exist for ASCII
    if (preset.asciiCharSet !== undefined) setAsciiCharSet(preset.asciiCharSet);
    if (preset.asciiColorMode !== undefined) setAsciiColorMode(preset.asciiColorMode);
    if (preset.asciiScale !== undefined) setAsciiScale(preset.asciiScale);

    // If specific halftone settings
    if (preset.halftoneShape !== undefined) setHalftoneShape(preset.halftoneShape);
    if (preset.halftoneSpacing !== undefined) setHalftoneSpacing(preset.halftoneSpacing);
    if (preset.halftoneDotScale !== undefined) setHalftoneDotScale(preset.halftoneDotScale);
  };

  // Process the image on canvas
  const processImage = () => {
    const srcCanvas = sourceCanvasRef.current;
    const outCanvas = outputCanvasRef.current;
    if (!srcCanvas || !outCanvas || !loadedImage) return;

    const ctx = srcCanvas.getContext('2d');
    const outCtx = outCanvas.getContext('2d');
    if (!ctx || !outCtx) return;

    setIsProcessing(true);

    const img = loadedImage;
    // Set canvas dimension based on image aspect ratio, but constrain to a max size for quick processing
    const maxDimension = 320; // Crisp pixel size
    let width = img.width;
    let height = img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    if (srcCanvas.width !== width || srcCanvas.height !== height) {
      srcCanvas.width = width;
      srcCanvas.height = height;
    }
    if (outCanvas.width !== width || outCanvas.height !== height) {
      outCanvas.width = width;
      outCanvas.height = height;
    }

    // Draw original image to hidden source canvas
    ctx.drawImage(img, 0, 0, width, height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const length = data.length;

      // Prepare an intermediate array for edits and math computations
      const rBuffer = new Float32Array(width * height);
      const gBuffer = new Float32Array(width * height);
      const bBuffer = new Float32Array(width * height);

      // Pre-apply Adjustments (Brightness, Contrast, Gamma, Invert)
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < length; i += 4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        // 1. Invert
        if (invert) {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        // 2. Brightness
        r += brightness;
        g += brightness;
        b += brightness;

        // 3. Contrast
        r = (r - 128) * contrastFactor + 128;
        g = (g - 128) * contrastFactor + 128;
        b = (b - 128) * contrastFactor + 128;

        // 4. Gamma
        if (gamma !== 1.0) {
          r = 255 * Math.pow(Math.max(0, r) / 255, 1 / gamma);
          g = 255 * Math.pow(Math.max(0, g) / 255, 1 / gamma);
          b = 255 * Math.pow(Math.max(0, b) / 255, 1 / gamma);
        }

        // Clip values
        const idx = i / 4;
        rBuffer[idx] = Math.min(255, Math.max(0, r));
        gBuffer[idx] = Math.min(255, Math.max(0, g));
        bBuffer[idx] = Math.min(255, Math.max(0, b));
      }

      // Pre-apply Simple Blur or Edge Enhance convolution if requested
      if (blur > 0) {
        const tempR = new Float32Array(rBuffer);
        const tempG = new Float32Array(gBuffer);
        const tempB = new Float32Array(bBuffer);
        // Simple box blur kernel
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            let sumR = 0, sumG = 0, sumB = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const kidx = (y + ky) * width + (x + kx);
                sumR += tempR[kidx];
                sumG += tempG[kidx];
                sumB += tempB[kidx];
              }
            }
            const currIdx = y * width + x;
            rBuffer[currIdx] = sumR / 9;
            gBuffer[currIdx] = sumG / 9;
            bBuffer[currIdx] = sumB / 9;
          }
        }
      }

      // Colors / Palettes map values
      const fgColor = hexToRgb(foreground);
      const bgColor = hexToRgb(background);
      const currentPalette = RETRO_PALETTES[selectedPaletteIndex].colors.map(hexToRgb);

      // Quantization utility mapping grayscale density
      const getClosestPaletteColor = (gray: number) => {
        // grayscale mapping to palette index
        const pct = Math.min(0.999, Math.max(0, gray / 255));
        const index = Math.floor(pct * currentPalette.length);
        return currentPalette[index];
      };

      // Dithering Algorithms Execution
      if (activeEffect === 'dithering') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        if (algorithm.startsWith('bayer-')) {
          // Bayer Ordered Dithering
          let bayerMatrix = BAYER_8X8;
          let bayerSize = 8;

          if (algorithm === 'bayer-2x2') {
            bayerMatrix = BAYER_2X2;
            bayerSize = 2;
          } else if (algorithm === 'bayer-4x4') {
            bayerMatrix = BAYER_4X4;
            bayerSize = 4;
          }

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const r = rBuffer[idx];
              const g = gBuffer[idx];
              const b = bBuffer[idx];
              
              // grayscale density
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;

              // get Bayer matrix threshold scaled to 0-255
              const threshold = (bayerMatrix[y % bayerSize][x % bayerSize] / (bayerSize * bayerSize)) * 255;
              const modulatedGray = gray + (modulation - 0.5) * 50;

              const outIdx = idx * 4;
              if (colorMode === 'mono') {
                const targetColor = modulatedGray > threshold ? fgColor : bgColor;
                out[outIdx] = targetColor.r;
                out[outIdx+1] = targetColor.g;
                out[outIdx+2] = targetColor.b;
                out[outIdx+3] = 255;
              } else if (colorMode === 'palette') {
                // Find matching palette color using dithered gray density
                const targetColor = getClosestPaletteColor(modulatedGray > threshold ? gray + 40 : gray - 40);
                out[outIdx] = targetColor.r;
                out[outIdx+1] = targetColor.g;
                out[outIdx+2] = targetColor.b;
                out[outIdx+3] = 255;
              } else {
                // Full Color Dithering
                const ditherR = r > threshold ? 255 : 0;
                const ditherG = g > threshold ? 255 : 0;
                const ditherB = b > threshold ? 255 : 0;
                out[outIdx] = ditherR;
                out[outIdx+1] = ditherG;
                out[outIdx+2] = ditherB;
                out[outIdx+3] = 255;
              }
            }
          }
        } else if (algorithm === 'crosshatch') {
          // Crosshatch dither lines drawing
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const r = rBuffer[idx];
              const g = gBuffer[idx];
              const b = bBuffer[idx];
              
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const outIdx = idx * 4;

              let isFilled = false;
              if (gray < 50) {
                // Very dark: Crosshatched lines
                isFilled = (x + y) % 4 === 0 || (x - y) % 4 === 0;
              } else if (gray < 110) {
                // Dark midtone: single diagonals
                isFilled = (x + y) % 4 === 0;
              } else if (gray < 180) {
                // Midtone: scattered dots
                isFilled = (x + y) % 6 === 0 && x % 2 === 0;
              } else {
                // Highlight: blank
                isFilled = false;
              }

              const targetColor = isFilled ? fgColor : bgColor;
              out[outIdx] = targetColor.r;
              out[outIdx+1] = targetColor.g;
              out[outIdx+2] = targetColor.b;
              out[outIdx+3] = 255;
            }
          }
        } else if (algorithm === 'blue-noise') {
          // Custom blue noise distribution threshold generator
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const r = rBuffer[idx];
              const g = gBuffer[idx];
              const b = bBuffer[idx];
              
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const outIdx = idx * 4;

              // Blue noise high-frequency pseudo formula
              const noiseVal = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
              const threshold = (noiseVal + 1) * 127.5;

              const targetColor = gray > threshold ? fgColor : bgColor;
              out[outIdx] = targetColor.r;
              out[outIdx+1] = targetColor.g;
              out[outIdx+2] = targetColor.b;
              out[outIdx+3] = 255;
            }
          }
        } else {
          // ERROR DIFFUSION ALGORITHMS (Floyd-Steinberg, Atkinson, Jarvis-Judice-Ninke, Stucki, Burkes, Sierra, etc.)
          const rError = new Float32Array(rBuffer);
          const gError = new Float32Array(gBuffer);
          const bError = new Float32Array(bBuffer);

          const errorDispersal = (x: number, y: number, errR: number, errG: number, errB: number, weight: number) => {
            if (x >= 0 && x < width && y >= 0 && y < height) {
              const nIdx = y * width + x;
              rError[nIdx] += errR * weight;
              gError[nIdx] += errG * weight;
              bError[nIdx] += errB * weight;
            }
          };

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = y * width + x;
              const outIdx = idx * 4;

              const r = Math.min(255, Math.max(0, rError[idx]));
              const g = Math.min(255, Math.max(0, gError[idx]));
              const b = Math.min(255, Math.max(0, bError[idx]));

              const gray = 0.299 * r + 0.587 * g + 0.114 * b;

              let qR = 0, qG = 0, qB = 0;

              if (colorMode === 'mono') {
                const choice = gray > 127 ? fgColor : bgColor;
                qR = choice.r;
                qG = choice.g;
                qB = choice.b;
              } else if (colorMode === 'palette') {
                const choice = getClosestPaletteColor(gray);
                qR = choice.r;
                qG = choice.g;
                qB = choice.b;
              } else {
                qR = r > 127 ? 255 : 0;
                qG = g > 127 ? 255 : 0;
                qB = b > 127 ? 255 : 0;
              }

              out[outIdx] = qR;
              out[outIdx+1] = qG;
              out[outIdx+2] = qB;
              out[outIdx+3] = 255;

              // Compute error
              const errR = r - qR;
              const errG = g - qG;
              const errB = b - qB;

              // Distribute error based on active diffusion strategy
              if (algorithm === 'floyd-steinberg') {
                errorDispersal(x + 1, y, errR, errG, errB, 7 / 16);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 3 / 16);
                errorDispersal(x, y + 1, errR, errG, errB, 5 / 16);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 1 / 16);
              } else if (algorithm === 'atkinson') {
                errorDispersal(x + 1, y, errR, errG, errB, 1 / 8);
                errorDispersal(x + 2, y, errR, errG, errB, 1 / 8);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 1 / 8);
                errorDispersal(x, y + 1, errR, errG, errB, 1 / 8);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 1 / 8);
                errorDispersal(x, y + 2, errR, errG, errB, 1 / 8);
              } else if (algorithm === 'jarvis-judice-ninke') {
                errorDispersal(x + 1, y, errR, errG, errB, 7 / 48);
                errorDispersal(x + 2, y, errR, errG, errB, 5 / 48);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 3 / 48);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 5 / 48);
                errorDispersal(x, y + 1, errR, errG, errB, 7 / 48);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 5 / 48);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 3 / 48);
                errorDispersal(x - 2, y + 2, errR, errG, errB, 1 / 48);
                errorDispersal(x - 1, y + 2, errR, errG, errB, 3 / 48);
                errorDispersal(x, y + 2, errR, errG, errB, 5 / 48);
                errorDispersal(x + 1, y + 2, errR, errG, errB, 3 / 48);
                errorDispersal(x + 2, y + 2, errR, errG, errB, 1 / 48);
              } else if (algorithm === 'stucki') {
                errorDispersal(x + 1, y, errR, errG, errB, 8 / 42);
                errorDispersal(x + 2, y, errR, errG, errB, 4 / 42);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 2 / 42);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 4 / 42);
                errorDispersal(x, y + 1, errR, errG, errB, 8 / 42);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 4 / 42);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 2 / 42);
                errorDispersal(x - 2, y + 2, errR, errG, errB, 1 / 42);
                errorDispersal(x - 1, y + 2, errR, errG, errB, 2 / 42);
                errorDispersal(x, y + 2, errR, errG, errB, 4 / 42);
                errorDispersal(x + 1, y + 2, errR, errG, errB, 2 / 42);
                errorDispersal(x + 2, y + 2, errR, errG, errB, 1 / 42);
              } else if (algorithm === 'burkes') {
                errorDispersal(x + 1, y, errR, errG, errB, 8 / 32);
                errorDispersal(x + 2, y, errR, errG, errB, 4 / 32);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 2 / 32);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x, y + 1, errR, errG, errB, 8 / 32);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 2 / 32);
              } else if (algorithm === 'sierra') {
                errorDispersal(x + 1, y, errR, errG, errB, 5 / 32);
                errorDispersal(x + 2, y, errR, errG, errB, 3 / 32);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 2 / 32);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x, y + 1, errR, errG, errB, 5 / 32);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 4 / 32);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 2 / 32);
                errorDispersal(x - 1, y + 2, errR, errG, errB, 2 / 32);
                errorDispersal(x, y + 2, errR, errG, errB, 3 / 32);
                errorDispersal(x + 1, y + 2, errR, errG, errB, 2 / 32);
              } else if (algorithm === 'sierra-two-row') {
                errorDispersal(x + 1, y, errR, errG, errB, 4 / 16);
                errorDispersal(x + 2, y, errR, errG, errB, 3 / 16);
                errorDispersal(x - 2, y + 1, errR, errG, errB, 1 / 16);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 2 / 16);
                errorDispersal(x, y + 1, errR, errG, errB, 3 / 16);
                errorDispersal(x + 1, y + 1, errR, errG, errB, 2 / 16);
                errorDispersal(x + 2, y + 1, errR, errG, errB, 1 / 16);
              } else if (algorithm === 'sierra-lite') {
                errorDispersal(x + 1, y, errR, errG, errB, 2 / 4);
                errorDispersal(x - 1, y + 1, errR, errG, errB, 1 / 4);
                errorDispersal(x, y + 1, errR, errG, errB, 1 / 4);
              }
            }
          }
        }

        // Apply Chromatic Aberration Displacement if enabled
        if (chromaticEnabled) {
          const shiftR = maxDisplace;
          const shiftB = -maxDisplace;
          const originalOutput = new Uint8ClampedArray(out);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              
              // Shift Red channel right
              if (x + shiftR < width) {
                const shiftIdx = (y * width + (x + shiftR)) * 4;
                out[shiftIdx] = originalOutput[idx];
              }
              // Shift Blue channel left
              if (x + shiftB >= 0) {
                const shiftIdx = (y * width + (x + shiftB)) * 4;
                out[shiftIdx+2] = originalOutput[idx+2];
              }
            }
          }
        }

        // Put processed output back on the main canvas
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'ascii') {
        // ASCII Canvas Renderer
        outCtx.fillStyle = asciiBgColor;
        outCtx.fillRect(0, 0, width, height);

        const charScale = asciiScale <= 1 ? 6 : asciiScale * 4;
        const spacingX = charScale + asciiSpacing;
        const spacingY = charScale + asciiSpacing + 2;

        outCtx.font = `bold ${charScale}px monospace`;
        outCtx.textAlign = 'left';

        let charList = " .:-=+*#%@";
        if (asciiCharSet === 'BLOCKS') charList = " ░▒▓█";
        else if (asciiCharSet === 'BINARY') charList = "01";
        else if (asciiCharSet === 'DETAILED') charList = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
        else if (asciiCharSet === 'MINIMAL') charList = " .oO@";
        else if (asciiCharSet === 'ALPHABETIC') charList = " abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        else if (asciiCharSet === 'NUMERIC') charList = " 0123456789";
        else if (asciiCharSet === 'MATH') charList = " +-=/X%";
        else if (asciiCharSet === 'SYMBOLS') charList = " !@#$%^&*()_+{}|:<>?[]\\;',./";
        else if (asciiCharSet === 'CUSTOM') charList = "@%#*+=-:. ";

        const currentAsciiGrid: string[][] = [];

        for (let y = 0; y < height; y += spacingY) {
          const gridRow: string[] = [];
          for (let x = 0; x < width; x += spacingX) {
            const rX = Math.floor(x);
            const rY = Math.floor(y);
            if (rX >= width || rY >= height) continue;

            // Sample grid patch
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let sy = 0; sy < spacingY; sy++) {
              for (let sx = 0; sx < spacingX; sx++) {
                const px = rX + sx;
                const py = rY + sy;
                if (px < width && py < height) {
                  const pIdx = py * width + px;
                  sumR += rBuffer[pIdx];
                  sumG += gBuffer[pIdx];
                  sumB += bBuffer[pIdx];
                  count++;
                }
              }
            }
            if (count === 0) continue;

            let avgR = sumR / count;
            let avgG = sumG / count;
            let avgB = sumB / count;

            // Adjustments
            avgR += asciiBrightness;
            avgG += asciiBrightness;
            avgB += asciiBrightness;

            const asciiContrastFactor = (259 * (asciiContrast + 255)) / (255 * (259 - asciiContrast));
            avgR = (avgR - 128) * asciiContrastFactor + 128;
            avgG = (avgG - 128) * asciiContrastFactor + 128;
            avgB = (avgB - 128) * asciiContrastFactor + 128;

            if (asciiGamma !== 1.0) {
              avgR = 255 * Math.pow(Math.max(0, avgR) / 255, 1 / asciiGamma);
              avgG = 255 * Math.pow(Math.max(0, avgG) / 255, 1 / asciiGamma);
              avgB = 255 * Math.pow(Math.max(0, avgB) / 255, 1 / asciiGamma);
            }

            avgR = Math.min(255, Math.max(0, avgR));
            avgG = Math.min(255, Math.max(0, avgG));
            avgB = Math.min(255, Math.max(0, avgB));

            const gray = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
            const charIndex = Math.floor((gray / 255) * (charList.length - 1));
            const char = charList[charIndex] || ' ';
            gridRow.push(char);

            let charColor = `rgb(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`;
            if (asciiColorMode === 'Mono') {
              charColor = foreground;
            } else if (asciiColorMode === 'Palette') {
              const col = getClosestPaletteColor(gray);
              charColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
            }

            outCtx.fillStyle = charColor;
            outCtx.fillText(char, x, y + charScale);
          }
          currentAsciiGrid.push(gridRow);
        }
        asciiCharGridRef.current = currentAsciiGrid;
      } else if (activeEffect === 'halftone') {
        // Halftone Grid Screen Renderer
        outCtx.fillStyle = halftoneBackground;
        outCtx.fillRect(0, 0, width, height);

        outCtx.save();
        outCtx.translate(width / 2, height / 2);
        outCtx.rotate((halftoneAngle * Math.PI) / 180);

        const diagonal = Math.ceil(Math.sqrt(width * width + height * height));
        const gridStart = -diagonal / 2;
        const gridEnd = diagonal / 2;
        const spacing = Math.max(4, halftoneSpacing);
        const maxRadius = (spacing / 2) * halftoneDotScale;

        for (let gy = gridStart; gy < gridEnd; gy += spacing) {
          for (let gx = gridStart; gx < gridEnd; gx += spacing) {
            // Un-rotate to find sample position in original image buffer
            const rad = (halftoneAngle * Math.PI) / 180;
            const origX = Math.round(gx * Math.cos(-rad) - gy * Math.sin(-rad) + width / 2);
            const origY = Math.round(gx * Math.sin(-rad) + gy * Math.cos(-rad) + height / 2);

            if (origX >= 0 && origX < width && origY >= 0 && origY < height) {
              const idx = origY * width + origX;
              let r = rBuffer[idx];
              let g = gBuffer[idx];
              let b = bBuffer[idx];

              r += halftoneBrightness;
              g += halftoneBrightness;
              b += halftoneBrightness;

              const hContrastFactor = (259 * (halftoneContrast + 255)) / (255 * (259 - halftoneContrast));
              r = (r - 128) * hContrastFactor + 128;
              g = (g - 128) * hContrastFactor + 128;
              b = (b - 128) * hContrastFactor + 128;

              r = Math.min(255, Math.max(0, r));
              g = Math.min(255, Math.max(0, g));
              b = Math.min(255, Math.max(0, b));

              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const intensityVal = halftoneInvert ? gray / 255 : (255 - gray) / 255;
              const radius = maxRadius * intensityVal;

              if (radius > 0.1) {
                let dotColor = halftoneForeground;
                if (halftoneColorMode === 'Original') {
                  dotColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
                } else if (halftoneColorMode === 'Palette') {
                  const col = getClosestPaletteColor(gray);
                  dotColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
                }

                outCtx.fillStyle = dotColor;
                outCtx.beginPath();
                if (halftoneShape === 'Square') {
                  outCtx.rect(gx - radius, gy - radius, radius * 2, radius * 2);
                } else {
                  outCtx.arc(gx, gy, radius, 0, Math.PI * 2);
                }
                outCtx.fill();
              }
            }
          }
        }
        outCtx.restore();
      } else if (activeEffect === 'blockify') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const size = Math.max(2, Math.round(blockifySize));
        const borderWidth = Math.max(0, blockifyBorderWidth);
        const bContrastFactor = (259 * (blockifyContrast + 255)) / (255 * (259 - blockifyContrast));
        const borderCol = hexToRgb(blockifyBorderColor);

        for (let by = 0; by < height; by += size) {
          for (let bx = 0; bx < width; bx += size) {
            // Calculate average color for this block
            let sumR = 0, sumG = 0, sumB = 0, count = 0;
            for (let dy = 0; dy < size; dy++) {
              for (let dx = 0; dx < size; dx++) {
                const px = bx + dx;
                const py = by + dy;
                if (px < width && py < height) {
                  const pIdx = py * width + px;
                  sumR += rBuffer[pIdx];
                  sumG += gBuffer[pIdx];
                  sumB += bBuffer[pIdx];
                  count++;
                }
              }
            }

            if (count === 0) continue;

            let avgR = sumR / count;
            let avgG = sumG / count;
            let avgB = sumB / count;

            // Apply blockify brightness adjustment
            avgR += blockifyBrightness;
            avgG += blockifyBrightness;
            avgB += blockifyBrightness;

            // Apply blockify contrast adjustment
            avgR = (avgR - 128) * bContrastFactor + 128;
            avgG = (avgG - 128) * bContrastFactor + 128;
            avgB = (avgB - 128) * bContrastFactor + 128;

            avgR = Math.min(255, Math.max(0, avgR));
            avgG = Math.min(255, Math.max(0, avgG));
            avgB = Math.min(255, Math.max(0, avgB));

            // Apply color mode mapping
            let finalR = avgR;
            let finalG = avgG;
            let finalB = avgB;

            const gray = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;

            if (blockifyColorMode === 'Mono') {
              const targetColor = gray > 127 ? fgColor : bgColor;
              finalR = targetColor.r;
              finalG = targetColor.g;
              finalB = targetColor.b;
            } else if (blockifyColorMode === 'Palette') {
              const targetColor = getClosestPaletteColor(gray);
              finalR = targetColor.r;
              finalG = targetColor.g;
              finalB = targetColor.b;
            }

            // Fill pixels for the block
            for (let dy = 0; dy < size; dy++) {
              for (let dx = 0; dx < size; dx++) {
                const px = bx + dx;
                const py = by + dy;
                if (px < width && py < height) {
                  const pIdx = (py * width + px) * 4;

                  // Check if this pixel is part of the border
                  // Border width determines spacing from block edges
                  const isBorder = (borderWidth > 0) && (
                    dx < borderWidth || 
                    dy < borderWidth || 
                    (size - dx - 1) < borderWidth || 
                    (size - dy - 1) < borderWidth
                  );

                  let r = finalR;
                  let g = finalG;
                  let b = finalB;

                  if (isBorder) {
                    r = borderCol.r;
                    g = borderCol.g;
                    b = borderCol.b;
                  } else if (blockifyStyle === 'Beveled Blocks') {
                    // Beveled blocks style: lighter top/left, darker bottom/right
                    const topOrLeft = (dx === Math.floor(borderWidth)) || (dy === Math.floor(borderWidth));
                    const bottomOrRight = (dx === size - 1 - Math.floor(borderWidth)) || (dy === size - 1 - Math.floor(borderWidth));
                    if (topOrLeft) {
                      r = Math.min(255, r + 40);
                      g = Math.min(255, g + 40);
                      b = Math.min(255, b + 40);
                    } else if (bottomOrRight) {
                      r = Math.max(0, r - 40);
                      g = Math.max(0, g - 40);
                      b = Math.max(0, b - 40);
                    }
                  } else if (blockifyStyle === 'Rounded Blocks') {
                    // Rounded blocks: skip the corners of the block inside the border
                    const insetX = dx - borderWidth;
                    const insetY = dy - borderWidth;
                    const innerSize = size - 2 * borderWidth;
                    const isCorner = (
                      (insetX < 1 && insetY < 1) ||
                      (insetX < 1 && insetY >= innerSize - 1) ||
                      (insetX >= innerSize - 1 && insetY < 1) ||
                      (insetX >= innerSize - 1 && insetY >= innerSize - 1)
                    );
                    if (isCorner && innerSize > 2) {
                      r = borderCol.r;
                      g = borderCol.g;
                      b = borderCol.b;
                    }
                  } else if (blockifyStyle === 'Grid Blocks') {
                    // Grid blocks: draw a dot or grid cell
                    const centerX = Math.floor(size / 2);
                    const centerY = Math.floor(size / 2);
                    const dist = Math.sqrt((dx - centerX) ** 2 + (dy - centerY) ** 2);
                    if (dist > (size / 2) - borderWidth) {
                      r = borderCol.r;
                      g = borderCol.g;
                      b = borderCol.b;
                    }
                  }

                  out[pIdx] = r;
                  out[pIdx+1] = g;
                  out[pIdx+2] = b;
                  out[pIdx+3] = 255;
                }
              }
            }
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'threshold') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const levels = Math.max(2, thresholdLevels);
        const contrastFactor = (259 * (thresholdContrast + 255)) / (255 * (259 - thresholdContrast));
        const fgCol = hexToRgb(thresholdForeground);
        const bgCol = hexToRgb(thresholdBackground);

        const bayer4x4 = [
          [0, 8, 2, 10],
          [12, 4, 14, 6],
          [3, 11, 1, 9],
          [15, 7, 13, 5]
        ];

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const pIdx = idx * 4;

            const origR = rBuffer[idx];
            const origG = gBuffer[idx];
            const origB = bBuffer[idx];

            let gray = 0.299 * origR + 0.587 * origG + 0.114 * origB;

            // Apply Brightness
            gray += thresholdBrightness;

            // Apply Contrast
            gray = (gray - 128) * contrastFactor + 128;
            gray = Math.max(0, Math.min(255, gray));

            // Apply Dither
            if (thresholdDither) {
              const ditherVal = ((bayer4x4[y % 4][x % 4] / 16) - 0.5) * (255 / (levels - 1));
              gray += ditherVal;
              gray = Math.max(0, Math.min(255, gray));
            }

            let norm = gray / 255;

            // Adjust based on Threshold Point
            if (thresholdPoint > 0 && thresholdPoint < 1) {
              if (norm < thresholdPoint) {
                norm = (norm / thresholdPoint) * 0.5;
              } else {
                norm = 0.5 + ((norm - thresholdPoint) / (1 - thresholdPoint)) * 0.5;
              }
            } else if (thresholdPoint === 0) {
              norm = 1.0;
            } else if (thresholdPoint === 1) {
              norm = 0.0;
            }

            // Quantize
            const levelIndex = Math.round(norm * (levels - 1));
            let finalGray = (levelIndex / (levels - 1)) * 255;

            if (thresholdInvert) {
              finalGray = 255 - finalGray;
            }

            let r = finalGray;
            let g = finalGray;
            let b = finalGray;

            if (thresholdColorMode === 'Mono') {
              const ratio = finalGray / 255;
              r = bgCol.r + (fgCol.r - bgCol.r) * ratio;
              g = bgCol.g + (fgCol.g - bgCol.g) * ratio;
              b = bgCol.b + (fgCol.b - bgCol.b) * ratio;
            } else if (thresholdColorMode === 'Original') {
              const ratio = finalGray / 255;
              r = origR * ratio;
              g = origG * ratio;
              b = origB * ratio;
            } else if (thresholdColorMode === 'Palette') {
              const col = getClosestPaletteColor(finalGray);
              r = col.r;
              g = col.g;
              b = col.b;
            }

            out[pIdx] = Math.max(0, Math.min(255, Math.round(r)));
            out[pIdx+1] = Math.max(0, Math.min(255, Math.round(g)));
            out[pIdx+2] = Math.max(0, Math.min(255, Math.round(b)));
            out[pIdx+3] = 255;
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'edge-detection') {
        const outDataArray = applyEdgeDetectionPipeline(width, height, rBuffer, gBuffer, bBuffer, {
          edgeAlgorithm,
          edgeThreshold,
          edgeLineWidth,
          edgeInvert,
          edgeBrightness,
          edgeContrast,
          edgeColorMode,
          edgeColor,
          edgeBgColor
        }, getClosestPaletteColor);

        const outData = outCtx.createImageData(width, height);
        outData.data.set(outDataArray);
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'crosshatch') {
        const layers = Math.min(5, Math.max(1, crosshatchLayers));
        const spacing = Math.max(3, 100 / crosshatchDensity);
        const baseAngleDeg = crosshatchAngle;
        const contrastFactor = (259 * (crosshatchContrast + 255)) / (255 * (259 - crosshatchContrast));

        // Fill canvas with background first
        outCtx.fillStyle = crosshatchBgColor;
        outCtx.fillRect(0, 0, width, height);

        // Set up stroke properties
        outCtx.strokeStyle = crosshatchLineColor;
        outCtx.lineWidth = crosshatchLineWidth;
        outCtx.lineCap = 'round';

        const thresholds = [0.8, 0.6, 0.4, 0.25, 0.12];

        for (let i = 0; i < layers; i++) {
          let angleDeg = baseAngleDeg;
          if (i === 1) angleDeg += 90;
          else if (i === 2) angleDeg += 45;
          else if (i === 3) angleDeg -= 45;
          else if (i === 4) angleDeg += 30;

          let angleRad = (angleDeg * Math.PI) / 180;
          angleRad += 0.0001; // Avoid exact 0, 90, 180 degree issues

          const S = Math.sin(angleRad);
          const C = Math.cos(angleRad);

          // Project corners to find offset range
          const proj0 = 0;
          const proj1 = -width * S;
          const proj2 = height * C;
          const proj3 = -width * S + height * C;

          const minProj = Math.min(proj0, proj1, proj2, proj3);
          const maxProj = Math.max(proj0, proj1, proj2, proj3);

          for (let offset = minProj; offset <= maxProj; offset += spacing) {
            const pts: {x: number, y: number}[] = [];
            if (Math.abs(C) > 0.0001) {
              const y1 = offset / C;
              if (y1 >= 0 && y1 <= height) pts.push({ x: 0, y: y1 });
              const y2 = (offset + width * S) / C;
              if (y2 >= 0 && y2 <= height) pts.push({ x: width, y: y2 });
            }
            if (Math.abs(S) > 0.0001) {
              const x1 = -offset / S;
              if (x1 >= 0 && x1 <= width) pts.push({ x: x1, y: 0 });
              const x2 = (height * C - offset) / S;
              if (x2 >= 0 && x2 <= width) pts.push({ x: x2, y: height });
            }

            // Filter duplicates
            const uniquePts: {x: number, y: number}[] = [];
            for (const p of pts) {
              if (!uniquePts.some(up => Math.hypot(up.x - p.x, up.y - p.y) < 0.1)) {
                uniquePts.push(p);
              }
            }

            if (uniquePts.length === 2) {
              const P_start = uniquePts[0];
              const P_end = uniquePts[1];

              const dx = P_end.x - P_start.x;
              const dy = P_end.y - P_start.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len < 1) continue;

              const stepSize = 3;
              const numSteps = Math.ceil(len / stepSize);

              outCtx.beginPath();
              let drawing = false;

              for (let k = 0; k < numSteps; k++) {
                const t = k / numSteps;
                let px = P_start.x + dx * t;
                let py = P_start.y + dy * t;

                // Add jitter/randomness if needed
                if (crosshatchRandomness > 0) {
                  const nx = -dy / len;
                  const ny = dx / len;
                  const jitter = (Math.random() - 0.5) * crosshatchRandomness * spacing * 0.4;
                  px += nx * jitter;
                  py += ny * jitter;
                }

                const sX = Math.max(0, Math.min(width - 1, Math.round(px)));
                const sY = Math.max(0, Math.min(height - 1, Math.round(py)));
                const sIdx = sY * width + sX;

                let pr = rBuffer[sIdx] + crosshatchBrightness;
                let pg = gBuffer[sIdx] + crosshatchBrightness;
                let pb = bBuffer[sIdx] + crosshatchBrightness;

                pr = (pr - 128) * contrastFactor + 128;
                pg = (pg - 128) * contrastFactor + 128;
                pb = (pb - 128) * contrastFactor + 128;

                let gray = 0.299 * pr + 0.587 * pg + 0.114 * pb;
                gray = Math.max(0, Math.min(255, gray));

                if (crosshatchInvert) {
                  gray = 255 - gray;
                }

                const normGray = gray / 255;
                const thresh = thresholds[i % 5];

                let shouldDraw = normGray < thresh;
                if (crosshatchRandomness > 0 && Math.random() < crosshatchRandomness * 0.15) {
                  shouldDraw = false;
                }

                if (shouldDraw) {
                  if (!drawing) {
                    outCtx.moveTo(px, py);
                    drawing = true;
                  } else {
                    outCtx.lineTo(px, py);
                  }
                } else {
                  if (drawing) {
                    outCtx.stroke();
                    outCtx.beginPath();
                    drawing = false;
                  }
                }
              }
              if (drawing) {
                outCtx.stroke();
              }
            }
          }
        }
      } else if (activeEffect === 'wave-lines') {
        applyWaveLinesPipeline(width, height, rBuffer, gBuffer, bBuffer, outCtx, {
          waveLineCount,
          waveAmplitude,
          waveFrequency,
          waveLineThickness,
          waveDirection,
          waveAnimate,
          waveBrightness,
          waveContrast,
          waveColorMode,
          waveLineColor,
          waveBgColor
        }, getClosestPaletteColor);
      } else if (activeEffect === 'noise-field') {
        // --- Noise Field Effect ---
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const timeOffset = noiseAnimate ? (Date.now() / 1000) * 0.5 * noiseSpeed : 0;
        const scaleVal = noiseScale > 0 ? noiseScale : 50;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;

            // Generate noise value in range [-1, 1]
            const nx = x / scaleVal;
            const ny = y / scaleVal;
            const noiseVal = getNoiseValue(nx, ny, timeOffset, noiseType, noiseOctaves);

            let targetX = x;
            let targetY = y;

            if (noiseDistortOnly) {
              // Displacement vectors based on noise
              const angle = (noiseVal + 1.0) * Math.PI; // Map [-1,1] to [0, 2PI]
              const displacement = noiseIntensity * 25; // Displacement up to 25px
              const dx = Math.cos(angle) * displacement;
              const dy = Math.sin(angle) * displacement;

              targetX = Math.max(0, Math.min(width - 1, Math.round(x + dx)));
              targetY = Math.max(0, Math.min(height - 1, Math.round(y + dy)));

              const sampleIdx = targetY * width + targetX;

              let r = rBuffer[sampleIdx] + noiseBrightness;
              let g = gBuffer[sampleIdx] + noiseBrightness;
              let b = bBuffer[sampleIdx] + noiseBrightness;

              const nContrastFactor = (259 * (noiseContrast + 255)) / (255 * (259 - noiseContrast));
              r = (r - 128) * nContrastFactor + 128;
              g = (g - 128) * nContrastFactor + 128;
              b = (b - 128) * nContrastFactor + 128;

              r = Math.max(0, Math.min(255, r));
              g = Math.max(0, Math.min(255, g));
              b = Math.max(0, Math.min(255, b));

              const outIdx = idx * 4;
              out[outIdx] = r;
              out[outIdx+1] = g;
              out[outIdx+2] = b;
              out[outIdx+3] = 255;
            } else {
              // Blend original image color with noise color
              let origR = rBuffer[idx];
              let origG = gBuffer[idx];
              let origB = bBuffer[idx];

              // Add noise flavor
              let r = origR + noiseBrightness + (noiseVal * noiseIntensity * 50);
              let g = origG + noiseBrightness + (noiseVal * noiseIntensity * 50);
              let b = origB + noiseBrightness + (noiseVal * noiseIntensity * 50);

              const nContrastFactor = (259 * (noiseContrast + 255)) / (255 * (259 - noiseContrast));
              r = (r - 128) * nContrastFactor + 128;
              g = (g - 128) * nContrastFactor + 128;
              b = (b - 128) * nContrastFactor + 128;

              r = Math.max(0, Math.min(255, r));
              g = Math.max(0, Math.min(255, g));
              b = Math.max(0, Math.min(255, b));

              const outIdx = idx * 4;
              out[outIdx] = r;
              out[outIdx+1] = g;
              out[outIdx+2] = b;
              out[outIdx+3] = 255;
            }
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'dots') {
        // Digital Dot-Screen Screen Shader
        outCtx.fillStyle = background;
        outCtx.fillRect(0, 0, width, height);

        const spacing = Math.max(4, dotsSpacing);
        const maxRadius = (spacing / 2) * dotsSize;

        for (let y = 0; y < height + spacing; y += spacing) {
          for (let x = 0; x < width + spacing; x += spacing) {
            let drawX = x;
            if (dotsGridType === 'Isometric Grid' && (Math.floor(y / spacing) % 2 === 1)) {
              drawX += spacing / 2;
            }

            const sampleX = Math.min(width - 1, Math.max(0, Math.floor(drawX)));
            const sampleY = Math.min(height - 1, Math.max(0, Math.floor(y)));
            const idx = sampleY * width + sampleX;

            let r = rBuffer[idx];
            let g = gBuffer[idx];
            let b = bBuffer[idx];

            r += dotsBrightness;
            g += dotsBrightness;
            b += dotsBrightness;

            const dContrastFactor = (259 * (dotsContrast + 255)) / (255 * (259 - dotsContrast));
            r = (r - 128) * dContrastFactor + 128;
            g = (g - 128) * dContrastFactor + 128;
            b = (b - 128) * dContrastFactor + 128;

            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const intensityVal = dotsInvert ? gray / 255 : (255 - gray) / 255;
            const radius = maxRadius * intensityVal;

            if (radius > 0.1) {
              let dotColor = foreground;
              if (dotsColorMode === 'Original') {
                dotColor = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
              } else if (dotsColorMode === 'Palette') {
                const col = getClosestPaletteColor(gray);
                dotColor = `rgb(${col.r}, ${col.g}, ${col.b})`;
              }

              outCtx.fillStyle = dotColor;
              outCtx.beginPath();
              if (dotsShape === 'Square') {
                outCtx.rect(drawX - radius, y - radius, radius * 2, radius * 2);
              } else if (dotsShape === 'Hexagon') {
                outCtx.moveTo(drawX + radius, y);
                for (let side = 1; side <= 6; side++) {
                  const angle = (side * Math.PI) / 3;
                  outCtx.lineTo(drawX + radius * Math.cos(angle), y + radius * Math.sin(angle));
                }
              } else {
                outCtx.arc(drawX, y, radius, 0, Math.PI * 2);
              }
              outCtx.fill();
            }
          }
        }
      } else if (activeEffect === 'contour') {
        // Contour Map Shader
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;
        const levelStep = 256 / Math.max(2, contourLevels);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const outIdx = idx * 4;

            let r = rBuffer[idx];
            let g = gBuffer[idx];
            let b = bBuffer[idx];

            r += contourBrightness;
            g += contourBrightness;
            b += contourBrightness;

            const cContrastFactor = (259 * (contourContrast + 255)) / (255 * (259 - contourContrast));
            r = (r - 128) * cContrastFactor + 128;
            g = (g - 128) * cContrastFactor + 128;
            b = (b - 128) * cContrastFactor + 128;

            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const currentLevel = Math.floor(gray / levelStep);

            let isBoundary = false;
            if (x < width - 1) {
              const rightIdx = y * width + (x + 1);
              const rightGray = 0.299 * rBuffer[rightIdx] + 0.587 * gBuffer[rightIdx] + 0.114 * bBuffer[rightIdx];
              const rightLevel = Math.floor((rightGray + contourBrightness) / levelStep);
              if (rightLevel !== currentLevel) isBoundary = true;
            }
            if (y < height - 1) {
              const downIdx = (y + 1) * width + x;
              const downGray = 0.299 * rBuffer[downIdx] + 0.587 * gBuffer[downIdx] + 0.114 * bBuffer[downIdx];
              const downLevel = Math.floor((downGray + contourBrightness) / levelStep);
              if (downLevel !== currentLevel) isBoundary = true;
            }

            const levelCenterGray = (currentLevel + 0.5) * levelStep;
            let baseR = levelCenterGray;
            let baseG = levelCenterGray;
            let baseB = levelCenterGray;

            if (contourColorMode === 'Original') {
              const grayRatio = levelCenterGray / Math.max(1, gray);
              baseR = r * grayRatio;
              baseG = g * grayRatio;
              baseB = b * grayRatio;
            } else if (contourColorMode === 'Palette') {
              const col = getClosestPaletteColor(levelCenterGray);
              baseR = col.r;
              baseG = col.g;
              baseB = col.b;
            } else {
              const colorVal = currentLevel * levelStep;
              baseR = fgColor.r * (colorVal / 255) + bgColor.r * (1 - colorVal / 255);
              baseG = fgColor.g * (colorVal / 255) + bgColor.g * (1 - colorVal / 255);
              baseB = fgColor.b * (colorVal / 255) + bgColor.b * (1 - colorVal / 255);
            }

            let finalR = baseR;
            let finalG = baseG;
            let finalB = baseB;

            if (contourFillMode === 'Lines Only') {
              if (isBoundary) {
                if (contourColorMode === 'Mono') {
                  finalR = fgColor.r; finalG = fgColor.g; finalB = fgColor.b;
                } else if (contourColorMode === 'Palette') {
                  const col = getClosestPaletteColor(gray);
                  finalR = col.r; finalG = col.g; finalB = col.b;
                } else {
                  finalR = r; finalG = g; finalB = b;
                }
              } else {
                finalR = bgColor.r; finalG = bgColor.g; finalB = bgColor.b;
              }
            } else if (contourFillMode === 'Filled Lines') {
              if (isBoundary) {
                finalR = contourInvert ? 255 - fgColor.r : fgColor.r;
                finalG = contourInvert ? 255 - fgColor.g : fgColor.g;
                finalB = contourInvert ? 255 - fgColor.b : fgColor.b;
              }
            }

            out[outIdx] = Math.min(255, Math.max(0, finalR));
            out[outIdx+1] = Math.min(255, Math.max(0, finalG));
            out[outIdx+2] = Math.min(255, Math.max(0, finalB));
            out[outIdx+3] = 255;
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'pixel-sort') {
        applyPixelSortPipeline(width, height, rBuffer, gBuffer, bBuffer, outCtx, {
          sortDirection,
          sortMode,
          sortThreshold,
          sortStreakLength,
          sortIntensity,
          sortRandomness,
          sortReverse,
          sortBrightness,
          sortContrast
        });
      } else if (activeEffect === 'voronoi') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const cellSize = Math.max(5, voronoiCellSize);
        const randomize = voronoiRandomize;
        const edgeWidth = voronoiEdgeWidth;

        // Parse edge color
        const hexToRgb = (hex: string) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : { r: 0, g: 0, b: 0 };
        };
        const edgeRGB = hexToRgb(voronoiEdgeColor);

        // Deterministic cell seed helper
        const getCellSeed = (c: number, r: number, size: number, rand: number) => {
          const h1 = Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453123) % 1;
          const h2 = Math.abs(Math.cos(c * 37.719 + r * 49.567) * 43758.5453123) % 1;
          const centerX = c * size + size / 2;
          const centerY = r * size + size / 2;
          const jitterX = (h1 - 0.5) * size * rand;
          const jitterY = (h2 - 0.5) * size * rand;
          return {
            x: Math.max(0, Math.min(width - 1, centerX + jitterX)),
            y: Math.max(0, Math.min(height - 1, centerY + jitterY))
          };
        };

        // Pre-calculate cell average colors if mode is 'Cell Average'
        const cellAverages: { [key: string]: { r: number, g: number, b: number, count: number } } = {};
        if (voronoiColorMode === 'Cell Average') {
          const step = cellSize < 10 ? 1 : 2;
          for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
              const cellX = Math.floor(x / cellSize);
              const cellY = Math.floor(y / cellSize);

              let minDist = Infinity;
              let closestKey = "";

              for (let dc = -2; dc <= 2; dc++) {
                for (let dr = -2; dr <= 2; dr++) {
                  const c = cellX + dc;
                  const r = cellY + dr;
                  const seed = getCellSeed(c, r, cellSize, randomize);
                  const dx = x - seed.x;
                  const dy = y - seed.y;
                  const dist = dx * dx + dy * dy;
                  if (dist < minDist) {
                    minDist = dist;
                    closestKey = `${c},${r}`;
                  }
                }
              }

              const idx = y * width + x;
              if (!cellAverages[closestKey]) {
                cellAverages[closestKey] = { r: 0, g: 0, b: 0, count: 0 };
              }
              cellAverages[closestKey].r += rBuffer[idx];
              cellAverages[closestKey].g += gBuffer[idx];
              cellAverages[closestKey].b += bBuffer[idx];
              cellAverages[closestKey].count++;
            }
          }
        }

        const contrastFactor = (259 * (voronoiContrast + 255)) / (255 * (259 - voronoiContrast));

        // Main pixel pass
        for (let y = 0; y < height; y++) {
          const cellY = Math.floor(y / cellSize);

          for (let x = 0; x < width; x++) {
            const cellX = Math.floor(x / cellSize);

            let minDist = Infinity;
            let secondMinDist = Infinity;
            let closestC = 0;
            let closestR = 0;
            let closestSeedX = 0;
            let closestSeedY = 0;

            for (let dc = -2; dc <= 2; dc++) {
              for (let dr = -2; dr <= 2; dr++) {
                const c = cellX + dc;
                const r = cellY + dr;
                const seed = getCellSeed(c, r, cellSize, randomize);
                const dx = x - seed.x;
                const dy = y - seed.y;
                const dist = dx * dx + dy * dy;

                if (dist < minDist) {
                  secondMinDist = minDist;
                  minDist = dist;
                  closestC = c;
                  closestR = r;
                  closestSeedX = seed.x;
                  closestSeedY = seed.y;
                } else if (dist < secondMinDist) {
                  secondMinDist = dist;
                }
              }
            }

            const d1 = Math.sqrt(minDist);
            const d2 = Math.sqrt(secondMinDist);
            const edgeDist = d2 - d1;

            const idx = y * width + x;
            const outIdx = idx * 4;

            if (edgeWidth > 0 && edgeDist < edgeWidth) {
              out[outIdx] = edgeRGB.r;
              out[outIdx + 1] = edgeRGB.g;
              out[outIdx + 2] = edgeRGB.b;
              out[outIdx + 3] = 255;
            } else {
              let cellR = 0, cellG = 0, cellB = 0;

              if (voronoiColorMode === 'Center Sample') {
                const sIdx = Math.round(closestSeedY) * width + Math.round(closestSeedX);
                cellR = rBuffer[sIdx];
                cellG = gBuffer[sIdx];
                cellB = bBuffer[sIdx];
              } else if (voronoiColorMode === 'Cell Average') {
                const key = `${closestC},${closestR}`;
                const avg = cellAverages[key];
                if (avg && avg.count > 0) {
                  cellR = avg.r / avg.count;
                  cellG = avg.g / avg.count;
                  cellB = avg.b / avg.count;
                } else {
                  const sIdx = Math.round(closestSeedY) * width + Math.round(closestSeedX);
                  cellR = rBuffer[sIdx];
                  cellG = gBuffer[sIdx];
                  cellB = bBuffer[sIdx];
                }
              } else { // 'Gradient'
                const sIdx = Math.round(closestSeedY) * width + Math.round(closestSeedX);
                const sR = rBuffer[sIdx];
                const sG = gBuffer[sIdx];
                const sB = bBuffer[sIdx];

                const t = Math.min(1.0, d1 / (cellSize * 1.5));
                cellR = sR * (1 - t) + rBuffer[idx] * t;
                cellG = sG * (1 - t) + gBuffer[idx] * t;
                cellB = sB * (1 - t) + bBuffer[idx] * t;
              }

              // Adjustments: Brightness
              cellR += voronoiBrightness;
              cellG += voronoiBrightness;
              cellB += voronoiBrightness;

              // Adjustments: Contrast
              cellR = (cellR - 128) * contrastFactor + 128;
              cellG = (cellG - 128) * contrastFactor + 128;
              cellB = (cellB - 128) * contrastFactor + 128;

              out[outIdx] = Math.max(0, Math.min(255, cellR));
              out[outIdx + 1] = Math.max(0, Math.min(255, cellG));
              out[outIdx + 2] = Math.max(0, Math.min(255, cellB));
              out[outIdx + 3] = 255;
            }
          }
        }

        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'vhs') {
        const outData = outCtx.createImageData(width, height);
        const out = outData.data;

        const rowOffsets = new Float32Array(height);
        const trackingStart = height * 0.85 - (vhsTrackingError * 80);
        const trackingEnd = height * 0.85 + 20;

        for (let y = 0; y < height; y++) {
          let shift = Math.sin(y / 10) * vhsDistortion * 5;
          shift += Math.sin(y / 1.5) * vhsDistortion * 1.5;

          if (y >= trackingStart && y <= trackingEnd) {
            const tFactor = (y - trackingStart) / (trackingEnd - trackingStart);
            shift += Math.sin(y / 3) * vhsTrackingError * 30 * tFactor;
          }

          rowOffsets[y] = shift;
        }

        const contrastFactor = (259 * (vhsContrast + 255)) / (255 * (259 - vhsContrast));

        for (let y = 0; y < height; y++) {
          const shiftX = rowOffsets[y];
          const isTrackingBand = y >= trackingStart && y <= trackingEnd;
          const scanlineVal = 1 - (vhsScanlines * 0.35 * (y % 3 === 0 ? 1 : 0));

          for (let x = 0; x < width; x++) {
            const idx = y * width + x;

            const rX = Math.max(0, Math.min(width - 1, Math.round(x + shiftX - vhsColorBleed * 7)));
            const gX = Math.max(0, Math.min(width - 1, Math.round(x + shiftX)));
            const bX = Math.max(0, Math.min(width - 1, Math.round(x + shiftX + vhsColorBleed * 7)));

            const rIdx = y * width + rX;
            const gIdx = y * width + gX;
            const bIdx = y * width + bX;

            let r = rBuffer[rIdx];
            let g = gBuffer[gIdx];
            let b = bBuffer[bIdx];

            if (vhsNoise > 0) {
              const noiseVal = (Math.random() - 0.5) * vhsNoise * 90;
              r += noiseVal;
              g += noiseVal;
              b += noiseVal;
            }

            if (isTrackingBand && Math.random() < vhsTrackingError * 0.5) {
              const staticNoise = Math.random() < 0.5 ? 255 : 0;
              r = staticNoise;
              g = staticNoise;
              b = staticNoise;
            }

            r += vhsBrightness;
            g += vhsBrightness;
            b += vhsBrightness;

            r = (r - 128) * contrastFactor + 128;
            g = (g - 128) * contrastFactor + 128;
            b = (b - 128) * contrastFactor + 128;

            r *= scanlineVal;
            g *= scanlineVal;
            b *= scanlineVal;

            const outIdx = idx * 4;
            out[outIdx] = Math.max(0, Math.min(255, r));
            out[outIdx + 1] = Math.max(0, Math.min(255, g));
            out[outIdx + 2] = Math.max(0, Math.min(255, b));
            out[outIdx + 3] = 255;
          }
        }
        outCtx.putImageData(outData, 0, 0);
      } else if (activeEffect === 'matrix-rain') {
        const { charGrid } = renderMatrixRain(
          outCtx,
          srcCanvas,
          width,
          height,
          matrixSettings,
          matrixFrameCountRef.current
        );
        matrixCharGridRef.current = charGrid;
      }

    // Stop processing spinner
    setIsProcessing(false);
  };

  // Trigger processing on state change
  useEffect(() => {
    if (loadedImage) {
      processImage();
    }
  }, [
    loadedImage, activeEffect, algorithm, intensity, matrixSize, modulation,
    brightness, contrast, gamma, sharpen, colorMode, foreground, background,
    selectedPaletteIndex, chromaticEnabled, maxDisplace, invert, blur,
    asciiScale, asciiSpacing, asciiOutputWidth, asciiCharSet, asciiColorMode,
    asciiBgColor, asciiIntensity, asciiBrightness, asciiContrast, asciiSaturation,
    asciiHueRotation, asciiSharpness, asciiGamma,
    halftoneShape, halftoneDotScale, halftoneSpacing, halftoneAngle, halftoneInvert,
    halftoneBrightness, halftoneContrast, halftoneColorMode, halftoneForeground, halftoneBackground,
    blockifyStyle, blockifySize, blockifyBorderWidth, blockifyBrightness, blockifyContrast, blockifyColorMode, blockifyBorderColor,
    dotsShape, dotsGridType, dotsSize, dotsSpacing, dotsInvert, dotsBrightness, dotsContrast, dotsColorMode,
    contourFillMode, contourLevels, contourLineThickness, contourInvert, contourBrightness, contourContrast, contourColorMode,
    sortDirection, sortMode, sortThreshold, sortStreakLength, sortIntensity, sortRandomness, sortReverse, sortBrightness, sortContrast,
    thresholdLevels, thresholdPoint, thresholdDither, thresholdInvert, thresholdBrightness, thresholdContrast, thresholdColorMode, thresholdForeground, thresholdBackground,
    edgeAlgorithm, edgeThreshold, edgeLineWidth, edgeInvert, edgeBrightness, edgeContrast, edgeColorMode, edgeColor, edgeBgColor,
    crosshatchDensity, crosshatchLayers, crosshatchAngle, crosshatchLineWidth, crosshatchRandomness, crosshatchInvert, crosshatchBrightness, crosshatchContrast, crosshatchLineColor, crosshatchBgColor,
    waveLineCount, waveAmplitude, waveFrequency, waveLineThickness, waveDirection, waveAnimate, waveBrightness, waveContrast, waveColorMode, waveLineColor, waveBgColor,
    noiseType, noiseScale, noiseIntensity, noiseOctaves, noiseSpeed, noiseAnimate, noiseDistortOnly, noiseBrightness, noiseContrast,
    voronoiCellSize, voronoiEdgeWidth, voronoiEdgeColor, voronoiColorMode, voronoiRandomize, voronoiBrightness, voronoiContrast,
    vhsDistortion, vhsNoise, vhsColorBleed, vhsScanlines, vhsTrackingError, vhsBrightness, vhsContrast
  ]);

  // Wave Lines animation loop
  useEffect(() => {
    if (activeEffect === 'wave-lines' && waveAnimate && loadedImage) {
      let animId: number;
      const tick = () => {
        processImage();
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animId);
    }
  }, [activeEffect, waveAnimate, loadedImage]);

  // Noise Field animation loop
  useEffect(() => {
    if (activeEffect === 'noise-field' && noiseAnimate && loadedImage) {
      let animId: number;
      const tick = () => {
        processImage();
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animId);
    }
  }, [activeEffect, noiseAnimate, loadedImage]);

  // Matrix Rain animation loop
  useEffect(() => {
    if (activeEffect === 'matrix-rain' && (matrixSettings.animate || matrixSettings.fallingMode) && loadedImage) {
      let animId: number;
      const tick = () => {
        matrixFrameCountRef.current++;
        processImage();
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(animId);
      };
    }
  }, [activeEffect, matrixSettings.animate, matrixSettings.fallingMode, loadedImage]);

  // Handle high quality download of processed canvas
  const triggerDownload = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;

    if (exportFormat === 'txt') {
      if (activeEffect === 'matrix-rain' && matrixCharGridRef.current) {
        const txt = exportMatrixTXT(matrixCharGridRef.current);
        downloadTXT(txt, 'retrolab_matrix.txt');
      } else if (activeEffect === 'ascii' && asciiCharGridRef.current) {
        const txt = asciiCharGridRef.current.map((row: string[]) => row.join('')).join('\n');
        downloadTXT(txt, 'retrolab_ascii.txt');
      }
      return;
    }

    if (exportFormat === 'svg') {
      const srcCanvas = sourceCanvasRef.current;
      if (!srcCanvas) return;
      const w = srcCanvas.width;
      const h = srcCanvas.height;
      let svgData = '';

      if (activeEffect === 'dots') {
        svgData = exportDotsSVG(srcCanvas, w, h, { shape: dotsShape, spacing: dotsSpacing, size: dotsSize, colorMode: dotsColorMode, invert: dotsInvert });
      } else if (activeEffect === 'halftone') {
        svgData = exportHalftoneSVG(srcCanvas, w, h, { shape: halftoneShape, spacing: halftoneSpacing, dotScale: halftoneDotScale, angle: halftoneAngle, colorMode: halftoneColorMode, foreground: halftoneForeground, background: halftoneBackground });
      } else if (activeEffect === 'contour') {
        svgData = exportContourSVG(srcCanvas, w, h, { levels: contourLevels, lineThickness: contourLineThickness, colorMode: contourColorMode, invert: contourInvert });
      } else if (activeEffect === 'crosshatch') {
        svgData = exportCrosshatchSVG(srcCanvas, w, h, { density: crosshatchDensity, layers: crosshatchLayers, angle: crosshatchAngle, lineWidth: crosshatchLineWidth, randomness: crosshatchRandomness, lineColor: crosshatchLineColor, bgColor: crosshatchBgColor });
      } else if (activeEffect === 'voronoi') {
        svgData = exportVoronoiSVG(srcCanvas, w, h, { cellSize: voronoiCellSize, edgeWidth: voronoiEdgeWidth, edgeColor: voronoiEdgeColor, colorMode: voronoiColorMode, randomize: voronoiRandomize });
      }
      
      if (svgData) {
        downloadSVG(svgData, `retrolab_${activeEffect}.svg`);
      }
      return;
    }

    // Create virtual canvas with higher resolution or download directly
    const dataUrl = canvas.toDataURL(`image/${exportFormat === 'jpg' ? 'jpeg' : exportFormat}`);
    const link = document.createElement('a');
    link.download = `dithered_masterpiece.${exportFormat}`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 pb-16">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="font-pixel text-sm md:text-base tracking-wider uppercase flex items-center gap-2">
            <Tv className="w-4 h-4 text-brand-cream animate-pulse" />
            <span>RETRO_LAB // ADVANCED IMAGE DITHERING STUDIO</span>
          </h1>
          <p className="font-sans text-[11px] text-brand-cream/60 leading-relaxed max-w-2xl mt-1">
            Recreate historical CRT, GameBoy, and Macintosh graphic aesthetics. Upload a source image, tweak quantizations, and apply error diffusion models.
          </p>
        </div>
        
        {/* Reset / Demo Buttons */}
        <div className="flex items-center gap-2 self-end">
          <button 
            onClick={undo}
            disabled={history.past.length <= 1}
            className={`px-3 py-1.5 border border-brand-cream/15 rounded font-mono text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              history.past.length <= 1 
                ? 'opacity-30 cursor-not-allowed text-brand-cream/40' 
                : 'text-brand-cream hover:bg-brand-cream/10'
            }`}
            title="Undo last adjustment (Ctrl+Z)"
          >
            <Undo className="w-3 h-3" />
            <span>UNDO</span>
          </button>

          <button 
            onClick={redo}
            disabled={history.future.length === 0}
            className={`px-3 py-1.5 border border-brand-cream/15 rounded font-mono text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              history.future.length === 0 
                ? 'opacity-30 cursor-not-allowed text-brand-cream/40' 
                : 'text-brand-cream hover:bg-brand-cream/10'
            }`}
            title="Redo last adjustment (Ctrl+Y)"
          >
            <Redo className="w-3 h-3" />
            <span>REDO</span>
          </button>

          <button 
            onClick={resetAdjustments}
            className="px-3 py-1.5 border border-brand-cream/15 text-brand-cream hover:bg-brand-cream/10 rounded font-mono text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Reset active adjustments"
          >
            <ResetIcon className="w-3 h-3" />
            <span>RESET ALL</span>
          </button>

          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="px-3 py-1.5 border-2 border-brand-cream/30 hover:border-brand-cream text-brand-cream hover:bg-brand-cream/10 rounded font-mono text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title={sidebarCollapsed ? "Expand Sidebar Controls" : "Collapse Sidebar Controls"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-brand-red" /> : <ChevronLeft className="w-3.5 h-3.5 text-brand-cream/60" />}
            <span>{sidebarCollapsed ? "EXPAND CONTROLS" : "COLLAPSE CONTROLS"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" ref={containerRef}>
        
        {/* LEFT COLUMN: Sidebar controls (lg:col-span-4) */}
        <div className={`${sidebarCollapsed ? 'hidden' : 'lg:col-span-4'} flex flex-col gap-4 max-h-[720px] overflow-y-auto pr-1`}>
          
          {/* EFFECTS SELECTOR LIST (Matches user mock design) */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('effects')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span>— Effects</span>
              <Layers className="w-3.5 h-3.5 text-brand-cream/60" />
            </button>
            
            {sidebarExpanded.effects && (
              <div className="flex flex-col gap-1.5 pl-2 mt-2 font-mono text-[11px] max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brand-cream/15">
                <button 
                  onClick={() => setActiveEffect('dithering')}
                  className={`flex items-center gap-2 w-full text-left py-1 px-2 rounded transition-all ${
                    activeEffect === 'dithering' 
                      ? 'text-brand-light bg-brand-cream/10 border-l-2 border-brand-cream font-bold' 
                      : 'text-brand-cream/65 hover:text-brand-cream hover:bg-brand-dark/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeEffect === 'dithering' ? 'bg-brand-cream' : 'border border-brand-cream/35'}`} />
                  <span>Dithering</span>
                </button>
                
                {/* Unlocked & Locked Effects */}
                {[
                  { name: 'ascii', label: 'ASCII', locked: false },
                  { name: 'matrix-rain', label: 'Matrix Rain', locked: false },
                  { name: 'halftone', label: 'Halftone', locked: false },
                  { name: 'blockify', label: 'Blockify', locked: false },
                  { name: 'dots', label: 'Dots', locked: false },
                  { name: 'contour', label: 'Contour', locked: false },
                  { name: 'pixel-sort', label: 'Pixel Sort', locked: false },
                  { name: 'threshold', label: 'Threshold', locked: false },
                  { name: 'edge-detection', label: 'Edge Detection', locked: false },
                  { name: 'crosshatch', label: 'Crosshatch', locked: false },
                  { name: 'wave-lines', label: 'Wave Lines', locked: false },
                  { name: 'noise-field', label: 'Noise Field', locked: false },
                  { name: 'voronoi', label: 'Voronoi', locked: false },
                  { name: 'vhs', label: 'VHS', locked: false }
                ].map((eff) => {
                  if (eff.locked) {
                    return (
                      <div 
                        key={eff.name}
                        className="flex items-center justify-between py-1 px-2 text-brand-cream/35 select-none pl-2"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full border border-brand-cream/15" />
                          <span>{eff.label}</span>
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-brand-cream/20">locked</span>
                      </div>
                    );
                  }
                  return (
                    <button 
                      key={eff.name}
                      onClick={() => setActiveEffect(eff.name)}
                      className={`flex items-center justify-between w-full text-left py-1 px-2 rounded transition-all cursor-pointer ${
                        activeEffect === eff.name 
                          ? 'text-brand-light bg-brand-cream/10 border-l-2 border-brand-cream font-bold' 
                          : 'text-brand-cream/65 hover:text-brand-cream hover:bg-brand-dark/30'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeEffect === eff.name ? 'bg-brand-cream' : 'border border-brand-cream/35'}`} />
                        <span>{eff.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ACTIVE EFFECT PARAMETER CONFIG */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('dithering')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span className="capitalize">— {activeEffect === 'dithering' ? 'Dithering' : activeEffect} Settings</span>
              <Sliders className="w-3.5 h-3.5 text-brand-cream/60" />
            </button>

            {sidebarExpanded.dithering && (
              <div className="flex flex-col gap-3.5 mt-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-brand-cream/15">
                {activeEffect === 'dithering' && (
                  <>
                    {/* Algorithm Dropdown */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Algorithm</label>
                      <select 
                        value={algorithm}
                        onChange={(e) => setAlgorithm(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none focus:border-brand-cream/50 cursor-pointer font-mono"
                      >
                        <optgroup label="Ordered Dithering (Bayer)">
                          <option value="bayer-8x8">Bayer 8x8 (Classic Console)</option>
                          <option value="bayer-4x4">Bayer 4x4 (Medium Grid)</option>
                          <option value="bayer-2x2">Bayer 2x2 (Coarse Grid)</option>
                        </optgroup>
                        <optgroup label="Error Diffusion Dithering">
                          <option value="floyd-steinberg">Floyd-Steinberg (Organic Diffusion)</option>
                          <option value="atkinson">Atkinson (Macintosh Low-Tone)</option>
                          <option value="jarvis-judice-ninke">Jarvis-Judice-Ninke</option>
                          <option value="stucki">Stucki (Extended Diffusion)</option>
                          <option value="burkes">Burkes (Shortened Kernels)</option>
                          <option value="sierra">Sierra (Classic 3-Row)</option>
                          <option value="sierra-two-row">Sierra Two-Row</option>
                          <option value="sierra-lite">Sierra Lite (Fast Coarse)</option>
                        </optgroup>
                        <optgroup label="Procedural & Stylistic">
                          <option value="blue-noise">Blue Noise (High Frequency)</option>
                          <option value="crosshatch">Crosshatch Sketching</option>
                        </optgroup>
                      </select>
                    </div>

                    {/* Intensity Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Intensity</span>
                        <span className="text-brand-cream font-bold">{intensity.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={intensity}
                        onChange={(e) => setIntensity(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Matrix Size Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Matrix Size</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['2x2', '4x4', '8x8'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setMatrixSize(size)}
                            className={`py-1 text-center font-mono text-[10px] border rounded transition-all cursor-pointer ${
                              matrixSize === size 
                                ? 'bg-brand-cream text-brand-charcoal border-brand-cream font-bold' 
                                : 'border-brand-cream/15 text-brand-cream/70 hover:bg-brand-dark/40'
                            }`}
                          >
                              {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Modulation Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Modulation (Bayer)</span>
                        <span className="text-brand-cream font-bold">{modulation.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={modulation}
                        onChange={(e) => setModulation(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>
                  </>
                )}

                {activeEffect === 'ascii' && (
                  <>
                    {/* Scale */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Scale</span>
                        <span className="text-brand-cream font-bold">{asciiScale}</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="8"
                        step="1"
                        value={asciiScale}
                        onChange={(e) => setAsciiScale(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Spacing */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Spacing</span>
                        <span className="text-brand-cream font-bold">{asciiSpacing.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range"
                        min="0.0"
                        max="6.0"
                        step="0.5"
                        value={asciiSpacing}
                        onChange={(e) => setAsciiSpacing(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Output Width */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Output Width</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setAsciiOutputWidth(0)} className="text-[8px] hover:underline text-brand-cream/45">reset</button>
                          <span className="text-brand-cream font-bold">{asciiOutputWidth === 0 ? 'AUTO' : asciiOutputWidth}</span>
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="320"
                        step="10"
                        value={asciiOutputWidth}
                        onChange={(e) => setAsciiOutputWidth(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Character Set */}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase flex items-center justify-between">
                        <span>Character Set</span>
                        {asciiCharSet === 'STANDARD' && <span className="text-[8px] text-brand-cream/45">✓ STANDARD</span>}
                      </label>
                      <select 
                        value={asciiCharSet}
                        onChange={(e) => setAsciiCharSet(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none focus:border-brand-cream/50 cursor-pointer font-mono w-full"
                      >
                        {['STANDARD', 'BLOCKS', 'BINARY', 'DETAILED', 'MINIMAL', 'ALPHABETIC', 'NUMERIC', 'MATH', 'SYMBOLS', 'CUSTOM'].map(set => (
                          <option key={set} value={set}>{set}</option>
                        ))}
                      </select>
                    </div>

                    {/* Adjustments: Brightness, Contrast, Saturation, Hue Rotation, Sharpness, Gamma */}
                    <div className="border border-brand-cream/10 p-2.5 rounded bg-brand-dark/20 flex flex-col gap-2.5 mt-1 select-none">
                      <span className="font-mono text-[9px] text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      {/* Brightness */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center font-mono text-[9px]">
                          <span className="text-brand-cream/60">Brightness</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAsciiBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                            <span className="text-brand-cream font-bold">{asciiBrightness}</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={asciiBrightness} 
                          onChange={(e) => setAsciiBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      {/* Contrast */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center font-mono text-[9px]">
                          <span className="text-brand-cream/60">Contrast</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAsciiContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                            <span className="text-brand-cream font-bold">{asciiContrast}</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={asciiContrast} 
                          onChange={(e) => setAsciiContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      {/* Saturation */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center font-mono text-[9px]">
                          <span className="text-brand-cream/60">Saturation</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAsciiSaturation(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                            <span className="text-brand-cream font-bold">{asciiSaturation}</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={asciiSaturation} 
                          onChange={(e) => setAsciiSaturation(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      {/* Hue Rotation */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center font-mono text-[9px]">
                          <span className="text-brand-cream/60">Hue Rotation</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAsciiHueRotation(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                            <span className="text-brand-cream font-bold">{asciiHueRotation}°</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="0" max="360" value={asciiHueRotation} 
                          onChange={(e) => setAsciiHueRotation(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      {/* Sharpness */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center font-mono text-[9px]">
                          <span className="text-brand-cream/60">Sharpness</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAsciiSharpness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                            <span className="text-brand-cream font-bold">{asciiSharpness}</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="0" max="5" step="0.5" value={asciiSharpness} 
                          onChange={(e) => setAsciiSharpness(parseFloat(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      {/* Gamma */}
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center font-mono text-[9px]">
                          <span className="text-brand-cream/60">Gamma</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAsciiGamma(1.0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                            <span className="text-brand-cream font-bold">{asciiGamma.toFixed(1)}</span>
                          </div>
                        </div>
                        <input 
                          type="range" min="0.2" max="3.0" step="0.1" value={asciiGamma} 
                          onChange={(e) => setAsciiGamma(parseFloat(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Mode / Background / Intensity */}
                    <div className="flex flex-col gap-2 bg-brand-dark/10 p-2 border border-brand-cream/10 rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Color Mode</span>
                        <select 
                          value={asciiColorMode}
                          onChange={(e) => setAsciiColorMode(e.target.value)}
                          className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none"
                        >
                          <option value="Original">Original</option>
                          <option value="Mono">Mono</option>
                          <option value="Palette">Palette</option>
                        </select>
                      </div>
                      
                      {asciiColorMode === 'Mono' && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-brand-cream/60">Background</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" value={asciiBgColor} 
                              onChange={(e) => setAsciiBgColor(e.target.value)}
                              className="w-4 h-4 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                            />
                            <span className="text-[9px]">{asciiBgColor.toUpperCase()}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-brand-cream/60">Intensity</span>
                        <span className="font-bold text-brand-cream">{asciiIntensity.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.1" value={asciiIntensity}
                        onChange={(e) => setAsciiIntensity(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                      />
                    </div>
                  </>
                )}

                {activeEffect === 'matrix-rain' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[9px] text-brand-cream/50 uppercase">Character Set</label>
                      <select 
                        value={matrixSettings.charSet}
                        onChange={(e) => setMatrixSettings({ ...matrixSettings, charSet: e.target.value as any })}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="binary">Binary</option>
                        <option value="katakana">Katakana</option>
                        <option value="ascii">ASCII</option>
                        <option value="hex">Hex</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {matrixSettings.charSet === 'custom' && (
                      <div className="flex flex-col gap-1 mt-1">
                        <label className="font-mono text-[9px] text-brand-cream/50 uppercase">Custom Characters</label>
                        <input
                          type="text"
                          value={matrixSettings.customChars || ''}
                          onChange={(e) => setMatrixSettings({ ...matrixSettings, customChars: e.target.value })}
                          className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none font-mono"
                          placeholder="e.g. 01@#"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-0.5 mt-2">
                      <div className="flex justify-between items-center font-mono text-[9px]">
                        <span className="text-brand-cream/60 uppercase">Font Size</span>
                        <span className="text-brand-cream font-bold">{matrixSettings.fontSize}</span>
                      </div>
                      <input 
                        type="range" min="4" max="24" step="1" value={matrixSettings.fontSize}
                        onChange={(e) => setMatrixSettings({ ...matrixSettings, fontSize: parseInt(e.target.value) })}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 mt-2">
                      <div className="flex justify-between items-center font-mono text-[9px]">
                        <span className="text-brand-cream/60 uppercase">Density</span>
                        <span className="text-brand-cream font-bold">{(matrixSettings.density * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1.0" step="0.05" value={matrixSettings.density}
                        onChange={(e) => setMatrixSettings({ ...matrixSettings, density: parseFloat(e.target.value) })}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-brand-cream/65 uppercase text-[10px]">Colorize Output</span>
                      <input 
                        type="checkbox"
                        checked={matrixSettings.colorize}
                        onChange={(e) => setMatrixSettings({ ...matrixSettings, colorize: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-2 p-2 border border-brand-cream/10 rounded bg-brand-dark/20 mt-3 select-none">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/65 uppercase text-[10px]">Animate Matrix</span>
                        <input 
                          type="checkbox"
                          checked={matrixSettings.animate}
                          onChange={(e) => setMatrixSettings({ ...matrixSettings, animate: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/65 uppercase text-[10px]">Falling Mode</span>
                        <input 
                          type="checkbox"
                          checked={matrixSettings.fallingMode}
                          onChange={(e) => {
                            if (e.target.checked) resetMatrixAnimation();
                            setMatrixSettings({ ...matrixSettings, fallingMode: e.target.checked });
                          }}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                      {(matrixSettings.animate || matrixSettings.fallingMode) && (
                        <div className="flex flex-col gap-0.5 mt-2">
                          <div className="flex justify-between items-center font-mono text-[9px]">
                            <span className="text-brand-cream/60 uppercase">Speed</span>
                            <span className="text-brand-cream font-bold">{matrixSettings.speed}</span>
                          </div>
                          <input 
                            type="range" min="1" max="10" step="1" value={matrixSettings.speed}
                            onChange={(e) => setMatrixSettings({ ...matrixSettings, speed: parseInt(e.target.value) })}
                            className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeEffect === 'halftone' && (
                  <>
                    {/* Shape Selector */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Shape</label>
                      <select 
                        value={halftoneShape}
                        onChange={(e) => setHalftoneShape(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Circle">Circle</option>
                        <option value="Square">Square</option>
                        <option value="Line">Line</option>
                        <option value="Cross">Cross</option>
                      </select>
                    </div>

                    {/* Dot Scale */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Dot Scale</span>
                        <span className="text-brand-cream font-bold">{halftoneDotScale.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.2" max="3.0" step="0.1" value={halftoneDotScale}
                        onChange={(e) => setHalftoneDotScale(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Spacing */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Spacing</span>
                        <span className="text-brand-cream font-bold">{halftoneSpacing}</span>
                      </div>
                      <input 
                        type="range" min="4" max="24" step="1" value={halftoneSpacing}
                        onChange={(e) => setHalftoneSpacing(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Angle */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Angle</span>
                        <span className="text-brand-cream font-bold">{halftoneAngle}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="180" step="5" value={halftoneAngle}
                        onChange={(e) => setHalftoneAngle(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Invert */}
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-brand-cream/65 uppercase">Invert</span>
                      <input 
                        type="checkbox" checked={halftoneInvert}
                        onChange={(e) => setHalftoneInvert(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                      />
                    </div>

                    {/* Adjustments */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setHalftoneBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={halftoneBrightness}
                          onChange={(e) => setHalftoneBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setHalftoneContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={halftoneContrast}
                          onChange={(e) => setHalftoneContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Mode Selection */}
                    <div className="flex flex-col gap-2 bg-brand-dark/10 p-2 border border-brand-cream/10 rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Color Mode</span>
                        <select 
                          value={halftoneColorMode}
                          onChange={(e) => setHalftoneColorMode(e.target.value)}
                          className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none"
                        >
                          <option value="Mono">Mono</option>
                          <option value="Palette">Palette</option>
                          <option value="Original">Original</option>
                        </select>
                      </div>

                      {halftoneColorMode === 'Mono' && (
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] text-brand-cream/50">FOREGROUND</span>
                            <input type="color" value={halftoneForeground} onChange={(e) => setHalftoneForeground(e.target.value)} className="w-5 h-5 bg-transparent cursor-pointer rounded" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[8px] text-brand-cream/50">BACKGROUND</span>
                            <input type="color" value={halftoneBackground} onChange={(e) => setHalftoneBackground(e.target.value)} className="w-5 h-5 bg-transparent cursor-pointer rounded" />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {activeEffect === 'blockify' && (
                  <>
                    {/* Style */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Style</label>
                      <select 
                        value={blockifyStyle}
                        onChange={(e) => setBlockifyStyle(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Full Blocks">Full Blocks</option>
                        <option value="Beveled Blocks">Beveled Blocks</option>
                        <option value="Rounded Blocks">Rounded Blocks</option>
                        <option value="Grid Blocks">Grid Blocks</option>
                      </select>
                    </div>

                    {/* Block Size */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Block Size</span>
                        <span className="text-brand-cream font-bold">{blockifySize}</span>
                      </div>
                      <input 
                        type="range" min="2" max="32" step="1" value={blockifySize}
                        onChange={(e) => setBlockifySize(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Border Width */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Border Width</span>
                        <span className="text-brand-cream font-bold">{blockifyBorderWidth.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="10.0" step="0.5" value={blockifyBorderWidth}
                        onChange={(e) => setBlockifyBorderWidth(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setBlockifyBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={blockifyBrightness}
                          onChange={(e) => setBlockifyBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setBlockifyContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={blockifyContrast}
                          onChange={(e) => setBlockifyContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Mode Selection */}
                    <div className="flex flex-col gap-2 bg-brand-dark/10 p-2 border border-brand-cream/10 rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Color Mode</span>
                        <select 
                          value={blockifyColorMode}
                          onChange={(e) => setBlockifyColorMode(e.target.value)}
                          className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none"
                        >
                          <option value="Preserve Colors">Preserve Colors</option>
                          <option value="Mono">Mono</option>
                          <option value="Palette">Palette</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-brand-cream/60">Border Color</span>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="color" value={blockifyBorderColor} 
                            onChange={(e) => setBlockifyBorderColor(e.target.value)}
                            className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                          />
                          <span className="text-[9px]">{blockifyBorderColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeEffect === 'threshold' && (
                  <>
                    {/* Levels */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Levels</span>
                        <span className="text-brand-cream font-bold">{thresholdLevels}</span>
                      </div>
                      <input 
                        type="range" min="2" max="16" step="1" value={thresholdLevels}
                        onChange={(e) => setThresholdLevels(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Threshold Point */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Threshold Point</span>
                        <span className="text-brand-cream font-bold">{thresholdPoint.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.05" value={thresholdPoint}
                        onChange={(e) => setThresholdPoint(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Toggles: Dither and Invert */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-brand-cream/65 uppercase">Dither</span>
                        <input 
                          type="checkbox" checked={thresholdDither}
                          onChange={(e) => setThresholdDither(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-brand-cream/65 uppercase">Invert</span>
                        <input 
                          type="checkbox" checked={thresholdInvert}
                          onChange={(e) => setThresholdInvert(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setThresholdBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={thresholdBrightness}
                          onChange={(e) => setThresholdBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setThresholdContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={thresholdContrast}
                          onChange={(e) => setThresholdContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Mode Selection */}
                    <div className="flex flex-col gap-2 bg-brand-dark/10 p-2 border border-brand-cream/10 rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Color Mode</span>
                        <select 
                          value={thresholdColorMode}
                          onChange={(e) => setThresholdColorMode(e.target.value)}
                          className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none cursor-pointer"
                        >
                          <option value="Mono">Mono</option>
                          <option value="Original">Original</option>
                          <option value="Palette">Palette</option>
                        </select>
                      </div>

                      {thresholdColorMode === 'Mono' && (
                        <>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-brand-cream/60">Foreground</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color" value={thresholdForeground} 
                                onChange={(e) => setThresholdForeground(e.target.value)}
                                className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                              />
                              <span className="text-[9px]">{thresholdForeground.toUpperCase()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-brand-cream/60">Background</span>
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="color" value={thresholdBackground} 
                                onChange={(e) => setThresholdBackground(e.target.value)}
                                className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                              />
                              <span className="text-[9px]">{thresholdBackground.toUpperCase()}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {activeEffect === 'edge-detection' && (
                  <>
                    {/* Algorithm Selection */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Algorithm</label>
                      <select 
                        value={edgeAlgorithm}
                        onChange={(e) => setEdgeAlgorithm(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Sobel">Sobel</option>
                        <option value="Prewitt">Prewitt</option>
                        <option value="Scharr">Scharr</option>
                        <option value="Laplacian">Laplacian</option>
                        <option value="Roberts Cross">Roberts Cross</option>
                      </select>
                    </div>

                    {/* Threshold */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Threshold</span>
                        <span className="text-brand-cream font-bold">{edgeThreshold.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.05" value={edgeThreshold}
                        onChange={(e) => setEdgeThreshold(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Line Width */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Line Width</span>
                        <span className="text-brand-cream font-bold">{edgeLineWidth.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="1.0" max="5.0" step="0.5" value={edgeLineWidth}
                        onChange={(e) => setEdgeLineWidth(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Invert Toggle */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-brand-cream/65 uppercase">Invert</span>
                        <input 
                          type="checkbox" checked={edgeInvert}
                          onChange={(e) => setEdgeInvert(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setEdgeBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={edgeBrightness}
                          onChange={(e) => setEdgeBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setEdgeContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={edgeContrast}
                          onChange={(e) => setEdgeContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Mode Selection */}
                    <div className="flex flex-col gap-2 bg-brand-dark/10 p-2 border border-brand-cream/10 rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Color Mode</span>
                        <select 
                          value={edgeColorMode}
                          onChange={(e) => setEdgeColorMode(e.target.value)}
                          className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none cursor-pointer"
                        >
                          <option value="Mono">Mono</option>
                          <option value="Original">Original</option>
                          <option value="Palette">Palette</option>
                        </select>
                      </div>

                      {edgeColorMode === 'Mono' && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-brand-cream/60">Edge Color</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" value={edgeColor} 
                              onChange={(e) => setEdgeColor(e.target.value)}
                              className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                            />
                            <span className="text-[9px]">{edgeColor.toUpperCase()}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-brand-cream/60">Background</span>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="color" value={edgeBgColor} 
                            onChange={(e) => setEdgeBgColor(e.target.value)}
                            className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                          />
                          <span className="text-[9px]">{edgeBgColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeEffect === 'crosshatch' && (
                  <>
                    {/* Density */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Density</span>
                        <span className="text-brand-cream font-bold">{crosshatchDensity}</span>
                      </div>
                      <input 
                        type="range" min="2" max="30" step="1" value={crosshatchDensity}
                        onChange={(e) => setCrosshatchDensity(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Layers */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Layers</span>
                        <span className="text-brand-cream font-bold">{crosshatchLayers}</span>
                      </div>
                      <input 
                        type="range" min="1" max="5" step="1" value={crosshatchLayers}
                        onChange={(e) => setCrosshatchLayers(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Angle */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Angle</span>
                        <span className="text-brand-cream font-bold">{crosshatchAngle}°</span>
                      </div>
                      <input 
                        type="range" min="0" max="180" step="5" value={crosshatchAngle}
                        onChange={(e) => setCrosshatchAngle(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Line Width */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Line Width</span>
                        <span className="text-brand-cream font-bold">{crosshatchLineWidth.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="5.0" step="0.1" value={crosshatchLineWidth}
                        onChange={(e) => setCrosshatchLineWidth(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Randomness */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Randomness</span>
                        <span className="text-brand-cream font-bold">{crosshatchRandomness.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.1" value={crosshatchRandomness}
                        onChange={(e) => setCrosshatchRandomness(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Invert Toggle */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-brand-cream/65 uppercase">Invert</span>
                        <input 
                          type="checkbox" checked={crosshatchInvert}
                          onChange={(e) => setCrosshatchInvert(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setCrosshatchBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={crosshatchBrightness}
                          onChange={(e) => setCrosshatchBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setCrosshatchContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={crosshatchContrast}
                          onChange={(e) => setCrosshatchContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Settings */}
                    <div className="flex flex-col gap-2 bg-brand-dark/10 p-2 border border-brand-cream/10 rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Line Color</span>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="color" value={crosshatchLineColor} 
                            onChange={(e) => setCrosshatchLineColor(e.target.value)}
                            className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                          />
                          <span className="text-[9px]">{crosshatchLineColor.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Background</span>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="color" value={crosshatchBgColor} 
                            onChange={(e) => setCrosshatchBgColor(e.target.value)}
                            className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                          />
                          <span className="text-[9px]">{crosshatchBgColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeEffect === 'wave-lines' && (
                  <>
                    {/* Line Count */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Line Count</span>
                        <span className="text-brand-cream font-bold">{waveLineCount}</span>
                      </div>
                      <input 
                        type="range" min="5" max="200" step="1" value={waveLineCount}
                        onChange={(e) => setWaveLineCount(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Amplitude */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Amplitude</span>
                        <span className="text-brand-cream font-bold">{waveAmplitude}</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="1" value={waveAmplitude}
                        onChange={(e) => setWaveAmplitude(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Frequency */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Frequency</span>
                        <span className="text-brand-cream font-bold">{waveFrequency.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="10.0" step="0.1" value={waveFrequency}
                        onChange={(e) => setWaveFrequency(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Line Thickness */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Line Thickness</span>
                        <span className="text-brand-cream font-bold">{waveLineThickness.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="10.0" step="0.1" value={waveLineThickness}
                        onChange={(e) => setWaveLineThickness(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Direction */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Direction</label>
                      <select 
                        value={waveDirection}
                        onChange={(e) => setWaveDirection(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Horizontal">Horizontal</option>
                        <option value="Vertical">Vertical</option>
                      </select>
                    </div>

                    {/* Animate Toggle */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-brand-cream/65 uppercase">Animate</span>
                        <input 
                          type="checkbox" checked={waveAnimate}
                          onChange={(e) => setWaveAnimate(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setWaveBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={waveBrightness}
                          onChange={(e) => setWaveBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setWaveContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={waveContrast}
                          onChange={(e) => setWaveContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Settings */}
                    <div className="flex flex-col gap-2 bg-brand-dark/10 p-2 border border-brand-cream/10 rounded font-mono text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-brand-cream/60">Mode</span>
                        <select 
                          value={waveColorMode}
                          onChange={(e) => setWaveColorMode(e.target.value)}
                          className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none cursor-pointer"
                        >
                          <option value="Original">Original</option>
                          <option value="Mono">Mono</option>
                          <option value="Palette">Palette</option>
                        </select>
                      </div>

                      {waveColorMode === 'Mono' && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-brand-cream/60">Line Color</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" value={waveLineColor} 
                              onChange={(e) => setWaveLineColor(e.target.value)}
                              className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                            />
                            <span className="text-[9px]">{waveLineColor.toUpperCase()}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-brand-cream/60">Background</span>
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="color" value={waveBgColor} 
                            onChange={(e) => setWaveBgColor(e.target.value)}
                            className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                          />
                          <span className="text-[9px]">{waveBgColor.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeEffect === 'noise-field' && (
                  <>
                    {/* Noise Type */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Noise Type</label>
                      <select 
                        value={noiseType}
                        onChange={(e) => setNoiseType(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Perlin">Perlin</option>
                        <option value="Simplex">Simplex</option>
                        <option value="Value">Value</option>
                        <option value="White">White</option>
                      </select>
                    </div>

                    {/* Scale */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Scale</span>
                        <span className="text-brand-cream font-bold">{noiseScale}</span>
                      </div>
                      <input 
                        type="range" min="1" max="200" step="1" value={noiseScale}
                        onChange={(e) => setNoiseScale(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Intensity */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Intensity</span>
                        <span className="text-brand-cream font-bold">{noiseIntensity.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="2.0" step="0.1" value={noiseIntensity}
                        onChange={(e) => setNoiseIntensity(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Octaves */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Octaves</span>
                        <span className="text-brand-cream font-bold">{noiseOctaves}</span>
                      </div>
                      <input 
                        type="range" min="1" max="8" step="1" value={noiseOctaves}
                        onChange={(e) => setNoiseOctaves(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Speed */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Speed</span>
                        <span className="text-brand-cream font-bold">{noiseSpeed.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="5.0" step="0.1" value={noiseSpeed}
                        onChange={(e) => setNoiseSpeed(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Animate and Distort Only Toggles */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-brand-cream/65 uppercase">Animate</span>
                        <input 
                          type="checkbox" checked={noiseAnimate}
                          onChange={(e) => setNoiseAnimate(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-brand-cream/65 uppercase">Distort Only</span>
                        <input 
                          type="checkbox" checked={noiseDistortOnly}
                          onChange={(e) => setNoiseDistortOnly(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setNoiseBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={noiseBrightness}
                          onChange={(e) => setNoiseBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setNoiseContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={noiseContrast}
                          onChange={(e) => setNoiseContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeEffect === 'dots' && (
                  <>
                    {/* Shape */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Shape</label>
                      <select 
                        value={dotsShape}
                        onChange={(e) => setDotsShape(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Circle">Circle</option>
                        <option value="Square">Square</option>
                        <option value="Hexagon">Hexagon</option>
                      </select>
                    </div>

                    {/* Grid Type */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Grid Type</label>
                      <select 
                        value={dotsGridType}
                        onChange={(e) => setDotsGridType(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Square Grid">Square Grid</option>
                        <option value="Isometric Grid">Isometric Grid</option>
                      </select>
                    </div>

                    {/* Size */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Size</span>
                        <span className="text-brand-cream font-bold">{dotsSize.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.2" max="3.0" step="0.1" value={dotsSize}
                        onChange={(e) => setDotsSize(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Spacing */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Spacing</span>
                        <span className="text-brand-cream font-bold">{dotsSpacing.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="10.0" step="0.5" value={dotsSpacing}
                        onChange={(e) => setDotsSpacing(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Invert */}
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-brand-cream/65 uppercase">Invert</span>
                      <input 
                        type="checkbox" checked={dotsInvert}
                        onChange={(e) => setDotsInvert(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                      />
                    </div>

                    {/* Adjustments */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setDotsBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={dotsBrightness}
                          onChange={(e) => setDotsBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setDotsContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={dotsContrast}
                          onChange={(e) => setDotsContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Mode */}
                    <div className="flex items-center justify-between font-mono text-[10px] mt-1">
                      <span className="text-brand-cream/60">Color Mode</span>
                      <select 
                        value={dotsColorMode}
                        onChange={(e) => setDotsColorMode(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none"
                      >
                        <option value="Original">Original</option>
                        <option value="Mono">Mono</option>
                        <option value="Palette">Palette</option>
                      </select>
                    </div>
                  </>
                )}

                {activeEffect === 'contour' && (
                  <>
                    {/* Fill Mode */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Fill Mode</label>
                      <select 
                        value={contourFillMode}
                        onChange={(e) => setContourFillMode(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Filled Bands">Filled Bands</option>
                        <option value="Lines Only">Lines Only</option>
                        <option value="Filled Lines">Filled Lines</option>
                      </select>
                    </div>

                    {/* Levels */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Levels</span>
                        <span className="text-brand-cream font-bold">{contourLevels}</span>
                      </div>
                      <input 
                        type="range" min="2" max="32" step="1" value={contourLevels}
                        onChange={(e) => setContourLevels(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Line Thickness */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Line Thickness</span>
                        <span className="text-brand-cream font-bold">{contourLineThickness.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="5.0" step="0.5" value={contourLineThickness}
                        onChange={(e) => setContourLineThickness(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Invert */}
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-brand-cream/65 uppercase">Invert</span>
                      <input 
                        type="checkbox" checked={contourInvert}
                        onChange={(e) => setContourInvert(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                      />
                    </div>

                    {/* Adjustments */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setContourBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={contourBrightness}
                          onChange={(e) => setContourBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setContourContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={contourContrast}
                          onChange={(e) => setContourContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>

                    {/* Color Mode */}
                    <div className="flex items-center justify-between font-mono text-[10px] mt-1">
                      <span className="text-brand-cream/60">Color Mode</span>
                      <select 
                        value={contourColorMode}
                        onChange={(e) => setContourColorMode(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/10 text-brand-cream text-[9px] p-1 rounded focus:outline-none"
                      >
                        <option value="Original">Original</option>
                        <option value="Mono">Mono</option>
                        <option value="Palette">Palette</option>
                      </select>
                    </div>
                  </>
                )}

                {activeEffect === 'pixel-sort' && (
                  <>
                    {/* Direction */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Direction</label>
                      <select 
                        value={sortDirection}
                        onChange={(e) => setSortDirection(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Horizontal">Horizontal</option>
                        <option value="Vertical">Vertical</option>
                      </select>
                    </div>

                    {/* Sort Mode */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Sort Mode</label>
                      <select 
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Brightness">Brightness</option>
                        <option value="Contrast">Contrast</option>
                        <option value="Hue">Hue</option>
                        <option value="Saturation">Saturation</option>
                      </select>
                    </div>

                    {/* Threshold */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Threshold</span>
                        <span className="text-brand-cream font-bold">{sortThreshold.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.1" value={sortThreshold}
                        onChange={(e) => setSortThreshold(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Streak Length */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Streak Length</span>
                        <span className="text-brand-cream font-bold">{sortStreakLength}</span>
                      </div>
                      <input 
                        type="range" min="10" max="500" step="10" value={sortStreakLength}
                        onChange={(e) => setSortStreakLength(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Intensity */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Intensity</span>
                        <span className="text-brand-cream font-bold">{sortIntensity.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.1" value={sortIntensity}
                        onChange={(e) => setSortIntensity(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Randomness */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Randomness</span>
                        <span className="text-brand-cream font-bold">{sortRandomness.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.1" value={sortRandomness}
                        onChange={(e) => setSortRandomness(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Reverse */}
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-brand-cream/65 uppercase">Reverse</span>
                      <input 
                        type="checkbox" checked={sortReverse}
                        onChange={(e) => setSortReverse(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                      />
                    </div>

                    {/* Adjustments */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setSortBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={sortBrightness}
                          onChange={(e) => setSortBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setSortContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={sortContrast}
                          onChange={(e) => setSortContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeEffect === 'voronoi' && (
                  <>
                    {/* Cell Size */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Cell Size</span>
                        <span className="text-brand-cream font-bold">{voronoiCellSize}</span>
                      </div>
                      <input 
                        type="range" min="5" max="200" step="1" value={voronoiCellSize}
                        onChange={(e) => setVoronoiCellSize(parseInt(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Edge Width */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Edge Width</span>
                        <span className="text-brand-cream font-bold">{voronoiEdgeWidth.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="5.0" step="0.1" value={voronoiEdgeWidth}
                        onChange={(e) => setVoronoiEdgeWidth(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Edge Color */}
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-brand-cream/60 uppercase">Edge Color</span>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="color" value={voronoiEdgeColor} 
                          onChange={(e) => setVoronoiEdgeColor(e.target.value)}
                          className="w-5 h-5 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                        />
                        <span className="text-[9px]">{voronoiEdgeColor.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Color Mode */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-brand-cream/60 uppercase">Color Mode</label>
                      <select 
                        value={voronoiColorMode}
                        onChange={(e) => setVoronoiColorMode(e.target.value)}
                        className="bg-brand-dark border border-brand-cream/15 text-brand-cream text-[11px] p-2 rounded focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="Cell Average">Cell Average</option>
                        <option value="Center Sample">Center Sample</option>
                        <option value="Gradient">Gradient</option>
                      </select>
                    </div>

                    {/* Randomize */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Randomize</span>
                        <span className="text-brand-cream font-bold">{voronoiRandomize.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.05" value={voronoiRandomize}
                        onChange={(e) => setVoronoiRandomize(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setVoronoiBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={voronoiBrightness}
                          onChange={(e) => setVoronoiBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setVoronoiContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={voronoiContrast}
                          onChange={(e) => setVoronoiContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeEffect === 'vhs' && (
                  <>
                    {/* Distortion */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Distortion</span>
                        <span className="text-brand-cream font-bold">{vhsDistortion.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="2.0" step="0.1" value={vhsDistortion}
                        onChange={(e) => setVhsDistortion(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Noise */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Noise</span>
                        <span className="text-brand-cream font-bold">{vhsNoise.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.05" value={vhsNoise}
                        onChange={(e) => setVhsNoise(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Color Bleed */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Color Bleed</span>
                        <span className="text-brand-cream font-bold">{vhsColorBleed.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="2.0" step="0.1" value={vhsColorBleed}
                        onChange={(e) => setVhsColorBleed(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Scanlines */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Scanlines</span>
                        <span className="text-brand-cream font-bold">{vhsScanlines.toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.1" value={vhsScanlines}
                        onChange={(e) => setVhsScanlines(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Tracking Error */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-brand-cream/60 uppercase">Tracking Error</span>
                        <span className="text-brand-cream font-bold">{vhsTrackingError.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" min="0.0" max="1.0" step="0.05" value={vhsTrackingError}
                        onChange={(e) => setVhsTrackingError(parseFloat(e.target.value))}
                        className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Adjustments: Brightness, Contrast */}
                    <div className="border border-brand-cream/10 p-2 rounded bg-brand-dark/20 flex flex-col gap-2 mt-1 font-mono text-[9px]">
                      <span className="text-brand-cream/45 uppercase tracking-wider">— Adjustments</span>
                      
                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Brightness</span>
                          <button onClick={() => setVhsBrightness(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={vhsBrightness}
                          onChange={(e) => setVhsBrightness(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                          <span>Contrast</span>
                          <button onClick={() => setVhsContrast(0)} className="text-[7px] hover:underline text-brand-cream/40">reset</button>
                        </div>
                        <input 
                          type="range" min="-100" max="100" value={vhsContrast}
                          onChange={(e) => setVhsContrast(parseInt(e.target.value))}
                          className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* BASIC ADJUSTMENTS */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('adjustments')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span>— Adjustments</span>
              <Sliders className="w-3.5 h-3.5 text-brand-cream/60" />
            </button>

            {sidebarExpanded.adjustments && (
              <div className="flex flex-col gap-3.5 mt-3">
                
                {/* Brightness */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-brand-cream/60 uppercase flex items-center gap-1">
                      <Sun className="w-3 h-3 text-brand-cream/50" />
                      Brightness
                    </span>
                    <button onClick={() => setBrightness(0)} className="text-[8px] hover:underline text-brand-cream/40">reset</button>
                  </div>
                  <input 
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                  />
                </div>

                {/* Contrast */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-brand-cream/60 uppercase flex items-center gap-1">
                      <Contrast className="w-3 h-3 text-brand-cream/50" />
                      Contrast
                    </span>
                    <button onClick={() => setContrast(0)} className="text-[8px] hover:underline text-brand-cream/40">reset</button>
                  </div>
                  <input 
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                  />
                </div>

                {/* Gamma */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-brand-cream/60 uppercase">Gamma</span>
                    <button onClick={() => setGamma(1.0)} className="text-[8px] hover:underline text-brand-cream/40">reset</button>
                  </div>
                  <input 
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={gamma}
                    onChange={(e) => setGamma(parseFloat(e.target.value))}
                    className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                  />
                </div>

                {/* Sharpen */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-brand-cream/60 uppercase">Sharpen</span>
                    <button onClick={() => setSharpen(0.0)} className="text-[8px] hover:underline text-brand-cream/40">reset</button>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={sharpen}
                    onChange={(e) => setSharpen(parseFloat(e.target.value))}
                    className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                  />
                </div>

              </div>
            )}
          </div>

          {/* COLOR MODE & PALETTES */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('colorMode')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span>— Color Mode</span>
              <Palette className="w-3.5 h-3.5 text-brand-cream/60" />
            </button>

            {sidebarExpanded.colorMode && (
              <div className="flex flex-col gap-4 mt-3">
                
                {/* Tab layout: Mono, Palette, Full */}
                <div className="grid grid-cols-3 gap-1 bg-brand-dark/40 p-1 rounded border border-brand-cream/10 font-mono text-[10px]">
                  <button
                    onClick={() => setColorMode('mono')}
                    className={`py-1 text-center rounded transition-all cursor-pointer ${
                      colorMode === 'mono' 
                        ? 'bg-brand-cream text-brand-charcoal font-bold' 
                        : 'text-brand-cream/55 hover:text-brand-cream'
                    }`}
                  >
                    Mono
                  </button>
                  <button
                    onClick={() => setColorMode('palette')}
                    className={`py-1 text-center rounded transition-all cursor-pointer ${
                      colorMode === 'palette' 
                        ? 'bg-brand-cream text-brand-charcoal font-bold' 
                        : 'text-brand-cream/55 hover:text-brand-cream'
                    }`}
                  >
                    Palette
                  </button>
                  <button
                    onClick={() => setColorMode('full')}
                    className={`py-1 text-center rounded transition-all cursor-pointer ${
                      colorMode === 'full' 
                        ? 'bg-brand-cream text-brand-charcoal font-bold' 
                        : 'text-brand-cream/55 hover:text-brand-cream'
                    }`}
                  >
                    Full
                  </button>
                </div>

                {/* Sub-modes details */}
                {colorMode === 'mono' && (
                  <div className="grid grid-cols-2 gap-3.5 border border-brand-cream/10 p-2.5 rounded bg-brand-dark/30 select-none">
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[9px] text-brand-cream/50 uppercase">Foreground</label>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="color" 
                          value={foreground}
                          onChange={(e) => setForeground(e.target.value)}
                          className="w-6 h-6 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                        />
                        <span className="font-mono text-[10px] text-brand-cream">{foreground.toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[9px] text-brand-cream/50 uppercase">Background</label>
                      <div className="flex items-center gap-1.5">
                        <input 
                          type="color" 
                          value={background}
                          onChange={(e) => setBackground(e.target.value)}
                          className="w-6 h-6 border border-brand-cream/20 bg-transparent rounded cursor-pointer"
                        />
                        <span className="font-mono text-[10px] text-brand-cream">{background.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {colorMode === 'palette' && (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                      {RETRO_PALETTES.map((pal, idx) => (
                        <button
                          key={pal.name}
                          onClick={() => setSelectedPaletteIndex(idx)}
                          className={`p-1.5 border rounded text-left flex flex-col gap-1 transition-all cursor-pointer ${
                            selectedPaletteIndex === idx 
                              ? 'border-brand-cream bg-brand-cream/10' 
                              : 'border-brand-cream/10 hover:border-brand-cream/25'
                          }`}
                        >
                          <span className="font-mono text-[9px] font-bold text-brand-cream truncate leading-tight">{pal.name}</span>
                          <div className="flex gap-0.5 w-full h-2 rounded overflow-hidden">
                            {pal.colors.map((c, cIdx) => (
                              <div key={cIdx} className="flex-1" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {colorMode === 'full' && (
                  <p className="font-sans text-[10px] text-brand-cream/50 leading-normal italic">
                    💡 Full color dithering renders 3-bit channels (8 core primary CRT hues).
                  </p>
                )}

              </div>
            )}
          </div>

          {/* CHROMATIC DISPLACEMENTS (ABERRATION) */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('chromatic')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span>— Chromatic Effects</span>
              <span className="font-mono text-[9px] text-brand-cream/40">{chromaticEnabled ? 'ACTIVE' : 'MUTED'}</span>
            </button>

            {sidebarExpanded.chromatic && (
              <div className="flex flex-col gap-3.5 mt-3">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-brand-cream/65 uppercase">Enabled</span>
                  <input 
                    type="checkbox"
                    checked={chromaticEnabled}
                    onChange={(e) => setChromaticEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-mono text-[10px]">
                    <span className="text-brand-cream/60 uppercase">Max Displace</span>
                    <span className="text-brand-cream font-bold">{maxDisplace}px</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="15"
                    value={maxDisplace}
                    onChange={(e) => setMaxDisplace(parseInt(e.target.value))}
                    disabled={!chromaticEnabled}
                    className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none disabled:opacity-40"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-center border border-brand-cream/5 p-2 rounded bg-brand-dark/20">
                  <div>
                    <span className="block text-brand-cream/45">R Channel</span>
                    <span className="block font-bold mt-1 text-red-400">23</span>
                  </div>
                  <div>
                    <span className="block text-brand-cream/45">G Channel</span>
                    <span className="block font-bold mt-1 text-green-400">50</span>
                  </div>
                  <div>
                    <span className="block text-brand-cream/45">B Channel</span>
                    <span className="block font-bold mt-1 text-blue-400">80</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ADVANCED IMAGE PROCESSING */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('processing')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span>— Processing</span>
              <Settings className="w-3.5 h-3.5 text-brand-cream/60" />
            </button>

            {sidebarExpanded.processing && (
              <div className="flex flex-col gap-3.5 mt-3 font-mono text-[11px]">
                
                <div className="flex items-center justify-between">
                  <span className="text-brand-cream/65 uppercase">Invert</span>
                  <input 
                    type="checkbox"
                    checked={invert}
                    onChange={(e) => setInvert(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-brand-cream/60 uppercase">Blur</span>
                  <span className="text-brand-cream font-bold">{blur.toFixed(1)}</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="4"
                  step="0.5"
                  value={blur}
                  onChange={(e) => setBlur(parseFloat(e.target.value))}
                  className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                />

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-brand-cream/60 uppercase">Edge Enhance</span>
                  <span className="text-brand-cream font-bold">{edgeEnhance}</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="10"
                  value={edgeEnhance}
                  onChange={(e) => setEdgeEnhance(parseInt(e.target.value))}
                  className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                />

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-brand-cream/60 uppercase">Quantize Colors</span>
                  <span className="text-brand-cream font-bold">{quantizeColors}</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="16"
                  value={quantizeColors}
                  onChange={(e) => setQuantizeColors(parseInt(e.target.value))}
                  className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1.5 rounded-lg appearance-none"
                />

              </div>
            )}
          </div>

          {/* CRT SCREEN / POST-PROCESSING GLOWS */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('postProcessing')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span>— Post-Processing</span>
              <Tv className="w-3.5 h-3.5 text-brand-cream/60" />
            </button>

            {sidebarExpanded.postProcessing && (
              <div className="flex flex-col gap-3 mt-3 font-mono text-[10px]">
                
                <div className="flex items-center justify-between">
                  <span className="text-brand-cream/65 uppercase">CRT Scanlines</span>
                  <input 
                    type="checkbox"
                    checked={scanlinesEnabled}
                    onChange={(e) => setScanlinesEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-brand-cream/65 uppercase">Vignette Overlay</span>
                  <input 
                    type="checkbox"
                    checked={vignetteEnabled}
                    onChange={(e) => setVignetteEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-brand-cream/65 uppercase">CRT Curve warp</span>
                  <input 
                    type="checkbox"
                    checked={crtCurveEnabled}
                    onChange={(e) => setCrtCurveEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-brand-cream/65 uppercase">Phosphor bloom</span>
                  <input 
                    type="checkbox"
                    checked={phosphorEnabled}
                    onChange={(e) => setPhosphorEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-brand-cream/65 uppercase">Film Grain</span>
                  <input 
                    type="checkbox"
                    checked={grainEnabled}
                    onChange={(e) => setGrainEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-cream/30 text-brand-charcoal accent-brand-cream cursor-pointer"
                  />
                </div>

                {grainEnabled && (
                  <div className="flex flex-col gap-2 p-2 border border-brand-cream/10 rounded bg-brand-dark/20 mt-1 select-none">
                    <div className="flex justify-between items-center text-[8px]">
                      <span className="text-brand-cream/55 uppercase">Grain Intensity</span>
                      <span className="text-brand-cream">{grainIntensity}</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="80"
                      value={grainIntensity}
                      onChange={(e) => setGrainIntensity(parseInt(e.target.value))}
                      className="accent-brand-cream cursor-pointer w-full bg-brand-dark h-1 rounded appearance-none"
                    />
                  </div>
                )}

              </div>
            )}
          </div>

          {/* EXPORTS / SOURCE DOWNLOAD */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <button 
              onClick={() => toggleSection('export')}
              className="w-full flex items-center justify-between font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2 cursor-pointer border-b border-brand-cream/10 pb-1.5"
            >
              <span>— Export</span>
              <Download className="w-3.5 h-3.5 text-brand-cream/60" />
            </button>

            {sidebarExpanded.export && (
              <div className="flex flex-col gap-3 mt-3">
                
                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[9px] text-brand-cream/50 uppercase">Output Format</label>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                    {['png', 'jpg'].map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`py-1 text-center border rounded transition-all cursor-pointer ${
                          exportFormat === format 
                            ? 'bg-brand-cream text-brand-charcoal border-brand-cream font-bold' 
                            : 'border-brand-cream/10 text-brand-cream/70 hover:bg-brand-dark/30'
                        }`}
                      >
                        .{format.toUpperCase()}
                      </button>
                    ))}
                    {EFFECT_CAPABILITIES[activeEffect]?.supportsSVG && (
                      <button
                        onClick={() => setExportFormat('svg')}
                        className={`py-1 text-center border rounded transition-all cursor-pointer ${
                          exportFormat === 'svg' 
                            ? 'bg-brand-cream text-brand-charcoal border-brand-cream font-bold' 
                            : 'border-brand-cream/10 text-brand-cream/70 hover:bg-brand-dark/30'
                        }`}
                      >
                        .SVG
                      </button>
                    )}
                    {EFFECT_CAPABILITIES[activeEffect]?.supportsTXT && (
                      <button
                        onClick={() => setExportFormat('txt')}
                        className={`py-1 text-center border rounded transition-all cursor-pointer ${
                          exportFormat === 'txt' 
                            ? 'bg-brand-cream text-brand-charcoal border-brand-cream font-bold' 
                            : 'border-brand-cream/10 text-brand-cream/70 hover:bg-brand-dark/30'
                        }`}
                      >
                        .TXT
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  onClick={triggerDownload}
                  className="w-full py-2 bg-brand-cream hover:bg-brand-light text-brand-charcoal font-pixel text-[10px] font-bold rounded flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer mt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORT SOURCE IMAGE</span>
                </button>

              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Workstage, comparing original vs processed (lg:col-span-8) */}
        <div className={`${sidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-4 transition-all duration-300`}>
          
          {/* Main Visual Display Screen */}
          <div 
            ref={containerRef}
            id="retro-stage-container"
            tabIndex={previewMode.startsWith('split') ? 0 : undefined}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHoveringContainer(true)}
            onMouseLeave={() => {
              setIsHoveringContainer(false);
              setIsDraggingSplit(false);
            }}
            onMouseDown={handleContainerMouseDownOrTouch}
            onTouchStart={handleContainerMouseDownOrTouch}
            onDoubleClick={handleContainerDoubleClick}
            className={`w-full aspect-[4/3] md:aspect-[16/10] bg-brand-dark border-2 border-brand-cream rounded-xl relative overflow-hidden flex items-center justify-center shadow-inner group select-none outline-none focus-within:ring-2 focus-within:ring-brand-cream/40 transition-all ${
              previewMode.startsWith('split') ? (previewMode === 'split-vertical' ? 'cursor-ew-resize' : 'cursor-ns-resize') : 'cursor-default'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Real Hidden Canvas for processing source */}
            <canvas ref={sourceCanvasRef} className="hidden" />

            {/* Simulated TV / CRT scanline glass reflection */}
            <div className={`absolute inset-0 pointer-events-none z-20 ${scanlinesEnabled ? 'bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.18)_50%)] bg-[length:100%_4px]' : ''}`} />
            {vignetteEnabled && (
              <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(circle,_transparent_60%,_rgba(0,0,0,0.55)_100%)]" />
            )}

            {/* CRT Curved warping distortion wrapper */}
            <div className={`w-full h-full flex items-center justify-center ${crtCurveEnabled ? 'scale-95 [transform:perspective(1000px)_rotateX(0deg)_rotateY(0deg)_scale(1.02)] [clip-path:ellipse(100%_100%_at_50%_50%)]' : ''}`}>
              
              {/* Display either compare split slider or active processed Canvas */}
              {/* Display either compare split slider or active processed Canvas */}
              {previewMode !== 'processed' ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Original image underlay */}
                  <img 
                    src={selectedImage} 
                    alt="Original Source" 
                    className={`w-full h-full object-contain pointer-events-none select-none ${previewMode === 'original' ? 'z-30' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                  {/* Processed image clipped by compareSplit range */}
                  {previewMode.startsWith('split') && (
                    <div 
                      ref={splitContainerRef}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                      style={{ 
                        clipPath: previewMode === 'split-vertical' 
                          ? `polygon(0 0, ${compareSplit}% 0, ${compareSplit}% 100%, 0 100%)`
                          : `polygon(0 0, 100% 0, 100% ${compareSplit}%, 0 ${compareSplit}%)`
                      }}
                    >
                      <canvas 
                        ref={outputCanvasRef} 
                        className={`w-full h-full object-contain ${phosphorEnabled ? 'blur-[0.5px] saturate-125 brightness-110' : ''}`}
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <canvas 
                  ref={outputCanvasRef} 
                  className={`max-w-full max-h-full object-contain ${phosphorEnabled ? 'blur-[0.5px] saturate-125 brightness-110' : ''}`}
                  style={{ imageRendering: 'pixelated' }}
                />
              )}

            </div>

            {/* Loading Indicator Spinner overlay */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-brand-dark/70 backdrop-blur-xs flex flex-col items-center justify-center z-30 font-pixel text-xs text-brand-cream/80 gap-3"
                >
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-cream" />
                  <span className="uppercase tracking-wider">Quantizing Gradients...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive hover instruction overlay when empty */}
            {!selectedImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-brand-charcoal z-10 select-none">
                <Upload className="w-8 h-8 text-brand-cream/40 mb-3 animate-bounce" />
                <h3 className="font-pixel text-[11px] text-brand-cream uppercase tracking-wider">Drag & Drop Source Image</h3>
                <p className="font-sans text-[10px] text-brand-cream/50 mt-1.5 max-w-xs">
                  Supports PNG, JPEG, and WebP assets up to 10MB. Or select one of our premium preset frames below.
                </p>
              </div>
            )}

            {/* Compare Line & Interactive Handle overlays */}
            {compareMode && selectedImage && (
              <>
                {/* Vertical Divider line */}
                <div 
                  ref={splitDividerRef}
                  className="absolute top-0 bottom-0 w-[2px] bg-brand-cream/80 z-25 pointer-events-none shadow-[0_0_8px_rgba(255,253,240,0.5)]"
                  style={{ left: `${compareSplit}%` }}
                />
                
                {/* Drag Handle button */}
                <div 
                  ref={splitHandleRef}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-charcoal border-2 border-brand-cream flex items-center justify-center shadow-[0_0_12px_rgba(0,0,0,0.5),_0_0_4px_rgba(255,253,240,0.2)] z-30 transition-transform select-none ${
                    isDraggingSplit ? 'scale-115 border-brand-cream' : 'hover:scale-105 border-brand-cream/80'
                  }`}
                  style={{ left: `${compareSplit}%` }}
                >
                  <Move className="w-3.5 h-3.5 text-brand-cream" />
                </div>
                
                {/* Floating labels indicating each side */}
                <div 
                  className={`absolute top-4 left-4 font-mono text-[9px] bg-brand-charcoal/90 border border-brand-cream/20 px-2 py-1 text-brand-cream rounded-md z-25 select-none uppercase tracking-wider transition-opacity duration-300 ${
                    isHoveringContainer || isDraggingSplit ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  DITHERED // {algorithm}
                </div>
                <div 
                  className={`absolute top-4 right-4 font-mono text-[9px] bg-brand-charcoal/90 border border-brand-cream/20 px-2 py-1 text-brand-cream/60 rounded-md z-25 select-none uppercase tracking-wider transition-opacity duration-300 ${
                    isHoveringContainer || isDraggingSplit ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  ORIGINAL
                </div>

                {/* Floating pill controller at the bottom */}
                <div 
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 bg-brand-charcoal/95 border border-brand-cream/25 px-3 py-1.5 rounded-lg shadow-lg select-none"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <span className="font-mono text-[8px] text-brand-cream/50 uppercase">Split:</span>
                  <span ref={splitTextRef} className="font-mono text-[9px] text-brand-cream font-bold w-7 text-right">{Math.round(compareSplit)}%</span>
                  <input 
                    ref={splitInputRef}
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={compareSplit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCompareSplit(val);
                      comparePctRef.current = val;
                    }}
                    className="w-20 h-1 accent-brand-cream cursor-ew-resize bg-brand-dark rounded-lg appearance-none"
                  />
                </div>
              </>
            )}

            {previewMode === 'processed' && (
              /* Visual floating tags indicating matrix layout */
              <div className="absolute top-4 left-4 font-mono text-[9px] bg-brand-charcoal/80 border border-brand-cream/20 px-2 py-1 text-brand-cream/70 rounded z-10 select-none uppercase">
                GRID: {matrixSize} // {algorithm}
              </div>
            )}

            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="absolute top-4 right-4 font-mono text-[9px] bg-brand-red/90 hover:bg-brand-red border border-brand-red-dark px-2.5 py-1 text-brand-cream rounded z-30 select-none uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md"
                title="Expand Sidebar Panels"
              >
                <ChevronRight className="w-3 h-3" />
                <span>EXPAND SIDEBAR</span>
              </button>
            )}

          </div>

          {/* Quick comparator & file selection row */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Compare Mode Selector */}
            <div className="flex items-center gap-2 select-none bg-brand-dark/50 p-1.5 rounded-lg border border-brand-cream/10 hidden md:flex">
              <button 
                onClick={() => setPreviewMode('processed')}
                className={`px-3 py-1.5 text-[10px] font-mono rounded uppercase transition-colors ${previewMode === 'processed' ? 'bg-brand-cream text-brand-charcoal font-bold shadow' : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/5'}`}
              >Processed</button>
              <button 
                onClick={() => setPreviewMode('original')}
                className={`px-3 py-1.5 text-[10px] font-mono rounded uppercase transition-colors ${previewMode === 'original' ? 'bg-brand-cream text-brand-charcoal font-bold shadow' : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/5'}`}
              >Original</button>
              <button 
                onClick={() => setPreviewMode('split-vertical')}
                className={`px-3 py-1.5 text-[10px] font-mono rounded uppercase transition-colors ${previewMode === 'split-vertical' ? 'bg-brand-cream text-brand-charcoal font-bold shadow' : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/5'}`}
              >Split (V)</button>
              <button 
                onClick={() => setPreviewMode('split-horizontal')}
                className={`px-3 py-1.5 text-[10px] font-mono rounded uppercase transition-colors ${previewMode === 'split-horizontal' ? 'bg-brand-cream text-brand-charcoal font-bold shadow' : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/5'}`}
              >Split (H)</button>
            </div>
            {/* Mobile simplified view */}
            <div className="flex md:hidden items-center gap-3.5 select-none">
              <span className="font-pixel text-[10px] text-brand-cream/70 uppercase">Preview</span>
              <button
                onClick={() => setPreviewMode(previewMode.startsWith('split') ? 'processed' : 'split-vertical')}
                className={`w-12 h-6 rounded-full p-0.5 transition-all cursor-pointer border ${
                  previewMode.startsWith('split') ? 'bg-brand-cream border-brand-cream' : 'bg-brand-dark/50 border-brand-cream/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full transition-all ${
                  previewMode.startsWith('split') ? 'bg-brand-charcoal translate-x-6' : 'bg-brand-cream'
                }`} />
              </button>
            </div>

            {/* Custom File Upload Input */}
            <div className="flex items-center gap-3">
              <label 
                htmlFor="retro-lab-file" 
                className="px-4 py-2 border border-brand-cream/20 hover:border-brand-cream text-brand-cream hover:bg-brand-cream/10 rounded font-pixel text-[10px] uppercase cursor-pointer flex items-center gap-2 transition-all active:scale-95 shadow"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Image</span>
              </label>
              <input 
                type="file" 
                id="retro-lab-file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden" 
              />
            </div>

          </div>

          {/* Quick Preset selection list */}
          <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4">
            <h4 className="font-pixel text-[9px] text-brand-cream/50 uppercase mb-3">Or choose a platform demo frame:</h4>
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_IMAGES.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`border rounded-lg overflow-hidden relative aspect-[16/10] group transition-all cursor-pointer flex flex-col justify-end ${
                    selectedImage === img.url 
                      ? 'border-brand-cream shadow-md scale-[1.02]' 
                      : 'border-brand-cream/10 hover:border-brand-cream/30'
                  }`}
                >
                  <img 
                    src={img.url} 
                    alt={img.name} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/95 via-transparent to-transparent z-10" />
                  <span className="relative z-20 font-mono text-[9px] font-bold text-brand-cream/80 p-2 truncate w-full text-left">
                    {img.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Theoretical Info Section explaining Dithering to user */}
          <div className="bg-brand-charcoal/50 border border-brand-cream/10 rounded-xl p-4">
            <h4 className="font-pixel text-[10px] text-brand-cream flex items-center gap-1.5 uppercase">
              <Info className="w-3.5 h-3.5 text-brand-cream/70" />
              <span>Dithering Explanation</span>
            </h4>
            <p className="font-sans text-[11px] text-brand-cream/65 leading-relaxed mt-2">
              Dithering simulates high-depth palettes on limited screens (e.g. 1-bit Macintosh or 2-bit GameBoy) by spreading micro quantization errors in structured bayer checkerboards or noise patterns. The human eye naturally blends adjacent dots to perceive intermediate tonal spectrums!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
