// Firestore Realtime Service with BroadcastChannel Fallback for Local / Offline Multiplayer

import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseApp } from '../config/firebase';
import type { GameRoom, Player, WordEvent } from '../types/game';
import { generateInitialTileBag } from '../config/letterDistribution';

// Local storage / BroadcastChannel sync for instant offline / multi-tab testing
const localRooms: Map<string, GameRoom> = new Map();
const localListeners: Map<string, Set<(room: GameRoom) => void>> = new Map();
const broadcast = typeof window !== 'undefined' ? new BroadcastChannel('word_blaster_channel') : null;

if (broadcast) {
  broadcast.onmessage = (event) => {
    const { type, roomId, room } = event.data;
    if (type === 'ROOM_UPDATE' && roomId && room) {
      localRooms.set(roomId, room);
      const callbacks = localListeners.get(roomId);
      if (callbacks) {
        callbacks.forEach((cb) => cb(room));
      }
    }
  };
}

function notifyLocalListeners(roomId: string, room: GameRoom) {
  localRooms.set(roomId, room);
  const callbacks = localListeners.get(roomId);
  if (callbacks) {
    callbacks.forEach((cb) => cb(room));
  }
  if (broadcast) {
    broadcast.postMessage({ type: 'ROOM_UPDATE', roomId, room });
  }
}

/**
 * Creates a new Game Room with the host player.
 */
export async function createRoom(
  roomId: string,
  hostPlayer: Player,
  maxPlayers: number = 4,
  startingTiles: number = 40,
  durationSeconds: number = 180
): Promise<GameRoom> {
  const initialTiles = generateInitialTileBag(startingTiles);
  hostPlayer.tiles = initialTiles;
  hostPlayer.initialTileCount = startingTiles;
  hostPlayer.tilesRemaining = startingTiles;

  const newRoom: GameRoom = {
    id: roomId.toUpperCase().trim(),
    name: `${hostPlayer.name}'s Arena`,
    hostId: hostPlayer.id,
    maxPlayers,
    status: 'lobby',
    startingTiles,
    minWordLength: 4,
    durationSeconds,
    createdAt: Date.now(),
    players: {
      [hostPlayer.id]: hostPlayer,
    },
    allWordsPlayed: [],
    recentEvents: [],
  };

  const { db, isConfigured } = getFirebaseApp();

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', newRoom.id);
      await setDoc(roomRef, newRoom);
      return newRoom;
    } catch (err) {
      console.warn('Firestore createRoom failed, falling back to local sync:', err);
    }
  }

  notifyLocalListeners(newRoom.id, newRoom);
  return newRoom;
}

/**
 * Joins an existing game room.
 */
export async function joinRoom(roomId: string, player: Player): Promise<GameRoom> {
  const formattedId = roomId.toUpperCase().trim();
  const { db, isConfigured } = getFirebaseApp();

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        throw new Error(`Room code ${formattedId} not found.`);
      }

      const room = snap.data() as GameRoom;
      if (room.status !== 'lobby') {
        throw new Error(`Game in room ${formattedId} has already started.`);
      }
      if (Object.keys(room.players).length >= room.maxPlayers) {
        throw new Error(`Room ${formattedId} is full (max ${room.maxPlayers} players).`);
      }

      const playerTiles = generateInitialTileBag(room.startingTiles);
      player.tiles = playerTiles;
      player.initialTileCount = room.startingTiles;
      player.tilesRemaining = room.startingTiles;

      const updatedPlayers = { ...room.players, [player.id]: player };
      await updateDoc(roomRef, { players: updatedPlayers });

      return { ...room, players: updatedPlayers };
    } catch (err) {
      console.warn('Firestore joinRoom failed:', err);
      if (err instanceof Error && err.message.includes('not found')) {
        throw err;
      }
    }
  }

  // Fallback to local memory
  const existing = localRooms.get(formattedId);
  if (!existing) {
    throw new Error(`Room code ${formattedId} not found.`);
  }
  if (existing.status !== 'lobby') {
    throw new Error(`Game in room ${formattedId} has already started.`);
  }
  if (Object.keys(existing.players).length >= existing.maxPlayers) {
    throw new Error(`Room ${formattedId} is full (max ${existing.maxPlayers} players).`);
  }

  const playerTiles = generateInitialTileBag(existing.startingTiles);
  player.tiles = playerTiles;
  player.initialTileCount = existing.startingTiles;
  player.tilesRemaining = existing.startingTiles;

  const updatedRoom: GameRoom = {
    ...existing,
    players: {
      ...existing.players,
      [player.id]: player,
    },
  };

  notifyLocalListeners(formattedId, updatedRoom);
  return updatedRoom;
}

/**
 * Updates a player in the room (ready toggle, bot addition/removal, avatar change)
 */
export async function updateRoomState(roomId: string, updates: Partial<GameRoom>): Promise<void> {
  const formattedId = roomId.toUpperCase().trim();
  const { db, isConfigured } = getFirebaseApp();

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      await updateDoc(roomRef, updates);
      return;
    } catch (err) {
      console.warn('Firestore updateRoomState failed, updating locally:', err);
    }
  }

  const room = localRooms.get(formattedId);
  if (room) {
    const updated = { ...room, ...updates };
    notifyLocalListeners(formattedId, updated);
  }
}

/**
 * Starts the game for all players in the room.
 */
export async function startGame(roomId: string): Promise<void> {
  const formattedId = roomId.toUpperCase().trim();
  const { db, isConfigured } = getFirebaseApp();

  // Reset/generate fresh bags for all players upon match start
  let currentRoom = localRooms.get(formattedId);

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        currentRoom = snap.data() as GameRoom;
      }
    } catch (e) {
      console.warn("Could not fetch room before start", e);
    }
  }

  if (!currentRoom) return;

  const updatedPlayers: Record<string, Player> = {};
  for (const [pId, player] of Object.entries(currentRoom.players)) {
    const startingTiles = generateInitialTileBag(currentRoom.startingTiles);
    updatedPlayers[pId] = {
      ...player,
      tiles: startingTiles,
      initialTileCount: currentRoom.startingTiles,
      tilesRemaining: currentRoom.startingTiles,
      score: 0,
      wordsMade: [],
      consecutiveWords: 0,
    };
  }

  const updates: Partial<GameRoom> = {
    status: 'playing',
    startedAt: Date.now(),
    players: updatedPlayers,
    allWordsPlayed: [],
    recentEvents: [],
  };

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      await updateDoc(roomRef, updates);
      return;
    } catch (e) {
      console.warn("Firestore startGame failed, fallback local:", e);
    }
  }

  const updated = { ...currentRoom, ...updates };
  notifyLocalListeners(formattedId, updated);
}

/**
 * Handles a word submission:
 * 1. Consumes used tiles from the submitting player
 * 2. Deducts score if duplicate, adds score if unique
 * 3. Randomly blasts N-1 letters from the word across other active players
 * 4. Checks if player tile bag reached 0 (end game trigger)
 */
export async function submitWordPlay(
  roomId: string,
  playerId: string,
  word: string,
  scoreDelta: number,
  isDuplicate: boolean
): Promise<void> {
  const formattedId = roomId.toUpperCase().trim();
  const upperWord = word.toUpperCase();
  const { db, isConfigured } = getFirebaseApp();

  let room: GameRoom | null = null;

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        room = snap.data() as GameRoom;
      }
    } catch (e) {
      console.warn("Firestore fetch error on word play:", e);
    }
  }

  if (!room) {
    room = localRooms.get(formattedId) || null;
  }

  if (!room || room.status !== 'playing') return;

  const player = room.players[playerId];
  if (!player) return;

  // 1. Remove played tiles from player's hand
  const currentTiles = [...player.tiles];
  for (const char of upperWord) {
    const idx = currentTiles.indexOf(char);
    if (idx !== -1) {
      currentTiles.splice(idx, 1);
    }
  }

  // 2. Select exactly N-1 letters to blast to opponents (e.g. 4-letter word blasts 3 tiles, 5-letter blasts 4 tiles)
  // This destroys 1 tile permanently from the match pool, ensuring global tile count keeps reducing
  const blastCount = upperWord.length - 1;
  const wordLetters = upperWord.split('');
  const shuffled = [...wordLetters].sort(() => Math.random() - 0.5);
  const blastedLetters = shuffled.slice(0, blastCount);

  // Other active opponents
  const opponentIds = Object.keys(room.players).filter((id) => id !== playerId);
  const updatedPlayers = { ...room.players };

  // Update submitting player: loses all N tiles from hand
  const newScore = Math.max(0, player.score + scoreDelta);
  const newTilesRemaining = currentTiles.length;

  updatedPlayers[playerId] = {
    ...player,
    tiles: currentTiles,
    tilesRemaining: newTilesRemaining,
    score: newScore,
    wordsMade: [
      {
        word: upperWord,
        score: scoreDelta,
        timestamp: Date.now(),
        isDuplicate,
      },
      ...player.wordsMade,
    ],
    consecutiveWords: isDuplicate ? 0 : player.consecutiveWords + 1,
  };

  // 3. Distribute the N-1 blasted letters randomly across active opponents
  const targetPlayerIds: string[] = [];
  if (opponentIds.length > 0) {
    blastedLetters.forEach((letter) => {
      // Pick a random opponent from the active opponent pool
      const targetId = opponentIds[Math.floor(Math.random() * opponentIds.length)];
      targetPlayerIds.push(targetId);
      const opp = updatedPlayers[targetId];
      if (opp) {
        const newOppTiles = [...opp.tiles, letter];
        updatedPlayers[targetId] = {
          ...opp,
          tiles: newOppTiles,
          tilesRemaining: newOppTiles.length,
        };
      }
    });
  }

  // Check end game condition (first player to 0 tiles)
  let newStatus: 'playing' | 'ended' = 'playing';
  let winnerId: string | undefined = undefined;

  if (newTilesRemaining === 0) {
    newStatus = 'ended';
    // The player who ran out of tiles gets a 500pt finisher bonus
    updatedPlayers[playerId].score += 500;
    // Find player with max score
    let highestScore = -1;
    for (const [pId, p] of Object.entries(updatedPlayers)) {
      if (p.score > highestScore) {
        highestScore = p.score;
        winnerId = pId;
      }
    }
  }

  const wordEvent: WordEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    word: upperWord,
    playerId,
    playerName: player.name,
    playerColor: player.color,
    score: scoreDelta,
    blastedLetters,
    targetPlayerIds,
    isDuplicate,
    timestamp: Date.now(),
  };

  const updates: Partial<GameRoom> = {
    players: updatedPlayers,
    allWordsPlayed: [...room.allWordsPlayed, upperWord],
    recentEvents: [wordEvent, ...(room.recentEvents || [])].slice(0, 20),
    status: newStatus,
    winnerId,
    endedAt: newStatus === 'ended' ? Date.now() : undefined,
  };

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      await updateDoc(roomRef, updates);
      return;
    } catch (err) {
      console.warn("Firestore submitWordPlay error, falling back to local sync:", err);
    }
  }

  const updatedRoom = { ...room, ...updates };
  notifyLocalListeners(formattedId, updatedRoom);
}

/**
 * Subscribes to realtime updates of a room.
 */
export function subscribeToRoom(roomId: string, onUpdate: (room: GameRoom) => void): Unsubscribe {
  const formattedId = roomId.toUpperCase().trim();
  const { db, isConfigured } = getFirebaseApp();

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      const unsub = onSnapshot(
        roomRef,
        (docSnap) => {
          if (docSnap.exists()) {
            onUpdate(docSnap.data() as GameRoom);
          }
        },
        (error) => {
          console.warn("Firestore subscription error:", error);
        }
      );
      return unsub;
    } catch (e) {
      console.warn("Could not attach Firestore onSnapshot:", e);
    }
  }

  // Fallback local subscription
  if (!localListeners.has(formattedId)) {
    localListeners.set(formattedId, new Set());
  }
  const callbacks = localListeners.get(formattedId)!;
  callbacks.add(onUpdate);

  const existing = localRooms.get(formattedId);
  if (existing) {
    onUpdate(existing);
  }

  return () => {
    callbacks.delete(onUpdate);
  };
}

/**
 * Concludes the game when the match timer expires.
 */
export async function endGameByTimeout(roomId: string): Promise<void> {
  const formattedId = roomId.toUpperCase().trim();
  const { db, isConfigured } = getFirebaseApp();

  let room = localRooms.get(formattedId);

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      const snap = await getDoc(roomRef);
      if (snap.exists()) {
        room = snap.data() as GameRoom;
      }
    } catch (e) {
      console.warn("Could not fetch room for timeout:", e);
    }
  }

  if (!room || room.status !== 'playing') return;

  // Determine player with highest score as winner
  const players = Object.values(room.players);
  let highestScore = -1;
  let winnerId: string | undefined = undefined;

  for (const p of players) {
    if (p.score > highestScore) {
      highestScore = p.score;
      winnerId = p.id;
    }
  }

  const updates: Partial<GameRoom> = {
    status: 'ended',
    winnerId,
    endedAt: Date.now(),
  };

  if (isConfigured && db) {
    try {
      const roomRef = doc(db, 'rooms', formattedId);
      await updateDoc(roomRef, updates);
      return;
    } catch (e) {
      console.warn("Firestore endGameByTimeout failed, falling back to local:", e);
    }
  }

  const updatedRoom = { ...room, ...updates };
  notifyLocalListeners(formattedId, updatedRoom);
}
