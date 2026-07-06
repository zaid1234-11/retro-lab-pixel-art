import React, { useState } from 'react';
import { User, Award, Eye, Heart, Coins, Folder, ShieldAlert, Sparkles, LogOut, FileImage, Download, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Artist, PixelArt, Category } from '../types';
import PixelEditor from './PixelEditor';

interface ProfileViewProps {
  artist: Artist;
  setArtist: React.Dispatch<React.SetStateAction<Artist>>;
  userPortfolio: PixelArt[];
  setUserPortfolio: React.Dispatch<React.SetStateAction<PixelArt[]>>;
  savedArts: PixelArt[];
  onToggleFavorite: (artId: string) => void;
  onSelectArt: (art: PixelArt) => void;
}

export default function ProfileView({
  artist,
  setArtist,
  userPortfolio,
  setUserPortfolio,
  savedArts,
  onToggleFavorite,
  onSelectArt
}: ProfileViewProps) {
  
  // Become author form
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formPalette, setFormPalette] = useState('Neon Arcade');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Creator toggle tools
  const [showEditor, setShowEditor] = useState(false);

  const generateAIBio = () => {
    setIsGeneratingBio(true);
    setTimeout(() => {
      const bios = [
        `Retro-futuristic enthusiast painting nostalgic pixel scenes using the restricted ${formPalette} palette. Drawn to sunset memories.`,
        `16-bit illustrator drafting cozy environments, coffee cups, and warm fireplace sparkles. Lover of slow retro gaming.`,
        `Digital nomad and sprite designer rendering glowing celestial artifacts and fantasy dungeon dungeons. Powered by chiptunes.`,
        `Vaporwave & cyberpunk pixel artisan sculpting dense glowing alleys, digital drizzle, and vintage CRT screen scanlines.`
      ];
      const randomBio = bios[Math.floor(Math.random() * bios.length)];
      setFormBio(randomBio);
      setIsGeneratingBio(false);
    }, 1200);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setArtist({
      ...artist,
      name: formName.trim(),
      bio: formBio.trim() || 'A mysterious retro pixel artist.',
      isAuthor: true,
      palettePreference: [formPalette],
      level: 'Pixel Novice',
      views: 120,
      likes: 24,
      earnings: 0
    });
  };

  const handleResetAuthor = () => {
    if (window.confirm('Reset your artist profile back to visitor mode? Your drawn portfolio will be kept but stats will reset.')) {
      setArtist({
        ...artist,
        name: 'Retro Guest',
        isAuthor: false,
        bio: 'Explorer of 16-bit retro horizons and cozy pixel designs.',
        level: 'Pixel Novice',
        views: 0,
        likes: 0,
        earnings: 0
      });
    }
  };

  const handleAddDrawnArt = (newArt: {
    title: string;
    imageUrl: string;
    category: Category;
    dimensions: string;
    tags: string[];
  }) => {
    const freshArt: PixelArt = {
      id: `art-user-${Date.now()}`,
      title: newArt.title,
      imageUrl: newArt.imageUrl,
      artistId: artist.id,
      artistName: artist.name,
      category: newArt.category,
      likes: 0,
      saves: 0,
      downloads: 0,
      price: 0,
      tags: newArt.tags,
      dimensions: newArt.dimensions,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUserPortfolio(prev => [freshArt, ...prev]);
    setShowEditor(false);

    // Increment local stats for feedback
    setArtist(prev => ({
      ...prev,
      views: prev.views + 15
    }));
  };

  const triggerDownload = (art: PixelArt) => {
    const link = document.createElement('a');
    link.href = art.imageUrl;
    link.download = `${art.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-8 pb-16 select-none animate-fadeIn">
      
      {/* 1. VISITOR / BECOME AUTHOR VIEW */}
      {!artist.isAuthor ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Info Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="md:col-span-5 bg-brand-charcoal border border-brand-cream/20 rounded-xl p-5 shadow-lg"
          >
            <div className="w-16 h-16 bg-brand-dark rounded-full border border-brand-cream/30 flex items-center justify-center text-brand-cream mb-4">
              <User className="w-8 h-8" />
            </div>
            <h3 className="font-pixel text-xs text-brand-cream tracking-wider uppercase mb-2">Become an Author</h3>
            <p className="font-sans text-xs text-brand-cream/70 leading-relaxed mb-4">
              By registering as an author, you unlock a portfolio, receive custom views statistics, and can use our interactive pixel canvas to publish your very own custom creations to the public search gallery!
            </p>
            <div className="border-t border-brand-cream/10 pt-3 space-y-2 font-mono text-[10px] text-brand-cream/50">
              <p>✔ Instant drawing board integration</p>
              <p>✔ Royalties simulator tracking saves</p>
              <p>✔ Custom AI retro biography generator</p>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.form 
            onSubmit={handleApply} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="md:col-span-7 bg-brand-charcoal border border-brand-cream/20 rounded-xl p-6 shadow-lg flex flex-col gap-4"
          >
            <h3 className="font-pixel text-xs text-brand-cream tracking-wider uppercase">Artist Profile Registration</h3>
            
            <div>
              <label className="block font-mono text-[9px] text-brand-cream/50 mb-1">ARTIST ALIAS / PSEUDONYM *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chronos_Vibe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-brand-dark border border-brand-cream/20 hover:border-brand-cream/40 focus:border-brand-cream rounded px-3 py-2 text-brand-cream text-xs font-sans outline-none outline-0"
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] text-brand-cream/50 mb-1">FAVORITE ARTISTIC PALETTE</label>
              <select
                value={formPalette}
                onChange={(e) => setFormPalette(e.target.value)}
                className="w-full bg-brand-dark border border-brand-cream/20 hover:border-brand-cream/40 focus:border-brand-cream rounded px-3 py-2 text-brand-cream text-xs font-sans outline-none cursor-pointer"
              >
                <option value="Neon Arcade">Neon Arcade (Vibrant, Retro)</option>
                <option value="Cozy Hearth">Cozy Hearth (Earth Tones, Browns)</option>
                <option value="Monochrome Gameboy">Monochrome Gameboy (Greens, Retro LCD)</option>
                <option value="Celestial Dream">Celestial Dream (Deep Blues, Purples)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-mono text-[9px] text-brand-cream/50">CREATOR BIOGRAPHY (MAX 160 CHARS)</label>
                <button
                  type="button"
                  onClick={generateAIBio}
                  disabled={isGeneratingBio}
                  className="text-yellow-400 hover:text-yellow-300 font-pixel text-[8px] flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5 animate-spin" />
                  <span>{isGeneratingBio ? 'GENERATING...' : 'AUTO-GENERATE RETRO BIO'}</span>
                </button>
              </div>
              <textarea
                placeholder="Write a tiny story about your pixel journey..."
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full bg-brand-dark border border-brand-cream/20 hover:border-brand-cream/40 focus:border-brand-cream rounded px-3 py-2 text-brand-cream text-xs font-sans outline-none resize-none"
              />
              <span className="text-[9px] font-mono text-brand-cream/30 self-end mt-1">{formBio.length}/160 characters</span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-cream hover:bg-brand-light text-brand-charcoal font-pixel text-xs font-bold rounded shadow transition-all active:scale-98 cursor-pointer mt-2"
            >
              LAUNCH MY ARTIST SPACE
            </button>
          </motion.form>

        </div>
      ) : (
        /* 2. LOGGED IN AUTHOR DASHBOARD */
        <div className="flex flex-col gap-8 animate-fadeIn">
          
          {/* Header Dashboard Profile Card */}
          <div className="bg-brand-charcoal border border-brand-cream/20 rounded-xl p-6 shadow-lg flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full border-2 border-brand-cream overflow-hidden bg-brand-dark">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-pixel text-sm text-brand-cream">{artist.name}</h2>
                  <span className="bg-brand-dark px-1.5 py-0.5 rounded text-[8px] font-mono text-brand-cream/50 border border-brand-cream/10">
                    {artist.level}
                  </span>
                </div>
                <p className="font-sans text-xs text-brand-cream/70 max-w-md mt-1.5 leading-relaxed italic">
                  "{artist.bio}"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-mono text-[9px] text-brand-cream/40">PREFERRED STYLE:</span>
                  <span className="font-mono text-[9px] text-brand-cream/75 bg-brand-dark/40 border border-brand-cream/10 px-1.5 py-0.5 rounded">
                    {artist.palettePreference[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout/Reset button */}
            <button
              onClick={handleResetAuthor}
              className="px-3 py-1.5 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-red-300 rounded font-pixel text-[9px] flex items-center gap-1.5 transition-all cursor-pointer self-end md:self-center"
              title="Reset artist profile"
            >
              <LogOut className="w-3 h-3" />
              <span>EXIT ARTIST SPACE</span>
            </button>
          </div>

          {/* Stats Bento Grid Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-brand-charcoal/80 border border-brand-cream/15 rounded-xl p-4 flex items-center gap-3 shadow">
              <Eye className="w-6 h-6 text-brand-cream/50" />
              <div>
                <span className="block font-mono text-[9px] text-brand-cream/40 uppercase">Total Views</span>
                <span className="font-mono text-sm font-bold text-brand-cream">{artist.views}</span>
              </div>
            </div>

            <div className="bg-brand-charcoal/80 border border-brand-cream/15 rounded-xl p-4 flex items-center gap-3 shadow">
              <Heart className="w-6 h-6 text-brand-cream/50 animate-pulse" />
              <div>
                <span className="block font-mono text-[9px] text-brand-cream/40 uppercase">Upvotes</span>
                <span className="font-mono text-sm font-bold text-brand-cream">{artist.likes}</span>
              </div>
            </div>

            <div className="bg-brand-charcoal/80 border border-brand-cream/15 rounded-xl p-4 flex items-center gap-3 shadow">
              <Coins className="w-6 h-6 text-brand-cream/50" />
              <div>
                <span className="block font-mono text-[9px] text-brand-cream/40 uppercase">Drawn Assets</span>
                <span className="font-mono text-sm font-bold text-brand-cream">{userPortfolio.length}</span>
              </div>
            </div>

            <div className="bg-brand-charcoal/80 border border-brand-cream/15 rounded-xl p-4 flex items-center gap-3 shadow">
              <Award className="w-6 h-6 text-brand-cream/50" />
              <div>
                <span className="block font-mono text-[9px] text-brand-cream/40 uppercase">Royalty Balance</span>
                <span className="font-mono text-sm font-bold text-brand-cream">${artist.earnings}.00 USD</span>
              </div>
            </div>

          </div>

          {/* Draw / Upload Canvas trigger and collapse */}
          <div className="bg-brand-charcoal border border-brand-cream/20 rounded-xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-pixel text-xs text-brand-cream tracking-wider uppercase flex items-center gap-2">
                <Folder className="w-4 h-4 text-brand-cream" />
                <span>My Drawn Portfolio ({userPortfolio.length})</span>
              </h3>
              <button
                onClick={() => setShowEditor(!showEditor)}
                className="px-4 py-1.5 bg-brand-cream hover:bg-brand-light text-brand-charcoal font-pixel text-[10px] font-bold rounded shadow transition-all cursor-pointer"
              >
                {showEditor ? 'HIDE DRAWING GRID' : 'LAUNCH DRAWING BOARD'}
              </button>
            </div>

            {showEditor && (
              <div className="mb-8 border border-brand-cream/20 rounded-lg p-1 animate-fadeIn">
                <PixelEditor onPublish={handleAddDrawnArt} />
              </div>
            )}

            {/* Active Drawn portfolio list */}
            {userPortfolio.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {userPortfolio.map((art, idx) => (
                  <motion.div
                    key={art.id}
                    onClick={() => onSelectArt(art)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ 
                      scale: 1.03,
                      y: -4,
                      borderColor: "rgba(237, 233, 224, 0.45)",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-brand-dark/40 border border-brand-cream/10 rounded-lg p-2.5 cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="relative w-full aspect-square rounded overflow-hidden bg-brand-dark">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'pixelated' }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="mt-2 flex flex-col justify-between h-full select-none">
                      <span className="font-pixel text-[9px] font-bold text-brand-cream truncate group-hover:text-brand-light transition-colors">{art.title}</span>
                      <span className="font-sans text-[8px] text-brand-cream/35 mt-0.5 uppercase tracking-wide">{art.dimensions} // {art.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="w-full py-12 text-center border border-dashed border-brand-cream/15 rounded-lg bg-brand-dark/20">
                <p className="font-pixel text-[10px] text-brand-cream/40 mb-1">YOUR PORTFOLIO IS EMPTY</p>
                <p className="font-sans text-xs text-brand-cream/35">Click 'Launch Drawing Board' above to sketch and publish your first artwork!</p>
              </div>
            )}
          </div>

          {/* Favorites List section */}
          <div className="bg-brand-charcoal border border-brand-cream/20 rounded-xl p-5 shadow-lg">
            <h3 className="font-pixel text-xs text-brand-cream tracking-wider uppercase mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-brand-cream" />
              <span>My Saved Favorites ({savedArts.length})</span>
            </h3>

            {savedArts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedArts.map((art, idx) => (
                  <motion.div
                    key={art.id}
                    onClick={() => onSelectArt(art)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ 
                      scale: 1.02,
                      borderColor: "rgba(237, 233, 224, 0.4)",
                      boxShadow: "0 8px 12px -3px rgba(0, 0, 0, 0.25)"
                    }}
                    className="bg-brand-dark/30 border border-brand-cream/10 rounded-lg p-3 flex gap-3 cursor-pointer transition-all items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded overflow-hidden bg-brand-dark border border-brand-cream/10 shrink-0">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover"
                          style={{ imageRendering: 'pixelated' }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 select-none">
                        <span className="block font-pixel text-[10px] text-brand-cream truncate group-hover:text-brand-light transition-colors">{art.title}</span>
                        <span className="block font-sans text-[10px] text-brand-cream/45 truncate mt-0.5">by {art.artistName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Download */}
                      <button
                        onClick={() => triggerDownload(art)}
                        className="p-1.5 border border-brand-cream/10 hover:border-brand-cream rounded hover:text-brand-cream transition-all cursor-pointer bg-brand-dark/40"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5 text-brand-cream/60 hover:text-brand-cream" />
                      </button>
                      {/* Unfavorite */}
                      <button
                        onClick={() => onToggleFavorite(art.id)}
                        className="p-1.5 border border-brand-cream/10 hover:border-red-400 rounded text-brand-cream transition-all cursor-pointer bg-brand-dark/40"
                        title="Unfavorite"
                      >
                        <Heart className="w-3.5 h-3.5 text-red-400 fill-current animate-pulse" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="w-full py-12 text-center border border-dashed border-brand-cream/15 rounded-lg bg-brand-dark/20">
                <p className="font-pixel text-[10px] text-brand-cream/40 mb-1">NO SAVED ARTWORKS YET</p>
                <p className="font-sans text-xs text-brand-cream/35">Explore our gallery space and click the ribbon/bookmark icon on any piece to save it here!</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
