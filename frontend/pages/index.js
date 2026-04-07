import { useState } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import styles from '../styles/Home.module.css';

export default function Home() {
  const router = useRouter();
  const { username, setUsername } = useGame();
  const [nameInput, setNameInput] = useState(username || '');
  const [error, setError] = useState('');

  function handleEnter(mode) {
    if (!nameInput.trim()) { setError('Enter your username first!'); return; }
    setUsername(nameInput.trim());
    if (mode === 'solo') router.push('/solo');
    else router.push('/lobby');
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.logo}>REFLEX ARENA</div>
        <div className={styles.sub}>RIALO EDITION</div>
      </div>

      <div className={styles.inputWrap}>
        <input
          className={styles.nameInput}
          placeholder="Enter username..."
          value={nameInput}
          onChange={e => { setNameInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleEnter('multi')}
          maxLength={20}
        />
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.modes}>
        <button className={styles.modeBtn} onClick={() => handleEnter('solo')}>
          <span className={styles.modeIcon}>⚡</span>
          <div>
            <div className={styles.modeTitle}>Solo Play</div>
            <div className={styles.modeDesc}>Reflex + Rialo modes, single player</div>
          </div>
        </button>

        <button className={`${styles.modeBtn} ${styles.modeFeatured}`} onClick={() => handleEnter('multi')}>
          <span className={styles.modeIcon}>⚔️</span>
          <div>
            <div className={styles.modeTitle}>Multiplayer</div>
            <div className={styles.modeDesc}>Create or join a room, compete live</div>
          </div>
          <span className={styles.hotBadge}>LIVE</span>
        </button>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerStat}>Scoring: +100 base &nbsp;|&nbsp; Speed bonus +50/+100 &nbsp;|&nbsp; Combo x2/x3</div>
      </div>
    </div>
  );
}
