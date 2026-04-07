import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import styles from '../styles/Solo.module.css';

const QUESTIONS = {
  reflex: [
    { tag:"MATH", prompt:"Quick! What is 7 × 8?", word:"7 × 8", options:["54","56","58","64"], answer:"56" },
    { tag:"MATH", prompt:"Quick! What is 9 × 7?", word:"9 × 7", options:["54","63","72","81"], answer:"63" },
    { tag:"MATH", prompt:"Quick! What is 12²?", word:"12²", options:["124","144","132","148"], answer:"144" },
    { tag:"TRIVIA", prompt:"How many sides in a hexagon?", word:"⬡", options:["5","6","7","8"], answer:"6" },
    { tag:"ODD ONE OUT", prompt:"NOT a planet?", word:"Planets?", options:["Mars","Pluto","Earth","Venus"], answer:"Pluto" },
    { tag:"MATH", prompt:"Quick! What is 8 × 8?", word:"8 × 8", options:["56","62","64","66"], answer:"64" },
    { tag:"TRIVIA", prompt:"Fastest land animal?", word:"Speed?", options:["Lion","Horse","Cheetah","Leopard"], answer:"Cheetah" },
    { tag:"MATH", prompt:"Quick! What is 6 × 7?", word:"6 × 7", options:["36","40","42","48"], answer:"42" },
    { tag:"TRIVIA", prompt:"Days in a leap year?", word:"Leap year?", options:["364","365","366","367"], answer:"366" },
    { tag:"MATH", prompt:"Quick! What is 15 × 4?", word:"15 × 4", options:["50","55","60","65"], answer:"60" },
  ],
  rialoMcq: [
    { tag:"RIALO", prompt:"Platform for decentralized AI?", word:"Decentralized AI", options:["Ethereum","GenLayer","Solana","Polygon"], answer:"GenLayer" },
    { tag:"WEB3", prompt:"What does NFT stand for?", word:"NFT", options:["Non-Fungible Token","New Finance Tech","Net Fund Token","Transfer"], answer:"Non-Fungible Token" },
    { tag:"CRYPTO", prompt:"Ethereum consensus now?", word:"Ethereum", options:["Proof of Work","Proof of Stake","Delegated PoS","PoA"], answer:"Proof of Stake" },
    { tag:"WEB3", prompt:"WAGMI means?", word:"WAGMI", options:["We Are Getting More Inu","We All Gonna Make It","Web3 Arena Game Mode","Wait And Get More Info"], answer:"We All Gonna Make It" },
    { tag:"CRYPTO", prompt:"What is a gas fee?", word:"Gas fee", options:["Network cost","Mining reward","Staking yield","Burn fee"], answer:"Network cost" },
    { tag:"RIALO", prompt:"Rialo rewards players with?", word:"Rewards", options:["NFTs only","Tokens","Fiat","Points only"], answer:"Tokens" },
    { tag:"WEB3", prompt:"Smart contract is?", word:"Smart contract", options:["Legal document","Self-executing code","A wallet type","An NFT standard"], answer:"Self-executing code" },
    { tag:"CRYPTO MATH", prompt:"1 RIALO=$0.5. 200 RIALO=?", word:"200 × $0.5", options:["$50","$100","$200","$150"], answer:"$100" },
    { tag:"WEB3", prompt:"DeFi stands for?", word:"DeFi", options:["Decentralized Finance","Digital Finance","Distributed Fiat","Deferred Financing"], answer:"Decentralized Finance" },
    { tag:"RIALO", prompt:"Rialo's game genre?", word:"Rialo is...", options:["RPG","DeFi","Competitive Gaming","NFT Market"], answer:"Competitive Gaming" },
  ],
  rialoType: [
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"GNLYRAEEG", answer:"GENLAYER" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"OLIARI", answer:"RIALO" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"KBCHINOLA", answer:"BLOCKCHAIN" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"TNOKE", answer:"TOKEN" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"TGNSAKI", answer:"STAKING" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"LATELW", answer:"WALLET" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"TNFM", answer:"MINT" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"ODECC", answer:"CODEC" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"EGIMNR", answer:"MINER" },
    { tag:"UNSCRAMBLE", prompt:"Unscramble:", word:"SEHBNAICL", answer:"CHAINLESS" },
  ],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const TIME_LIMITS = { reflex: 3000, rialoMcq: 8000, rialoType: 12000 };

export default function Solo() {
  const router = useRouter();
  const { username } = useGame();
  const [screen, setScreen] = useState('menu'); // menu | game | over
  const [gameMode, setGameMode] = useState('reflex');
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestCombo, setBestCombo] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [timerPct, setTimerPct] = useState(100);
  const [answered, setAnswered] = useState(false);
  const [typeVal, setTypeVal] = useState('');
  const [shuffledOpts, setShuffledOpts] = useState([]);
  const [answerStates, setAnswerStates] = useState({});
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const speedTimesRef = useRef([]);

  useEffect(() => {
    if (!username) router.replace('/');
  }, [username]);

  function startGame(mode) {
    const qs = shuffle(QUESTIONS[mode]).slice(0, 10);
    setGameMode(mode);
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setStreak(0);
    setBestCombo(1);
    setCorrect(0);
    speedTimesRef.current = [];
    setScreen('game');
  }

  const q = questions[qIndex];

  useEffect(() => {
    if (screen !== 'game' || !q) return;
    setAnswered(false);
    setFeedback({ text: '', type: '' });
    setTypeVal('');
    setAnswerStates({});
    if (q.options) setShuffledOpts(shuffle(q.options));
    startTimeRef.current = Date.now();

    clearInterval(timerRef.current);
    const limit = TIME_LIMITS[gameMode];
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / limit) * 100);
      setTimerPct(pct);
      if (elapsed >= limit) {
        clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [qIndex, screen]);

  function getMult(s) {
    if (s >= 5) return 3;
    if (s >= 3) return 2;
    return 1;
  }

  function onCorrect(elapsed, newStreak) {
    const mult = getMult(newStreak);
    let pts = 100 * mult;
    if (elapsed < 500) pts += 100;
    else if (elapsed < 1000) pts += 50;
    setScore(s => s + pts);
    if (mult > bestCombo) setBestCombo(mult);
    setCorrect(c => c + 1);
    speedTimesRef.current.push(elapsed);
    setFeedback({ text: elapsed < 500 ? `PERFECT! +${pts}` : `CORRECT! +${pts}`, type: 'correct' });
  }

  function onWrong(correctAns) {
    setFeedback({ text: correctAns ? `WRONG! Answer: ${correctAns}` : 'TOO SLOW!', type: 'wrong' });
  }

  function next() {
    clearInterval(timerRef.current);
    setTimeout(() => {
      if (qIndex + 1 >= 10) { setScreen('over'); return; }
      setQIndex(i => i + 1);
    }, 900);
  }

  function handleMCQ(opt) {
    if (answered) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    if (opt === q.answer) {
      const ns = streak + 1;
      setStreak(ns);
      setAnswerStates({ [opt]: 'correct' });
      onCorrect(elapsed, ns);
    } else {
      setStreak(0);
      setAnswerStates({ [opt]: 'wrong', [q.answer]: 'correct' });
      onWrong(q.answer);
    }
    next();
  }

  function handleType() {
    if (answered || !typeVal.trim()) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    if (typeVal.trim().toUpperCase() === q.answer.toUpperCase()) {
      const ns = streak + 1;
      setStreak(ns);
      onCorrect(elapsed, ns);
    } else {
      setStreak(0);
      onWrong(q.answer);
    }
    next();
  }

  function handleTimeout() {
    if (answered) return;
    setAnswered(true);
    setStreak(0);
    onWrong(null);
    next();
  }

  const mult = getMult(streak);
  const timerColor = timerPct < 30 ? '#FF3B3B' : timerPct < 60 ? '#FFB800' : '#00FF9C';
  const avgSpeed = speedTimesRef.current.length
    ? (speedTimesRef.current.reduce((a,b)=>a+b,0) / speedTimesRef.current.length / 1000).toFixed(1)
    : '—';

  if (screen === 'menu') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.topTitle}>Solo Play</div>
        <div />
      </div>
      <div className={styles.modeList}>
        <button className={styles.modeBtn} onClick={() => startGame('reflex')}>
          <span>⚡</span>
          <div>
            <div className={styles.modeTitle}>Reflex Mode</div>
            <div className={styles.modeSub}>Math & trivia. 3s per question.</div>
          </div>
        </button>
        <button className={styles.modeBtn} onClick={() => startGame('rialoMcq')}>
          <span>🧠</span>
          <div>
            <div className={styles.modeTitle}>Rialo MCQ</div>
            <div className={styles.modeSub}>Web3 & Rialo knowledge. Tap fastest.</div>
          </div>
        </button>
        <button className={styles.modeBtn} onClick={() => startGame('rialoType')}>
          <span>⌨️</span>
          <div>
            <div className={styles.modeTitle}>Rialo Typing</div>
            <div className={styles.modeSub}>Unscramble crypto words. Type & submit.</div>
          </div>
        </button>
      </div>
    </div>
  );

  if (screen === 'over') return (
    <div className={styles.root}>
      <div className={styles.overWrap}>
        <div className={styles.overLabel}>GAME OVER</div>
        <div className={styles.overScore}>{score}</div>
        <div className={styles.overSub}>{gameMode === 'reflex' ? 'REFLEX MODE' : gameMode === 'rialoMcq' ? 'RIALO MCQ' : 'RIALO TYPING'}</div>
        <div className={styles.statsCard}>
          <div className={styles.stat}><span>Correct</span><span>{correct} / 10</span></div>
          <div className={styles.stat}><span>Best combo</span><span>x{bestCombo}</span></div>
          <div className={styles.stat}><span>Avg speed</span><span>{avgSpeed}s</span></div>
        </div>
        <button className={styles.playAgain} onClick={() => startGame(gameMode)}>Play Again</button>
        <button className={styles.homeBtn} onClick={() => setScreen('menu')}>Back to Menu</button>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.gameTopbar}>
        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>SCORE</div>
          <div className={styles.scoreVal}>{score}</div>
        </div>
        <div className={styles.qCount}>Q {qIndex + 1}/10</div>
        <div className={styles.comboBox}>
          <div className={styles.comboVal} style={{ color: mult >= 3 ? '#FF9C00' : mult >= 2 ? '#00FF9C' : '#555' }}>x{mult}</div>
          <div className={styles.comboLabel}>COMBO</div>
        </div>
      </div>

      <div className={styles.timerWrap}>
        <div className={styles.timerBg}>
          <div className={styles.timerFill} style={{ width: `${timerPct}%`, background: timerColor }} />
        </div>
      </div>

      <div className={styles.promptArea}>
        <div className={styles.promptTag}>{q?.tag}</div>
        <div className={styles.promptText}>{q?.word}</div>
        <div className={styles.promptSub}>{q?.prompt}</div>
        <div className={`${styles.feedback} ${feedback.type === 'correct' ? styles.feedCorrect : feedback.type === 'wrong' ? styles.feedWrong : ''}`}>
          {feedback.text}
        </div>
      </div>

      {gameMode !== 'rialoType' ? (
        <div className={styles.mcqGrid}>
          {shuffledOpts.map(opt => (
            <button
              key={opt}
              className={`${styles.optBtn} ${answerStates[opt] === 'correct' ? styles.optCorrect : answerStates[opt] === 'wrong' ? styles.optWrong : ''}`}
              onClick={() => handleMCQ(opt)}
              disabled={answered}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.typeArea}>
          <input
            className={styles.typeInput}
            value={typeVal}
            onChange={e => setTypeVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleType()}
            placeholder="TYPE ANSWER..."
            disabled={answered}
            autoFocus
          />
          <button className={styles.submitBtn} onClick={handleType} disabled={answered}>GO</button>
        </div>
      )}
    </div>
  );
}
