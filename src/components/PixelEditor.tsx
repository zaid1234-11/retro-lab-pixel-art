import React, { useState, useRef, useEffect } from 'react';
import { Download, Trash2, Edit2, Eraser, PaintBucket, Plus, Check } from 'lucide-react';
import { Category } from '../types';

interface PixelEditorProps {
  onPublish: (newArt: {
    title: string;
    imageUrl: string;
    category: Category;
    dimensions: string;
    tags: string[];
  }) => void;
  initialPalette?: string[];
  initialDimensions?: '16x16' | '32x32';
}

export default function PixelEditor({ onPublish, initialPalette, initialDimensions = '16x16' }: PixelEditorProps) {
  const [gridSize, setGridSize] = useState<'16x16' | '32x32'>(initialDimensions);
  const size = gridSize === '16x16' ? 16 : 32;

  // Initialize empty grid (storing color strings, empty is null)
  const [grid, setGrid] = useState<(string | null)[]>(() => Array(16 * 16).fill(null));

  useEffect(() => {
    setGrid(Array(size * size).fill(null));
  }, [gridSize]);

  // Default color palette
  const defaultColors = [
    '#E8E8C6', // Cream
    '#252525', // Charcoal
    '#474744', // Medium Grey
    '#E54B4B', // Ruby Red
    '#49FF9F', // Forest/Neon Green
    '#00F0FF', // Sky/Neon Blue
    '#FF79C6', // Pastel Pink
    '#F1FA8C', // Sunshine Yellow
    '#BD93F9', // Purple
    '#FFB86C', // Orange
  ];

  const palette = initialPalette || defaultColors;
  const [selectedColor, setSelectedColor] = useState<string>(palette[0]);
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'bucket'>('pencil');

  // Publishing form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('sci-fi');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['PixelCanvas']);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Drag to paint state
  const [isMouseDown, setIsMouseDown] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Bucket Fill algorithm (Flood Fill)
  const floodFill = (startIndex: number, targetColor: string | null, fillColor: string) => {
    if (targetColor === fillColor) return;
    const newGrid = [...grid];
    const queue = [startIndex];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (newGrid[curr] === targetColor) {
        newGrid[curr] = fillColor;

        const row = Math.floor(curr / size);
        const col = curr % size;

        // Neighbors: Top, Bottom, Left, Right
        if (row > 0) queue.push((row - 1) * size + col);
        if (row < size - 1) queue.push((row + 1) * size + col);
        if (col > 0) queue.push(row * size + (col - 1));
        if (col < size - 1) queue.push(row * size + (col + 1));
      }
    }
    setGrid(newGrid);
  };

  const handlePixelAction = (index: number) => {
    const newGrid = [...grid];
    if (tool === 'pencil') {
      newGrid[index] = selectedColor;
      setGrid(newGrid);
    } else if (tool === 'eraser') {
      newGrid[index] = null;
      setGrid(newGrid);
    } else if (tool === 'bucket') {
      floodFill(index, grid[index], selectedColor);
    }
  };

  const handleMouseEnterPixel = (index: number) => {
    if (isMouseDown && tool !== 'bucket') {
      const newGrid = [...grid];
      newGrid[index] = tool === 'pencil' ? selectedColor : null;
      setGrid(newGrid);
    }
  };

  const clearGrid = () => {
    if (window.confirm('Clear your canvas? All unsaved pixel edits will be lost.')) {
      setGrid(Array(size * size).fill(null));
    }
  };

  // Convert pixel grid to data URL image
  const generateImageDataUrl = (): string => {
    const tempCanvas = document.createElement('canvas');
    const scale = 16; // scale up to make image crisp and viewable
    tempCanvas.width = size * scale;
    tempCanvas.height = size * scale;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    // Disable smoothing to preserve sharp pixel boundaries
    ctx.imageSmoothingEnabled = false;

    // Fill background as transparent or solid depending on choice
    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw pixel blocks
    grid.forEach((color, idx) => {
      if (color) {
        const row = Math.floor(idx / size);
        const col = idx % size;
        ctx.fillStyle = color;
        ctx.fillRect(col * scale, row * scale, scale, scale);
      }
    });

    return tempCanvas.toDataURL('image/png');
  };

  const downloadPNG = () => {
    const dataUrl = generateImageDataUrl();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `${title || 'my-pixel-art'}-${size}x${size}.png`;
    link.href = dataUrl;
    link.click();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dataUrl = generateImageDataUrl();
    if (!dataUrl) return;

    onPublish({
      title: title.trim(),
      imageUrl: dataUrl,
      category,
      dimensions: gridSize,
      tags: tags
    });

    setIsPublished(true);
    setTimeout(() => {
      setIsPublished(false);
      setShowPublishForm(false);
      setTitle('');
      setTags(['PixelCanvas']);
    }, 2000);
  };

  return (
    <div className="w-full bg-brand-charcoal border border-brand-cream/20 p-5 rounded-lg select-none">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Draw Area */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-3">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] text-brand-cream/60">GRID SIZE:</span>
              <button
                onClick={() => setGridSize('16x16')}
                className={`px-2 py-0.5 font-mono text-xs border rounded transition-all ${
                  gridSize === '16x16'
                    ? 'bg-brand-cream text-brand-charcoal border-brand-cream'
                    : 'text-brand-cream border-brand-cream/30 hover:border-brand-cream'
                }`}
              >
                16x16
              </button>
              <button
                onClick={() => setGridSize('32x32')}
                className={`px-2 py-0.5 font-mono text-xs border rounded transition-all ${
                  gridSize === '32x32'
                    ? 'bg-brand-cream text-brand-charcoal border-brand-cream'
                    : 'text-brand-cream border-brand-cream/30 hover:border-brand-cream'
                }`}
              >
                32x32
              </button>
            </div>
            <button
              onClick={clearGrid}
              className="text-red-400 hover:text-red-300 transition-all font-mono text-xs flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div
            className="border-4 border-brand-cream bg-brand-dark/90 relative p-1 cursor-crosshair shadow-md overflow-hidden aspect-square w-full max-w-[340px]"
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
          >
            <div
              className="grid gap-[1px] bg-brand-charcoal/40 h-full w-full"
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              }}
            >
              {grid.map((color, index) => (
                <div
                  key={index}
                  onMouseDown={() => handlePixelAction(index)}
                  onMouseEnter={() => handleMouseEnterPixel(index)}
                  className="w-full aspect-square transition-all border border-transparent hover:border-white/30"
                  style={{
                    backgroundColor: color || 'transparent',
                    boxShadow: !color ? 'inset 0 0 1px rgba(232, 232, 198, 0.05)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <p className="font-mono text-[10px] text-brand-cream/40 mt-2 text-center">
            💡 Drag your mouse/finger to draw, click single squares to fill or paint.
          </p>
        </div>

        {/* Toolbar & Palette */}
        <div className="w-full md:w-64 flex flex-col gap-5 justify-between">
          
          {/* Active Tools */}
          <div>
            <h4 className="font-pixel text-[10px] text-brand-cream/60 mb-2 uppercase">Tools</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTool('pencil')}
                className={`py-2 px-3 border rounded flex flex-col items-center justify-center gap-1 transition-all ${
                  tool === 'pencil'
                    ? 'bg-brand-cream text-brand-charcoal border-brand-cream font-bold shadow-md'
                    : 'text-brand-cream/70 border-brand-cream/20 hover:border-brand-cream hover:text-brand-cream'
                }`}
              >
                <Edit2 className="w-4 h-4" />
                <span className="font-mono text-[10px]">Pencil</span>
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`py-2 px-3 border rounded flex flex-col items-center justify-center gap-1 transition-all ${
                  tool === 'eraser'
                    ? 'bg-brand-cream text-brand-charcoal border-brand-cream font-bold shadow-md'
                    : 'text-brand-cream/70 border-brand-cream/20 hover:border-brand-cream hover:text-brand-cream'
                }`}
              >
                <Eraser className="w-4 h-4" />
                <span className="font-mono text-[10px]">Eraser</span>
              </button>
              <button
                onClick={() => setTool('bucket')}
                className={`py-2 px-3 border rounded flex flex-col items-center justify-center gap-1 transition-all ${
                  tool === 'bucket'
                    ? 'bg-brand-cream text-brand-charcoal border-brand-cream font-bold shadow-md'
                    : 'text-brand-cream/70 border-brand-cream/20 hover:border-brand-cream hover:text-brand-cream'
                }`}
              >
                <PaintBucket className="w-4 h-4" />
                <span className="font-mono text-[10px]">Bucket</span>
              </button>
            </div>
          </div>

          {/* Palette Colors */}
          <div>
            <h4 className="font-pixel text-[10px] text-brand-cream/60 mb-2 uppercase">Palette</h4>
            <div className="grid grid-cols-5 gap-2">
              {palette.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    if (tool === 'eraser') setTool('pencil');
                  }}
                  className={`w-full aspect-square rounded border relative transition-all active:scale-95 ${
                    selectedColor === color && tool !== 'eraser'
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-brand-cream/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {selectedColor === color && tool !== 'eraser' && (
                    <span className="absolute inset-0 m-auto w-1.5 h-1.5 bg-brand-dark rounded-full shadow-inner" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 bg-brand-dark/40 border border-brand-cream/10 p-2 rounded">
              <div className="w-6 h-6 rounded border border-brand-cream/30" style={{ backgroundColor: selectedColor }} />
              <span className="font-mono text-xs text-brand-cream/75">{selectedColor}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-brand-cream/15">
            <button
              onClick={downloadPNG}
              className="w-full py-2 px-3 bg-brand-dark hover:bg-brand-dark/80 text-brand-cream border border-brand-cream/30 hover:border-brand-cream rounded flex items-center justify-center gap-2 font-pixel text-[11px] transition-all"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT TO PNG</span>
            </button>

            {!showPublishForm ? (
              <button
                onClick={() => setShowPublishForm(true)}
                className="w-full py-2 px-3 bg-brand-cream hover:bg-brand-cream/90 text-brand-charcoal font-pixel text-[11px] font-bold rounded flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>PUBLISH TO PORTFOLIO</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPublishForm(false)}
                className="w-full py-1.5 text-brand-cream/50 hover:text-brand-cream font-mono text-[11px] text-center"
              >
                Cancel Publish
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Publish Form Overlay/Collapse */}
      {showPublishForm && (
        <form onSubmit={handlePublishSubmit} className="mt-5 p-4 border-t border-brand-cream/15 bg-brand-dark/30 rounded flex flex-col gap-4 animate-fadeIn">
          <h4 className="font-pixel text-[11px] text-brand-cream">Publishing Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] text-brand-cream/50 mb-1">ARTWORK TITLE *</label>
              <input
                type="text"
                required
                placeholder="e.g. Moonlight Alley"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-brand-dark/60 border border-brand-cream/20 hover:border-brand-cream/40 focus:border-brand-cream/70 rounded px-3 py-1.5 text-brand-cream text-xs font-sans outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-brand-cream/50 mb-1">THEME CATEGORY *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-brand-dark/60 border border-brand-cream/20 hover:border-brand-cream/40 focus:border-brand-cream/70 rounded px-3 py-1.5 text-brand-cream text-xs font-sans outline-none"
              >
                <option value="sci-fi">Cyberpunk / Sci-Fi</option>
                <option value="nature">Nature / Landscapes</option>
                <option value="fantasy">Fantasy / Magic</option>
                <option value="coffee">Cozy Coffee / Intimate</option>
                <option value="music-retro">Synth Retro / Audio</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-mono text-[10px] text-brand-cream/50 mb-1">TAGS (PRESS ENTER TO ADD)</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-brand-dark/60 border border-brand-cream/20 rounded min-h-[38px] items-center">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  onClick={() => removeTag(idx)}
                  className="px-2 py-0.5 bg-brand-charcoal text-brand-cream/80 text-[10px] font-mono rounded border border-brand-cream/10 hover:border-red-400/50 hover:text-red-400 cursor-pointer flex items-center gap-1 transition-all"
                  title="Click to remove tag"
                >
                  #{tag}
                  <span className="text-[8px]">×</span>
                </span>
              ))}
              <input
                type="text"
                placeholder={tags.length === 0 ? "e.g. retro, neon" : "add tag..."}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="bg-transparent border-none outline-none text-brand-cream text-xs p-0 flex-1 min-w-[60px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPublished}
            className={`w-full py-2 rounded font-pixel text-xs flex items-center justify-center gap-2 shadow transition-all ${
              isPublished
                ? 'bg-green-500 text-white'
                : 'bg-brand-cream text-brand-charcoal hover:bg-brand-cream/90 font-bold active:scale-98'
            }`}
          >
            {isPublished ? (
              <>
                <Check className="w-4 h-4 animate-bounce" />
                <span>PUBLISHED SUCCESSFULLY!</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>CONFIRM & UPLOAD ARTWORK</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
