import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameRoom } from '../../types/game';
import { isWordInDictionary } from '../../dictionary/words';
import { calculateWordScore } from '../../config/letterDistribution';
import { submitWordPlay, startGame, endGameByTimeout } from '../../services/firestoreService';
import { manageBotTurn, stopAllBots } from '../../services/botService';
import { audio } from '../../services/audioService';
import { WordBuilder } from '../Rack/WordBuilder';
import { TileRack } from '../Rack/TileRack';
import { ActionButtons } from '../Rack/ActionButtons';
import { WordHistory } from './WordHistory';
import { GameOverModal } from './GameOverModal';
import { ScoreboardStrip } from './ScoreboardStrip';
import { DuplicateWordsPane } from './DuplicateWordsPane';
import { PlayerNetworkGraph } from './PlayerNetworkGraph';
import { Volume2, VolumeX, LogOut, Timer, AlertTriangle, Network, Grid, Flame } from 'lucide-react';

interface Props {
  room: GameRoom;
  currentPlayerId: string;
  onLeaveRoom: () => void;
}

export const GameArena: React.FC<Props> = ({
  room,
  currentPlayerId,
  onLeaveRoom,
}) => {
  const [draftWord, setDraftWord] = useState<string[]>([]);
  const [usedTileIndices, setUsedTileIndices] = useState<number[]>([]);
  const [soundMuted, setSoundMuted] = useState(!audio.enabled);
  const [showDuplicatePane, setShowDuplicatePane] = useState(false);
  const [mobileTab, setMobileTab] = useState<'deck' | 'network'>('deck');
  const [blastAlert, setBlastAlert] = useState<{ text: string; color: string; isIncoming: boolean } | null>(null);
  const lastProcessedEventId = useRef<string | null>(null);

  const duration = room.durationSeconds || 180; // default 3 minutes (180s)
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!room.startedAt) return duration;
    const elapsed = Math.floor((Date.now() - room.startedAt) / 1000);
    return Math.max(0, duration - elapsed);
  });

  const myPlayer = room.players[currentPlayerId];
  const allPlayers = Object.values(room.players);
  const isHost = room.hostId === currentPlayerId;

  // Match countdown timer
  useEffect(() => {
    if (room.status !== 'playing' || !room.startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (room.startedAt || Date.now())) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (isHost) {
          endGameByTimeout(room.id);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [room.status, room.startedAt, duration, isHost, room.id]);

  // AI Bots management (Host machine orchestrates bot thinking)
  useEffect(() => {
    if (room.status === 'playing' && isHost) {
      allPlayers.forEach((p) => {
        if (p.isBot && p.tilesRemaining > 0) {
          manageBotTurn(room, p, isHost);
        }
      });
    }
  }, [room, isHost, allPlayers]);

  // Clean up bots only when match is not playing or component unmounts
  useEffect(() => {
    if (room.status !== 'playing') {
      stopAllBots();
    }
    return () => {
      stopAllBots();
    };
  }, [room.status]);

  const toggleSound = () => {
    audio.enabled = !audio.enabled;
    setSoundMuted(!audio.enabled);
  };

  // Local rack order
  const [rackTiles, setRackTiles] = useState<string[]>(() => myPlayer?.tiles || []);

  // Synchronize rack tiles when player's hand changes
  useEffect(() => {
    if (myPlayer?.tiles) {
      setRackTiles(myPlayer.tiles);
    }
  }, [myPlayer?.tiles]);

  // Listen for latest blast events to show animated alerts and play audio
  useEffect(() => {
    const latestEvent = room.recentEvents?.[0];
    if (!latestEvent || latestEvent.id === lastProcessedEventId.current) return;
    lastProcessedEventId.current = latestEvent.id;

    if (latestEvent.playerId === currentPlayerId) {
      setBlastAlert({
        text: `🚀 You blasted ${latestEvent.blastedLetters.length} tiles to opponents!`,
        color: '#10B981',
        isIncoming: false,
      });
    } else if (latestEvent.targetPlayerIds.includes(currentPlayerId)) {
      const incomingCount = latestEvent.blastedLetters.filter(
        (_, idx) => latestEvent.targetPlayerIds[idx % latestEvent.targetPlayerIds.length] === currentPlayerId
      ).length || 1;
      setBlastAlert({
        text: `💥 ${latestEvent.playerName} blasted +${incomingCount} tiles onto your rack!`,
        color: '#FF385C',
        isIncoming: true,
      });
      audio.playImpact();
    } else {
      setBlastAlert({
        text: `✨ ${latestEvent.playerName} played "${latestEvent.word}" (+${latestEvent.score} pts)`,
        color: '#0EA5E9',
        isIncoming: false,
      });
    }

    const timer = setTimeout(() => setBlastAlert(null), 3000);
    return () => clearTimeout(timer);
  }, [room.recentEvents, currentPlayerId]);

  // Word calculation & validation
  const wordString = draftWord.join('').toUpperCase();
  const isValid = wordString.length >= room.minWordLength && isWordInDictionary(wordString);
  const isDuplicate = isValid && (room.allWordsPlayed || []).includes(wordString);
  const calculatedScore = isValid ? calculateWordScore(wordString, isDuplicate) : 0;

  // Select a letter from rack
  const handleSelectTile = useCallback((index: number) => {
    if (!rackTiles[index] || usedTileIndices.includes(index)) return;
    const letter = rackTiles[index];
    setDraftWord((prev) => [...prev, letter]);
    setUsedTileIndices((prev) => [...prev, index]);
    audio.playTileClick();
  }, [rackTiles, usedTileIndices]);

  // Remove letter from draft
  const handleRemoveLetter = useCallback((letterIndex: number) => {
    setDraftWord((prev) => {
      const updated = [...prev];
      updated.splice(letterIndex, 1);
      return updated;
    });

    setUsedTileIndices((prev) => {
      const updated = [...prev];
      updated.splice(letterIndex, 1);
      return updated;
    });

    audio.playTileRemove();
  }, []);

  // Clear word draft
  const handleClear = useCallback(() => {
    setDraftWord([]);
    setUsedTileIndices([]);
    audio.playTileRemove();
  }, []);

  // Shuffle rack
  const handleShuffle = useCallback(() => {
    handleClear();
    setRackTiles((prev) => [...prev].sort(() => Math.random() - 0.5));
    audio.playShuffle();
  }, [handleClear]);

  // Sort rack alphabetically
  const handleSort = useCallback(() => {
    handleClear();
    setRackTiles((prev) => [...prev].sort((a, b) => a.localeCompare(b)));
    audio.playTileClick();
  }, [handleClear]);

  // Submit & Blast Word!
  const handleSubmitWord = useCallback(async () => {
    if (!isValid || !myPlayer) return;

    if (isDuplicate) {
      audio.playDuplicateBuzz();
    } else {
      audio.playBlast();
    }

    const currentWord = wordString;
    const currentScore = calculatedScore;
    const currentIsDuplicate = isDuplicate;

    // Instantly clear draft tiles from builder
    setDraftWord([]);
    setUsedTileIndices([]);

    try {
      await submitWordPlay(
        room.id,
        myPlayer.id,
        currentWord,
        currentScore,
        currentIsDuplicate
      );
    } catch (err) {
      console.warn("Could not submit word:", err);
    }
  }, [isValid, myPlayer, isDuplicate, room.id, wordString, calculatedScore]);

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!myPlayer || room.status !== 'playing') return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (isValid) {
          handleSubmitWord();
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (draftWord.length > 0) {
          handleRemoveLetter(draftWord.length - 1);
        }
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        handleShuffle();
        return;
      }

      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        const availableIndex = rackTiles.findIndex(
          (tile, idx) => tile === key && !usedTileIndices.includes(idx)
        );

        if (availableIndex !== -1) {
          handleSelectTile(availableIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    myPlayer,
    room.status,
    isValid,
    draftWord.length,
    rackTiles,
    usedTileIndices,
    handleSubmitWord,
    handleRemoveLetter,
    handleShuffle,
    handleSelectTile,
  ]);

  const handleRematch = async () => {
    if (isHost) {
      await startGame(room.id);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-2.5 sm:p-4 md:p-5 select-none bg-[#F8F9FA] text-[#222222]">
      {/* Top Navbar */}
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3 bg-white border border-slate-200 rounded-3xl px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-cute-sm mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF385C] flex items-center justify-center text-white text-sm sm:text-base font-black shadow-cute-pill">
            💥
          </div>
          <div>
            <span className="font-display font-extrabold text-sm sm:text-base md:text-lg text-slate-900 tracking-tight">
              Word Blaster
            </span>
            <span className="ml-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-[10px] sm:text-xs font-semibold rounded-full border border-slate-200">
              {room.id}
            </span>
          </div>
        </div>

        {/* Center Countdown Clock Pill */}
        <div className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border font-display font-extrabold text-xs sm:text-sm md:text-base tracking-wide shadow-cute-sm transition-all ${
          secondsLeft <= 30
            ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626] animate-pulse'
            : secondsLeft <= 60
            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
            : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <Timer className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${secondsLeft <= 30 ? 'text-[#DC2626] animate-spin' : 'text-[#FF385C]'}`} />
          <span>
            {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowDuplicatePane(!showDuplicatePane)}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full border text-xs font-bold font-display flex items-center gap-1.5 transition ${
              showDuplicatePane
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Duplicate words feed"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden md:inline">Duplicates</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition"
            title={soundMuted ? "Unmute" : "Mute"}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-[#DC2626]" /> : <Volume2 className="w-4 h-4 text-[#0EA5E9]" />}
          </button>

          <button
            onClick={onLeaveRoom}
            className="p-2 sm:px-3.5 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold font-display flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Persistent Live Scoreboard Strip for ALL players */}
      <div className="w-full mb-2 sm:mb-3">
        <ScoreboardStrip players={allPlayers} currentPlayerId={currentPlayerId} />
      </div>

      {/* Mobile Tab Switcher (Visible on mobile/tablets < lg) */}
      <div className="flex lg:hidden bg-white p-1 rounded-2xl border border-slate-200 shadow-cute-sm mb-2 w-full max-w-sm mx-auto">
        <button
          onClick={() => setMobileTab('deck')}
          className={`flex-1 py-1.5 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'deck'
              ? 'bg-[#FF385C] text-white shadow-cute-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Word Deck</span>
        </button>
        <button
          onClick={() => setMobileTab('network')}
          className={`flex-1 py-1.5 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 transition ${
            mobileTab === 'network'
              ? 'bg-[#FF385C] text-white shadow-cute-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Player Network</span>
        </button>
      </div>

      {/* Main Game Stage */}
      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 sm:gap-4 min-h-0">
        {/* Left Side: Circular Nodes Player Network Graph */}
        <div className={`w-full lg:w-[420px] shrink-0 ${mobileTab === 'network' ? 'block' : 'hidden lg:block'}`}>
          <PlayerNetworkGraph
            players={allPlayers}
            currentPlayerId={currentPlayerId}
            recentEvents={room.recentEvents || []}
          />
        </div>

        {/* Center Deck: Word Drafting Arena & Tile Rack */}
        <div className={`flex-1 w-full max-w-2xl flex flex-col justify-between gap-2 sm:gap-3 h-full ${mobileTab === 'deck' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Live Activity Feed */}
          <WordHistory events={room.recentEvents || []} />

          {/* Live Blast Alert Notification Banner */}
          {blastAlert && (
            <div
              className={`w-full max-w-xl mx-auto py-2 px-4 rounded-2xl border text-center font-display font-bold text-xs sm:text-sm animate-bounce shadow-cute-md flex items-center justify-center gap-2 transition-all ${
                blastAlert.isIncoming
                  ? 'bg-[#FFF0F2] border-[#FF385C] text-[#FF385C]'
                  : 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]'
              }`}
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>{blastAlert.text}</span>
            </div>
          )}

          {/* Word Drafting Card */}
          <div className="flex flex-col items-center justify-center my-0.5 sm:my-1">
            <WordBuilder
              draftWord={draftWord}
              isValid={isValid}
              isDuplicate={isDuplicate}
              score={calculatedScore}
              minWordLength={room.minWordLength}
              onRemoveLetter={handleRemoveLetter}
            />
          </div>

          {/* Action Buttons & Tile Rack */}
          <div className="w-full flex flex-col gap-2 safe-bottom">
            <ActionButtons
              canSubmit={isValid}
              isDuplicate={isDuplicate}
              score={calculatedScore}
              onSubmit={handleSubmitWord}
              onShuffle={handleShuffle}
              onSort={handleSort}
              onClear={handleClear}
            />

            {myPlayer && (
              <TileRack
                tiles={rackTiles}
                usedTileIndices={usedTileIndices}
                onSelectTile={handleSelectTile}
              />
            )}
          </div>
        </div>

        {/* Right Side: Contested Duplicate Words Pane */}
        {showDuplicatePane && (
          <div className="w-full lg:w-80 shrink-0 animate-fade-in">
            <DuplicateWordsPane
              room={room}
              isOpen={showDuplicatePane}
              onClose={() => setShowDuplicatePane(false)}
            />
          </div>
        )}
      </div>

      {/* Game Over Finale Modal */}
      {room.status === 'ended' && (
        <GameOverModal
          room={room}
          currentPlayerId={currentPlayerId}
          onRematch={handleRematch}
          onLeaveRoom={onLeaveRoom}
        />
      )}
    </div>
  );
};
