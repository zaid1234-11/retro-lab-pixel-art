import React, { useState, useEffect } from 'react';
import { Clock, Flame, Calendar, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Award, Heart, HelpCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PixelEditor from './PixelEditor';
import { Category } from '../types';

// Curated daily prompts with custom retro themes, palettes, and descriptions
interface DailyTheme {
  id: string;
  theme: string;
  description: string;
  dimensions: '16x16' | '32x32';
  palette: string[];
  inspiration: string;
}

const DAILY_THEMES: DailyTheme[] = [
  {
    id: 'cyberpunk-ramen',
    theme: 'Cyberpunk Ramen',
    description: 'A steaming bowl of futuristic street ramen glowing under neon billboards.',
    dimensions: '16x16',
    palette: ['#FF0055', '#00FFCC', '#251F47', '#120024', '#FFFF00', '#FAF6F2'],
    inspiration: 'Use high-contrast cyber-neon colors to make the broth glow, and keep the chopstick lines clean.'
  },
  {
    id: 'gameboy-castle',
    theme: 'Pocket Castle',
    description: 'A micro-castle or dungeon gate styled exactly like a 1989 handheld console screen.',
    dimensions: '16x16',
    palette: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    inspiration: 'Use only these 4 pure green LCD shades. Emphasize grid tiles and light highlights.'
  },
  {
    id: 'synthwave-cassette',
    theme: 'Synthwave Cassette',
    description: 'A classic magnetic tape cassette reflecting a virtual outrun wireframe sunset.',
    dimensions: '32x32',
    palette: ['#FF007F', '#7F00FF', '#00F0FF', '#FFB700', '#14002A', '#E8E8C6'],
    inspiration: 'Draw a neon purple stripe across the front casing and add small light reflections to the reels.'
  },
  {
    id: '8bit-coffee',
    theme: '8-Bit Brew',
    description: 'A steaming hot cup of pixelated coffee with elegant vapor curls rising from it.',
    dimensions: '16x16',
    palette: ['#FAF6F2', '#E29578', '#B07D62', '#83503E', '#1E1E24', '#F4A261'],
    inspiration: 'Animate or design three diagonal blocks of floating white steam pixels rising from the cup.'
  },
  {
    id: 'neon-bonsai',
    theme: 'Neon Bonsai Tree',
    description: 'A spiritual miniature tree growing under the acid neon lights of Neo-Tokyo.',
    dimensions: '32x32',
    palette: ['#39FF14', '#053F5C', '#F27370', '#4E3629', '#080F1D', '#9CA3AF'],
    inspiration: 'Paint leaves in clusters of bright lime green against deep blue and grey backdrop shading.'
  },
  {
    id: 'retro-console',
    theme: 'Classic Game Controller',
    description: 'A vintage console controller with an tactile D-pad and bright primary action buttons.',
    dimensions: '32x32',
    palette: ['#D1D5DB', '#9CA3AF', '#EF4444', '#1F2937', '#FBBF24', '#3B82F6'],
    inspiration: 'Give grey plastic casings a thin dark lower outline to give them immediate retro 3D weight.'
  },
  {
    id: 'sunset-stripes',
    theme: 'Outrun Sunrise',
    description: 'A minimalist low-res outrun sun rising behind majestic dark mountain peaks.',
    dimensions: '16x16',
    palette: ['#FF4E50', '#F9D423', '#E1559E', '#7F00FF', '#111111', '#FAF6F2'],
    inspiration: 'Use horizontal stripes of decreasing thickness in the sun vector to simulate retro CRT scanlines!'
  },
  {
    id: 'space-invader',
    theme: 'Space Invader Sprite',
    description: 'A symmetric alien spacecraft or defensive turret from a classic 1978 arcade cabinet.',
    dimensions: '16x16',
    palette: ['#00FF66', '#007A33', '#111111', '#FFFFFF', '#FF0055', '#3A0CA3'],
    inspiration: 'Ensure pixel-perfect bilateral symmetry (mirrored left and right) to lock in that authentic feel!'
  },
  {
    id: 'pizza-slice',
    theme: 'Arcade Parlor Pizza',
    description: 'A hot slice of pixelated pizza with molten yellow cheese and neon green peppers.',
    dimensions: '16x16',
    palette: ['#FFD166', '#EF476F', '#06D6A0', '#118AB2', '#073B4C', '#FAF6F2'],
    inspiration: 'Add high-contrast circular pepperoni discs and highlight the crust with a crisp light-brown edge.'
  },
  {
    id: 'cyber-deck',
    theme: 'Decker Matrix Terminal',
    description: 'A glowing cyberpunk deck terminal display showing flowing vertical hacker glyphs.',
    dimensions: '32x32',
    palette: ['#00FF00', '#003300', '#001100', '#777777', '#000000', '#39FF14'],
    inspiration: 'Use dark green blocks for screen background lines and scatter bright neon pixels to represent data flow.'
  }
];

export default function DailyPrompt() {
  const [currentPrompt, setCurrentPrompt] = useState<DailyTheme>(DAILY_THEMES[0]);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('00h : 00m : 00s');
  const [streakCount, setStreakCount] = useState<number>(0);
  const [completedToday, setCompletedToday] = useState<boolean>(false);
  const [historyCompletions, setHistoryCompletions] = useState<string[]>([]); // list of YYYY-MM-DD strings
  const [showWorkspace, setShowWorkspace] = useState<boolean>(false);
  const [drawSuccess, setDrawSuccess] = useState<boolean>(false);
  const [savedDrawings, setSavedDrawings] = useState<{ id: string; date: string; title: string; imgUrl: string; promptTheme: string }[]>([]);

  // Get current date string in YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Determine current prompt based on day of the year/month deterministically
  useEffect(() => {
    const dateStr = getTodayDateString();
    
    // Simple deterministic hash based on date string
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % DAILY_THEMES.length;
    setCurrentPrompt(DAILY_THEMES[index]);

    // Load streak metrics & past creations from local storage
    const storedStreak = localStorage.getItem('retrolab_daily_streak');
    const storedHistory = localStorage.getItem('retrolab_daily_history');
    const storedDrawings = localStorage.getItem('retrolab_daily_drawings');

    if (storedStreak) {
      setStreakCount(parseInt(storedStreak, 10));
    }
    
    if (storedHistory) {
      const historyParsed = JSON.parse(storedHistory) as string[];
      setHistoryCompletions(historyParsed);
      if (historyParsed.includes(dateStr)) {
        setCompletedToday(true);
      }
    }

    if (storedDrawings) {
      setSavedDrawings(JSON.parse(storedDrawings));
    }
  }, []);

  // Update Countdown timer to midnight (24h roll over)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight

      const diffMs = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeftStr(
        `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle successful Daily Art submission
  const handleDailySubmit = (newArt: {
    title: string;
    imageUrl: string;
    category: Category;
    dimensions: string;
    tags: string[];
  }) => {
    const todayStr = getTodayDateString();
    
    // Prevent duplicate submission counting on the same day
    let newStreak = streakCount;
    const updatedHistory = [...historyCompletions];
    if (!historyCompletions.includes(todayStr)) {
      updatedHistory.push(todayStr);
      newStreak = streakCount + 1;
      
      // Update states and persistent values
      setStreakCount(newStreak);
      setHistoryCompletions(updatedHistory);
      setCompletedToday(true);
      
      localStorage.setItem('retrolab_daily_streak', String(newStreak));
      localStorage.setItem('retrolab_daily_history', JSON.stringify(updatedHistory));
    }

    // Save actual pixel artwork drawing internally
    const newDrawing = {
      id: `daily-art-${Date.now()}`,
      date: todayStr,
      title: newArt.title || 'Untitled Daily Masterpiece',
      imgUrl: newArt.imageUrl,
      promptTheme: currentPrompt.theme
    };

    const updatedDrawings = [newDrawing, ...savedDrawings];
    setSavedDrawings(updatedDrawings);
    localStorage.setItem('retrolab_daily_drawings', JSON.stringify(updatedDrawings));

    setDrawSuccess(true);
    setTimeout(() => {
      setDrawSuccess(false);
      setShowWorkspace(false);
    }, 2800);
  };

  return (
    <div id="daily-prompt-container" className="mb-10 w-full">
      {/* Container Box */}
      <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-5 md:p-6 shadow-lg relative overflow-hidden transition-all hover:border-brand-cream/25">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-cream to-brand-red-dark" />
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-cream/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-dark/50 border border-brand-cream/10">
              <Calendar className="w-5 h-5 text-brand-red animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[9px] text-brand-red tracking-wider uppercase font-bold">Retro Daily Hub</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              </div>
              <h3 className="font-pixel text-sm text-brand-cream mt-0.5">24-HOUR PIXEL TASK</h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak Counter */}
            <div className="flex items-center gap-2 bg-brand-dark/40 border border-brand-cream/10 px-3 py-1.5 rounded-lg">
              <Flame className={`w-4 h-4 ${streakCount > 0 ? 'text-orange-500 animate-bounce' : 'text-brand-cream/30'}`} />
              <div className="flex flex-col leading-none">
                <span className="font-pixel text-[8px] text-brand-cream/40">STREAK</span>
                <span className="font-mono text-xs font-bold text-brand-cream mt-0.5">{streakCount} Days</span>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-2 bg-brand-dark/40 border border-brand-cream/10 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-brand-cream/60" />
              <div className="flex flex-col leading-none">
                <span className="font-pixel text-[8px] text-brand-cream/40">NEXT IN</span>
                <span className="font-mono text-xs font-bold text-brand-red mt-0.5">{timeLeftStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Theme Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand-red/10 border border-brand-red/30 text-brand-red font-mono text-[8px] px-2 py-0.5 rounded uppercase font-bold">
                PROMPT FOR TODAY
              </span>
              <span className="bg-brand-dark border border-brand-cream/10 text-brand-cream/60 font-mono text-[8px] px-2 py-0.5 rounded">
                DIMENSIONS: {currentPrompt.dimensions}
              </span>
            </div>

            <h4 className="font-pixel text-base text-brand-cream tracking-wide">{currentPrompt.theme}</h4>
            <p className="font-sans text-xs text-brand-cream/70 leading-relaxed bg-brand-dark/20 p-3 rounded border border-brand-cream/5">
              {currentPrompt.description}
            </p>

            <div className="bg-brand-dark/30 border border-brand-cream/5 p-3 rounded text-[11px] space-y-1">
              <div className="font-pixel text-[8px] text-brand-cream/40 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-brand-red" />
                <span>CHALLENGE INSPIRATION // TIP:</span>
              </div>
              <p className="font-sans text-brand-cream/60 leading-tight">
                {currentPrompt.inspiration}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 bg-brand-dark/40 border border-brand-cream/10 p-4 rounded-lg flex flex-col justify-between self-stretch">
            {/* Color Palette requirements */}
            <div>
              <div className="font-pixel text-[8px] text-brand-cream/40 mb-2">REQUIRED COAL PALETTE:</div>
              <div className="flex flex-wrap gap-1.5">
                {currentPrompt.palette.map((color) => (
                  <div
                    key={color}
                    className="w-10 h-7 rounded border border-brand-cream/15 flex items-center justify-center font-mono text-[8px] font-bold shadow-xs cursor-help hover:scale-105 transition-transform"
                    style={{
                      backgroundColor: color,
                      color: ['#FFFFFF', '#00FFCC', '#39FF14', '#06D6A0', '#FFFF00', '#FAF6F2', '#D1D5DB'].includes(color) ? '#121214' : '#E8E8C6'
                    }}
                    title={color}
                  >
                    {color.toUpperCase().slice(1)}
                  </div>
                ))}
              </div>
            </div>

            {/* Completion state button */}
            <div className="pt-2">
              {completedToday ? (
                <div className="w-full bg-green-500/10 border border-green-500/30 rounded-lg p-2.5 flex items-center justify-between text-green-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 animate-bounce" />
                    <span className="font-pixel text-[10px] tracking-wider uppercase font-bold">TASK SECURED</span>
                  </div>
                  <span className="font-sans text-[10px] text-brand-cream/50">+1 Daily Streak Added</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowWorkspace(!showWorkspace);
                    if (!showWorkspace) {
                      setTimeout(() => {
                        const workspaceEl = document.getElementById('daily-workspace-canvas');
                        if (workspaceEl) {
                          workspaceEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }, 100);
                    }
                  }}
                  className="w-full py-2.5 bg-brand-cream hover:bg-brand-light text-brand-charcoal rounded-lg font-pixel text-xs font-bold transition-all shadow active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{showWorkspace ? 'COLLAPSE WORKSPACE' : 'DRAW DAILY CHALLENGE'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Streak progress tracker calendar visual (Incentive design) */}
        <div className="mt-6 pt-4 border-t border-brand-cream/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-cream/65" />
            <span className="font-sans text-[10px] text-brand-cream/50">
              Submit daily creations to expand your streak count and collect master retro badges.
            </span>
          </div>

          <div className="flex items-center gap-1 bg-brand-dark/60 border border-brand-cream/5 px-2.5 py-1 rounded">
            <span className="font-pixel text-[8px] text-brand-cream/40 mr-1.5 uppercase">STREAK LOG:</span>
            {[...Array(7)].map((_, i) => {
              // Show last 7 days blocks
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
              const wasCompleted = historyCompletions.includes(dStr);
              return (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-xs border transition-all ${
                    wasCompleted 
                      ? 'bg-brand-red border-brand-red/60 shadow-xs' 
                      : dStr === getTodayDateString()
                      ? 'bg-transparent border-brand-cream/35 border-dashed animate-pulse'
                      : 'bg-brand-charcoal/80 border-brand-cream/10'
                  }`}
                  title={`${dStr}: ${wasCompleted ? 'Completed' : 'Locked'}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* DRAWING WORKSPACE (INLINE EXPANDABLE) */}
      <AnimatePresence>
        {showWorkspace && (
          <motion.div
            id="daily-workspace-canvas"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4"
          >
            <div className="bg-brand-dark/50 border-2 border-dashed border-brand-red/35 p-5 md:p-6 rounded-xl relative">
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
                <span className="font-mono text-[8px] text-brand-cream/40 uppercase">Interactive Terminal</span>
              </div>

              <div className="mb-4">
                <h4 className="font-pixel text-xs text-brand-cream flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-red animate-pulse" />
                  <span>Pixel Canvas // {currentPrompt.theme} ({currentPrompt.dimensions})</span>
                </h4>
                <p className="font-sans text-[11px] text-brand-cream/65 mt-0.5">
                  The canvas is locked to the daily required grid size and preloaded with today's color values. Draw, name, and publish.
                </p>
              </div>

              {drawSuccess ? (
                <div className="py-14 flex flex-col items-center justify-center bg-brand-charcoal/50 border border-brand-red/40 rounded-xl text-center gap-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-brand-red/10 border border-brand-red/40 flex items-center justify-center text-brand-red">
                    <CheckCircle2 className="w-7 h-7 text-brand-red animate-bounce" />
                  </div>
                  <h4 className="font-pixel text-sm text-brand-cream uppercase tracking-wide">DAILY ACHIEVEMENT UNLOCKED!</h4>
                  <p className="font-sans text-xs text-brand-cream/60 max-w-sm">
                    Your daily masterpiece is registered! Your streak count is now <span className="font-bold text-brand-cream font-mono">{streakCount} Days</span>. Keep up the high fidelity!
                  </p>
                </div>
              ) : (
                <PixelEditor
                  onPublish={handleDailySubmit}
                  initialPalette={currentPrompt.palette}
                  initialDimensions={currentPrompt.dimensions}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USER'S SAVED DAILY MASTERPIECES */}
      {savedDrawings.length > 0 && (
        <div className="mt-8 bg-brand-charcoal/30 border border-brand-cream/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-cream/5">
            <span className="font-pixel text-[9px] text-brand-cream/50 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-brand-red" />
              <span>Your Daily Collection ({savedDrawings.length})</span>
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {savedDrawings.map((draw) => (
              <div 
                key={draw.id} 
                className="bg-brand-charcoal border border-brand-cream/10 rounded-lg p-2.5 flex flex-col justify-between group hover:border-brand-cream/30 transition-all"
              >
                <div className="relative aspect-square w-full rounded bg-brand-dark overflow-hidden border border-brand-cream/5">
                  <img 
                    src={draw.imgUrl} 
                    alt={draw.title} 
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 right-1 bg-brand-dark/90 border border-brand-cream/10 px-1 py-0.5 rounded text-[6px] font-mono text-brand-cream/60">
                    {draw.date}
                  </div>
                </div>

                <div className="mt-2 text-left">
                  <span className="font-mono text-[7px] text-brand-cream/40 block leading-none truncate">#{draw.promptTheme.toUpperCase().replace(/\s+/g, '')}</span>
                  <span className="font-sans font-bold text-[10px] text-brand-cream mt-0.5 block truncate leading-tight group-hover:text-brand-light transition-colors">{draw.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
