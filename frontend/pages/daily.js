import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import Confetti from '../components/Confetti';
import styles from '../styles/Daily.module.css';

// Seeded daily questions (same for everyone each day)
const DAILY_POOL = [
  {tag:'MATH',prompt:'7 × 8 = ?',word:'7 × 8',options:['54','56','58','64'],answer:'56'},
  {tag:'RIALO',prompt:'What does NFT stand for?',word:'NFT',options:['Non-Fungible Token','New Finance Tech','Net Fund Token','Network File Transfer'],answer:'Non-Fungible Token'},
  {tag:'SCIENCE',prompt:'Powerhouse of the cell?',word:'Cell power',options:['Nucleus','Ribosome','Mitochondria','Vacuole'],answer:'Mitochondria'},
  {tag:'GEO',prompt:'Capital of France?',word:'France 🇫🇷',options:['Lyon','Marseille','Paris','Bordeaux'],answer:'Paris'},
  {tag:'SPORTS',prompt:'Olympic rings?',word:'Olympic rings',options:['4','5','6','7'],answer:'5'},
  {tag:'HISTORY',prompt:'WW2 ended in?',word:'WW2 ended',options:['1943','1944','1945','1946'],answer:'1945'},
  {tag:'MUSIC',prompt:'Piano keys?',word:'Piano keys',options:['72','76','88','92'],answer:'88'},
  {tag:'MOVIES',prompt:'Who played Iron Man?',word:'Iron Man',options:['Chris Evans','Chris Hemsworth','Robert Downey Jr.','Mark Ruffalo'],answer:'Robert Downey Jr.'},
  {tag:'RIALO',prompt:'What does WAGMI mean?',word:'WAGMI',options:['We Are Getting More Inu','We All Gonna Make It','Web3 Arena Game Mode','Wait And Get More Info'],answer:'We All Gonna Make It'},
  {tag:'MATH',prompt:'12 × 12 = ?',word:'12²',options:['124','144','132','148'],answer:'144'},
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  for (let i = a.length - 1; i > 0; i--) {
    h = (Math.imul(h ^ (h >>> 16), 0x45d9f3b)) | 0;
    const j = Math.abs(h) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Daily() {
  const router = useRouter();
  const { username } = useGame();
  const { socket } = useSocket();
  const [phase, setPhase] = useState('intro'); // intro | playing | over
  const [questions] = useState(() => seededShuffle([...DAILY_POOL], getTodayKey()));
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timerPct, setTimerPct] = useState(100);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [answerStates, setAnswerStates] = useState({});
  const [shuffledOpts, setShuffledOpts] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(0);
  const TIME_LIMIT = 8000;

  useEffect(() => {
    if (!username) { router.replace('/'); return; }
    const key = `daily_${getTodayKey()}_${username}`;
    if (localStorage.getItem(key)) setAlreadyPlayed(true);
  }, [username]);

  const q = questions[qIndex];

  useEffect(() => {
    if (phase !== 'playing' || !q) return;
    setAnswered(false);
    setFeedback({ text: '', type: '' });
    setAnswerStates({});
    setShuffledOpts(shuffle([...q.options]));
    setTimerPct(100);
    startRef.current = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / TIME_LIMIT) * 100);
      setTimerPct(pct);
      if (elapsed >= TIME_LIMIT) { clearInterval(timerRef.current); handleTimeout(); }
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [qIndex, phase]);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getMult(s) { return s >= 5 ? 3 : s >= 3 ? 2 : 1; }

  function handleAnswer(opt) {
    if (answered) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    const elapsed = Date.now() - startRef.current;
    if (opt === q.answer) {
      const ns = streak + 1;
      setStreak(ns);
      setBestStreak(b => Math.max(b, ns));
      const mult = getMult(ns);
      let pts = 100 * mult;
      if (elapsed < 500) pts += 100;
      else if (elapsed < 1500) pts += 50;
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setAnswerStates({ [opt]: 'correct' });
      setFeedback({ text: `✓ +${pts}`, type: 'correct' });
    } else {
      setStreak(0);
      setAnswerStates({ [opt]: 'wrong', [q.answer]: 'correct' });
      setFeedback({ text: '✗ WRONG!', type: 'wrong' });
    }
    setTimeout(() => {
      if (qIndex + 1 >= questions.length) finishGame();
      else setQIndex(i => i + 1);
    }, 700);
  }

  function handleTimeout() {
    if (answered) return;
    setAnswered(true);
    setStreak(0);
    setFeedback({ text: '⏰ TOO SLOW!', type: 'wrong' });
    setTimeout(() => {
      if (qIndex + 1 >= questions.length) finishGame();
      else setQIndex(i => i + 1);
    }, 700);
  }

  function finishGame() {
    const key = `daily_${getTodayKey()}_${username}`;
    localStorage.setItem(key, JSON.stringify({ score, correct }));
    setPhase('over');
    setShowConfetti(true);
    if (socket) {
      socket.emit('game:save', {
        score, correct, answered: questions.length,
        won: false, streak: bestStreak,
        mode: 'daily', daily: true, date: getTodayKey(),
      });
    }
  }

  const timerColor = timerPct < 30 ? '#FF3B3B' : timerPct < 60 ? '#FFB800' : '#00FF9C';

  if (alreadyPlayed) return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.title}>Daily Challenge</div>
        <div />
      </div>
      <div className={styles.centered}>
        <div style={{ fontSize: 48 }}>✅</div>
        <div className={styles.doneTitle}>Already Played Today!</div>
        <div className={styles.doneSub}>Come back tomorrow for a new challenge.</div>
        <div className={styles.dateTag}>{getTodayKey()}</div>
        <button className={styles.lbBtn} onClick={() => router.push('/leaderboard')}>View Leaderboard</button>
        <button className={styles.homeBtn} onClick={() => router.push('/')}>Home</button>
      </div>
    </div>
  );

  if (phase === 'intro') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.title}>Daily Challenge</div>
        <div />
      </div>
      <div className={styles.centered}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
        <div className={styles.dateTag}>{getTodayKey()}</div>
        <div className={styles.introTitle}>TODAY'S CHALLENGE</div>
        <div className={styles.introDesc}>10 questions. Same for everyone today. You only get one attempt — make it count!</div>
        <div className={styles.introStats}>
          <div className={styles.iStat}><span>10</span><small>Questions</small></div>
          <div className={styles.iStat}><span>1x</span><small>Attempt</small></div>
          <div className={styles.iStat}><span>🌍</span><small>Global rank</small></div>
        </div>
        <button className={styles.startBtn} onClick={() => setPhase('playing')}>Start Challenge</button>
      </div>
    </div>
  );

  if (phase === 'over') return (
    <div className={styles.root}>
      <Confetti trigger={showConfetti} />
      <div className={styles.overWrap}>
        <div className={styles.overLabel}>DAILY COMPLETE</div>
        <div className={styles.overScore}>{score}</div>
        <div className={styles.overDate}>{getTodayKey()}</div>
        <div className={styles.statsCard}>
          <div className={styles.stat}><span>Correct</span><span>{correct} / {questions.length}</span></div>
          <div className={styles.stat}><span>Accuracy</span><span>{Math.round((correct/questions.length)*100)}%</span></div>
          <div className={styles.stat}><span>Best streak</span><span>{bestStreak} 🔥</span></div>
        </div>
        <button className={styles.lbBtn} onClick={() => router.push('/leaderboard')}>View Leaderboard</button>
        <button className={styles.homeBtn} onClick={() => router.push('/')}>Home</button>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.gameTop}>
        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>SCORE</div>
          <div className={styles.scoreVal}>{score}</div>
        </div>
        <div className={styles.qCount}>Q {qIndex + 1} / {questions.length}</div>
        <div className={styles.comboBox}>
          <div className={styles.comboVal} style={{ color: getMult(streak) >= 3 ? '#FF9C00' : getMult(streak) >= 2 ? '#00FF9C' : '#555' }}>
            x{getMult(streak)}
          </div>
          <div className={styles.comboLabel}>COMBO</div>
        </div>
      </div>
      <div className={styles.timerWrap}>
        <div className={styles.timerBg}>
          <div className={styles.timerFill} style={{ width: `${timerPct}%`, background: timerColor }} />
        </div>
      </div>
      <div className={styles.promptArea}>
        <div className={styles.tag}>{q?.tag}</div>
        <div className={`${styles.word} ${feedback.type === 'wrong' ? 'animate-shake' : ''}`}>{q?.word}</div>
        <div className={styles.prompt}>{q?.prompt}</div>
        <div className={`${styles.feedback} ${feedback.type === 'correct' ? styles.fCorrect : feedback.type === 'wrong' ? styles.fWrong : ''}`}>
          {feedback.text}
        </div>
      </div>
      <div className={styles.grid}>
        {shuffledOpts.map(opt => (
          <button
            key={opt}
            className={`${styles.optBtn} ${answerStates[opt] === 'correct' ? styles.optCorrect : answerStates[opt] === 'wrong' ? styles.optWrong : ''}`}
            onClick={() => handleAnswer(opt)}
            disabled={answered}
          >{opt}</button>
        ))}
      </div>
    </div>
  );
}
