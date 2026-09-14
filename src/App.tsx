import React from 'react';
import { useGameState } from './hooks/useGameState';
import { RoomLobby } from './components/Lobby/RoomLobby';
import { GameArena } from './components/Arena/GameArena';

export const App: React.FC = () => {
  const {
    playerId,
    playerName,
    setPlayerName,
    playerAvatar,
    setPlayerAvatar,
    playerColor,
    setPlayerColor,
    currentRoom,
    setCurrentRoom,
  } = useGameState();

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#222222] flex flex-col items-center justify-center relative overflow-x-hidden font-sans">
      {/* Soft warm ambient background blurs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-[#FFE4E8]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-[#E0F2FE]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-[#FEF3C7]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Views */}
      {!currentRoom || currentRoom.status === 'lobby' ? (
        <main className="w-full relative z-10 py-6">
          <RoomLobby
            playerId={playerId}
            playerName={playerName}
            setPlayerName={setPlayerName}
            playerAvatar={playerAvatar}
            setPlayerAvatar={setPlayerAvatar}
            playerColor={playerColor}
            setPlayerColor={setPlayerColor}
            currentRoom={currentRoom}
            setCurrentRoom={setCurrentRoom}
          />
        </main>
      ) : (
        <main className="w-full min-h-screen relative z-10">
          <GameArena
            room={currentRoom}
            currentPlayerId={playerId}
            onLeaveRoom={() => setCurrentRoom(null)}
          />
        </main>
      )}
    </div>
  );
};

export default App;
