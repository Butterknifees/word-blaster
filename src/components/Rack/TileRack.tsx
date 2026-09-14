import React from 'react';
import { LETTER_VALUES } from '../../config/letterDistribution';

interface Props {
  tiles: string[];
  usedTileIndices: number[];
  onSelectTile: (tileIndex: number) => void;
}

function getTileTheme(letter: string, isUsed: boolean) {
  const value = LETTER_VALUES[letter] || 1;
  if (isUsed) {
    return {
      container: 'opacity-20 scale-90 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none',
      badge: 'text-slate-300',
    };
  }

  if (value >= 8) {
    // 8-10 pts (Q, Z, J, X)
    return {
      container: 'bg-[#FFF7ED] border-[#FDBA74] text-[#C2410C] hover:border-[#EA580C] hover:shadow-cute-md hover:-translate-y-1',
      badge: 'text-[#EA580C] font-extrabold',
    };
  }
  if (value >= 4) {
    // 4-5 pts
    return {
      container: 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9] hover:border-[#7C3AED] hover:shadow-cute-md hover:-translate-y-1',
      badge: 'text-[#7C3AED] font-bold',
    };
  }
  if (value >= 2) {
    // 2-3 pts
    return {
      container: 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0369A1] hover:border-[#0284C7] hover:shadow-cute-md hover:-translate-y-1',
      badge: 'text-[#0284C7] font-semibold',
    };
  }

  // 1-pt classic tiles
  return {
    container: 'bg-white border-slate-200 text-slate-800 hover:border-[#FF385C] hover:shadow-cute-md hover:-translate-y-1',
    badge: 'text-slate-400 font-medium',
  };
}

export const TileRack: React.FC<Props> = ({
  tiles,
  usedTileIndices,
  onSelectTile,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Cute tile deck box */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-3.5 bg-white/95 border border-slate-200 rounded-3xl shadow-cute-md max-h-[170px] md:max-h-[210px] overflow-y-auto custom-scrollbar">
        {tiles.length === 0 ? (
          <div className="text-sm text-[#10B981] font-display font-bold py-3 flex items-center gap-2 animate-bounce">
            🎉 YOU EMPTIED YOUR TILE RACK!
          </div>
        ) : (
          tiles.map((letter, index) => {
            const isUsed = usedTileIndices.includes(index);
            const value = LETTER_VALUES[letter] || 1;
            const theme = getTileTheme(letter, isUsed);

            return (
              <button
                key={`${letter}-${index}`}
                disabled={isUsed}
                onClick={() => onSelectTile(index)}
                className={`relative w-10 h-12 sm:w-11 sm:h-13 md:w-12 md:h-14 rounded-2xl font-display font-extrabold text-xl md:text-2xl transition-all duration-150 select-none flex items-center justify-center border shadow-cute-tile active:shadow-cute-tile-active active:translate-y-0.5 ${theme.container}`}
              >
                <span>{letter}</span>
                <span className={`absolute bottom-0.5 right-1.5 text-[9px] font-mono ${theme.badge}`}>
                  {value}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
