import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import styles from '../styles/Lobby.module.css';

const MODES = [
  { key:'reflex', label:'Reflex Mode', icon:'⚡', desc:'3s per Q — math & trivia' },
  { key:'rialo-mcq', label:'Rialo MCQ', icon:'🎮', desc:'Web3 knowledge — tap fastest' },
  { key:'rialo-type', label:'Rialo Typing', icon:'⌨️', desc:'Unscramble crypto words' },
  { key:'emoji', label:'Emoji Merge', icon:'🧩', desc:'Decode emoji combinations' },
  { key:'timeattack', label:'Time Attack', icon:'⏱️', desc:'60 seconds — score as much as possible' },
  { key:'daily', label:'Daily Challenge', icon:'📅', desc:'Same questions for everyone today' },
];

const CATEGORIES = [
  { key:'math', label:'Math', icon:'🔢' },
  { key:'rialo', label:'Rialo & Web3', icon:'🎮' },
  { key:'science', label:'Science', icon:'🔬' },
  { key:'geography', label:'Geography', icon:'🌍' },
  { key:'sports', label:'Sports', icon:'⚽' },
  { key:'history', label:'History', icon:'📜' },
  { key:'music', label:'Music', icon:'🎵' },
  { key:'movies', label:'Movies & TV', icon:'🎬' },
];

const Q_COUNTS = [5, 10, 15, 20, 30, 50];

export default function Lobby() {
  const router = useRouter();
  const { username, setRoomCode, setMode, setIsHost, setPlayers } = useGame();
  const { socket, connected } = useSocket();
  const [view, setView] = useState('menu');
  const [selectedMode, setSelectedMode] = useState('reflex');
  const [selectedCats, setSelectedCats] = useState(['math','rialo','science']);
  const [qCount, setQCount] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [isHostLocal, setIsHostLocal] = useState(false);
  const [error, setError] = useState('');
  const [players, setPlayersLocal] = useState([]);
  const [showCats, setShowCats] = useState(false);

  useEffect(() => { if (!username) router.replace('/'); }, [username]);

  useEffect(() => {
    if (!socket) return;
    socket.on('room:created', ({ roomCode, mode, players }) => {
      setRoomInfo({ roomCode, mode });
      setRoomCode(roomCode); setMode(mode);
      setIsHost(true); setIsHostLocal(true);
      setPlayersLocal(players); setView('waiting');
    });
    socket.on('room:joined', ({ roomCode, mode, hostId }) => {
      setRoomInfo({ roomCode, mode });
      setRoomCode(roomCode); setMode(mode);
      setIsHost(socket.id === hostId);
      setIsHostLocal(socket.id === hostId);
      setView('waiting');
    });
    socket.on('room:updated', ({ players, hostId }) => {
      setPlayersLocal(players); setPlayers(players);
      setIsHostLocal(socket.id === hostId);
    });
    socket.on('room:error', ({ message }) => setError(message));
    socket.on('game:countdown', () => router.push('/game'));
    return () => {
      socket.off('room:created'); socket.off('room:joined');
      socket.off('room:updated'); socket.off('room:error');
      socket.off('game:countdown');
    };
  }, [socket]);

  function toggleCat(key) {
    setSelectedCats(prev => prev.includes(key) ? (prev.length > 1 ? prev.filter(k => k !== key) : prev) : [...prev, key]);
  }

  function createRoom() {
    if (!socket || !connected) { setError('Not connected.'); return; }
    socket.emit('room:create', { username, mode: selectedMode, categories: selectedCats, questionCount: qCount });
  }

  function joinRoom() {
    if (!joinCode.trim()) { setError('Enter a room code.'); return; }
    if (!socket || !connected) { setError('Not connected.'); return; }
    socket.emit('room:join', { roomCode: joinCode.trim().toUpperCase(), username });
  }

  function startGame() {
    if (!socket) return;
    socket.emit('game:start');
  }

  const connDot = { width:8, height:8, borderRadius:'50%', background: connected ? '#00FF9C' : '#FF3B3B' };

  if (view === 'menu') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.topTitle}>Multiplayer</div>
        <div style={connDot} title={connected ? 'Connected' : 'Disconnected'} />
      </div>
      <div className={styles.btnList}>
        <button className={styles.bigBtn} onClick={() => setView('create')}>
          <span>🏠</span>
          <div><div className={styles.btnTitle}>Create Room</div><div className={styles.btnSub}>Host a private match</div></div>
        </button>
        <button className={styles.bigBtn} onClick={() => setView('join')}>
          <span>🔗</span>
          <div><div className={styles.btnTitle}>Join Room</div><div className={styles.btnSub}>Enter a room code</div></div>
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
        <div className={styles.sLabel}>GAME MODE</div>
        <div className={styles.modeList}>
          {MODES.map(m => (
            <button key={m.key}
              className={`${styles.modeBtn} ${selectedMode === m.key ? styles.modeSelected : ''}`}
              onClick={() => setSelectedMode(m.key)}>
              <span>{m.icon}</span>
              <div><div className={styles.modeTitle}>{m.label}</div><div className={styles.modeDesc}>{m.desc}</div></div>
              {selectedMode === m.key && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {['reflex', 'rialo-mcq'].includes(selectedMode) && (
        <div className={styles.section}>
          <div className={styles.sRow}>
            <div className={styles.sLabel}>CATEGORIES</div>
            <button className={styles.toggleBtn} onClick={() => setShowCats(!showCats)}>
              {selectedCats.length} selected {showCats ? '▲' : '▼'}
            </button>
          </div>
          {showCats && (
            <div className={styles.catGrid}>
              {CATEGORIES.map(c => (
                <button key={c.key}
                  className={`${styles.catChip} ${selectedCats.includes(c.key) ? styles.catActive : ''}`}
                  onClick={() => toggleCat(c.key)}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sRow}>
          <div className={styles.sLabel}>QUESTIONS</div>
          <div className={styles.qVal}>{qCount} questions</div>
        </div>
        <div className={styles.qBtns}>
          {Q_COUNTS.map(n => (
            <button key={n}
              className={`${styles.qBtn} ${qCount === n ? styles.qBtnActive : ''}`}
              onClick={() => setQCount(n)}>{n}</button>
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
        <div className={styles.sLabel}>ROOM CODE</div>
        <input className={styles.codeInput} placeholder="ABC123"
          value={joinCode}
          onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
          maxLength={8} autoFocus />
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
        <div style={connDot} />
      </div>
      <div className={styles.roomCodeWrap}>
        <div className={styles.rcLabel}>ROOM CODE</div>
        <div className={styles.rcCode}>{roomInfo?.roomCode}</div>
        <div className={styles.rcHint}>Share this code with friends</div>
      </div>
      <div className={styles.modeTag}>
        {MODES.find(m => m.key === roomInfo?.mode)?.icon} {MODES.find(m => m.key === roomInfo?.mode)?.label}
        <span style={{ color:'var(--text-muted)', marginLeft:8 }}>· {qCount} questions</span>
      </div>
      <div className={styles.playerList}>
        <div className={styles.sLabel}>PLAYERS ({players.length})</div>
        {players.map((p, i) => (
          <div key={p.id} className={styles.playerRow}>
            <div className={styles.pRank}>{i + 1}</div>
            <div className={styles.pName}>
              {p.username}
              {i === 0 && <span className={styles.hostTag}>HOST</span>}
            </div>
            <div className={styles.pDot}>●</div>
          </div>
        ))}
      </div>
      <div className={styles.bottom}>
        {isHostLocal ? (
          <button className={styles.primaryBtn} onClick={startGame}>
            {players.length < 2 ? `Start Solo (${players.length} player)` : `Start Game (${players.length} players)`}
          </button>
        ) : (
          <div className={styles.waitMsg}>Waiting for host to start...</div>
        )}
      </div>
    </div>
  );
}
