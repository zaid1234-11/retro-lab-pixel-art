import React, { useState, useMemo } from 'react';
import { Search, Heart, Bookmark, ArrowLeft, Download, CreditCard, CheckCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelArt, Category } from '../types';
import LazyImage from './LazyImage';

interface GalleryViewProps {
  pixelArts: PixelArt[];
  onToggleFavorite: (artId: string) => void;
  savedArtIds: string[];
  initialCategory?: Category | null;
}

export default function GalleryView({
  pixelArts,
  onToggleFavorite,
  savedArtIds,
  initialCategory = null
}: GalleryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(initialCategory || 'all');
  const [selectedSort, setSelectedSort] = useState<'newest' | 'likes' | 'price-low'>('newest');
  
  // Modal states
  const [activeArt, setActiveArt] = useState<PixelArt | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [checkoutSimStatus, setCheckoutSimStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  // Interactive local like counter for cards inside gallery
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  const handleLike = (e: React.MouseEvent, art: PixelArt) => {
    e.stopPropagation();
    const isLiked = userLikes[art.id] || false;
    setUserLikes(prev => ({ ...prev, [art.id]: !isLiked }));
    setLocalLikes(prev => ({
      ...prev,
      [art.id]: (prev[art.id] ?? art.likes) + (isLiked ? -1 : 1)
    }));
  };

  // Filter & Search Logic
  const filteredArts = useMemo(() => {
    return pixelArts
      .filter((art) => {
        const matchesSearch =
          art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          art.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (selectedSort === 'likes') {
          return (localLikes[b.id] ?? b.likes) - (localLikes[a.id] ?? a.likes);
        }
        if (selectedSort === 'price-low') {
          return a.price - b.price;
        }
        // default newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [pixelArts, searchTerm, selectedCategory, selectedSort, localLikes]);

  const categoriesList: { id: Category | 'all'; label: string }[] = [
    { id: 'all', label: 'All Creations' },
    { id: 'coffee', label: 'Cozy Cafe' },
    { id: 'nature', label: 'Forests' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'sci-fi', label: 'Cyberpunk' },
    { id: 'music-retro', label: 'Retrowave' },
  ];

  const copyPaletteHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const startCheckoutSimulation = () => {
    setCheckoutSimStatus('processing');
    setTimeout(() => {
      setCheckoutSimStatus('success');
    }, 2000);
  };

  const handleDownload = (art: PixelArt) => {
    const link = document.createElement('a');
    link.href = art.imageUrl;
    link.download = `${art.title.replace(/\s+/g, '-').toLowerCase()}-pixelart.png`;
    link.click();
  };

  // Mock colors parsed from image based on category
  const getMockPalette = (category: Category) => {
    switch (category) {
      case 'coffee':
        return ['#4E3115', '#8E5D46', '#D4A373', '#FAEDCD', '#E8E8C6'];
      case 'nature':
        return ['#132A13', '#31572C', '#4F772D', '#90A955', '#ECF39E'];
      case 'fantasy':
        return ['#2B1B17', '#4E387E', '#800080', '#DDA0DD', '#F5F5DC'];
      case 'sci-fi':
        return ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#00F0FF'];
      case 'music-retro':
        return ['#0F0C1B', '#2D142C', '#510A32', '#801336', '#C72C41'];
      default:
        return ['#252525', '#474744', '#E8E8C6'];
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 pb-16 animate-fadeIn select-none">
      
      {/* Search and Filters panel */}
      <div className="bg-brand-charcoal border border-brand-cream/20 rounded-xl p-5 shadow-lg mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Custom retro Search Input */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by title, creator, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-brand-dark/60 border border-brand-cream/30 hover:border-brand-cream/50 focus:border-brand-cream rounded-lg px-10 py-2.5 text-brand-cream text-xs outline-none transition-all placeholder-brand-cream/40"
            />
            <Search className="w-4 h-4 text-brand-cream/55 absolute left-3 top-3.5" />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 font-pixel text-[10px] text-brand-cream/80 w-full md:w-auto justify-end">
            <span>SORT:</span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="bg-brand-dark border border-brand-cream/20 hover:border-brand-cream/40 rounded px-2.5 py-1.5 outline-none font-sans text-xs text-brand-cream cursor-pointer"
            >
              <option value="newest">Newest Uploads</option>
              <option value="likes">Most Appreciated</option>
              <option value="price-low">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Category horizontal scrolling list */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1.5 scrollbar-thin">
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full border text-[10px] font-pixel tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-brand-red text-brand-cream border-brand-red-dark shadow-sm font-bold'
                  : 'bg-transparent text-brand-cream/70 border-brand-cream/15 hover:border-brand-cream/40 hover:text-brand-cream'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main arts listing count */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-[11px] text-brand-cream/60">
          SHOWING {filteredArts.length} PIXEL CREATIONS
        </span>
        <div className="flex-1 ml-4 border-b border-brand-cream/10" />
      </div>

      {/* Primary Gallery Grid */}
      {filteredArts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredArts.map((art) => {
            const isLiked = userLikes[art.id] || false;
            const currentLikes = localLikes[art.id] ?? art.likes;
            const isSaved = savedArtIds.includes(art.id);

            return (
              <motion.div
                key={art.id}
                onClick={() => {
                  setActiveArt(art);
                  setCheckoutSimStatus('idle');
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                whileHover={{ 
                  y: -6, 
                  scale: 1.025,
                  borderColor: "var(--color-brand-cream)",
                  boxShadow: "0 12px 25px -5px rgba(155, 49, 53, 0.4)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 350, 
                  damping: 25,
                  mass: 0.8
                }}
                className="bg-brand-red border border-brand-red-dark/80 rounded-xl p-3 flex flex-col justify-between cursor-pointer group shadow-lg"
              >
                {/* Image Frame */}
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-brand-cream p-1.5 border border-brand-cream/15">
                  <LazyImage
                    src={art.imageUrl}
                    alt={art.title}
                    className="w-full h-full object-cover rounded-md transition-transform duration-700 ease-out group-hover:scale-106"
                    pixelated={true}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Category small badge */}
                  <div className="absolute top-2.5 left-2.5 bg-brand-charcoal/85 border border-brand-cream/20 px-1.5 py-0.5 rounded text-[8px] font-pixel text-brand-cream/75 capitalize">
                    {art.category === 'music-retro' ? 'vinyl' : art.category}
                  </div>

                  {/* Dimension badge */}
                  <div className="absolute bottom-2.5 right-2.5 bg-brand-charcoal/85 border border-brand-cream/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-brand-cream/60">
                    {art.dimensions}
                  </div>
                </div>

                {/* Info & stats */}
                <div className="mt-3 flex flex-col gap-0.5 text-center select-none">
                  <div className="flex justify-between items-start">
                    <span className="font-pixel text-[10px] font-bold text-brand-cream truncate flex-1 leading-tight group-hover:text-brand-cream transition-colors text-left">
                      {art.title.toLowerCase()}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-brand-cream/90 ml-2">
                      {art.price === 0 ? 'FREE' : `$${art.price}`}
                    </span>
                  </div>
                  <span className="font-sans text-[8px] text-brand-cream/70 text-left">
                    @{art.artistName.toLowerCase().replace(/\s+/g, '')}
                  </span>
                </div>

                {/* Hover tools / quick interact row */}
                <div className="mt-4 flex items-center justify-between border-t border-brand-cream/10 pt-2.5">
                  {/* Hearts */}
                  <button
                    onClick={(e) => handleLike(e, art)}
                    className={`flex items-center gap-1 font-mono text-[10px] transition-all active:scale-90 ${
                      isLiked ? 'text-brand-cream' : 'text-brand-cream/60 hover:text-brand-cream'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{currentLikes}</span>
                  </button>

                  {/* Save */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(art.id);
                    }}
                    className={`p-1 rounded transition-all active:scale-90 ${
                      isSaved
                        ? 'text-brand-cream'
                        : 'text-brand-cream/60 hover:text-brand-cream'
                    }`}
                    title={isSaved ? 'Unsave' : 'Save artwork'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="w-full py-16 text-center border border-dashed border-brand-cream/20 rounded-xl bg-brand-charcoal/35">
          <p className="font-pixel text-xs text-brand-cream/50 mb-2">NO RETRO CREATIONS FOUND</p>
          <p className="font-sans text-xs text-brand-cream/30">Try tweaking your search filters or check another category!</p>
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {activeArt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-dark/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 26 } }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="bg-brand-charcoal border-2 border-brand-cream rounded-xl max-w-2xl w-full p-6 relative shadow-2xl my-8"
            >
              
              {/* Close button */}
              <button
                onClick={() => setActiveArt(null)}
                className="absolute top-4 right-4 text-brand-cream/60 hover:text-brand-cream border border-brand-cream/20 hover:border-brand-cream/50 rounded-full p-1.5 transition-all cursor-pointer bg-brand-dark/30"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                
                {/* Left Column: Scaled crispy image view */}
                <div className="flex flex-col gap-4">
                  <div className="w-full aspect-square bg-brand-dark border border-brand-cream/20 rounded-lg overflow-hidden relative shadow-inner">
                    <LazyImage
                      src={activeArt.imageUrl}
                      alt={activeArt.title}
                      className="w-full h-full object-cover"
                      pixelated={true}
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Copyable Palette row */}
                  <div>
                    <h4 className="font-pixel text-[9px] text-brand-cream/50 mb-2 uppercase">ARTWORK HEX PALETTE</h4>
                    <div className="flex items-center gap-1.5">
                      {getMockPalette(activeArt.category).map((color) => (
                        <button
                          key={color}
                          onClick={() => copyPaletteHex(color)}
                          className="flex-1 h-7 rounded border border-brand-cream/15 relative group active:scale-95 cursor-pointer"
                          style={{ backgroundColor: color }}
                          title={`Click to copy ${color}`}
                        >
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-brand-dark text-brand-cream font-mono text-[9px] px-1 rounded border border-brand-cream/20 whitespace-nowrap z-10">
                            {color}
                          </span>
                        </button>
                      ))}
                    </div>
                    {copiedColor && (
                      <p className="text-[10px] font-pixel text-green-400 mt-1.5 text-center animate-pulse">
                        Copied color {copiedColor} to clipboard!
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column: Descriptions & simulated download/buy actions */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="bg-brand-dark/40 px-2 py-1 border border-brand-cream/10 rounded self-start inline-block font-mono text-[9px] text-brand-cream/65 mb-2.5">
                      DIMENSIONS: {activeArt.dimensions}px // {activeArt.category === 'music-retro' ? 'vinyl' : activeArt.category}
                    </div>
                    
                    <h2 className="font-pixel text-base text-brand-cream leading-snug">{activeArt.title}</h2>
                    <p className="font-sans text-xs text-brand-cream/60 mt-1">
                      by <span className="text-brand-cream font-semibold">{activeArt.artistName}</span>
                    </p>

                    <p className="font-sans text-xs text-brand-cream/80 leading-relaxed mt-4 bg-brand-dark/30 p-3 rounded border border-brand-cream/5">
                      A beautiful retro creation capturing quiet pixelated moods. Available for high-res download and integration under CC-BY license.
                    </p>

                    {/* Tag List */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {activeArt.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono text-brand-cream/50 bg-brand-dark/40 border border-brand-cream/10 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Checkouts / Download Area */}
                  <div className="mt-6 border-t border-brand-cream/15 pt-4">
                    <div className="flex items-center justify-between font-pixel text-xs mb-3">
                      <span className="text-brand-cream/50">LICENSE PRICE:</span>
                      <span className="text-brand-cream text-sm font-bold">
                        {activeArt.price === 0 ? 'FREE DOWNLOAD' : `$${activeArt.price}.00 USD`}
                      </span>
                    </div>

                    {activeArt.price === 0 ? (
                      <button
                        onClick={() => handleDownload(activeArt)}
                        className="w-full py-2.5 bg-brand-cream hover:bg-brand-light text-brand-charcoal font-pixel text-xs font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>DOWNLOAD ORIGINAL ASSET</span>
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {checkoutSimStatus === 'idle' && (
                          <button
                            onClick={startCheckoutSimulation}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-pixel text-xs font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>BUY RETRO LICENSE</span>
                          </button>
                        )}

                        {checkoutSimStatus === 'processing' && (
                          <div className="w-full py-2.5 bg-brand-dark border border-brand-cream/30 text-brand-cream/70 rounded flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-brand-cream" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="font-mono text-xs">PROCESSING RETRO CRYPTO PAYMENTS...</span>
                          </div>
                        )}

                        {checkoutSimStatus === 'success' && (
                          <div className="flex flex-col gap-2">
                            <div className="p-2.5 bg-green-950/40 border border-green-500/30 rounded flex items-center gap-2 text-green-400 font-mono text-[11px] animate-fadeIn">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span>PAYMENT ACQUIRED! LICENSE KEY GENERATED.</span>
                            </div>
                            <button
                              onClick={() => handleDownload(activeArt)}
                              className="w-full py-2.5 bg-brand-cream hover:bg-brand-light text-brand-charcoal font-pixel text-xs font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              <span>DOWNLOAD SOURCE PNG</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="font-mono text-[8px] text-brand-cream/30 text-center mt-3">
                      🔒 Retro encryption secures payments. Downloading provides scaled-up 1024x1024 crispy source file.
                    </p>
                  </div>

                </div>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
