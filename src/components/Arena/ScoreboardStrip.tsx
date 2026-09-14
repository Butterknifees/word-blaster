import React from 'react';
import { Trophy, Layers, Award } from 'lucide-react';
import type { Player } from '../../types/game';

interface Props {
  players: Player[];
  currentPlayerId: string;
}

export const ScoreboardStrip: React.FC<Props> = ({ players, currentPlayerId }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-2.5 shadow-cute-sm">
      <div className="flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar pb-0.5">
        <div className="flex items-center gap-1.5 px-2 text-[11px] font-display font-bold uppercase tracking-wider text-slate-400 shrink-0">
          <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>SCORES:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {sorted.map((player, idx) => {
            const isMe = player.id === currentPlayerId;
            const medals = ['🥇', '🥈', '🥉'];
            const rankLabel = medals[idx] || `#${idx + 1}`;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all shrink-0 ${
                  isMe
                    ? 'border-[#FF385C] bg-[#FFF0F2] shadow-cute-sm ring-1 ring-[#FF385C]/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Rank Badge */}
                <span className="font-display font-extrabold text-xs">
                  {rankLabel}
                </span>

                {/* Avatar & Name */}
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{player.avatar}</span>
                  <span className="font-display font-bold text-slate-800 truncate max-w-[90px] sm:max-w-[120px]">
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-[9px] bg-[#FF385C] text-white px-1.5 py-0.2 rounded-full font-bold">
                      YOU
                    </span>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center gap-1 font-display font-black text-slate-900 ml-1">
                  <Award className="w-3 h-3 text-[#FF7A00]" />
                  <span>{player.score.toLocaleString()}</span>
                </div>

                {/* Tiles */}
                <div className="flex items-center gap-0.5 text-[10px] font-mono text-slate-400 pl-1.5 border-l border-slate-200">
                  <Layers className="w-2.5 h-2.5 text-[#0EA5E9]" />
                  <span className={player.tilesRemaining <= 5 ? 'text-[#FF385C] font-bold animate-pulse' : 'font-medium'}>
                    {player.tilesRemaining}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
