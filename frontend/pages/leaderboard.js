import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Leaderboard.module.css';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

const TABS = [
  { key: 'score', label: '🏆 All Time' },
  { key: 'today', label: '📅 Today' },
  { key: 'streak', label: '🔥 Streaks' },
  { key: 'wins', label: '⚔️ Wins' },
];

// Fallback mock data when API is unavailable
const MOCK = [
  { rank:1, username:'RialoChamp', totalScore:12450, gamesWon:24, bestStreak:8 },
  { rank:2, username:'CryptoKing', totalScore:10200, gamesWon:19, bestStreak:6 },
  { rank:3, username:'Web3Wizard', totalScore:9800, gamesWon:17, bestStreak:5 },
  { rank:4, username:'BlockchainBoss', totalScore:8600, gamesWon:14, bestStreak:4 },
  { rank:5, username:'TokenMaster', totalScore:7400, gamesWon:12, bestStreak:4 },
];

export default function Leaderboard() {
  const router = useRouter();
  const [tab, setTab] = useState('score');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData(tab);
  }, [tab]);

  async function fetchData(t) {
    setLoading(true);
    setError('');
    try {
      const url = t === 'today'
        ? `${SOCKET_URL}/leaderboard/today`
        : `${SOCKET_URL}/leaderboard?sort=${t === 'streak' ? 'streak' : t === 'wins' ? 'wins' : 'score'}&limit=100`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json.length > 0 ? json : MOCK);
    } catch {
      setData(MOCK);
      setError('Showing sample data — connect backend to see live scores');
    }
    setLoading(false);
  }

  function getVal(p) {
    if (tab === 'streak') return `${p.bestStreak || 0} 🔥`;
    if (tab === 'wins') return `${p.gamesWon || 0} W`;
    return (p.totalScore || p.score || 0).toLocaleString();
  }

  function getRankIcon(i) {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
  }

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.title}>Leaderboard</div>
        <div />
      </div>

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.loadingDot} />
          <div className={styles.loadingDot} style={{ animationDelay: '0.2s' }} />
          <div className={styles.loadingDot} style={{ animationDelay: '0.4s' }} />
        </div>
      ) : (
        <div className={styles.list}>
          {data.length === 0 ? (
            <div className={styles.empty}>No players yet. Be the first! 🚀</div>
          ) : data.map((p, i) => (
            <div key={p.username || i} className={`${styles.row} ${i < 3 ? styles.topRow : ''}`}>
              <div className={styles.rank}>{getRankIcon(i)}</div>
              <div className={styles.avatar} style={{
                background: i === 0 ? 'rgba(255,184,0,0.2)' : i === 1 ? 'rgba(0,229,255,0.2)' : 'rgba(138,43,226,0.2)'
              }}>
                {(p.username || '?')[0].toUpperCase()}
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{p.username}</div>
                {p.gamesPlayed && <div className={styles.sub}>{p.gamesPlayed} games played</div>}
              </div>
              <div className={styles.val}>{getVal(p)}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.footerNote}>Scores update after each game</div>
        <button className={styles.refreshBtn} onClick={() => fetchData(tab)}>↻ Refresh</button>
      </div>
    </div>
  );
}
