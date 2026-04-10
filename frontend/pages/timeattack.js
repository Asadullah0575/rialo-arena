import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import Confetti from '../components/Confetti';
import styles from '../styles/TimeAttack.module.css';

const ALL_QUESTIONS = [
  {tag:'MATH',prompt:'7 × 8 = ?',word:'7 × 8',options:['54','56','58','64'],answer:'56'},
  {tag:'MATH',prompt:'9 × 7 = ?',word:'9 × 7',options:['54','63','72','81'],answer:'63'},
  {tag:'MATH',prompt:'12 × 12 = ?',word:'12²',options:['124','144','132','148'],answer:'144'},
  {tag:'MATH',prompt:'8 × 8 = ?',word:'8 × 8',options:['56','62','64','66'],answer:'64'},
  {tag:'MATH',prompt:'6 × 7 = ?',word:'6 × 7',options:['36','40','42','48'],answer:'42'},
  {tag:'MATH',prompt:'√144 = ?',word:'√144',options:['11','12','13','14'],answer:'12'},
  {tag:'MATH',prompt:'9 × 9 = ?',word:'9 × 9',options:['72','81','90','99'],answer:'81'},
  {tag:'MATH',prompt:'11 × 11 = ?',word:'11²',options:['111','121','131','141'],answer:'121'},
  {tag:'MATH',prompt:'2^10 = ?',word:'2¹⁰',options:['512','1024','2048','256'],answer:'1024'},
  {tag:'MATH',prompt:'8 × 9 = ?',word:'8 × 9',options:['63','72','81','90'],answer:'72'},
  {tag:'RIALO',prompt:'What does NFT stand for?',word:'NFT',options:['Non-Fungible Token','New Finance Tech','Net Fund Token','Network File Transfer'],answer:'Non-Fungible Token'},
  {tag:'RIALO',prompt:'What is staking?',word:'Staking',options:['Selling tokens','Locking tokens to earn rewards','Mining blocks','Burning tokens'],answer:'Locking tokens to earn rewards'},
  {tag:'RIALO',prompt:'What does WAGMI mean?',word:'WAGMI',options:['We Are Getting More Inu','We All Gonna Make It','Web3 Arena Game Mode','Wait And Get More Info'],answer:'We All Gonna Make It'},
  {tag:'RIALO',prompt:'What does DeFi stand for?',word:'DeFi',options:['Decentralized Finance','Digital Finance','Distributed Fiat','Deferred Financing'],answer:'Decentralized Finance'},
  {tag:'RIALO',prompt:'What does HODL mean?',word:'HODL',options:['Hold On for Dear Life','High Order Digital Ledger','Hold or Drop Later','High Output Digital Layer'],answer:'Hold On for Dear Life'},
  {tag:'SCIENCE',prompt:'Powerhouse of the cell?',word:'Cell power',options:['Nucleus','Ribosome','Mitochondria','Vacuole'],answer:'Mitochondria'},
  {tag:'SCIENCE',prompt:'Symbol for gold?',word:'Gold symbol',options:['Go','Gd','Au','Ag'],answer:'Au'},
  {tag:'SCIENCE',prompt:'pH of pure water?',word:'Water pH',options:['5','6','7','8'],answer:'7'},
  {tag:'SCIENCE',prompt:'Largest planet?',word:'Largest planet',options:['Saturn','Neptune','Jupiter','Uranus'],answer:'Jupiter'},
  {tag:'SCIENCE',prompt:'Boiling point of water?',word:'Water boils',options:['90°C','95°C','100°C','105°C'],answer:'100°C'},
  {tag:'GEO',prompt:'Capital of France?',word:'France 🇫🇷',options:['Lyon','Marseille','Paris','Bordeaux'],answer:'Paris'},
  {tag:'GEO',prompt:'Largest country?',word:'Largest country',options:['USA','Canada','China','Russia'],answer:'Russia'},
  {tag:'GEO',prompt:'Capital of Japan?',word:'Japan 🇯🇵',options:['Osaka','Kyoto','Hiroshima','Tokyo'],answer:'Tokyo'},
  {tag:'GEO',prompt:'Tallest mountain?',word:'Tallest peak',options:['K2','Kangchenjunga','Everest','Lhotse'],answer:'Everest'},
  {tag:'GEO',prompt:'Capital of Nigeria?',word:'Nigeria 🇳🇬',options:['Lagos','Kano','Ibadan','Abuja'],answer:'Abuja'},
  {tag:'SPORTS',prompt:'Players on a football team?',word:'Football team',options:['9','10','11','12'],answer:'11'},
  {tag:'SPORTS',prompt:'Olympic rings?',word:'Olympic rings',options:['4','5','6','7'],answer:'5'},
  {tag:'SPORTS',prompt:'Players in basketball?',word:'Basketball team',options:['4','5','6','7'],answer:'5'},
  {tag:'SPORTS',prompt:'Golf holes?',word:'Golf holes',options:['9','12','16','18'],answer:'18'},
  {tag:'SPORTS',prompt:'Points for a touchdown?',word:'Touchdown',options:['4','5','6','7'],answer:'6'},
  {tag:'HISTORY',prompt:'First US president?',word:'1st US president',options:['Jefferson','Lincoln','Washington','Adams'],answer:'Washington'},
  {tag:'HISTORY',prompt:'WW2 ended in?',word:'WW2 ended',options:['1943','1944','1945','1946'],answer:'1945'},
  {tag:'HISTORY',prompt:'Moon landing year?',word:'Moon landing',options:['1965','1967','1969','1971'],answer:'1969'},
  {tag:'HISTORY',prompt:'Who invented telephone?',word:'Telephone',options:['Edison','Tesla','Bell','Marconi'],answer:'Bell'},
  {tag:'HISTORY',prompt:'Berlin Wall fell in?',word:'Berlin Wall',options:['1987','1988','1989','1990'],answer:'1989'},
  {tag:'MUSIC',prompt:'Guitar strings?',word:'Guitar strings',options:['4','5','6','7'],answer:'6'},
  {tag:'MUSIC',prompt:'Piano keys?',word:'Piano keys',options:['72','76','88','92'],answer:'88'},
  {tag:'MUSIC',prompt:'Forte means?',word:'Forte',options:['Slow','Soft','Loud','Fast'],answer:'Loud'},
  {tag:'MUSIC',prompt:'Notes in an octave?',word:'Octave',options:['6','7','8','9'],answer:'8'},
  {tag:'MOVIES',prompt:'Who played Iron Man?',word:'Iron Man',options:['Chris Evans','Chris Hemsworth','Robert Downey Jr.','Mark Ruffalo'],answer:'Robert Downey Jr.'},
  {tag:'MOVIES',prompt:'Nollywood is from?',word:'Nollywood',options:['Ghana','Kenya','South Africa','Nigeria'],answer:'Nigeria'},
  {tag:'MOVIES',prompt:'Batman city?',word:'Batman city',options:['Metropolis','Star City','Gotham','Central City'],answer:'Gotham'},
  {tag:'MOVIES',prompt:'Thor actor in MCU?',word:'Thor',options:['Chris Pratt','Chris Evans','Liam Hemsworth','Chris Hemsworth'],answer:'Chris Hemsworth'},
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TIME_LIMIT = 60;
const Q_TIME = 5000;

export default function TimeAttack() {
  const router = useRouter();
  const { username } = useGame();
  const [phase, setPhase] = useState('ready'); // ready | playing | over
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [qTimerPct, setQTimerPct] = useState(100);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [answerStates, setAnswerStates] = useState({});
  const [shuffledOpts, setShuffledOpts] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const gameTimerRef = useRef(null);
  const qTimerRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!username) router.replace('/');
  }, [username]);

  function startGame() {
    const qs = [...shuffle(ALL_QUESTIONS), ...shuffle(ALL_QUESTIONS), ...shuffle(ALL_QUESTIONS)];
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(TIME_LIMIT);
    setPhase('playing');
  }

  const q = questions[qIndex];

  useEffect(() => {
    if (phase !== 'playing') return;
    // Main countdown
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(gameTimerRef.current);
          clearInterval(qTimerRef.current);
          setPhase('over');
          setShowConfetti(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(gameTimerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' || !q) return;
    setAnswered(false);
    setFeedback({ text: '', type: '' });
    setAnswerStates({});
    setShuffledOpts(shuffle([...q.options]));
    setQTimerPct(100);
    startTimeRef.current = Date.now();
    clearInterval(qTimerRef.current);
    qTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / Q_TIME) * 100);
      setQTimerPct(pct);
      if (elapsed >= Q_TIME) {
        clearInterval(qTimerRef.current);
        handleTimeout();
      }
    }, 80);
    return () => clearInterval(qTimerRef.current);
  }, [qIndex, phase]);

  function getMult(s) { return s >= 5 ? 3 : s >= 3 ? 2 : 1; }

  function handleAnswer(opt) {
    if (answered) return;
    setAnswered(true);
    clearInterval(qTimerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    if (opt === q.answer) {
      const ns = streak + 1;
      setStreak(ns);
      setBestStreak(b => Math.max(b, ns));
      const mult = getMult(ns);
      let pts = 50 * mult;
      if (elapsed < 500) pts += 100;
      else if (elapsed < 1500) pts += 50;
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setAnswerStates({ [opt]: 'correct' });
      setFeedback({ text: elapsed < 500 ? `⚡ PERFECT! +${pts}` : `✓ +${pts}`, type: 'correct' });
    } else {
      setStreak(0);
      setAnswerStates({ [opt]: 'wrong', [q.answer]: 'correct' });
      setFeedback({ text: '✗ WRONG!', type: 'wrong' });
    }
    setTimeout(() => setQIndex(i => i + 1), 600);
  }

  function handleTimeout() {
    if (answered) return;
    setAnswered(true);
    setStreak(0);
    setFeedback({ text: '⏰ TOO SLOW!', type: 'wrong' });
    setTimeout(() => setQIndex(i => i + 1), 600);
  }

  const timerColor = timeLeft <= 10 ? '#FF3B3B' : timeLeft <= 20 ? '#FFB800' : '#00FF9C';
  const qTimerColor = qTimerPct < 30 ? '#FF3B3B' : qTimerPct < 60 ? '#FFB800' : '#00FF9C';
  const mult = getMult(streak);

  if (phase === 'ready') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.title}>Time Attack</div>
        <div />
      </div>
      <div className={styles.readyWrap}>
        <div className={styles.readyIcon}>⏱️</div>
        <div className={styles.readyTitle}>60 SECONDS</div>
        <div className={styles.readyDesc}>Answer as many questions as possible before time runs out. Speed bonuses multiply your score!</div>
        <div className={styles.rulesGrid}>
          <div className={styles.rule}><span>⚡</span><div><b>Under 0.5s</b><br/>+100 bonus</div></div>
          <div className={styles.rule}><span>🔥</span><div><b>3 streak</b><br/>x2 multiplier</div></div>
          <div className={styles.rule}><span>💥</span><div><b>5 streak</b><br/>x3 multiplier</div></div>
          <div className={styles.rule}><span>📚</span><div><b>All categories</b><br/>mixed together</div></div>
        </div>
        <button className={styles.startBtn} onClick={startGame}>START!</button>
      </div>
    </div>
  );

  if (phase === 'over') return (
    <div className={styles.root}>
      <Confetti trigger={showConfetti} />
      <div className={styles.overWrap}>
        <div className={styles.overLabel}>TIME UP!</div>
        <div className={styles.overScore}>{score}</div>
        <div className={styles.overSub}>TIME ATTACK</div>
        <div className={styles.statsCard}>
          <div className={styles.stat}><span>Questions answered</span><span>{qIndex}</span></div>
          <div className={styles.stat}><span>Correct</span><span>{correct} / {qIndex}</span></div>
          <div className={styles.stat}><span>Accuracy</span><span>{qIndex > 0 ? Math.round((correct/qIndex)*100) : 0}%</span></div>
          <div className={styles.stat}><span>Best combo</span><span>x{bestStreak >= 5 ? 3 : bestStreak >= 3 ? 2 : 1}</span></div>
        </div>
        <button className={styles.playAgain} onClick={startGame}>Play Again</button>
        <button className={styles.homeBtn} onClick={() => router.push('/')}>Home</button>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      {/* Top bar */}
      <div className={styles.gameTop}>
        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>SCORE</div>
          <div className={styles.scoreVal}>{score}</div>
        </div>
        <div className={styles.clockWrap}>
          <div
            className={`${styles.clock} ${timeLeft <= 10 ? styles.clockDanger : ''}`}
            style={{ color: timerColor }}
          >
            {timeLeft}s
          </div>
          <div className={styles.clockLabel}>LEFT</div>
        </div>
        <div className={styles.comboBox}>
          <div className={styles.comboVal} style={{ color: mult >= 3 ? '#FF9C00' : mult >= 2 ? '#00FF9C' : '#555' }}>
            {streak >= 3 ? <span className="animate-streak">x{mult}</span> : `x${mult}`}
          </div>
          <div className={styles.comboLabel}>COMBO</div>
        </div>
      </div>

      {/* Game timer */}
      <div className={styles.timerWrap}>
        <div className={styles.timerBg}>
          <div className={styles.timerFill} style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%`, background: timerColor }} />
        </div>
      </div>

      {/* Q timer */}
      <div className={styles.timerWrap} style={{ marginTop: 4 }}>
        <div className={styles.timerBg}>
          <div className={styles.timerFill} style={{ width: `${qTimerPct}%`, background: qTimerColor, height: 4 }} />
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
            className={`${styles.optBtn}
              ${answerStates[opt] === 'correct' ? styles.optCorrect : ''}
              ${answerStates[opt] === 'wrong' ? styles.optWrong : ''}
            `}
            onClick={() => handleAnswer(opt)}
            disabled={answered}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
