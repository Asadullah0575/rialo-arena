import { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('reflex');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [streak, setStreak] = useState(0);

  return (
    <GameContext.Provider value={{
      username, setUsername,
      roomCode, setRoomCode,
      mode, setMode,
      isHost, setIsHost,
      players, setPlayers,
      myScore, setMyScore,
      streak, setStreak,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
