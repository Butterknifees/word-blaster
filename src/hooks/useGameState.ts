import { useState, useEffect } from 'react';
import type { GameRoom } from '../types/game';
import { subscribeToRoom } from '../services/firestoreService';
import { getFirebaseApp } from '../config/firebase';

const PLAYER_ID_KEY = 'word_blaster_player_id';
const PLAYER_NAME_KEY = 'word_blaster_player_name';
const PLAYER_AVATAR_KEY = 'word_blaster_player_avatar';
const PLAYER_COLOR_KEY = 'word_blaster_player_color';

export function useGameState() {
  const [playerId] = useState<string>(() => {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  });

  const [playerName, setPlayerNameState] = useState<string>(() => {
    return localStorage.getItem(PLAYER_NAME_KEY) || 'Blaster' + Math.floor(100 + Math.random() * 900);
  });

  const [playerAvatar, setPlayerAvatarState] = useState<string>(() => {
    return localStorage.getItem(PLAYER_AVATAR_KEY) || '🦊';
  });

  const [playerColor, setPlayerColorState] = useState<string>(() => {
    return localStorage.getItem(PLAYER_COLOR_KEY) || '#00f0ff';
  });

  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean>(() => {
    return getFirebaseApp().isConfigured;
  });

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    localStorage.setItem(PLAYER_NAME_KEY, name);
  };

  const setPlayerAvatar = (avatar: string) => {
    setPlayerAvatarState(avatar);
    localStorage.setItem(PLAYER_AVATAR_KEY, avatar);
  };

  const setPlayerColor = (color: string) => {
    setPlayerColorState(color);
    localStorage.setItem(PLAYER_COLOR_KEY, color);
  };

  const checkFirebaseConfig = () => {
    setIsFirebaseConfigured(getFirebaseApp().isConfigured);
  };

  // Subscribe to room updates when inside a room
  useEffect(() => {
    if (!currentRoom?.id) return;

    const unsub = subscribeToRoom(currentRoom.id, (updatedRoom) => {
      setCurrentRoom(updatedRoom);
    });

    return () => {
      unsub();
    };
  }, [currentRoom?.id]);

  return {
    playerId,
    playerName,
    setPlayerName,
    playerAvatar,
    setPlayerAvatar,
    playerColor,
    setPlayerColor,
    currentRoom,
    setCurrentRoom,
    isFirebaseConfigured,
    checkFirebaseConfig,
  };
}
