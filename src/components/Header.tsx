import React from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
  showMenuButton?: boolean;
}

export default function Header({ onMenuToggle, isMenuOpen, showMenuButton = false }: HeaderProps) {
  return (
    <header className="relative w-full border-b border-brand-charcoal/20 bg-brand-dark px-4 py-3 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 select-none z-50">
      {/* Pixel Rocket Logo */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
        <div className="flex items-center gap-3">
          <svg
            className="w-12 h-12 text-brand-cream fill-current"
            viewBox="0 0 24 24"
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Custom Pixel Art Rocket Ship Grid */}
            <path d="M11 2h2v2h-2zm-1 2h4v2h-4zm-1 2h6v4h-6zm-1 4h8v2H8zm-1 2h10v4H7zm-1 4h12v2H6zm-2 2h2v2H4zm14 0h2v2h-2zm-12 2h16v1H4z" />
            {/* Flame details */}
            <rect x="11" y="19" width="2" height="2" className="text-orange-500 fill-current" />
            <rect x="9" y="18" width="1" height="1" className="text-orange-400 fill-current" />
            <rect x="14" y="18" width="1" height="1" className="text-orange-400 fill-current" />
          </svg>
          <div>
            <h1 className="font-pixel text-lg tracking-wider text-brand-cream">
              PIX_RCKT
            </h1>
            <span className="font-mono text-[10px] text-brand-cream/60">
              v1.0.4-live
            </span>
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        {showMenuButton && onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="sm:hidden p-2.5 rounded-lg border border-brand-cream/15 bg-brand-charcoal/80 text-brand-cream hover:bg-brand-charcoal transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="font-pixel text-[8px] uppercase tracking-wider hidden xs:inline">menu</span>
          </button>
        )}
      </div>

      {/* Subtitle / English Translation & Design Philosophy */}
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left max-w-md hidden xs:flex">
        <span className="font-mono text-[11px] leading-relaxed text-brand-cream/80 italic">
          "Contrast the artists' masterpieces against deep crimson and warm coal shadows."
        </span>
        <span className="font-sans text-[10px] text-brand-cream/50 mt-1">
          💡 Design Palette: Polar Crimson & Coal - a bold yet supportive gallery theme.
        </span>
      </div>
    </header>
  );
}

