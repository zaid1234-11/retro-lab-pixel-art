import React, { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import GalleryView from './components/GalleryView';
import ContestsView from './components/ContestsView';
import ProfileView from './components/ProfileView';
import RetroLabView from './components/RetroLabView';
import RetroCursor from './components/RetroCursor';
import MobileDrawer from './components/MobileDrawer';
import { useMediaQuery } from './hooks/useMediaQuery';

import { mockPixelArts, mockArtists, mockContests } from './data';
import { Category, Artist, PixelArt } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);

  // Hook-based responsive system
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  const showMobileNav = isMobile || isTablet;

  // User States
  const [artistProfile, setArtistProfile] = useState<Artist>({
    id: 'user-artist-1',
    name: 'Retro Guest',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Explorer of 16-bit retro horizons and cozy pixel designs.',
    joinedDate: 'July 2026',
    isAuthor: false,
    palettePreference: ['Neon Arcade'],
    level: 'Pixel Novice',
    views: 0,
    likes: 0,
    earnings: 0
  });

  // User portfolio (starts empty, gets populated when user draws assets)
  const [userPortfolio, setUserPortfolio] = useState<PixelArt[]>([]);

  // Favorited arts (starts with 'art-summer-dream' pre-saved for illustration)
  const [savedArtIds, setSavedArtIds] = useState<string[]>(['art-summer-dream', 'art-cozy-coffee']);

  const handleToggleFavorite = (artId: string) => {
    setSavedArtIds((prev) =>
      prev.includes(artId) ? prev.filter((id) => id !== artId) : [...prev, artId]
    );
  };

  const handleDeepLinkCategory = (category?: Category) => {
    setSelectedCategory(category || null);
    setCurrentView('gallery');
  };

  // Combine default mock arts and user-created portfolio items for the search gallery
  const allPixelArts = [...userPortfolio, ...mockPixelArts];

  const featuredArt = mockPixelArts.find((art) => art.id === 'art-summer-dream') || mockPixelArts[0];
  const rightGridArts = mockPixelArts.filter((art) => art.id !== 'art-summer-dream');

  // Find saved arts objects to render in favorites drawer
  const savedArtsList = allPixelArts.filter((art) => savedArtIds.includes(art.id));

  // Detail Modal popup shortcut (useful if selected from Profile or other lists)
  const [profileSelectedArt, setProfileSelectedArt] = useState<PixelArt | null>(null);

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col font-sans text-brand-cream/90 selection:bg-brand-cream selection:text-brand-charcoal retro-scanlines">
      {/* Custom Retro Pixel-Art Cursor overlay */}
      <RetroCursor />

      {/* Visual top bar of mockup */}
      <Header 
        showMenuButton={showMobileNav}
        isMenuOpen={isSideMenuOpen}
        onMenuToggle={() => setIsSideMenuOpen(!isSideMenuOpen)}
      />

      {/* Mobile-friendly sliding menu drawer */}
      {showMobileNav && (
        <MobileDrawer 
          isOpen={isSideMenuOpen} 
          onClose={() => setIsSideMenuOpen(false)} 
          currentView={currentView} 
          setCurrentView={(view) => {
            setCurrentView(view);
            setSelectedCategory(null); // Clear temporary filter
          }}
        />
      )}

      {/* Retro Navigation Capsule - only displayed on Desktop */}
      {!showMobileNav && (
        <Navigation currentView={currentView} setCurrentView={(view) => {
          setCurrentView(view);
          setSelectedCategory(null); // Clear temporary filter
        }} />
      )}


      {/* Main Screen Router */}
      <main className="flex-1 w-full">
        {currentView === 'home' && (
          <HomeView
            featuredArt={featuredArt}
            rightGridArts={rightGridArts}
            onNavigateToGallery={handleDeepLinkCategory}
            onNavigateToContests={() => setCurrentView('contests')}
            onNavigateToProfile={() => setCurrentView('profile')}
            onToggleFavorite={handleToggleFavorite}
            savedArtIds={savedArtIds}
          />
        )}

        {currentView === 'gallery' && (
          <GalleryView
            pixelArts={allPixelArts}
            onToggleFavorite={handleToggleFavorite}
            savedArtIds={savedArtIds}
            initialCategory={selectedCategory}
          />
        )}

        {currentView === 'contests' && (
          <ContestsView
            activeContest={mockContests[0]}
            pastContests={mockContests.slice(1)}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            artist={artistProfile}
            setArtist={setArtistProfile}
            userPortfolio={userPortfolio}
            setUserPortfolio={setUserPortfolio}
            savedArts={savedArtsList}
            onToggleFavorite={handleToggleFavorite}
            onSelectArt={(art) => {
              setProfileSelectedArt(art);
              setCurrentView('gallery');
            }}
          />
        )}

        {currentView === 'retro-lab' && (
          <RetroLabView />
        )}
      </main>

      {/* Tiny Retro footer */}
      <footer className="w-full border-t border-brand-charcoal/30 bg-brand-dark/80 py-4 text-center font-mono text-[9px] text-brand-cream/35 select-none mt-auto">
        <p>© 2026 PIX_RCKT LABS // CRAFTED WITH NEUTRAL & CALM COLOR DESIGN VALUES</p>
      </footer>
    </div>
  );
}
