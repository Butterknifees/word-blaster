import React from 'react';
import { Flame, Shuffle, RotateCcw, ArrowUpDown } from 'lucide-react';

interface Props {
  canSubmit: boolean;
  isDuplicate: boolean;
  score: number;
  onSubmit: () => void;
  onShuffle: () => void;
  onSort: () => void;
  onClear: () => void;
}

export const ActionButtons: React.FC<Props> = ({
  canSubmit,
  isDuplicate,
  score,
  onSubmit,
  onShuffle,
  onSort,
  onClear,
}) => {
  return (
    <div className="flex items-center justify-center gap-2.5 flex-wrap">
      {/* Shuffle */}
      <button
        onClick={onShuffle}
        title="Shuffle your letter rack (Spacebar)"
        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-bold font-display flex items-center gap-1.5 transition active:scale-95 shadow-cute-sm"
      >
        <Shuffle className="w-3.5 h-3.5 text-[#0EA5E9]" />
        <span className="hidden sm:inline">Shuffle</span>
      </button>

      {/* Sort A-Z */}
      <button
        onClick={onSort}
        title="Sort tiles alphabetically"
        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-bold font-display flex items-center gap-1.5 transition active:scale-95 shadow-cute-sm"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span className="hidden sm:inline">Sort</span>
      </button>

      {/* Clear Draft */}
      <button
        onClick={onClear}
        title="Clear current word"
        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-bold font-display flex items-center gap-1.5 transition active:scale-95 shadow-cute-sm"
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#FF385C]" />
        <span className="hidden sm:inline">Clear</span>
      </button>

      {/* BLAST Button (Airbnb Coral pill button) */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`px-7 py-2.5 rounded-full font-display font-black tracking-wide text-sm uppercase flex items-center gap-2 transition-all select-none shadow-cute-md ${
          canSubmit
            ? isDuplicate
              ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-cute-pill hover:scale-105 active:scale-95 animate-pulse'
              : 'bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:from-[#E00B41] hover:to-[#C10034] text-white shadow-cute-pill hover:scale-105 active:scale-95'
            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
        }`}
      >
        <Flame className="w-4 h-4 fill-current" />
        <span>BLAST WORD!</span>
        {canSubmit && (
          <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
            {score > 0 ? `+${score}` : score}
          </span>
        )}
      </button>
    </div>
  );
};
