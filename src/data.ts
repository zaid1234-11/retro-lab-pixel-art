import { PixelArt, Artist, Contest } from './types';

export const mockArtists: Artist[] = [
  {
    id: 'artist-sony-t',
    name: 'Sony T',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Self-taught 16-bit pixel artist with a passion for melancholic sunset horizons and nostalgic cyberpunk alleys.',
    joinedDate: 'Jan 2026',
    isAuthor: true,
    palettePreference: ['#E8E8C6', '#252525', '#E25822', '#FF9F1C'],
    level: 'Sprite Master',
    views: 14205,
    likes: 3820,
    earnings: 450
  },
  {
    id: 'artist-kiko',
    name: 'Kiko_99',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Retro coder and cozy cafe atmosphere drawing enthusiast. Loves small warm details.',
    joinedDate: 'Mar 2026',
    isAuthor: true,
    palettePreference: ['#8E5D46', '#D4A373', '#FAEDCD', '#E8E8C6'],
    level: 'Pixel Novice',
    views: 4820,
    likes: 910,
    earnings: 85
  },
  {
    id: 'artist-cosmic-ray',
    name: 'Cosmic Ray',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    bio: 'Spaceships, galactic retro overlays, and sci-fi neon arcade memories.',
    joinedDate: 'Feb 2026',
    isAuthor: true,
    palettePreference: ['#1A1A2E', '#16213E', '#0F3460', '#E94560'],
    level: 'Vector Elite',
    views: 8440,
    likes: 2150,
    earnings: 290
  }
];

export const mockPixelArts: PixelArt[] = [
  {
    id: 'art-summer-dream',
    title: 'Summer dream...',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    artistId: 'artist-sony-t',
    artistName: 'Sony T',
    category: 'nature',
    likes: 1240,
    saves: 850,
    downloads: 320,
    price: 0,
    tags: ['Sunset', 'Anime', 'Melancholic', 'Summer'],
    dimensions: '128x128',
    createdAt: '2026-06-15',
    isFeatured: true
  },
  {
    id: 'art-forest-path',
    title: 'Sunlit Sanctuary',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-kiko',
    artistName: 'Kiko_99',
    category: 'nature',
    likes: 540,
    saves: 320,
    downloads: 110,
    price: 5,
    tags: ['Forest', 'Green', 'Peaceful', 'Sunlight'],
    dimensions: '64x64',
    createdAt: '2026-06-20'
  },
  {
    id: 'art-pagoda',
    title: 'Kyoto Temple Waterfalls',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-sony-t',
    artistName: 'Sony T',
    category: 'fantasy',
    likes: 890,
    saves: 610,
    downloads: 240,
    price: 10,
    tags: ['Pagoda', 'Japan', 'Waterfall', 'Autumn'],
    dimensions: '128x128',
    createdAt: '2026-06-25'
  },
  {
    id: 'art-sunrise-ocean',
    title: 'Crimson Cliffs',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-cosmic-ray',
    artistName: 'Cosmic Ray',
    category: 'nature',
    likes: 420,
    saves: 280,
    downloads: 80,
    price: 0,
    tags: ['Sunrise', 'Cliffs', 'Nature', 'Atmospheric'],
    dimensions: '64x64',
    createdAt: '2026-06-28'
  },
  {
    id: 'art-sunset-hill',
    title: 'Twilight Bond',
    imageUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-sony-t',
    artistName: 'Sony T',
    category: 'nature',
    likes: 910,
    saves: 720,
    downloads: 190,
    price: 0,
    tags: ['Sunset', 'Silhouettes', 'Twilight', 'Hill'],
    dimensions: '64x64',
    createdAt: '2026-07-01'
  },
  {
    id: 'art-glowing-mushrooms',
    title: 'Spore Glow Caverns',
    imageUrl: 'https://images.unsplash.com/photo-1532456745301-b2c645d8b80d?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-cosmic-ray',
    artistName: 'Cosmic Ray',
    category: 'fantasy',
    likes: 710,
    saves: 490,
    downloads: 150,
    price: 8,
    tags: ['Mushrooms', 'Cave', 'Fantasy', 'Glowing'],
    dimensions: '64x64',
    createdAt: '2026-06-18'
  },
  {
    id: 'art-demon-shogun',
    title: 'Oni Guardian',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-sony-t',
    artistName: 'Sony T',
    category: 'fantasy',
    likes: 1040,
    saves: 790,
    downloads: 290,
    price: 12,
    tags: ['Oni', 'Warrior', 'Red', 'Japanese Myth'],
    dimensions: '128x128',
    createdAt: '2026-06-30'
  },
  {
    id: 'art-cozy-coffee',
    title: 'Rainy Day Brew',
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-kiko',
    artistName: 'Kiko_99',
    category: 'coffee',
    likes: 380,
    saves: 220,
    downloads: 95,
    price: 0,
    tags: ['Coffee', 'Cafe', 'Rain', 'Cozy'],
    dimensions: '32x32',
    createdAt: '2026-07-02'
  },
  {
    id: 'art-space-arcade',
    title: 'Arcade Invasion',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-cosmic-ray',
    artistName: 'Cosmic Ray',
    category: 'sci-fi',
    likes: 620,
    saves: 410,
    downloads: 130,
    price: 4,
    tags: ['Arcade', 'Invaders', 'Neon', 'Retro'],
    dimensions: '64x64',
    createdAt: '2026-07-03'
  },
  {
    id: 'art-neon-city',
    title: 'Drizzly Neon Alley',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-sony-t',
    artistName: 'Sony T',
    category: 'sci-fi',
    likes: 1530,
    saves: 1100,
    downloads: 480,
    price: 15,
    tags: ['Cyberpunk', 'Rain', 'Neon', 'Street'],
    dimensions: '128x128',
    createdAt: '2026-07-04'
  },
  {
    id: 'art-retro-synth',
    title: 'Midnight Cassette',
    imageUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-cosmic-ray',
    artistName: 'Cosmic Ray',
    category: 'music-retro',
    likes: 470,
    saves: 300,
    downloads: 120,
    price: 0,
    tags: ['Synthwave', 'Cassette', 'Purple', 'Nostalgia'],
    dimensions: '32x32',
    createdAt: '2026-07-01'
  },
  {
    id: 'art-jazz-cafe',
    title: 'Vinyl & Jazz Evening',
    imageUrl: 'https://images.unsplash.com/photo-1481185103603-1dc844ef51db?auto=format&fit=crop&w=600&q=80',
    artistId: 'artist-kiko',
    artistName: 'Kiko_99',
    category: 'music-retro',
    likes: 310,
    saves: 190,
    downloads: 65,
    price: 5,
    tags: ['Vinyl', 'Music', 'Jazz', 'Chill'],
    dimensions: '32x32',
    createdAt: '2026-07-04'
  }
];

export const mockContests: Contest[] = [
  {
    id: 'contest-cyberpunk-rain',
    theme: 'Neon Drizzle & Cyber Alleys',
    description: 'Draw a gritty, rainy urban scene under vibrant neon lights using a restricted 8-color cool-tone palette.',
    palette: ['#000000', '#1F1A3A', '#3C2E75', '#00F0FF', '#FF007F', '#8A2BE2', '#FFFFFF', '#49FF9F'],
    dimensions: '64x64',
    endDate: '2026-07-15T23:59:59-07:00',
    prizePool: '150 USD + "Cyber Artisan" Badge',
    active: true,
    submissions: [
      {
        id: 'sub-1',
        title: 'Cyber Slum Window',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=80',
        artistName: 'Kiko_99',
        votes: 142,
        submittedAt: '2026-07-03'
      },
      {
        id: 'sub-2',
        title: 'Neon Ramen Stall',
        imageUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
        artistName: 'Sony T',
        votes: 285,
        submittedAt: '2026-07-04'
      },
      {
        id: 'sub-3',
        title: 'Floating Police Pod',
        imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80',
        artistName: 'Cosmic Ray',
        votes: 198,
        submittedAt: '2026-07-04'
      }
    ],
    pastWinners: [
      {
        place: 1,
        artistName: 'Sony T',
        artTitle: 'Chinatown Glitch',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80'
      },
      {
        place: 2,
        artistName: 'Cosmic Ray',
        artTitle: 'Cyber Outpost 9',
        imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=300&q=80'
      },
      {
        place: 3,
        artistName: 'Kiko_99',
        artTitle: 'Noodle Stand Rain',
        imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80'
      }
    ]
  },
  {
    id: 'contest-cozy-kitchen',
    theme: 'Warm Pixel Baking',
    description: 'Illustrate a cozy baking kitchen full of delicious pies, warm oven light, and friendly steam.',
    palette: ['#4E3115', '#9A5B2B', '#E5A65D', '#F9EAD3', '#D64E4D', '#A1C349', '#63C0DF', '#FFE57F'],
    dimensions: '32x32',
    endDate: '2026-06-30T23:59:59-07:00',
    prizePool: '100 USD + "Patisserie Pixeller" Badge',
    active: false,
    submissions: [],
    pastWinners: [
      {
        place: 1,
        artistName: 'Kiko_99',
        artTitle: 'Mamma Cooking Pie',
        imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300&q=80'
      },
      {
        place: 2,
        artistName: 'Sony T',
        artTitle: 'Golden Hour Bread',
        imageUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=300&q=80'
      }
    ]
  }
];
