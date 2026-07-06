import React from 'react';
import { Home, Image as ImageIcon, Award, User, Castle, Tv } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function Navigation({ currentView, setCurrentView }: NavigationProps) {
  return (
    <nav className="w-full max-w-5xl mx-auto px-4 mt-6">
      <div className="border border-brand-cream/15 bg-brand-charcoal/80 rounded-full py-1.5 px-3 sm:px-6 flex items-center justify-between sm:justify-center sm:gap-6 md:gap-10 select-none shadow-lg">
        {/* Home Link */}
        <button
          onClick={() => setCurrentView('home')}
          className={`flex items-center gap-1.5 font-pixel text-[11px] tracking-wider uppercase transition-all duration-200 px-3 py-1.5 rounded-full ${
            currentView === 'home'
              ? 'bg-brand-red text-brand-cream scale-105 font-bold shadow-md'
              : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-charcoal/50'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">home</span>
        </button>

        {/* Gallery Link */}
        <button
          onClick={() => setCurrentView('gallery')}
          className={`flex items-center gap-1.5 font-pixel text-[11px] tracking-wider uppercase transition-all duration-200 px-3 py-1.5 rounded-full ${
            currentView === 'gallery'
              ? 'bg-brand-red text-brand-cream scale-105 font-bold shadow-md'
              : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-charcoal/50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">gallery</span>
        </button>

        {/* Retro Lab Link */}
        <button
          onClick={() => setCurrentView('retro-lab')}
          className={`flex items-center gap-1.5 font-pixel text-[11px] tracking-wider uppercase transition-all duration-200 px-3 py-1.5 rounded-full ${
            currentView === 'retro-lab'
              ? 'bg-brand-red text-brand-cream scale-105 font-bold shadow-md'
              : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-charcoal/50'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">retro lab</span>
        </button>

        {/* Central Lighthouse/Tower Icon (Mockup Centerpiece) */}
        <div className="flex items-center justify-center p-1.5 border border-brand-red/35 bg-brand-red/10 rounded-md shadow-md mx-1 sm:mx-2 animate-pulse text-brand-red">
          <Castle className="w-4 h-4" />
        </div>

        {/* Contests Link */}
        <button
          onClick={() => setCurrentView('contests')}
          className={`flex items-center gap-1.5 font-pixel text-[11px] tracking-wider uppercase transition-all duration-200 px-3 py-1.5 rounded-full ${
            currentView === 'contests'
              ? 'bg-brand-red text-brand-cream scale-105 font-bold shadow-md'
              : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-charcoal/50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">contests</span>
        </button>

        {/* Profile Link */}
        <button
          onClick={() => setCurrentView('profile')}
          className={`flex items-center gap-1.5 font-pixel text-[11px] tracking-wider uppercase transition-all duration-200 px-3 py-1.5 rounded-full ${
            currentView === 'profile'
              ? 'bg-brand-red text-brand-cream scale-105 font-bold shadow-md'
              : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-charcoal/50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">profile</span>
        </button>
      </div>
    </nav>
  );
}
