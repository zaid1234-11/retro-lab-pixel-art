import React, { useState, useEffect, useRef } from 'react';
import { ToggleLeft, ToggleRight, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type CursorType = 'default' | 'pointer' | 'crosshair' | 'text';

export default function RetroCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorType, setCursorType] = useState<CursorType>('default');
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true); // Can toggle custom cursor on/off

  const cursorRef = useRef<HTMLDivElement | null>(null);

  // Load and save state to local storage
  useEffect(() => {
    const saved = localStorage.getItem('retrolab_custom_cursor');
    if (saved !== null) {
      setIsEnabled(saved === 'true');
    }
  }, []);

  const handleToggle = () => {
    const newVal = !isEnabled;
    setIsEnabled(newVal);
    localStorage.setItem('retrolab_custom_cursor', String(newVal));
    if (!newVal) {
      document.body.classList.remove('cursor-none');
      // Remove from children elements as well
      const interactiveEls = document.querySelectorAll('button, a, input, textarea, select, [role="button"], .cursor-pointer');
      interactiveEls.forEach(el => el.classList.remove('cursor-none'));
    } else {
      document.body.classList.add('cursor-none');
    }
  };

  useEffect(() => {
    if (isEnabled) {
      document.body.classList.add('cursor-none');
    } else {
      document.body.classList.remove('cursor-none');
    }
    return () => {
      document.body.classList.remove('cursor-none');
    };
  }, [isEnabled]);

  // Track mouse coordinates and handle browser boundary events
  useEffect(() => {
    if (!isEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isEnabled, isVisible]);

  // Listen for elements hovered to switch cursor style
  useEffect(() => {
    if (!isEnabled) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if target is interactive (button, links, form inputs)
      const isInteractive = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'SELECT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.cursor-pointer') ||
        target.classList.contains('cursor-pointer');

      // Check if inside canvas, drawing editor, or images
      const isCanvas = 
        target.tagName === 'CANVAS' ||
        target.closest('canvas') ||
        target.closest('.pixel-cell') ||
        target.classList.contains('pixel-cell') ||
        target.tagName === 'IMG' ||
        target.closest('img') ||
        target.closest('.interactive-canvas-container');

      // Check if target is text input
      const isText = 
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'button' && (target as HTMLInputElement).type !== 'submit') ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('.is-text-target');

      setIsHovered(isInteractive || isCanvas || isText);

      if (isText) {
        setCursorType('text');
      } else if (isCanvas) {
        setCursorType('crosshair');
      } else if (isInteractive) {
        setCursorType('pointer');
      } else {
        setCursorType('default');
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [isEnabled]);

  if (!isEnabled || !isVisible) {
    // Add global style when cursor is active to ensure standard cursors are hidden
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1.5 bg-brand-charcoal hover:bg-brand-dark border border-brand-cream/15 text-brand-cream/70 hover:text-brand-cream px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          title="Enable Retro Custom Pixel Cursor"
        >
          <ToggleLeft className="w-4 h-4 text-brand-cream/30" />
          <span>PIXEL CURSOR: OFF</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Absolute floating cursor element */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999] top-0 left-0 mix-blend-difference"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          // Offset adjustments depending on cursor hot-spot
          marginTop: cursorType === 'crosshair' ? '-12px' : cursorType === 'text' ? '-12px' : '0px',
          marginLeft: cursorType === 'crosshair' ? '-12px' : cursorType === 'text' ? '-6px' : '0px',
        }}
      >
        <div className="relative animate-fadeIn duration-100">
          {/* Default Pixelated Arrow */}
          {cursorType === 'default' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ shapeRendering: 'crispEdges' }}>
              {/* Outer shadow border */}
              <path d="M0 0 H5 V2 H7 V4 H9 V6 H11 V8 H13 V10 H15 V12 H17 V14 H11 V16 H8 V19 H5 V12 H0 Z" fill="#000000" />
              <path d="M5 12 L0 17 V24 H7 L12 19 Z" fill="#000000" />
              {/* White interior */}
              <path d="M2 2 H4 V4 H6 V6 H8 V8 H10 V10 H12 V12 H14 V13 H10 V15 H7 V18 H5 V12 H2 Z" fill="#FAF6F2" />
              {/* Crimson Accent */}
              <rect x="4" y="6" width="2" height="2" fill="#9B3135" />
            </svg>
          )}

          {/* Retro Pointing Finger Glove */}
          {cursorType === 'pointer' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ shapeRendering: 'crispEdges' }}>
              {/* Hand Outline */}
              <path d="M6 0 H10 V8 H12 V5 H16 V8 H18 V11 H20 V16 H14 V20 H8 V12 H6 Z" fill="#000000" />
              <path d="M6 12 H2 V16 H6 Z" fill="#000000" />
              {/* Hand Interior */}
              <path d="M8 2 H9 V8 H11 V7 H14 V8 H16 V11 H18 V15 H13 V18 H9 V12 H8 Z" fill="#FAF6F2" />
              <path d="M4 14 H6 V15 H4 Z" fill="#FAF6F2" />
              {/* Crimson cuff lines */}
              <rect x="8" y="16" width="4" height="2" fill="#9B3135" />
            </svg>
          )}

          {/* Custom Pixel Target Crosshair */}
          {cursorType === 'crosshair' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ shapeRendering: 'crispEdges' }}>
              {/* Black Outline */}
              <rect x="11" y="2" width="2" height="6" fill="#000000" />
              <rect x="11" y="16" width="2" height="6" fill="#000000" />
              <rect x="2" y="11" width="6" height="2" fill="#000000" />
              <rect x="16" y="11" width="6" height="2" fill="#000000" />
              {/* Inner Circle outline */}
              <path d="M8 8 H10 V10 H8 Z M14 8 H16 V10 H14 Z M8 14 H10 V16 H8 Z M14 14 H16 V16 H14 Z" fill="#000000" />
              {/* White/Crimson Fill */}
              <rect x="11" y="3" width="2" height="4" fill="#FAF6F2" />
              <rect x="11" y="17" width="2" height="4" fill="#FAF6F2" />
              <rect x="3" y="11" width="4" height="2" fill="#FAF6F2" />
              <rect x="17" y="11" width="4" height="2" fill="#FAF6F2" />
              {/* Center point red dot */}
              <rect x="11" y="11" width="2" height="2" fill="#9B3135" />
            </svg>
          )}

          {/* Vintage I-beam Text Selector */}
          {cursorType === 'text' && (
            <svg width="12" height="24" viewBox="0 0 12 24" fill="none" style={{ shapeRendering: 'crispEdges' }}>
              {/* Top horizontal caps */}
              <rect x="2" y="2" width="8" height="2" fill="#000000" />
              <rect x="3" y="3" width="6" height="2" fill="#FAF6F2" />
              {/* Center column */}
              <rect x="5" y="4" width="2" height="16" fill="#000000" />
              <rect x="5.5" y="5" width="1" height="14" fill="#FAF6F2" />
              {/* Bottom horizontal caps */}
              <rect x="2" y="20" width="8" height="2" fill="#000000" />
              <rect x="3" y="19" width="6" height="2" fill="#FAF6F2" />
              {/* Accent dot */}
              <rect x="5" y="11" width="2" height="2" fill="#9B3135" />
            </svg>
          )}
        </div>
      </div>

      {/* Floating control to toggle custom cursor */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleToggle}
          className="flex items-center gap-1.5 bg-brand-charcoal hover:bg-brand-dark border border-brand-cream/15 text-brand-cream/70 hover:text-brand-cream px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
          title="Disable Retro Custom Pixel Cursor"
        >
          <ToggleRight className="w-4 h-4 text-brand-red animate-pulse" />
          <span>PIXEL CURSOR: ON</span>
        </button>
      </div>
    </>
  );
}
