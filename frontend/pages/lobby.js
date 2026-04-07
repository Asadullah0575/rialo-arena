import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import styles from '../styles/Lobby.module.css';

const MODES = [
  { key: 'reflex', label: 'Reflex Mode', icon: '⚡', desc: '3s per question, math & trivia' },
  { key: 'rialo-mcq', label: 'Rialo MCQ', icon: '🧠', desc: 'Web3 knowledge, 4 options' },
  { key: 'rialo-type', label: 'Rialo Typing', icon: '⌨️', desc: 'Unscramble crypto words' },
];

export default function Lobby() {
  const router = useRouter();
  const { username, setRoomCode, setMode, setIsHost, setPlayers } = useGame();
  const { socket, connected } = useSocket();

  const [view, setView] = useState('menu'); // menu | create | join | waiting
  const [selectedMode, setSelectedMode] = useState('reflex');
  const [joinCode, setJoinCode] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [isHostLocal, setIsHostLocal] = useState(false);
  const [error, setError] = useState('');
  const [players, setPlayersLocal] = useState([]);

  useEffect(() => {
    if (!username) { router.replace('/'); return; }
  }, [username]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room:created', ({ roomCode, mode, players }) => {
      setRoomInfo({ roomCode, mode });
      setRoomCode(roomCode);
      setMode(mode);
      setIsHost(true);
      setIsHostLocal(true);
      setPlayersLocal(players);
      setView('waiting');
    });

    socket.on('room:joined', ({ roomCode, mode, hostId }) => {
      setRoomInfo({ roomCode, mode });
      setRoomCode(roomCode);
      setMode(mode);
      setIsHost(socket.id === hostId);
      setIsHostLocal(socket.id === hostId);
      setView('waiting');
    });

    socket.on('room:updated', ({ players, hostId }) => {
      setPlayersLocal(players);
      setPlayers(players);
      setIsHostLocal(socket.id === hostId);
    });

    socket.on('room:error', ({ message }) => {
      setError(message);
    });

    socket.on('game:countdown', ({ seconds }) => {
      router.push('/game');
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:updated');
      socket.off('room:error');
      socket.off('game:countdown');
    };
  }, [socket]);

  function createRoom() {
    if (!socket || !connected) { setError('Not connected to server.'); return; }
    socket.emit('room:create', { username, mode: selectedMode });
  }

  function joinRoom() {
    if (!joinCode.trim()) { setError('Enter a room code.'); return; }
    if (!socket || !connected) { setError('Not connected to server.'); return; }
    socket.emit('room:join', { roomCode: joinCode.trim().toUpperCase(), username });
  }

  function startGame() {
    if (!socket) return;
    socket.emit('game:start');
  }

  if (view === 'menu') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.topTitle}>Multiplayer</div>
        <div className={styles.connDot} style={{ background: connected ? '#00FF9C' : '#FF3B3B' }} title={connected ? 'Connected' : 'Disconnected'} />
      </div>
      <div className={styles.btnList}>
        <button className={styles.bigBtn} onClick={() => setView('create')}>
          <span>🏠</span>
          <div>
            <div className={styles.btnTitle}>Create Room</div>
            <div className={styles.btnSub}>Host a private match</div>
          </div>
        </button>
        <button className={styles.bigBtn} onClick={() => setView('join')}>
          <span>🔗</span>
          <div>
            <div className={styles.btnTitle}>Join Room</div>
            <div className={styles.btnSub}>Enter a room code</div>
          </div>
        </button>
      </div>
    </div>
  );

  if (view === 'create') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => setView('menu')}>← Back</button>
        <div className={styles.topTitle}>Create Room</div>
        <div />
      </div>
      <div className={styles.section}>
        <div className={styles.sectionLabel}>SELECT MODE</div>
        <div className={styles.modeList}>
          {MODES.map(m => (
            <button
              key={m.key}
              className={`${styles.modeBtn} ${selectedMode === m.key ? styles.modeSelected : ''}`}
              onClick={() => setSelectedMode(m.key)}
            >
              <span>{m.icon}</span>
              <div>
                <div className={styles.modeTitle}>{m.label}</div>
                <div className={styles.modeDesc}>{m.desc}</div>
              </div>
              {selectedMode === m.key && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.bottom}>
        <button className={styles.primaryBtn} onClick={createRoom} disabled={!connected}>
          {connected ? 'Create Room' : 'Connecting...'}
        </button>
      </div>
    </div>
  );

  if (view === 'join') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => setView('menu')}>← Back</button>
        <div className={styles.topTitle}>Join Room</div>
        <div />
      </div>
      <div className={styles.joinWrap}>
        <div className={styles.sectionLabel}>ROOM CODE</div>
        <input
          className={styles.codeInput}
          placeholder="ABC123"
          value={joinCode}
          onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
          maxLength={8}
          autoFocus
        />
        {error && <div className={styles.error}>{error}</div>}
        <button className={styles.primaryBtn} onClick={joinRoom} disabled={!connected}>
          {connected ? 'Join Room' : 'Connecting...'}
        </button>
      </div>
    </div>
  );

  if (view === 'waiting') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>Leave</button>
        <div className={styles.topTitle}>Waiting Room</div>
        <div />
      </div>
      <div className={styles.roomCodeWrap}>
        <div className={styles.rcLabel}>ROOM CODE</div>
        <div className={styles.rcCode}>{roomInfo?.roomCode}</div>
        <div className={styles.rcHint}>Share this code with friends</div>
      </div>
      <div className={styles.modeTag}>
        {MODES.find(m => m.key === roomInfo?.mode)?.icon} {MODES.find(m => m.key === roomInfo?.mode)?.label}
      </div>
      <div className={styles.playerList}>
        <div className={styles.sectionLabel}>PLAYERS ({players.length})</div>
        {players.map((p, i) => (
          <div key={p.id} className={styles.playerRow}>
            <div className={styles.playerRank}>{i + 1}</div>
            <div className={styles.playerName}>{p.username} {i === 0 ? <span className={styles.hostTag}>HOST</span> : ''}</div>
            <div className={styles.playerReady}>●</div>
          </div>
        ))}
      </div>
      <div className={styles.bottom}>
        {isHostLocal ? (
          <button
            className={styles.primaryBtn}
            onClick={startGame}
            disabled={players.length < 1}
          >
            {players.length < 2 ? 'Start (waiting for players...)' : `Start Game (${players.length} players)`}
          </button>
        ) : (
          <div className={styles.waitMsg}>Waiting for host to start...</div>
        )}
      </div>
    </div>
  );
}
