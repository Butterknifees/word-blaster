import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Zap } from 'lucide-react';
import type { GameRoom } from '../../types/game';
import { audio } from '../../services/audioService';

interface Props {
  room: GameRoom;
  currentPlayerId: string;
  onRematch: () => void;
  onLeaveRoom: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  room,
  currentPlayerId,
  onRematch,
  onLeaveRoom,
}) => {
  const players = Object.values(room.players);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isWinner = winner?.id === currentPlayerId;
  const isHost = room.hostId === currentPlayerId;

  const finisher = players.find((p) => p.tilesRemaining === 0);

  useEffect(() => {
    audio.playVictory();

    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#FF385C', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FF385C', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-4xl p-6 md:p-8 shadow-cute-lg text-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header / Trophy */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#FFF7ED] text-[#F97316] text-4xl mb-3 shadow-cute-md border border-[#FED7AA] animate-bounce">
            <Trophy className="w-10 h-10 fill-current" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight text-slate-900">
            {isWinner ? '🎉 Victory Royale!' : 'Match Finished!'}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {finisher
              ? `🎯 ${finisher.name} emptied their tile rack first (+500 Finisher Bonus)!`
              : `⏱️ Time's Up (${Math.round((room.durationSeconds || 180) / 60)} Minutes reached) — Final scores tallied!`}
          </p>
        </div>

        {/* Leaderboard Podium */}
        <div className="space-y-2.5 mb-6">
          {sortedPlayers.map((player, rank) => {
            const isMe = player.id === currentPlayerId;
            const medals = ['🥇', '🥈', '🥉', '4th', '5th'];

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                  rank === 0
                    ? 'bg-[#FFFBEB] border-[#FDE68A] shadow-cute-sm'
                    : isMe
                    ? 'bg-[#FFF0F2] border-[#FFE4E8]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center text-lg font-bold font-display">
                    {medals[rank]}
                  </span>

                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-white border border-slate-200 shadow-cute-sm"
                  >
                    {player.avatar}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm md:text-base text-slate-900 font-display">
                        {player.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-[#FF385C] text-white px-1.5 py-0.2 rounded-full font-bold">
                          YOU
                        </span>
                      )}
                      {player.tilesRemaining === 0 && (
                        <span className="text-[10px] bg-[#ECFDF5] text-[#059669] px-1.5 py-0.2 rounded-full font-bold border border-[#A7F3D0]">
                          FINISHER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-display">
                      {player.wordsMade.length} Words Blasted &bull; {player.tilesRemaining} Tiles Left
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base md:text-xl font-black font-display text-slate-900">
                    {player.score.toLocaleString()} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Word Highlights */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-xs space-y-2">
          <div className="font-bold text-slate-500 uppercase flex items-center gap-1.5 text-[11px] font-display">
            <Zap className="w-3.5 h-3.5 text-[#F59E0B]" /> Words Played in Match:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {room.allWordsPlayed.slice(0, 15).map((w, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg font-display font-semibold shadow-2xs"
              >
                {w}
              </span>
            ))}
            {room.allWordsPlayed.length > 15 && (
              <span className="text-slate-400 self-center font-display text-[11px]">
                +{room.allWordsPlayed.length - 15} more
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onLeaveRoom}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold font-display uppercase flex items-center gap-2 transition shadow-cute-sm"
          >
            <Home className="w-4 h-4" /> Lobby
          </button>

          {isHost ? (
            <button
              onClick={onRematch}
              className="px-8 py-3 bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:from-[#E00B41] hover:to-[#C10034] text-white font-black font-display tracking-wide uppercase rounded-full text-sm shadow-cute-pill flex items-center gap-2 transition hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> PLAY AGAIN!
            </button>
          ) : (
            <div className="text-xs text-[#FF385C] font-semibold flex items-center gap-2 animate-pulse font-display">
              <Zap className="w-4 h-4" /> Waiting for Host to start Rematch...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
