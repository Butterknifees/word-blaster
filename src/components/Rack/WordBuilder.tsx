import React from 'react';
import { Sparkles, AlertTriangle, XCircle, CheckCircle2, Zap } from 'lucide-react';
import { LETTER_VALUES } from '../../config/letterDistribution';

interface Props {
  draftWord: string[];
  isValid: boolean;
  isDuplicate: boolean;
  score: number;
  minWordLength: number;
  onRemoveLetter: (index: number) => void;
}

function getLetterColorClass(value: number): string {
  if (value >= 8) return 'text-[#C2410C] bg-[#FFF7ED] border-[#FDBA74]';
  if (value >= 4) return 'text-[#6D28D9] bg-[#F5F3FF] border-[#DDD6FE]';
  if (value >= 2) return 'text-[#0369A1] bg-[#F0F9FF] border-[#BAE6FD]';
  return 'text-slate-600 bg-slate-100 border-slate-200';
}

export const WordBuilder: React.FC<Props> = ({
  draftWord,
  isValid,
  isDuplicate,
  score,
  minWordLength,
  onRemoveLetter,
}) => {
  const wordString = draftWord.join('');
  const isTooShort = draftWord.length > 0 && draftWord.length < minWordLength;

  const baseLetterSum = draftWord.reduce((acc, char) => acc + (LETTER_VALUES[char] || 1), 0);
  let lengthMultiplier = 1.0;
  if (draftWord.length === 5) lengthMultiplier = 1.3;
  else if (draftWord.length === 6) lengthMultiplier = 1.6;
  else if (draftWord.length >= 7) lengthMultiplier = 2.0;

  return (
    <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2">
      {/* Word Slots */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-[60px] sm:min-h-[70px] p-2 sm:p-3 bg-white/90 border border-slate-200 rounded-3xl w-full max-w-xl shadow-cute-sm backdrop-blur-sm">
        {draftWord.length === 0 ? (
          <div className="text-xs sm:text-sm text-slate-400 font-medium italic tracking-wide flex items-center gap-2">
            <span>Tap tiles below to formulate a 4+ letter word</span>
          </div>
        ) : (
          draftWord.map((letter, idx) => {
            const val = LETTER_VALUES[letter] || 1;
            const badgeClass = getLetterColorClass(val);

            return (
              <button
                key={`${letter}-${idx}`}
                onClick={() => onRemoveLetter(idx)}
                title={`Tap to remove (${val} pts)`}
                className="relative w-9 h-12 sm:w-11 sm:h-14 md:w-13 md:h-16 rounded-2xl bg-white border-2 border-[#FF385C] text-[#222222] font-display font-black text-lg sm:text-xl md:text-2xl shadow-cute-tile hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center group select-none"
              >
                <span>{letter}</span>
                <span className={`text-[8px] sm:text-[9px] font-mono px-1 py-0.2 rounded-full border font-bold ${badgeClass}`}>
                  +{val}
                </span>
                <span className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 bg-[#FF385C] text-white rounded-full p-0.5 transition shadow">
                  <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Letter-by-Letter Math Breakdown & Status */}
      {draftWord.length > 0 && (
        <div className="flex flex-col items-center gap-1.5 animate-fade-in text-xs">
          {/* Detailed Letter Equation */}
          <div className="flex items-center gap-1.5 px-3.5 py-1 bg-white border border-slate-200 rounded-full text-slate-700 shadow-cute-sm flex-wrap justify-center font-display">
            <span className="text-slate-400 text-[11px]">Letters:</span>
            {draftWord.map((char, i) => (
              <span key={i} className="flex items-center">
                <span className="font-bold text-slate-900">{char}</span>
                <span className="text-[10px] text-[#F59E0B] font-bold ml-0.5">({LETTER_VALUES[char] || 1})</span>
                {i < draftWord.length - 1 && <span className="text-slate-300 mx-0.5">+</span>}
              </span>
            ))}
            <span className="text-slate-300">=</span>
            <span className="font-bold text-[#0EA5E9]">{baseLetterSum} base</span>
            {lengthMultiplier > 1.0 && (
              <>
                <span className="text-slate-300">&times;</span>
                <span className="text-[#EC4899] font-bold">{lengthMultiplier}&times; bonus</span>
              </>
            )}
          </div>

          {/* Validation Banner */}
          {isValid ? (
            isDuplicate ? (
              <div className="px-4 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] rounded-full flex items-center gap-2 shadow-cute-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="font-bold">{wordString}</span>
                <span className="text-[#DC2626] font-extrabold">{score} pts (-50% Penalty)</span>
                <span className="text-[10px] text-[#FF385C] font-bold bg-[#FFF0F2] px-2 py-0.5 rounded-full border border-[#FFE4E8]">
                  💥 Blasts {draftWord.length - 1} tiles
                </span>
              </div>
            ) : (
              <div className="px-4 py-1.5 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] rounded-full flex items-center gap-2 shadow-cute-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="font-bold font-display">{wordString}</span>
                <span className="text-[#059669] font-black flex items-center gap-0.5 font-display">
                  <Zap className="w-3 h-3 fill-current text-[#F59E0B]" /> +{score} pts
                </span>
                <span className="text-[10px] text-[#FF385C] font-bold bg-white px-2 py-0.5 rounded-full border border-[#FFE4E8] shadow-sm">
                  💥 Blasts {draftWord.length - 1} tiles
                </span>
              </div>
            )
          ) : isTooShort ? (
            <div className="px-3.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center gap-1.5 shadow-cute-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF385C]" />
              <span>Need at least {minWordLength} letters ({draftWord.length}/{minWordLength})</span>
            </div>
          ) : (
            <div className="px-3.5 py-1 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-full flex items-center gap-1.5 shadow-cute-sm">
              <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Not in dictionary</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
