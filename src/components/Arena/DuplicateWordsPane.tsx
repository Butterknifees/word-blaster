import React from 'react';
import { AlertTriangle, Copy, X } from 'lucide-react';
import type { GameRoom } from '../../types/game';

interface Props {
  room: GameRoom;
  isOpen?: boolean;
  onClose?: () => void;
}

interface DuplicateEntry {
  word: string;
  count: number;
  firstClaimant?: {
    name: string;
    color: string;
    avatar: string;
    score: number;
  };
  subsequentPlays: {
    name: string;
    color: string;
    avatar: string;
    penalty: number;
  }[];
}

export const DuplicateWordsPane: React.FC<Props> = ({ room, isOpen = true, onClose }) => {
  const wordPlayMap: Record<string, DuplicateEntry> = {};

  const allPlayerWords: {
    word: string;
    playerName: string;
    playerColor: string;
    playerAvatar: string;
    score: number;
    timestamp: number;
    isDuplicate?: boolean;
  }[] = [];

  Object.values(room.players).forEach((p) => {
    (p.wordsMade || []).forEach((w) => {
      allPlayerWords.push({
        word: w.word.toUpperCase(),
        playerName: p.name,
        playerColor: p.color,
        playerAvatar: p.avatar,
        score: w.score,
        timestamp: w.timestamp,
        isDuplicate: w.isDuplicate,
      });
    });
  });

  allPlayerWords.sort((a, b) => a.timestamp - b.timestamp);

  allPlayerWords.forEach((play) => {
    if (!wordPlayMap[play.word]) {
      wordPlayMap[play.word] = {
        word: play.word,
        count: 1,
        firstClaimant: {
          name: play.playerName,
          color: play.playerColor,
          avatar: play.playerAvatar,
          score: Math.abs(play.score),
        },
        subsequentPlays: [],
      };
    } else {
      wordPlayMap[play.word].count += 1;
      wordPlayMap[play.word].subsequentPlays.push({
        name: play.playerName,
        color: play.playerColor,
        avatar: play.playerAvatar,
        penalty: play.score,
      });
    }
  });

  const duplicatesList = Object.values(wordPlayMap).filter((entry) => entry.count > 1);

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-white border border-slate-200 rounded-3xl p-4 shadow-cute-md flex flex-col justify-between text-slate-800 max-h-[480px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[#F59E0B]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold font-display tracking-tight text-sm text-slate-900">
                Contested Words
              </h3>
              <p className="text-[11px] text-slate-400">
                Used &gt;1 time &bull; -50% penalty
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-[#FFFBEB] text-[#B45309] font-display font-bold text-xs rounded-full border border-[#FDE68A]">
              {duplicatesList.length}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List of Contested Words */}
        <div className="space-y-2.5 overflow-y-auto max-h-[360px] custom-scrollbar pr-1">
          {duplicatesList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-display text-xs flex flex-col items-center gap-2">
              <Copy className="w-6 h-6 text-slate-300" />
              <span>No duplicate words yet!</span>
              <span className="text-[10px] text-slate-400">
                Playing a previously used word deducts 50% points.
              </span>
            </div>
          ) : (
            duplicatesList.map((entry) => (
              <div
                key={entry.word}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-sm text-slate-900">
                    {entry.word}
                  </span>
                  <span className="text-[10px] font-display font-bold bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    {entry.count}&times; Played
                  </span>
                </div>

                {/* 1st Play */}
                {entry.firstClaimant && (
                  <div className="flex items-center justify-between text-[11px] font-display bg-white rounded-xl px-2.5 py-1 border border-slate-100 shadow-2xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs">{entry.firstClaimant.avatar}</span>
                      <span className="text-slate-800 font-semibold truncate">
                        {entry.firstClaimant.name}
                      </span>
                      <span className="text-slate-400 text-[9px] uppercase font-bold">(1st)</span>
                    </div>
                    <span className="text-[#059669] font-bold ml-1">
                      +{entry.firstClaimant.score} pts
                    </span>
                  </div>
                )}

                {/* Copiers */}
                {entry.subsequentPlays.map((sub, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-[11px] font-display bg-[#FEF2F2] rounded-xl px-2.5 py-1 border border-[#FECACA]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs">{sub.avatar}</span>
                      <span className="text-[#991B1B] font-semibold truncate">
                        {sub.name}
                      </span>
                      <span className="text-[#DC2626] text-[9px] font-bold">(-50%)</span>
                    </div>
                    <span className="text-[#DC2626] font-bold ml-1">
                      {sub.penalty} pts
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
