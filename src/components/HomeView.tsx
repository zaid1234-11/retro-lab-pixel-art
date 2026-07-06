import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Trees, Castle, Trophy, Disc, Heart, ArrowRight, Bookmark, Users, Sparkles, Image, Zap, Flame, HelpCircle, Award, Cpu, Palette, Star, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelArt, Category } from '../types';
import LazyImage from './LazyImage';

// Static assets for infinite scroll / lazy loading showcase
const EXTRA_COMMUNITY_ARTS = [
  {
    id: 'comm-1',
    title: 'Rainy Ramen Bar',
    imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
    artistName: 'Kiko_99',
    category: 'coffee' as Category,
    likes: 412,
    saves: 180,
    downloads: 90,
    tags: ['Cozy', 'Ramen', 'Rainy']
  },
  {
    id: 'comm-2',
    title: 'Cyber Neon Street',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    artistName: 'Sony T',
    category: 'sci-fi' as Category,
    likes: 850,
    saves: 340,
    downloads: 210,
    tags: ['Cyberpunk', 'Neon', 'Alley']
  },
  {
    id: 'comm-3',
    title: 'Solitary Space Cruiser',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    artistName: 'Cosmic Ray',
    category: 'sci-fi' as Category,
    likes: 567,
    saves: 220,
    downloads: 140,
    tags: ['Sci-Fi', 'Nebula', 'Space']
  },
  {
    id: 'comm-4',
    title: 'Cozy Vinyl Setup',
    imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    artistName: 'Kiko_99',
    category: 'music-retro' as Category,
    likes: 290,
    saves: 110,
    downloads: 75,
    tags: ['Vinyl', 'Lofi', 'Jazz']
  },
  {
    id: 'comm-5',
    title: 'Sunset Beach Cabin',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    artistName: 'DitherQueen',
    category: 'nature' as Category,
    likes: 720,
    saves: 390,
    downloads: 180,
    tags: ['Sunset', 'Ocean', 'Beach']
  },
  {
    id: 'comm-6',
    title: 'Pixel Cafe Morning',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
    artistName: 'Kiko_99',
    category: 'coffee' as Category,
    likes: 512,
    saves: 280,
    downloads: 130,
    tags: ['Cafe', 'Morning', 'Espresso']
  },
  {
    id: 'comm-7',
    title: 'Cyber Terminal Room',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    artistName: 'CRT_Wizard',
    category: 'sci-fi' as Category,
    likes: 934,
    saves: 450,
    downloads: 270,
    tags: ['Terminal', 'Retro', 'Hacker']
  },
  {
    id: 'comm-8',
    title: 'Autumn Temple Garden',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
    artistName: 'Sony T',
    category: 'fantasy' as Category,
    likes: 648,
    saves: 310,
    downloads: 165,
    tags: ['Temple', 'Japan', 'Autumn']
  }
];

const TRENDING_STYLES = [
  {
    id: 'style-1',
    name: '16-Bit Ordered Dither',
    creator: 'DitherQueen',
    tag: 'MOST POPULAR',
    description: '4x4 and 8x8 ordered bayer pattern rendering that creates nostalgic checkerboard transparency gradients.',
    uses: '2.4k times this week',
    activeShader: 'ordered_bayer_8x8'
  },
  {
    id: 'style-2',
    name: 'Neon Scanline Glitch',
    creator: 'CRT_Wizard',
    tag: 'TRENDING',
    description: 'Analog video noise simulation using horizontal scanline offsets combined with heavy cyan-magenta aberration.',
    uses: '1.9k times this week',
    activeShader: 'chromatic_scanline'
  },
  {
    id: 'style-3',
    name: 'Topographical Wave Contour',
    creator: 'Sony T',
    tag: 'NEW PIPELINE',
    description: 'Converts luminance density bands into gorgeous dynamic curved wave contours and outline segments.',
    uses: '1.2k times this week',
    activeShader: 'contour_wave_sine'
  },
  {
    id: 'style-4',
    name: 'Floyd-Steinberg High Contrast',
    creator: 'RetroPixel8',
    tag: 'CLASSIC',
    description: 'High-fidelity error diffusion dithering with stark 2-color threshold output reminiscent of classic Macintosh.',
    uses: '950 times this week',
    activeShader: 'floyd_steinberg_mono'
  },
  {
    id: 'style-5',
    name: 'Halftone Newsprint Screen',
    creator: 'Kiko_99',
    tag: 'VINTAGE',
    description: 'Rotated dot grids mimicking retro CMYK newspaper prints and comic book illustrations.',
    uses: '820 times this week',
    activeShader: 'cmyk_halftone_dot'
  },
  {
    id: 'style-6',
    name: 'Luma-Sorted Scan Drift',
    creator: 'CRT_Wizard',
    tag: 'GLITCH',
    description: 'Selectively sorts pixel strings horizontally based on brightness threshold, creating fluid digital melts.',
    uses: '790 times this week',
    activeShader: 'pixel_sort_luma'
  }
];

interface HomeViewProps {
  featuredArt: PixelArt;
  rightGridArts: PixelArt[];
  onNavigateToGallery: (category?: Category) => void;
  onNavigateToContests: () => void;
  onNavigateToProfile: () => void;
  onToggleFavorite: (artId: string) => void;
  savedArtIds: string[];
  onNavigateToLab: () => void;
}

export default function HomeView({
  featuredArt,
  rightGridArts,
  onNavigateToGallery,
  onNavigateToContests,
  onNavigateToProfile,
  onToggleFavorite,
  savedArtIds,
  onNavigateToLab
}: HomeViewProps) {
  const [likesCount, setLikesCount] = useState<number>(featuredArt.likes);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Scroll loading state
  const [visibleArtsCount, setVisibleArtsCount] = useState<number>(4);
  const [visibleStylesCount, setVisibleStylesCount] = useState<number>(3);
  const [isLoadingArts, setIsLoadingArts] = useState<boolean>(false);
  const [isLoadingStyles, setIsLoadingStyles] = useState<boolean>(false);

  const artsSectionRef = useRef<HTMLDivElement | null>(null);
  const stylesSectionRef = useRef<HTMLDivElement | null>(null);

  // Scroll listener to fetch more "featured community arts"
  useEffect(() => {
    const handleScrollArts = () => {
      if (!artsSectionRef.current) return;
      const rect = artsSectionRef.current.getBoundingClientRect();
      const isNearBottom = rect.bottom <= window.innerHeight + 150;
      
      if (isNearBottom && !isLoadingArts && visibleArtsCount < EXTRA_COMMUNITY_ARTS.length) {
        setIsLoadingArts(true);
        setTimeout(() => {
          setVisibleArtsCount((prev) => Math.min(prev + 4, EXTRA_COMMUNITY_ARTS.length));
          setIsLoadingArts(false);
        }, 1200); // 1.2s delay for retro compiling feel
      }
    };

    window.addEventListener('scroll', handleScrollArts);
    return () => window.removeEventListener('scroll', handleScrollArts);
  }, [isLoadingArts, visibleArtsCount]);

  // Scroll listener to fetch more "trending styles"
  useEffect(() => {
    const handleScrollStyles = () => {
      if (!stylesSectionRef.current) return;
      const rect = stylesSectionRef.current.getBoundingClientRect();
      const isNearBottom = rect.bottom <= window.innerHeight + 150;
      
      if (isNearBottom && !isLoadingStyles && visibleStylesCount < TRENDING_STYLES.length) {
        setIsLoadingStyles(true);
        setTimeout(() => {
          setVisibleStylesCount((prev) => Math.min(prev + 3, TRENDING_STYLES.length));
          setIsLoadingStyles(false);
        }, 1200); // 1.2s delay for retro compiling feel
      }
    };

    window.addEventListener('scroll', handleScrollStyles);
    return () => window.removeEventListener('scroll', handleScrollStyles);
  }, [isLoadingStyles, visibleStylesCount]);

  // Update dynamic clock in JetBrains Mono to make it feel highly alive
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasLiked) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const isSaved = savedArtIds.includes(featuredArt.id);

  // Category items with matching icons
  const categoryItems = [
    { id: 'coffee', label: 'Cozy Cafe', icon: Coffee, desc: 'Warm sips & lo-fi coffee views' },
    { id: 'nature', label: 'Forests', icon: Trees, desc: 'Verdant peaks & pixel nature paths' },
    { id: 'fantasy', label: 'Fantasy World', icon: Castle, desc: 'Mystical spires & medieval castles' },
    { id: 'sci-fi', label: 'Cyberpunk Space', icon: Trophy, desc: 'Neon drizzled space invaders' },
    { id: 'music-retro', label: 'Retro Vinyl', icon: Disc, desc: 'Vintage turntables & tape deck vibes' },
  ];

  // Container variants for staggered entrance of children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 pb-16">
      
      {/* Dynamic Live Activity Ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-brand-charcoal/80 border-x border-t border-brand-cream/10 rounded-t-xl px-4 py-2 font-mono text-[9px] text-brand-cream/60 gap-2">
        <div className="flex items-center gap-3">
          <span className="text-brand-cream font-bold uppercase tracking-widest text-[9px]">PIX_RCKT Creative Center</span>
          <span className="hidden sm:inline text-brand-cream/20">|</span>
          <span className="hidden sm:inline">Curated Pixel Art Hub</span>
        </div>
        <div className="text-brand-cream/70 font-mono bg-brand-dark px-2.5 py-0.5 rounded border border-brand-cream/10">
          {currentTime || 'LOADING TIME...'}
        </div>
      </div>

      {/* Outer Hero Container with elegant background styling */}
      <div className="w-full bg-brand-charcoal border border-brand-cream/10 rounded-b-xl rounded-t-none p-8 md:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Typographic Hero Area */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 select-none">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-red animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-widest text-brand-cream/60">Advanced Image Processing Engine</span>
            </div>
            <motion.h1 
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, delay: 0.2 }}
              className="font-sans font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4"
            >
              Downgrade Reality. <br />
              <span className="bg-gradient-to-r from-[#E34A53] via-yellow-500 to-[#E34A53] bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                Instant Retro Masterpieces.
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="font-sans text-xs sm:text-sm leading-relaxed text-brand-cream/70 max-w-xl"
            >
              Welcome to the internet's premier offline-first pixel processing engine. 
              Instantly downgrade high-fidelity modern images into gorgeous retro formats, custom pixel art, and digital glitch matrices—directly in your browser at 60 FPS.
            </motion.p>
          </motion.div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:self-end font-pixel text-[9px] mt-6 md:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToLab}
              className="px-6 py-4 bg-brand-red text-brand-cream hover:bg-brand-red-hover font-bold rounded-lg shadow-[0_0_15px_rgba(227,74,83,0.5)] border border-brand-red-dark transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              LAUNCH RETROLAB
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(250, 246, 242, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigateToGallery()}
              className="px-5 py-3 flex items-center justify-center border border-brand-cream/20 text-brand-cream hover:border-brand-cream/40 font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider"
            >
              go to gallery
            </motion.button>
          </div>
        </div>

        {/* Quick Filter Category Row */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-5 bg-brand-dark/40 border border-brand-cream/10 rounded-xl p-3 mt-8 font-pixel text-[9px] text-brand-cream/70 shadow-inner gap-3"
        >
          {categoryItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <motion.button
                variants={itemVariants}
                key={item.id}
                onClick={() => onNavigateToGallery(item.id as Category)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-brand-charcoal/60 hover:bg-brand-red hover:text-brand-cream border border-brand-cream/5 hover:border-brand-red-dark transition-all duration-200 cursor-pointer text-center group active:scale-95 text-[8px]"
                title={`${item.label}: ${item.desc}`}
              >
                {/* Special styling for space-invader rendering */}
                {item.id === 'sci-fi' ? (
                  <svg className="w-3.5 h-3.5 fill-current text-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M4 14h2v2H4zm14 0h2v2h-2zM8 4h2v2H8zm6 0h2v2h-2zm-2 4h2v2h-2zm-4 2h2v2H8zm8 0h2v2h-2zm-6 4h4v2h-4zm-8 4h18v2H2zm1-8h2v2H3zm16 0h2v2h-2z" />
                  </svg>
                ) : (
                  <IconComponent className="w-3.5 h-3.5 text-current transition-transform group-hover:scale-110" />
                )}
                <span className="select-none tracking-wider uppercase text-[8px]">{item.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Platform Real-Time Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-brand-charcoal/45 border border-brand-cream/10 rounded-xl p-3.5 flex items-center gap-3 shadow-md"
        >
          <div className="p-2 rounded bg-brand-cream/5 text-brand-cream">
            <Image className="w-4 h-4 text-brand-cream/70" />
          </div>
          <div>
            <span className="block font-mono text-[8px] text-brand-cream/40 uppercase">Total Items</span>
            <span className="font-mono text-xs font-bold text-brand-cream">24 Curator Handcrafted</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-brand-charcoal/45 border border-brand-cream/10 rounded-xl p-3.5 flex items-center gap-3 shadow-md"
        >
          <div className="p-2 rounded bg-brand-cream/5 text-brand-cream">
            <Users className="w-4 h-4 text-brand-cream/70" />
          </div>
          <div>
            <span className="block font-mono text-[8px] text-brand-cream/40 uppercase">Active Creators</span>
            <span className="font-mono text-xs font-bold text-brand-cream">14 Certified Authors</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-brand-charcoal/45 border border-brand-cream/10 rounded-xl p-3.5 flex items-center gap-3 shadow-md"
        >
          <div className="p-2 rounded bg-brand-cream/5 text-brand-cream">
            <Flame className="w-4 h-4 text-brand-cream/70" />
          </div>
          <div>
            <span className="block font-mono text-[8px] text-brand-cream/40 uppercase">Global Votes</span>
            <span className="font-mono text-xs font-bold text-brand-cream">1,248 Verified Votes</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-brand-charcoal/45 border border-brand-cream/10 rounded-xl p-3.5 flex items-center gap-3 shadow-md"
        >
          <div className="p-2 rounded bg-brand-cream/5 text-brand-cream">
            <Zap className="w-4 h-4 text-brand-cream/70" />
          </div>
          <div>
            <span className="block font-mono text-[8px] text-brand-cream/40 uppercase">Platform Status</span>
            <span className="font-mono text-xs font-bold text-green-400">OPTIMAL / SECURE</span>
          </div>
        </motion.div>
      </div>

      {/* Grid Header: the best arts this month */}
      <div className="flex items-center justify-between mt-12 mb-6">
        <div className="border border-brand-cream/30 bg-brand-charcoal/30 px-5 py-2.5 rounded-t-lg rounded-r-lg shadow-sm border-b-0">
          <h3 className="font-pixel text-xs tracking-wider uppercase text-brand-cream">
            the best arts this month
          </h3>
        </div>
        <div className="w-1/3 border-b border-brand-cream/20" />
      </div>

      {/* Arts Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Featured Art Card (Anime girl sunset) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-5 bg-brand-charcoal border border-brand-cream/20 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden"
        >
          
          {/* Main Artwork Frame */}
          <div 
            className="relative w-full h-[280px] rounded-lg overflow-hidden border border-brand-cream/10 bg-brand-dark/50 group cursor-pointer"
            onClick={() => onNavigateToGallery()}
          >
            <LazyImage
              src={featuredArt.imageUrl}
              alt={featuredArt.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-104"
              pixelated={true}
              referrerPolicy="no-referrer"
            />
            {/* Soft Shadow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Heart hover overlay */}
            <button
              onClick={handleLike}
              className={`absolute top-3 right-3 p-2 rounded-full border shadow-md transition-all active:scale-90 ${
                hasLiked
                  ? 'bg-red-500 text-white border-red-500 scale-105'
                  : 'bg-brand-charcoal/80 text-brand-cream border-brand-cream/20 hover:text-red-400 hover:border-red-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* User Details & Action Row */}
          <div className="flex items-center justify-between mt-3 font-pixel">
            <div className="flex items-center gap-3">
              {/* Creator Circular Avatar */}
              <div className="w-9 h-9 rounded-full border border-brand-cream/40 overflow-hidden bg-brand-dark">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                  alt="Sony T"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-brand-cream">{featuredArt.artistName}</span>
                <span className="font-sans text-[10px] text-brand-cream/50 mt-0.5">{featuredArt.title}</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(featuredArt.id);
              }}
              className={`px-4 py-1.5 rounded-full border text-[9px] uppercase tracking-wider font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                isSaved
                  ? 'bg-brand-cream text-brand-charcoal border-brand-cream'
                  : 'bg-transparent text-brand-cream border-brand-cream/30 hover:border-brand-cream'
              }`}
            >
              <Bookmark className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? 'saved' : 'save'}</span>
            </button>
          </div>

          {/* Social Stats footer */}
          <div className="flex items-center gap-4 text-brand-cream/40 font-mono text-[9px] mt-2 border-t border-brand-cream/10 pt-2">
            <span>❤️ {likesCount} likes</span>
            <span>⭐ {featuredArt.saves + (isSaved ? 1 : 0)} saves</span>
            <span>📥 {featuredArt.downloads} downloads</span>
          </div>

        </motion.div>

        {/* Right Side: 2x3 Grid of smaller outstanding arts */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4"
        >
          {rightGridArts.slice(0, 6).map((art, index) => (
            <motion.div
              variants={itemVariants}
              key={art.id}
              onClick={() => onNavigateToGallery(art.category)}
              whileHover={{ 
                y: -6, 
                scale: 1.03,
                borderColor: "var(--color-brand-cream)",
                boxShadow: "0 12px 20px -5px rgba(155, 49, 53, 0.35)"
              }}
              whileTap={{ scale: 0.98 }}
              className="bg-brand-red border border-brand-red-dark/80 rounded-xl p-3 flex flex-col justify-between shadow-lg cursor-pointer group transition-all duration-200"
            >
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-brand-cream p-1.5 border border-brand-cream/15">
                {/* Number indicator similar to the top left of polar cards */}
                <span className="absolute top-2 left-2 z-10 w-4 h-4 bg-brand-charcoal/80 text-brand-cream text-[8px] font-pixel rounded-full flex items-center justify-center border border-brand-cream/20">
                  {index + 1}
                </span>
                <LazyImage
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-full h-full object-cover rounded-md transition-transform duration-750 ease-out group-hover:scale-106"
                  pixelated={true}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="mt-2.5 flex flex-col gap-0.5 select-none text-center">
                <span className="font-pixel text-[10px] font-bold text-brand-cream leading-tight truncate group-hover:text-brand-cream transition-colors">
                  {art.title.toLowerCase()}
                </span>
                <span className="font-sans text-[8px] text-brand-cream/70 tracking-wider">
                  @{art.artistName.toLowerCase().replace(/\s+/g, '')}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* NEW SECTION 1: FEATURED COMMUNITY ARTS (DYNAMIC SCROLL LOADING) */}
      <div className="flex items-center justify-between mt-16 mb-6">
        <div className="border border-brand-cream/30 bg-brand-charcoal/30 px-5 py-2.5 rounded-t-lg rounded-r-lg shadow-sm border-b-0">
          <h3 className="font-pixel text-[10px] tracking-wider uppercase text-brand-cream flex items-center gap-2">
            <Image className="w-3.5 h-3.5 text-brand-red animate-pulse" />
            <span>Featured Community Arts</span>
          </h3>
        </div>
        <div className="w-1/3 border-b border-brand-cream/20" />
      </div>

      <div ref={artsSectionRef} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXTRA_COMMUNITY_ARTS.slice(0, visibleArtsCount).map((art) => {
            const isArtSaved = savedArtIds.includes(art.id);
            return (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ y: -5 }}
                key={art.id}
                className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-4 flex flex-col justify-between shadow-lg relative group overflow-hidden"
              >
                {/* Artwork frame */}
                <div>
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-brand-dark/50 border border-brand-cream/10 cursor-pointer"
                       onClick={() => onNavigateToGallery(art.category)}>
                    <LazyImage
                      src={art.imageUrl}
                      alt={art.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      pixelated={true}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-brand-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <div className="flex flex-wrap gap-1">
                        {art.tags.map(t => (
                          <span key={t} className="font-mono text-[7px] bg-brand-dark/90 text-brand-cream px-1.5 py-0.5 rounded border border-brand-cream/5">#{t.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(art.id);
                      }}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-full border shadow-sm transition-all active:scale-90 ${
                        isArtSaved
                          ? 'bg-brand-cream text-brand-charcoal border-brand-cream'
                          : 'bg-brand-charcoal/80 text-brand-cream border-brand-cream/15 hover:border-brand-cream/50'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isArtSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <span className="font-mono text-[8px] text-brand-cream/40 uppercase block">@{art.artistName.toLowerCase()}</span>
                    <h4 className="font-sans font-bold text-xs text-brand-cream leading-tight mt-0.5 truncate">{art.title}</h4>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-brand-cream/10 font-mono text-[8px] text-brand-cream/50">
                  <span>📥 {art.downloads} dl</span>
                  <span>⭐ {art.saves + (isArtSaved ? 1 : 0)} saves</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Micro-Loader indicator */}
        <AnimatePresence>
          {isLoadingArts && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 font-mono text-[9px] text-brand-cream/50 select-none gap-2"
            >
              <div className="flex items-center gap-1.5 bg-brand-dark/50 border border-brand-cream/10 px-4 py-2 rounded-lg shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
                <span>SYNCHRONIZING COMMUNITY CHIPS... [COMPILING COAL CHIPS]</span>
              </div>
              <div className="w-32 bg-brand-dark/80 h-1 border border-brand-cream/10 rounded-full overflow-hidden animate-pulse">
                <div className="w-1/3 bg-brand-red h-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {visibleArtsCount < EXTRA_COMMUNITY_ARTS.length && !isLoadingArts && (
          <div className="text-center py-2">
            <span className="inline-block font-mono text-[9px] text-brand-cream/40 border border-dashed border-brand-cream/20 px-3 py-1.5 rounded-md animate-pulse">
              ⬇️ Keep scrolling down to load more certified arts...
            </span>
          </div>
        )}
      </div>

      {/* NEW SECTION 2: TRENDING RETRO SHADER STYLES (DYNAMIC SCROLL LOADING) */}
      <div className="flex items-center justify-between mt-16 mb-6">
        <div className="border border-brand-cream/30 bg-brand-charcoal/30 px-5 py-2.5 rounded-t-lg rounded-r-lg shadow-sm border-b-0">
          <h3 className="font-pixel text-[10px] tracking-wider uppercase text-brand-cream flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-red animate-pulse" />
            <span>Trending Shader Styles</span>
          </h3>
        </div>
        <div className="w-1/3 border-b border-brand-cream/20" />
      </div>

      <div ref={stylesSectionRef} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRENDING_STYLES.slice(0, visibleStylesCount).map((style) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
              whileHover={{ scale: 1.02 }}
              key={style.id}
              className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 h-1.5 w-full bg-brand-red-dark/30 group-hover:bg-brand-red transition-colors" />
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="font-mono text-[8px] text-brand-red font-bold uppercase border border-brand-red/35 px-1.5 py-0.5 rounded bg-brand-red/5">
                    {style.tag}
                  </span>
                  <span className="font-mono text-[8px] text-brand-cream/45">by @{style.creator.toLowerCase()}</span>
                </div>
                <h4 className="font-sans font-bold text-sm text-brand-cream mt-2 group-hover:text-brand-light transition-colors">{style.name}</h4>
                <p className="font-sans text-[11px] text-brand-cream/65 leading-relaxed mt-2">{style.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-brand-cream/10 flex items-center justify-between font-mono text-[9px]">
                <span className="text-brand-cream/40">⚡ {style.uses}</span>
                <span className="text-brand-cream/60 flex items-center gap-1">
                  active: <code className="bg-brand-dark/65 px-1 rounded text-brand-cream/80 text-[8px] font-mono border border-brand-cream/5">{style.activeShader}</code>
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dynamic Styles Micro-Loader */}
        <AnimatePresence>
          {isLoadingStyles && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 font-mono text-[9px] text-brand-cream/50 select-none gap-2"
            >
              <div className="flex items-center gap-1.5 bg-brand-dark/50 border border-brand-cream/10 px-4 py-2 rounded-lg shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
                <span>SYNCHRONIZING STYLES METRICS... [SECTOR ONLINE]</span>
              </div>
              <div className="w-32 bg-brand-dark/80 h-1 border border-brand-cream/10 rounded-full overflow-hidden animate-pulse">
                <div className="w-1/3 bg-brand-red h-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {visibleStylesCount < TRENDING_STYLES.length && !isLoadingStyles && (
          <div className="text-center py-2">
            <span className="inline-block font-mono text-[9px] text-brand-cream/40 border border-dashed border-brand-cream/20 px-3 py-1.5 rounded-md animate-pulse">
              ⬇️ Scroll down to extract more styles...
            </span>
          </div>
        )}
      </div>

      {/* SECTION 1: RetroLab Shader Showcase */}
      <div className="flex items-center justify-between mt-16 mb-6">
        <div className="border border-brand-cream/30 bg-brand-charcoal/30 px-5 py-2.5 rounded-t-lg rounded-r-lg shadow-sm border-b-0">
          <h3 className="font-pixel text-[10px] tracking-wider uppercase text-brand-cream flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-brand-red animate-pulse" />
            <span>the retrolab shader showcase</span>
          </h3>
        </div>
        <div className="w-1/3 border-b border-brand-cream/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[8px] bg-brand-red text-brand-cream px-1.5 py-0.5 rounded font-bold uppercase">16-BIT RETRO</span>
              <span className="font-mono text-[9px] text-brand-cream/60">Shader Pipeline v4.0</span>
            </div>
            <h4 className="font-sans font-bold text-lg text-brand-cream mb-2">Real-time Dithering & Color Quantizer</h4>
            <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
              RetroLab compiles clean local states to emulate classical hardware. Harness customizable ordered Bayer grids (2x2 up to 8x8) and error diffusion (Floyd-Steinberg, Atkinson, Sierra Lite) to reproduce authentic arcade graphics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-mono text-brand-cream/60">
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#BAYER_GRID</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#FLOYD_STEINBERG</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#ATKINSON_DIFFUSION</span>
          </div>
        </div>

        <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[8px] bg-brand-red text-brand-cream px-1.5 py-0.5 rounded font-bold uppercase">GLITCH ART</span>
              <span className="font-mono text-[9px] text-brand-cream/60">Interactive Glitch Engine</span>
            </div>
            <h4 className="font-sans font-bold text-lg text-brand-cream mb-2">Pixel Sorting & Chromatic Displacement</h4>
            <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
              Simulate volatile analogue magnetic tapes with customizable streak thresholds, sorting algorithms (brightness, hue, saturation, luma), chromatic aberration split, and interactive horizontal/vertical scanline displacement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-mono text-brand-cream/60">
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#PIXEL_SORTING</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#CRT_SCANLINES</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#CHROMATIC_ABERRATION</span>
          </div>
        </div>

        <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[8px] bg-brand-red text-brand-cream px-1.5 py-0.5 rounded font-bold uppercase">VECTOR ISO</span>
              <span className="font-mono text-[9px] text-brand-cream/60">Topography & Contours</span>
            </div>
            <h4 className="font-sans font-bold text-lg text-brand-cream mb-2">Dynamic Wave-Lines & Halftones</h4>
            <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
              Vectorize textures with beautiful topological contour lines that offset dynamically based on brightness and sine waves. Turn any standard photograph into custom pop-art halftone grid screens or retro comic prints.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-mono text-brand-cream/60">
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#WAVE_LINES</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#HALFTONE_SCREEN</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#CONTUR_MAPPING</span>
          </div>
        </div>

        <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[8px] bg-brand-red text-brand-cream px-1.5 py-0.5 rounded font-bold uppercase">FLOW FIELD</span>
              <span className="font-mono text-[9px] text-brand-cream/60">Procedural Texturing</span>
            </div>
            <h4 className="font-sans font-bold text-lg text-brand-cream mb-2">Perlin Noise & Voronoi Partitions</h4>
            <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
              Generate procedural vectors based on Perlin flow fields and cellular Voronoi tessellations. Reconstruct standard static scenes into beautifully fragmented geometric nodes, creating generative digital artifacts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-mono text-brand-cream/60">
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#VORONOI_TILES</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#PERLIN_NOISE</span>
            <span className="bg-brand-dark/50 px-2 py-1 rounded border border-brand-cream/5">#FLOW_GENERATIVE</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Active Competitions & Challenges */}
      <div className="flex items-center justify-between mt-16 mb-6">
        <div className="border border-brand-cream/30 bg-brand-charcoal/30 px-5 py-2.5 rounded-t-lg rounded-r-lg shadow-sm border-b-0">
          <h3 className="font-pixel text-[10px] tracking-wider uppercase text-brand-cream flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-brand-red" />
            <span>current active contests</span>
          </h3>
        </div>
        <div className="w-1/3 border-b border-brand-cream/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-charcoal border-2 border-brand-red/40 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-brand-red text-brand-cream font-pixel text-[8px] uppercase tracking-wider px-3 py-1 rounded-bl-lg">
            submissions open
          </div>
          <div className="flex flex-col h-full justify-between">
            <div>
              <span className="font-pixel text-[8px] text-brand-red uppercase tracking-widest block mb-1">CONTEST ID #284</span>
              <h4 className="font-pixel text-xs text-brand-cream tracking-wide mb-3">16-BIT SUNSET MEADOWS</h4>
              <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
                Bring comfort and nostalgia to life. Create a warm pixel art scene using only retro sepia and crimson sunset hex palettes. 
              </p>
              
              <div className="flex justify-between items-center bg-brand-dark/50 px-3 py-2 rounded border border-brand-cream/10 mb-4 text-[10px] font-mono">
                <div>
                  <span className="block text-brand-cream/40 text-[8px] uppercase">Prize Pool</span>
                  <span className="text-brand-cream font-bold">RETRON POCKET 4 PRO</span>
                </div>
                <div className="text-right">
                  <span className="block text-brand-cream/40 text-[8px] uppercase">Time Left</span>
                  <span className="text-brand-cream font-bold">4 DAYS 12 HOURS</span>
                </div>
              </div>
            </div>

            <motion.button 
              onClick={onNavigateToContests}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 bg-brand-red text-brand-cream hover:bg-brand-red-hover font-pixel text-[9px] uppercase tracking-wider rounded border border-brand-red-dark cursor-pointer shadow-md transition-all"
            >
              SUBMIT ARTWORK
            </motion.button>
          </div>
        </div>

        <div className="bg-brand-charcoal border border-brand-cream/15 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-brand-cream text-brand-charcoal font-pixel text-[8px] uppercase tracking-wider px-3 py-1 rounded-bl-lg">
            public voting
          </div>
          <div>
            <span className="font-pixel text-[8px] text-brand-cream/50 uppercase tracking-widest block mb-1">CONTEST ID #283</span>
            <h4 className="font-pixel text-xs text-brand-cream tracking-wide mb-3">CYBERPUNK NEON NOODLES</h4>
            <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
              Capture a rainy dystopian noodle stall at midnight. Glow, CRT scanlines, and high contrast fluorescent palettes encouraged.
            </p>

            <div className="flex justify-between items-center bg-brand-dark/50 px-3 py-2 rounded border border-brand-cream/10 mb-4 text-[10px] font-mono">
              <div>
                <span className="block text-brand-cream/40 text-[8px] uppercase">Prize Pool</span>
                <span className="text-brand-cream font-bold">$250 STEAM GIFT CARD</span>
              </div>
              <div className="text-right">
                <div>
                  <span className="block text-brand-cream/40 text-[8px] uppercase">VOTES CAST</span>
                  <span className="text-brand-cream font-bold">1,824 TOTAL</span>
                </div>
              </div>
            </div>
          </div>

          <motion.button 
            onClick={onNavigateToContests}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(250, 246, 242, 0.1)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2 border border-brand-cream/20 hover:border-brand-cream text-brand-cream font-pixel text-[9px] uppercase tracking-wider rounded cursor-pointer transition-all"
          >
            VOTE IN GALLERY
          </motion.button>
        </div>
      </div>

      {/* SECTION 3: Creator Hall of Fame */}
      <div className="flex items-center justify-between mt-16 mb-6">
        <div className="border border-brand-cream/30 bg-brand-charcoal/30 px-5 py-2.5 rounded-t-lg rounded-r-lg shadow-sm border-b-0">
          <h3 className="font-pixel text-[10px] tracking-wider uppercase text-brand-cream flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-brand-red" />
            <span>creator hall of fame</span>
          </h3>
        </div>
        <div className="w-1/3 border-b border-brand-cream/20" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-brand-charcoal border border-brand-cream/10 rounded-xl p-4 flex flex-col items-center text-center shadow-lg relative group">
          <div className="w-16 h-16 rounded-full border-2 border-brand-red overflow-hidden bg-brand-dark mb-3">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80"
              alt="DitherQueen"
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
            />
          </div>
          <span className="font-pixel text-[10px] font-bold text-brand-cream">DitherQueen</span>
          <span className="font-mono text-[8px] text-brand-cream/50 mt-1 uppercase tracking-wider">Tokyo, Japan</span>
          <p className="font-sans text-[11px] text-brand-cream/70 leading-relaxed my-3">
            Vintage game designer and bayer colorway wizard specializing in 8-bit visual assets.
          </p>
          <div className="w-full bg-brand-dark/40 border border-brand-cream/5 rounded p-2 text-[9px] font-mono grid grid-cols-2 gap-2 text-left mb-3">
            <div>
              <span className="block text-brand-cream/30 text-[7px] uppercase">CREATIONS</span>
              <span className="text-brand-cream">148 pieces</span>
            </div>
            <div>
              <span className="block text-brand-cream/30 text-[7px] uppercase">royalties</span>
              <span className="text-brand-cream text-green-400">4.2 ETH</span>
            </div>
          </div>
          <button 
            onClick={onNavigateToProfile}
            className="w-full py-1 border border-brand-cream/25 hover:border-brand-cream text-brand-cream font-pixel text-[8px] uppercase tracking-wider rounded cursor-pointer transition-all active:scale-95"
          >
            VIEW STUDIO
          </button>
        </div>

        <div className="bg-brand-charcoal border border-brand-cream/10 rounded-xl p-4 flex flex-col items-center text-center shadow-lg relative group">
          <div className="w-16 h-16 rounded-full border-2 border-brand-red overflow-hidden bg-brand-dark mb-3">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80"
              alt="CRT_Wizard"
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
            />
          </div>
          <span className="font-pixel text-[10px] font-bold text-brand-cream">CRT_Wizard</span>
          <span className="font-mono text-[8px] text-brand-cream/50 mt-1 uppercase tracking-wider">Neo-Seoul</span>
          <p className="font-sans text-[11px] text-brand-cream/70 leading-relaxed my-3">
            Master of noise fields, glitch displacement, and multi-layered cyberpunk scanlines.
          </p>
          <div className="w-full bg-brand-dark/40 border border-brand-cream/5 rounded p-2 text-[9px] font-mono grid grid-cols-2 gap-2 text-left mb-3">
            <div>
              <span className="block text-brand-cream/30 text-[7px] uppercase">CREATIONS</span>
              <span className="text-brand-cream">94 pieces</span>
            </div>
            <div>
              <span className="block text-brand-cream/30 text-[7px] uppercase">royalties</span>
              <span className="text-brand-cream text-green-400">2.8 ETH</span>
            </div>
          </div>
          <button 
            onClick={onNavigateToProfile}
            className="w-full py-1 border border-brand-cream/25 hover:border-brand-cream text-brand-cream font-pixel text-[8px] uppercase tracking-wider rounded cursor-pointer transition-all active:scale-95"
          >
            VIEW STUDIO
          </button>
        </div>

        <div className="bg-brand-charcoal border border-brand-cream/10 rounded-xl p-4 flex flex-col items-center text-center shadow-lg relative group">
          <div className="w-16 h-16 rounded-full border-2 border-brand-red overflow-hidden bg-brand-dark mb-3">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
              alt="RetroPixel8"
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
            />
          </div>
          <span className="font-pixel text-[10px] font-bold text-brand-cream">RetroPixel8</span>
          <span className="font-mono text-[8px] text-brand-cream/50 mt-1 uppercase tracking-wider">Berlin, DE</span>
          <p className="font-sans text-[11px] text-brand-cream/70 leading-relaxed my-3">
            Handcrafts architectural isometric dioramas and comfortable retro vinyl interiors.
          </p>
          <div className="w-full bg-brand-dark/40 border border-brand-cream/5 rounded p-2 text-[9px] font-mono grid grid-cols-2 gap-2 text-left mb-3">
            <div>
              <span className="block text-brand-cream/30 text-[7px] uppercase">CREATIONS</span>
              <span className="text-brand-cream">124 pieces</span>
            </div>
            <div>
              <span className="block text-brand-cream/30 text-[7px] uppercase">royalties</span>
              <span className="text-brand-cream text-green-400">3.9 ETH</span>
            </div>
          </div>
          <button 
            onClick={onNavigateToProfile}
            className="w-full py-1 border border-brand-cream/25 hover:border-brand-cream text-brand-cream font-pixel text-[8px] uppercase tracking-wider rounded cursor-pointer transition-all active:scale-95"
          >
            VIEW STUDIO
          </button>
        </div>
      </div>

      {/* SECTION 4: Knowledge Deck FAQ Accordions */}
      <div className="flex items-center justify-between mt-16 mb-6">
        <div className="border border-brand-cream/30 bg-brand-charcoal/30 px-5 py-2.5 rounded-t-lg rounded-r-lg shadow-sm border-b-0">
          <h3 className="font-pixel text-[10px] tracking-wider uppercase text-brand-cream flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-brand-red" />
            <span>knowledge base & faqs</span>
          </h3>
        </div>
        <div className="w-1/3 border-b border-brand-cream/20" />
      </div>

      <div className="flex flex-col gap-3 bg-brand-charcoal border border-brand-cream/10 rounded-xl p-5 mb-16">
        {[
          {
            q: "How does the RetroLab real-time shader system operate?",
            a: "RetroLab runs a bespoke client-side pipeline. When you import any high-definition source image, it decomposes the RGBA pixel array into optimized Float32 color-channel buffers. Shaders like Bayer-ordering, Floyd-Steinberg error diffusion, topological wave contours, and multi-stage pixel sorting execute dynamically inside ultra-fast rendering routines to generate real-time feedback without server bottlenecks."
          },
          {
            q: "What is the Creator Program, and how are royalties processed?",
            a: "The Creator Program lets any approved pixel artist upload digital retro assets to the showcase. You can set customized royalty prices for downloadable files. When other users buy or download your artwork, 85% of royalties are directly credited to your creator account, which you can easily manage in your Profile dashboard."
          },
          {
            q: "Are there image size limits or custom format limitations?",
            a: "We support PNG, JPEG, WEBP, and high-fidelity SVG source uploads up to 4K resolution. Shaders optimize processing by dynamically scaling inside viewport ratios, maintaining original rendering quality, and allowing export at original scale, compressed grid configurations, or styled retro CRT mockups."
          },
          {
            q: "Can I participate in the active competitions without being a creator?",
            a: "Yes! While only verified creators can upload and submit custom entries to the active contests, all platform members can explore the galleries and cast votes in real-time. Public voting heavily influences the outcome of active prize pools."
          }
        ].map((faq, idx) => (
          <div key={idx} className="border border-brand-cream/15 rounded-lg overflow-hidden bg-brand-dark/30">
            <button
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="w-full flex items-center justify-between px-4 py-3 bg-brand-charcoal/60 hover:bg-brand-charcoal hover:text-brand-cream text-brand-cream/80 text-xs text-left cursor-pointer transition-colors font-sans font-medium"
            >
              <span>{faq.q}</span>
              <span className="font-mono text-brand-red text-xs font-bold pl-2">
                {openFaq === idx ? '[-]' : '[+]'}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {openFaq === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 pt-1 text-xs text-brand-cream/60 leading-relaxed font-sans bg-brand-dark/20">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer redirection link */}
      <div className="flex justify-between items-center mt-12 pt-6 border-t border-brand-cream/10 select-none">
        <span className="font-mono text-[9px] text-brand-cream/40">© 2026 PIX_RCKT INDEPENDENT CREATIVE HUB</span>
        <motion.button
          onClick={onNavigateToContests}
          whileHover={{ x: 4 }}
          className="flex items-center gap-2 group text-brand-cream/70 hover:text-brand-cream font-pixel text-xs transition-all cursor-pointer"
        >
          <span>to the contests</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

    </div>
  );
}
