// Hook & State Manager for Flying Blaster Projectile Tiles

import { useState, useCallback, useEffect, useRef } from 'react';
import type { FlyingTile, WordEvent } from '../types/game';
import { audio } from '../services/audioService';

export function useBlasterFX() {
  const [flyingTiles, setFlyingTiles] = useState<FlyingTile[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Registers player screen coordinates for projectile trajectories
  const playerCoordsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const registerPlayerPosition = useCallback((playerId: string, element: HTMLElement | null) => {
    if (!element) {
      playerCoordsRef.current.delete(playerId);
      return;
    }
    const rect = element.getBoundingClientRect();
    playerCoordsRef.current.set(playerId, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, []);

  const triggerBlastEffect = useCallback((event: WordEvent) => {
    if (processedEventsRef.current.has(event.id)) return;
    processedEventsRef.current.add(event.id);

    audio.playBlast();

    const senderCoords = playerCoordsRef.current.get(event.playerId) || {
      x: window.innerWidth / 2,
      y: window.innerHeight - 100,
    };

    const newFlyingTiles: FlyingTile[] = [];

    event.blastedLetters.forEach((letter, i) => {
      const targetPlayerId = event.targetPlayerIds[i % event.targetPlayerIds.length];
      const targetCoords = playerCoordsRef.current.get(targetPlayerId) || {
        x: window.innerWidth / 2,
        y: 100,
      };

      const durationMs = 850 + Math.random() * 200;

      const tile: FlyingTile = {
        id: `flying-${event.id}-${i}-${Math.random()}`,
        letter,
        fromPlayerId: event.playerId,
        toPlayerId: targetPlayerId,
        startX: senderCoords.x + (i - (event.blastedLetters.length - 1) / 2) * 25,
        startY: senderCoords.y,
        targetX: targetCoords.x,
        targetY: targetCoords.y,
        color: event.playerColor,
        createdAt: Date.now() + i * 80, // staggered launch
        durationMs,
      };

      newFlyingTiles.push(tile);

      // Play arrival impact sound
      setTimeout(() => {
        audio.playImpact();
      }, durationMs + i * 80);
    });

    setFlyingTiles((prev) => [...prev, ...newFlyingTiles]);
  }, []);

  // Clean up completed flying tiles
  useEffect(() => {
    if (flyingTiles.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setFlyingTiles((prev) =>
        prev.filter((tile) => now < tile.createdAt + tile.durationMs + 200)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [flyingTiles.length]);

  return {
    flyingTiles,
    registerPlayerPosition,
    triggerBlastEffect,
  };
}
