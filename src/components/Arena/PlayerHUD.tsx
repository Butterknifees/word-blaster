import React, { useEffect, useRef, useState } from 'react';
import { Award, Zap, AlertTriangle, Layers } from 'lucide-react';
import type { Player, PlayerPosition } from '../../types/game';

interface Props {
  player: Player;
  position: PlayerPosition;
  isCurrentPlayer?: boolean;
  onRegisterRef: (playerId: string, el: HTMLElement | null) => void;
}

export const PlayerHUD: React.FC<Props> = ({
  player,
  isCurrentPlayer = false,
  onRegisterRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHit, setIsHit] = useState(false);
  const prevTileCount = useRef(player.tilesRemaining);

  // Register position for blaster animations
  useEffect(() => {
    if (containerRef.current) {
      onRegisterRef(player.id, containerRef.current);
    }
    return () => {
      onRegisterRef(player.id, null);
    };
  }, [player.id, onRegisterRef]);

  // Flash card when player receives blasted tiles (tile count increases)
  useEffect(() => {
    if (player.tilesRemaining > prevTileCount.current) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 800);
      return () => clearTimeout(timer);
    }
    prevTileCount.current = player.tilesRemaining;
  }, [player.tilesRemaining]);

  // Gauge calculation: 0 tiles = 100% empty (Game finisher goal!)
  const initial = player.initialTileCount || 40;
  const remaining = player.tilesRemaining;
  const emptyPercentage = Math.min(100, Math.max(0, ((initial - remaining) / initial) * 100));

  const latestWord = player.wordsMade?.[0];

  return (
    <div
      ref={containerRef}
      className={`relative z-20 transition-all duration-300 rounded-2xl p-3 md:p-3.5 backdrop-blur-md border ${
        isHit ? 'ring-4 ring-pink-500 scale-105' : ''
      } ${
        isCurrentPlayer
          ? 'bg-slate-900/90 border-cyan-500/50 shadow-[0_0_25px_rgba(0,240,255,0.25)]'
          : 'bg-slate-900/80 border-slate-800 shadow-xl'
      }`}
      style={{
        borderColor: `${player.color}66`,
        boxShadow: `0 0 20px ${player.color}22`,
      }}
    >
      {/* Top row: Avatar + Name + Score */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-xl md:text-2xl border-2 transition-transform ${
              isHit ? 'animate-bounce' : ''
            }`}
            style={{
              backgroundColor: `${player.color}20`,
              borderColor: player.color,
              boxShadow: `0 0 10px ${player.color}50`,
            }}
          >
            {player.avatar}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-xs md:text-sm truncate max-w-[110px] md:max-w-[140px]">
                {player.name}
              </span>
              {isCurrentPlayer && (
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded border border-cyan-500/40 font-mono font-bold">
                  YOU
                </span>
              )}
              {player.isBot && (
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded border border-purple-500/40 font-mono">
                  BOT
                </span>
              )}
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>{player.score.toLocaleString()} PTS</span>
            </div>
          </div>
        </div>

        {/* Tile Counter Badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 font-mono font-black text-sm md:text-base text-slate-100">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className={remaining <= 5 ? 'text-pink-400 animate-pulse text-lg' : ''}>
              {remaining}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">TILES</span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">
            {Math.round(emptyPercentage)}% Cleared
          </span>
        </div>
      </div>

      {/* Tile depletion progress bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 mt-2.5 overflow-hidden p-0.5 border border-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 via-pink-500 to-emerald-400"
          style={{ width: `${emptyPercentage}%` }}
        />
      </div>

      {/* Latest Word Bubble */}
      {latestWord && (
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400 truncate flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="font-bold text-slate-200">{latestWord.word}</span>
          </span>
          <span
            className={`font-bold ${
              latestWord.isDuplicate ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {latestWord.isDuplicate ? (
              <span className="flex items-center gap-0.5">
                <AlertTriangle className="w-3 h-3" /> {latestWord.score}
              </span>
            ) : (
              `+${latestWord.score}`
            )}
          </span>
        </div>
      )}
    </div>
  );
};
