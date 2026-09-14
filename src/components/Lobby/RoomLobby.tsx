import React, { useState } from 'react';
import {
  Users,
  Play,
  Copy,
  Check,
  Flame,
  Shield,
  ArrowRight,
  Trash2,
  Volume2,
  VolumeX,
  Sparkles,
  Plus,
} from 'lucide-react';
import type { GameRoom, Player } from '../../types/game';
import { PLAYER_AVATARS, PLAYER_COLORS } from '../../config/letterDistribution';
import { createRoom, joinRoom, updateRoomState, startGame } from '../../services/firestoreService';
import { audio } from '../../services/audioService';

interface Props {
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  playerAvatar: string;
  setPlayerAvatar: (avatar: string) => void;
  playerColor: string;
  setPlayerColor: (color: string) => void;
  currentRoom: GameRoom | null;
  setCurrentRoom: (room: GameRoom | null) => void;
}

export const RoomLobby: React.FC<Props> = ({
  playerId,
  playerName,
  setPlayerName,
  playerAvatar,
  setPlayerAvatar,
  playerColor,
  setPlayerColor,
  currentRoom,
  setCurrentRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinCode, setJoinCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [startingTiles, setStartingTiles] = useState<number>(40);
  const [matchDuration, setMatchDuration] = useState<number>(180);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [soundMuted, setSoundMuted] = useState(!audio.enabled);

  const toggleSound = () => {
    audio.enabled = !audio.enabled;
    setSoundMuted(!audio.enabled);
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your player nickname!');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      const hostPlayer: Player = {
        id: playerId,
        name: playerName.trim(),
        avatar: playerAvatar,
        color: playerColor,
        isHost: true,
        isReady: true,
        score: 0,
        tiles: [],
        initialTileCount: startingTiles,
        tilesRemaining: startingTiles,
        wordsMade: [],
        consecutiveWords: 0,
      };

      const room = await createRoom(randomCode, hostPlayer, maxPlayers, startingTiles, matchDuration);
      setCurrentRoom(room);
      audio.playTileClick();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your player nickname!');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a valid room code.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const joiningPlayer: Player = {
        id: playerId,
        name: playerName.trim(),
        avatar: playerAvatar,
        color: playerColor,
        isHost: false,
        isReady: false,
        score: 0,
        tiles: [],
        initialTileCount: startingTiles,
        tilesRemaining: startingTiles,
        wordsMade: [],
        consecutiveWords: 0,
      };

      const room = await joinRoom(joinCode.trim(), joiningPlayer);
      setCurrentRoom(room);
      audio.playTileClick();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBot = async (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    if (!currentRoom) return;
    const currentCount = Object.keys(currentRoom.players).length;
    if (currentCount >= currentRoom.maxPlayers) {
      setError(`Room is full (${currentRoom.maxPlayers} max players)`);
      return;
    }

    const botNames = ['Panda Bot', 'Bunny AI', 'Koala Byte', 'Fox Turbo', 'Duckling'];
    const botAvatars = ['🐼', '🐰', '🐨', '🦊', '🐥'];
    const botColors = ['#F97316', '#8B5CF6', '#10B981', '#FF385C', '#0EA5E9'];

    const botId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const botIndex = currentCount;
    const botPlayer: Player = {
      id: botId,
      name: botNames[botIndex % botNames.length],
      avatar: botAvatars[botIndex % botAvatars.length],
      color: botColors[botIndex % botColors.length],
      isHost: false,
      isReady: true,
      isBot: true,
      botDifficulty: difficulty,
      score: 0,
      tiles: [],
      initialTileCount: currentRoom.startingTiles,
      tilesRemaining: currentRoom.startingTiles,
      wordsMade: [],
      consecutiveWords: 0,
    };

    const updatedPlayers = {
      ...currentRoom.players,
      [botId]: botPlayer,
    };

    await updateRoomState(currentRoom.id, { players: updatedPlayers });
    audio.playTileClick();
  };

  const handleRemovePlayer = async (pId: string) => {
    if (!currentRoom || pId === playerId) return;
    const updated = { ...currentRoom.players };
    delete updated[pId];
    await updateRoomState(currentRoom.id, { players: updated });
    audio.playTileRemove();
  };

  const handleToggleReady = async () => {
    if (!currentRoom) return;
    const me = currentRoom.players[playerId];
    if (!me) return;

    const updatedPlayer = { ...me, isReady: !me.isReady };
    const updatedPlayers = { ...currentRoom.players, [playerId]: updatedPlayer };
    await updateRoomState(currentRoom.id, { players: updatedPlayers });
    audio.playTileClick();
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;
    const playersList = Object.values(currentRoom.players);
    if (playersList.length < 2) {
      setError('You need at least 2 players to start! Add a bot or share room code.');
      return;
    }

    setLoading(true);
    try {
      await startGame(currentRoom.id);
      audio.playBlast();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to launch game');
      setLoading(false);
    }
  };

  const copyRoomLink = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // IF IN ROOM LOBBY:
  if (currentRoom) {
    const isHost = currentRoom.hostId === playerId;
    const playerList = Object.values(currentRoom.players);
    const myPlayer = currentRoom.players[playerId];

    return (
      <div className="w-full max-w-3xl mx-auto p-4 md:p-6 animate-fade-in text-slate-800">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white border border-slate-200 rounded-3xl p-5 shadow-cute-md">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] border border-[#FFE4E8] flex items-center justify-center text-2xl shadow-cute-sm text-[#FF385C]">
              💥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-display font-bold text-slate-400 uppercase tracking-wider">
                  ROOM CODE
                </span>
                <span className="px-3 py-0.5 bg-[#FFF0F2] text-[#FF385C] font-mono font-black text-sm rounded-full border border-[#FFE4E8]">
                  {currentRoom.id}
                </span>
                <button
                  onClick={copyRoomLink}
                  title="Copy room code"
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 font-display mt-0.5">
                {playerList.length} of {currentRoom.maxPlayers} Players Joined &bull; {currentRoom.startingTiles} Starting Tiles &bull; {Math.round((currentRoom.durationSeconds || 180) / 60)} Min Timer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full border border-slate-200 transition"
              title={soundMuted ? "Unmute sound" : "Mute sound"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-[#DC2626]" /> : <Volume2 className="w-4 h-4 text-[#0EA5E9]" />}
            </button>
            <button
              onClick={() => setCurrentRoom(null)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold font-display transition"
            >
              Leave
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] flex items-center gap-2 font-display">
            <Shield className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Players Circular Slot Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {playerList.map((p) => {
            const isMe = p.id === playerId;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center justify-between shadow-cute-sm hover:shadow-cute-md transition-all"
                style={{
                  borderLeftColor: p.color || '#FF385C',
                  borderLeftWidth: '4px',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-cute-sm"
                    style={{ backgroundColor: `${p.color || '#FF385C'}15` }}
                  >
                    {p.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-slate-900 text-sm font-display">{p.name}</h4>
                      {isMe && (
                        <span className="text-[9px] bg-[#FFF0F2] text-[#FF385C] px-1.5 py-0.2 rounded-full font-bold">
                          YOU
                        </span>
                      )}
                      {p.isHost && (
                        <span className="text-[9px] bg-[#FFFBEB] text-[#B45309] px-1.5 py-0.2 rounded-full font-bold border border-[#FDE68A]">
                          HOST
                        </span>
                      )}
                      {p.isBot && (
                        <span className="text-[9px] bg-[#F5F3FF] text-[#6D28D9] px-1.5 py-0.2 rounded-full font-bold border border-[#DDD6FE]">
                          BOT ({p.botDifficulty})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-display mt-0.5">
                      {p.isReady ? (
                        <span className="text-[#059669] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-[#D97706]">Not Ready</span>
                      )}
                    </p>
                  </div>
                </div>

                {isHost && !isMe && (
                  <button
                    onClick={() => handleRemovePlayer(p.id)}
                    title="Remove"
                    className="p-2 text-slate-300 hover:text-[#DC2626] rounded-full hover:bg-slate-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Empty Slot / Add Bot Slots */}
          {Array.from({ length: currentRoom.maxPlayers - playerList.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border-2 border-dashed border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center gap-1.5 text-center bg-slate-50/60 min-h-[110px]"
            >
              <Users className="w-5 h-5 text-slate-300" />
              <p className="text-xs text-slate-400 font-display font-medium">Slot Open</p>
              {isHost && (
                <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                  <button
                    onClick={() => handleAddBot('hard')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-bold font-display flex items-center gap-1 transition shadow-cute-sm"
                  >
                    ⚡ Hard
                  </button>
                  <button
                    onClick={() => handleAddBot('medium')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-bold font-display flex items-center gap-1 transition shadow-cute-sm"
                  >
                    🎯 Med
                  </button>
                  <button
                    onClick={() => handleAddBot('easy')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-bold font-display flex items-center gap-1 transition shadow-cute-sm"
                  >
                    🐢 Chill
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action / Launch Controls */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-cute-md">
          <button
            onClick={handleToggleReady}
            className={`px-6 py-2.5 rounded-full font-bold font-display text-sm transition flex items-center gap-2 border ${
              myPlayer?.isReady
                ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Check className="w-4 h-4" />
            {myPlayer?.isReady ? 'READY TO PLAY!' : 'CLICK TO READY'}
          </button>

          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={loading || playerList.length < 2}
              className={`px-8 py-3 rounded-full font-black font-display tracking-wide text-sm uppercase flex items-center gap-2 transition ${
                playerList.length >= 2
                  ? 'bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:from-[#E00B41] hover:to-[#C10034] text-white shadow-cute-pill hover:scale-105 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              START MATCH!
            </button>
          ) : (
            <div className="text-xs text-[#FF385C] font-semibold flex items-center gap-2 animate-pulse font-display">
              <Sparkles className="w-4 h-4" /> Waiting for Host to start...
            </div>
          )}
        </div>
      </div>
    );
  }

  // LOBBY HOME
  return (
    <div className="w-full max-w-xl mx-auto p-4 md:p-6 text-slate-900 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#FFF0F2] border border-[#FFE4E8] rounded-full text-xs font-bold font-display text-[#FF385C] mb-3 shadow-cute-sm">
          <Flame className="w-3.5 h-3.5 fill-current" /> REALTIME WORD BATTLE
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900">
          Word Blaster
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 font-display">
          Form 4+ letter words to blast tiles onto your friends&apos; racks along network paths. First to empty their rack wins!
        </p>
      </div>

      {/* Profile & Avatar Customizer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-cute-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">
            1. Player Nickname &amp; Avatar
          </h3>
          <button
            onClick={toggleSound}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full border border-slate-200 transition text-xs flex items-center gap-1.5 font-display"
            title={soundMuted ? "Unmute sound" : "Mute sound"}
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-[#DC2626]" /> : <Volume2 className="w-3.5 h-3.5 text-[#0EA5E9]" />}
            <span className="text-[11px] font-medium">{soundMuted ? 'Muted' : 'Sound On'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-600 font-bold font-display block mb-1.5">Nickname</label>
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-900 font-bold font-display focus:outline-none focus:border-[#FF385C] focus:bg-white shadow-cute-sm transition"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 font-bold font-display block mb-1.5">Choose Avatar</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PLAYER_AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => {
                    setPlayerAvatar(av.icon);
                    audio.playTileClick();
                  }}
                  className={`p-2.5 text-2xl rounded-2xl border transition-all flex items-center justify-center ${
                    playerAvatar === av.icon
                      ? 'border-[#FF385C] bg-[#FFF0F2] shadow-cute-sm ring-2 ring-[#FF385C]/30 scale-105'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {av.icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 font-bold font-display block mb-1.5">Favorite Color</label>
            <div className="flex flex-wrap gap-2">
              {PLAYER_COLORS.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    setPlayerColor(col.hex);
                    audio.playTileClick();
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold font-display transition ${
                    playerColor === col.hex
                      ? 'border-slate-800 bg-white shadow-cute-sm ring-2 ring-slate-800/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: col.hex }} />
                  {col.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Create vs Join */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-cute-md">
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-5">
          <button
            onClick={() => {
              setActiveTab('create');
              audio.playTileClick();
            }}
            className={`flex-1 py-2 text-xs font-bold font-display uppercase rounded-xl transition ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-cute-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Match
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
              audio.playTileClick();
            }}
            className={`flex-1 py-2 text-xs font-bold font-display uppercase rounded-xl transition ${
              activeTab === 'join'
                ? 'bg-white text-[#FF385C] shadow-cute-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Join with Code
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#991B1B] font-display">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 font-bold font-display block mb-1.5 flex items-center justify-between">
                <span>Players (2 to 5)</span>
                <span className="text-[#FF385C] font-bold">{maxPlayers} Players</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMaxPlayers(count)}
                    className={`py-2 rounded-2xl text-xs font-bold font-display transition border ${
                      maxPlayers === count
                        ? 'bg-[#FFF0F2] border-[#FF385C] text-[#FF385C] shadow-cute-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {count} Players
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold font-display block mb-1.5 flex items-center justify-between">
                <span>Starting Letter Tiles</span>
                <span className="text-[#0EA5E9] font-bold">{startingTiles} Tiles</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 40, 50].map((tiles) => (
                  <button
                    key={tiles}
                    onClick={() => setStartingTiles(tiles)}
                    className={`py-2 rounded-2xl text-xs font-bold font-display transition border ${
                      startingTiles === tiles
                        ? 'bg-[#F0F9FF] border-[#0EA5E9] text-[#0EA5E9] shadow-cute-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {tiles} Tiles
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-bold font-display block mb-1.5 flex items-center justify-between">
                <span>Match Timer</span>
                <span className="text-[#F59E0B] font-bold">
                  {matchDuration === 60 ? '1 Min' : matchDuration === 120 ? '2 Min' : matchDuration === 180 ? '3 Min (Default)' : '5 Min'}
                </span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '1 Min', val: 60 },
                  { label: '2 Min', val: 120 },
                  { label: '3 Min', val: 180 },
                  { label: '5 Min', val: 300 },
                ].map((dur) => (
                  <button
                    key={dur.val}
                    onClick={() => setMatchDuration(dur.val)}
                    className={`py-2 rounded-2xl text-xs font-bold font-display transition border ${
                      matchDuration === dur.val
                        ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#B45309] shadow-cute-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full mt-3 py-3.5 bg-gradient-to-r from-[#FF385C] to-[#E00B41] hover:from-[#E00B41] hover:to-[#C10034] text-white font-black font-display tracking-wide uppercase rounded-full text-sm shadow-cute-pill flex items-center justify-center gap-2 transition hover:scale-102 active:scale-98"
            >
              <Plus className="w-4 h-4" /> CREATE GAME ROOM
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-600 font-bold font-display block mb-1.5">Enter 5-Letter Code</label>
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7X9K2"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-center text-xl tracking-widest font-mono text-[#FF385C] font-black focus:outline-none focus:border-[#FF385C] focus:bg-white uppercase shadow-cute-sm transition"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={loading}
              className="w-full py-3.5 bg-[#FF385C] hover:bg-[#E00B41] text-white font-black font-display tracking-wide uppercase rounded-full text-sm shadow-cute-pill flex items-center justify-center gap-2 transition hover:scale-102 active:scale-98"
            >
              <ArrowRight className="w-4 h-4" /> ENTER ARENA
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
