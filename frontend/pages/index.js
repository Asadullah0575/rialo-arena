import { useState } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import ThemeToggle from '../components/ThemeToggle';
import styles from '../styles/Home.module.css';

const CATEGORIES = [
  { key: 'math', label: 'Math', icon: '🔢' },
  { key: 'rialo', label: 'Rialo & Web3', icon: '🎮' },
  { key: 'science', label: 'Science', icon: '🔬' },
  { key: 'geography', label: 'Geography', icon: '🌍' },
  { key: 'sports', label: 'Sports', icon: '⚽' },
  { key: 'history', label: 'History', icon: '📜' },
  { key: 'music', label: 'Music', icon: '🎵' },
  { key: 'movies', label: 'Movies & TV', icon: '🎬' },
  { key: 'emojiMerge', label: 'Emoji Merge', icon: '🧩' },
  { key: 'unscramble', label: 'Unscramble', icon: '⌨️' },
];

const Q_COUNTS = [5, 10, 15, 20, 30, 50];

export default function Home() {
  const router = useRouter();
  const { username, setUsername, setMode } = useGame();
  const [nameInput, setNameInput] = useState(username || '');
  const [selectedCats, setSelectedCats] = useState(['math', 'rialo']);
  const [qCount, setQCount] = useState(10);
  const [error, setError] = useState('');
  const [showCats, setShowCats] = useState(false);

  function toggleCat(key) {
    setSelectedCats(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  function go(dest) {
    if (!nameInput.trim()) { setError('Enter your username first!'); return; }
    setUsername(nameInput.trim());
    router.push(dest);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.logo}>REFLEX ARENA</div>
            <div className={styles.sub}>RIALO EDITION</div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className={styles.inputWrap}>
        <input
          className={styles.nameInput}
          placeholder="Enter username..."
          value={nameInput}
          onChange={e => { setNameInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && go('/solo')}
          maxLength={20}
        />
        {error && <div className={styles.error}>{error}</div>}
      </div>

      {/* Category selector */}
      <div className={styles.section}>
        <div className={styles.sectionRow}>
          <div className={styles.sectionLabel}>CATEGORIES</div>
          <button className={styles.toggleBtn} onClick={() => setShowCats(!showCats)}>
            {selectedCats.length} selected {showCats ? '▲' : '▼'}
          </button>
        </div>
        {showCats && (
          <div className={styles.catGrid}>
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                className={`${styles.catChip} ${selectedCats.includes(c.key) ? styles.catActive : ''}`}
                onClick={() => toggleCat(c.key)}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Question count */}
      <div className={styles.section}>
        <div className={styles.sectionRow}>
          <div className={styles.sectionLabel}>QUESTIONS</div>
          <div className={styles.qCountVal}>{qCount} questions</div>
        </div>
        <div className={styles.qCountBtns}>
          {Q_COUNTS.map(n => (
            <button
              key={n}
              className={`${styles.qBtn} ${qCount === n ? styles.qBtnActive : ''}`}
              onClick={() => setQCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Game modes */}
      <div className={styles.modes}>
        <button className={styles.modeBtn} onClick={() => go('/solo')}>
          <span className={styles.modeIcon}>⚡</span>
          <div>
            <div className={styles.modeTitle}>Solo Play</div>
            <div className={styles.modeDesc}>Practice all modes alone</div>
          </div>
        </button>

        <button className={`${styles.modeBtn} ${styles.modeFeatured}`} onClick={() => go('/lobby')}>
          <span className={styles.modeIcon}>⚔️</span>
          <div>
            <div className={styles.modeTitle}>Multiplayer</div>
            <div className={styles.modeDesc}>Create or join a live room</div>
          </div>
          <span className={styles.hotBadge}>LIVE</span>
        </button>

        <button className={styles.modeBtn} onClick={() => go('/timeattack')}>
          <span className={styles.modeIcon}>⏱️</span>
          <div>
            <div className={styles.modeTitle}>Time Attack</div>
            <div className={styles.modeDesc}>60 seconds. Answer as many as possible</div>
          </div>
        </button>

        <button className={styles.modeBtn} onClick={() => go('/daily')}>
          <span className={styles.modeIcon}>📅</span>
          <div>
            <div className={styles.modeTitle}>Daily Challenge</div>
            <div className={styles.modeDesc}>Same questions for everyone today</div>
          </div>
          <span className={styles.newBadge}>NEW</span>
        </button>
      </div>

      <div className={styles.footer}>
        <button className={styles.lbBtn} onClick={() => go('/leaderboard')}>
          🏆 Global Leaderboard
        </button>
        <div className={styles.footerStat}>
          +100 correct &nbsp;·&nbsp; Speed bonus +50/+100 &nbsp;·&nbsp; Combo x2/x3
        </div>
      </div>
    </div>
  );
}
