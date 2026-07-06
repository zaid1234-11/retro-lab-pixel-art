import React from 'react';
import { Home, Image as ImageIcon, Award, User, Castle, Tv, X } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

export default function MobileDrawer({ isOpen, onClose, currentView, setCurrentView }: MobileDrawerProps) {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'home', label: 'Home Feed', icon: Home },
    { id: 'gallery', label: 'Retro Gallery', icon: ImageIcon },
    { id: 'retro-lab', label: 'Retro Shader Lab', icon: Tv },
    { id: 'contests', label: 'Art Contests', icon: Award },
    { id: 'profile', label: 'Artist Profile', icon: User },
  ];

  const handleSelect = (viewId: string) => {
    setCurrentView(viewId);
    onClose();
  };

  return (
    <>
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-brand-dark/80 backdrop-blur-xs z-[100] transition-opacity" 
      />

      {/* Slide-out side navigation panel */}
      <div className="fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-brand-charcoal border-r border-brand-cream/15 z-[101] shadow-2xl flex flex-col justify-between animate-slideInLeft select-none">
        <div>
          {/* Header area */}
          <div className="p-5 border-b border-brand-cream/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 border border-brand-red/35 bg-brand-red/10 rounded">
                <Castle className="w-4 h-4 text-brand-red animate-pulse" />
              </div>
              <span className="font-pixel text-[10px] tracking-wider text-brand-cream uppercase font-bold">PIX_RCKT HUB</span>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg border border-brand-cream/10 text-brand-cream/60 hover:text-brand-cream hover:bg-brand-dark/50 cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links with large touch targets >= 44px */}
          <div className="p-4 space-y-2">
            <span className="font-pixel text-[8px] text-brand-cream/35 tracking-widest block mb-4 uppercase">MAIN CONSOLE</span>
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-brand-red text-brand-cream border-brand-red shadow-lg font-bold' 
                      : 'bg-brand-dark/20 text-brand-cream/70 border-brand-cream/5 hover:text-brand-cream hover:bg-brand-dark/50 hover:border-brand-cream/10'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-brand-cream' : 'text-brand-cream/50'}`} />
                  <span className="font-pixel text-[10px] tracking-wider uppercase mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand footer area */}
        <div className="p-5 border-t border-brand-cream/10 bg-brand-dark/30 text-center">
          <span className="font-mono text-[8px] text-brand-cream/30 block tracking-widest uppercase">PIX_RCKT ENG_V1.04</span>
          <span className="font-sans text-[9px] text-brand-cream/40 block mt-1">Polar Crimson & Coal Gallery Theme</span>
        </div>
      </div>
    </>
  );
}
