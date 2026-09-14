export type PlayerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'mid-left' | 'mid-right' | 'bottom-center';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  score: number;
  tiles: string[]; // Current hand of tiles
  initialTileCount: number;
  tilesRemaining: number;
  wordsMade: {
    word: string;
    score: number;
    timestamp: number;
    isDuplicate?: boolean;
  }[];
  consecutiveWords: number;
}

export interface FlyingTile {
  id: string;
  letter: string;
  fromPlayerId: string;
  toPlayerId: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  createdAt: number;
  durationMs: number;
}

export interface WordEvent {
  id: string;
  word: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  score: number;
  blastedLetters: string[];
  targetPlayerIds: string[];
  isDuplicate: boolean;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  maxPlayers: number; // 2 to 5
  status: 'lobby' | 'playing' | 'ended';
  startingTiles: number; // default ~40
  minWordLength: number; // default 4
  durationSeconds: number; // default 180 (3 minutes)
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  players: Record<string, Player>;
  allWordsPlayed: string[]; // List of all words ever played in room for duplicate detection
  winnerId?: string;
  recentEvents: WordEvent[];
}

export interface FirebaseConfigData {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
