export type Category = 'coffee' | 'nature' | 'fantasy' | 'sci-fi' | 'music-retro';

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  joinedDate: string;
  isAuthor: boolean;
  palettePreference: string[];
  level: string;
  views: number;
  likes: number;
  earnings: number;
}

export interface PixelArt {
  id: string;
  title: string;
  imageUrl: string;
  artistId: string;
  artistName: string;
  category: Category;
  likes: number;
  saves: number;
  downloads: number;
  price: number; // 0 for free
  tags: string[];
  dimensions: string; // e.g., "64x64"
  createdAt: string;
  isFeatured?: boolean;
}

export interface Contest {
  id: string;
  theme: string;
  description: string;
  palette: string[];
  dimensions: string;
  endDate: string;
  prizePool: string;
  active: boolean;
  submissions: ContestSubmission[];
  pastWinners?: {
    place: 1 | 2 | 3;
    artistName: string;
    artTitle: string;
    imageUrl: string;
  }[];
}

export interface ContestSubmission {
  id: string;
  artId?: string; // if from gallery
  title: string;
  imageUrl: string;
  artistName: string;
  votes: number;
  submittedAt: string;
}
