import React, { useEffect, useState, useMemo } from 'react';
import type { Player, WordEvent } from '../../types/game';
import { Award, Layers, Sparkles, Zap } from 'lucide-react';
import { audio } from '../../services/audioService';

interface Props {
  players: Player[];
  currentPlayerId: string;
  recentEvents: WordEvent[];
}

interface MovingTileAlongEdge {
  id: string;
  letter: string;
  fromIndex: number;
  toIndex: number;
  progress: number;
  color: string;
  createdAt: number;
  durationMs: number;
}

export const PlayerNetworkGraph: React.FC<Props> = ({
  players,
  currentPlayerId,
  recentEvents,
}) => {
  const [movingTiles, setMovingTiles] = useState<MovingTileAlongEdge[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  // Position nodes along a circle in coordinate space (width=400, height=320, center=(200, 160))
  const nodePositions = useMemo(() => {
    const total = players.length;
    const centerX = 200;
    const centerY = 150;
    const radiusX = 140;
    const radiusY = 95;

    return players.map((_, i) => {
      // Current player at bottom center if possible
      const angle = (i * (2 * Math.PI / total)) + (Math.PI / 2);
      const x = centerX + radiusX * Math.cos(angle);
      const y = centerY + radiusY * Math.sin(angle);
      return { x, y };
    });
  }, [players.length]);

  // When a new blast event occurs, launch tiles along edges
  useEffect(() => {
    if (!recentEvents || recentEvents.length === 0) return;
    const latest = recentEvents[0];
    if (latest.id === lastEventId) return;

    setLastEventId(latest.id);

    const fromIdx = players.findIndex((p) => p.id === latest.playerId);
    if (fromIdx === -1) return;

    const newTiles: MovingTileAlongEdge[] = [];

    latest.blastedLetters.forEach((letter, i) => {
      const targetPlayerId = latest.targetPlayerIds[i % latest.targetPlayerIds.length];
      const toIdx = players.findIndex((p) => p.id === targetPlayerId);
      if (toIdx === -1) return;

      newTiles.push({
        id: `node-tile-${latest.id}-${i}-${Math.random()}`,
        letter,
        fromIndex: fromIdx,
        toIndex: toIdx,
        progress: 0,
        color: latest.playerColor || '#FF385C',
        createdAt: Date.now() + i * 120,
        durationMs: 1100,
      });

      setTimeout(() => {
        audio.playImpact();
      }, 1100 + i * 120);
    });

    setMovingTiles((prev) => [...prev, ...newTiles]);
  }, [recentEvents, lastEventId, players]);

  // Animation loop for tile travel along edges
  useEffect(() => {
    if (movingTiles.length === 0) return;

    let animId: number;
    const update = () => {
      const now = Date.now();
      setMovingTiles((prev) =>
        prev
          .map((tile) => {
            const elapsed = Math.max(0, now - tile.createdAt);
            const progress = Math.min(1, elapsed / tile.durationMs);
            return { ...tile, progress };
          })
          .filter((tile) => tile.progress < 1)
      );

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [movingTiles.length]);

  return (
    <div className="relative w-full bg-white rounded-3xl p-2.5 sm:p-4 md:p-5 border border-slate-200 shadow-cute-md flex flex-col items-center overflow-hidden">
      {/* Header Pill */}
      <div className="w-full flex items-center justify-between mb-0.5 sm:mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF385C] animate-pulse" />
          <span className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider text-slate-500">
            Player Network &amp; Tile Tracks
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
          {players.length} Connected
        </span>
      </div>

      {/* SVG Canvas for Network Graph */}
      <div className="relative w-full max-w-[420px] h-[150px] xs:h-[175px] sm:h-[220px] lg:h-[280px] my-0.5 sm:my-1">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 400 320">
          <defs>
            {/* Soft gradient glow for edges */}
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.6" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Network Edges (Connections between every player node) */}
          {players.map((_, i) =>
            players.map((_, j) => {
              if (i >= j) return null;
              const p1 = nodePositions[i];
              const p2 = nodePositions[j];
              if (!p1 || !p2) return null;

              // Curved bezier midpoint for soft organic lines
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2 + 10;

              return (
                <g key={`edge-${i}-${j}`}>
                  {/* Subtle background track */}
                  <path
                    d={`M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                </g>
              );
            })
          )}

          {/* Moving Tile Tokens Along Edges */}
          {movingTiles.map((tile) => {
            const p1 = nodePositions[tile.fromIndex];
            const p2 = nodePositions[tile.toIndex];
            if (!p1 || !p2) return null;

            // Curved path interpolation (Quadratic Bezier)
            const t = tile.progress;
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 + 10;

            const curX = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * midX + Math.pow(t, 2) * p2.x;
            const curY = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * midY + Math.pow(t, 2) * p2.y;

            // Cute rotation & scale bounce
            const rot = (t * 360) % 360;
            const scale = 1 + Math.sin(t * Math.PI) * 0.25;

            return (
              <g
                key={tile.id}
                transform={`translate(${curX}, ${curY}) scale(${scale}) rotate(${rot})`}
                filter="url(#softGlow)"
              >
                {/* Cute creamy tile squircle */}
                <rect
                  x="-13"
                  y="-13"
                  width="26"
                  height="26"
                  rx="7"
                  fill="#FFFFFF"
                  stroke={tile.color}
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="bold"
                  fontSize="12"
                  fill="#0F172A"
                >
                  {tile.letter}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Player Circular Nodes (HTML overlay on top of SVG points for perfect responsiveness & avatars) */}
        {players.map((player, idx) => {
          const pos = nodePositions[idx];
          if (!pos) return null;

          const isMe = player.id === currentPlayerId;
          const initial = player.initialTileCount || 40;
          const remaining = player.tilesRemaining;
          const percentCleared = Math.min(100, Math.max(0, ((initial - remaining) / initial) * 100));

          return (
            <div
              key={player.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
              style={{
                left: `${(pos.x / 400) * 100}%`,
                top: `${(pos.y / 320) * 100}%`,
              }}
            >
              {/* Circular Node Bubble */}
              <div className="relative group cursor-pointer">
                {/* SVG Progress Ring around node */}
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    stroke="#F1F5F9"
                    strokeWidth="3.5"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    stroke={player.color || '#FF385C'}
                    strokeWidth="3.5"
                    strokeDasharray={2 * Math.PI * 27}
                    strokeDashoffset={2 * Math.PI * 27 * (1 - percentCleared / 100)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-500"
                  />
                </svg>

                {/* Avatar Circle */}
                <div
                  className={`absolute inset-1.5 rounded-full flex items-center justify-center text-2xl shadow-cute-sm transition-transform group-hover:scale-105 ${
                    isMe
                      ? 'bg-white ring-2 ring-[#FF385C] shadow-cute-md'
                      : 'bg-white'
                  }`}
                  style={{
                    backgroundColor: `${player.color}15`,
                  }}
                >
                  <span>{player.avatar}</span>
                </div>

                {/* Live Tiles Pill (Badge on top right) */}
                <div
                  className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono text-white shadow-sm flex items-center gap-0.5"
                  style={{ backgroundColor: player.color || '#FF385C' }}
                >
                  <Layers className="w-2.5 h-2.5" />
                  <span>{remaining}</span>
                </div>
              </div>

              {/* Player Tag & Live Score Pill */}
              <div className="mt-1 flex flex-col items-center">
                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200 shadow-cute-sm max-w-[110px] truncate">
                  <span className="font-display font-bold text-xs text-slate-800 truncate">
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-[9px] bg-[#FFF0F2] text-[#FF385C] font-bold px-1 rounded-full">
                      YOU
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 text-[11px] font-display font-extrabold text-slate-900 mt-0.5">
                  <Award className="w-3 h-3 text-[#FF7A00]" />
                  <span>{player.score.toLocaleString()} pts</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full text-center text-[11px] text-slate-400 mt-1 font-medium">
        ✨ Form words to blast tiles along tracks to other player nodes!
      </div>
    </div>
  );
};
