import React from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import type { WordEvent } from '../../types/game';

interface Props {
  events: WordEvent[];
}

export const WordHistory: React.FC<Props> = ({ events }) => {
  if (events.length === 0) return null;

  return (
    <div className="w-full max-w-lg mx-auto bg-white/90 border border-slate-200 rounded-2xl p-2.5 shadow-cute-sm overflow-hidden">
      <div className="text-[10px] font-bold font-display uppercase tracking-wider text-slate-400 mb-1 px-1 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> LIVE ACTIVITY FEED
      </div>
      <div className="space-y-1.5 max-h-[72px] overflow-y-auto custom-scrollbar pr-1">
        {events.slice(0, 4).map((ev) => (
          <div
            key={ev.id}
            className="flex items-center justify-between text-xs font-display bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-slate-800 truncate max-w-[90px]">
                {ev.playerName}
              </span>
              <span className="text-slate-400 text-[11px]">blasted</span>
              <span className="font-extrabold text-slate-900 px-1.5 py-0.2 bg-white rounded-md border border-slate-200 shadow-2xs">
                {ev.word}
              </span>
              <span className="text-[10px] text-[#0EA5E9] flex items-center gap-0.5 font-bold">
                <Send className="w-2.5 h-2.5" /> {ev.blastedLetters.length} tiles
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2 font-bold">
              {ev.isDuplicate ? (
                <span className="text-[#DC2626] flex items-center gap-0.5 text-xs">
                  <AlertTriangle className="w-3 h-3" /> {ev.score}
                </span>
              ) : (
                <span className="text-[#059669] text-xs">
                  +{ev.score}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
