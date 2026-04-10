import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import Confetti from '../components/Confetti';
import styles from '../styles/Solo.module.css';

const ALL_Q = {
  math:[
    {tag:'MATH',prompt:'7 × 8 = ?',word:'7 × 8',options:['54','56','58','64'],answer:'56'},
    {tag:'MATH',prompt:'9 × 7 = ?',word:'9 × 7',options:['54','63','72','81'],answer:'63'},
    {tag:'MATH',prompt:'12 × 12 = ?',word:'12²',options:['124','144','132','148'],answer:'144'},
    {tag:'MATH',prompt:'8 × 8 = ?',word:'8 × 8',options:['56','62','64','66'],answer:'64'},
    {tag:'MATH',prompt:'6 × 7 = ?',word:'6 × 7',options:['36','40','42','48'],answer:'42'},
    {tag:'MATH',prompt:'√144 = ?',word:'√144',options:['11','12','13','14'],answer:'12'},
    {tag:'MATH',prompt:'9 × 9 = ?',word:'9 × 9',options:['72','81','90','99'],answer:'81'},
    {tag:'MATH',prompt:'2¹⁰ = ?',word:'2¹⁰',options:['512','1024','2048','256'],answer:'1024'},
    {tag:'MATH',prompt:'△ has how many degrees?',word:'△°',options:['90','120','180','360'],answer:'180'},
    {tag:'MATH',prompt:'Area of 8×6 rectangle?',word:'8×6',options:['28','36','40','48'],answer:'48'},
    {tag:'MATH',prompt:'50% of 90 = ?',word:'50%×90',options:['40','45','50','55'],answer:'45'},
    {tag:'MATH',prompt:'100 ÷ 4 = ?',word:'100÷4',options:['20','25','30','40'],answer:'25'},
    {tag:'MATH',prompt:'7² = ?',word:'7²',options:['42','49','56','63'],answer:'49'},
    {tag:'MATH',prompt:'5! = ?',word:'5!',options:['60','100','120','150'],answer:'120'},
    {tag:'MATH',prompt:'3/4 of 200 = ?',word:'¾×200',options:['100','125','150','175'],answer:'150'},
  ],
  rialo:[
    {tag:'RIALO',prompt:'What is Rialo?',word:'Rialo',options:['A DeFi protocol','A competitive gaming platform','An NFT marketplace','A blockchain'],answer:'A competitive gaming platform'},
    {tag:'WEB3',prompt:'What does NFT stand for?',word:'NFT',options:['Non-Fungible Token','New Finance Tech','Net Fund Token','Network File Transfer'],answer:'Non-Fungible Token'},
    {tag:'WEB3',prompt:'What does DeFi stand for?',word:'DeFi',options:['Decentralized Finance','Digital Finance','Distributed Fiat','Deferred Financing'],answer:'Decentralized Finance'},
    {tag:'WEB3',prompt:'Ethereum consensus?',word:'Ethereum',options:['Proof of Work','Proof of Stake','Delegated PoS','PoA'],answer:'Proof of Stake'},
    {tag:'WEB3',prompt:'What does WAGMI mean?',word:'WAGMI',options:['We Are Getting More Inu','We All Gonna Make It','Web3 Arena Game Mode','Wait And Get More Info'],answer:'We All Gonna Make It'},
    {tag:'WEB3',prompt:'What is staking?',word:'Staking',options:['Selling tokens','Locking tokens to earn rewards','Mining blocks','Burning tokens'],answer:'Locking tokens to earn rewards'},
    {tag:'WEB3',prompt:'What does HODL mean?',word:'HODL',options:['Hold On for Dear Life','High Order Digital Ledger','Hold or Drop Later','High Output Digital Layer'],answer:'Hold On for Dear Life'},
    {tag:'WEB3',prompt:'What is a DEX?',word:'DEX',options:['Digital Exchange','Decentralized Exchange','Derivative Exchange','Data Exchange'],answer:'Decentralized Exchange'},
    {tag:'WEB3',prompt:'What is TVL?',word:'TVL',options:['Total Value Locked','Token Volume Ledger','Trade Verification Layer','Total Vault Liquidity'],answer:'Total Value Locked'},
    {tag:'WEB3',prompt:'What is a DAO?',word:'DAO',options:['Digital Asset Organization','Decentralized Autonomous Organization','Data Access Object','Distributed App Operation'],answer:'Decentralized Autonomous Organization'},
    {tag:'WEB3',prompt:'What is FUD?',word:'FUD',options:['Fear Uncertainty Doubt','Fast Utility Demand','Full User Data','Fund Utility Distribution'],answer:'Fear Uncertainty Doubt'},
    {tag:'WEB3',prompt:'What is yield farming?',word:'Yield farming',options:['Mining crypto','Earning rewards by providing liquidity','Staking only','Trading bots'],answer:'Earning rewards by providing liquidity'},
    {tag:'WEB3',prompt:'What does P2E mean?',word:'P2E',options:['Play to Earn','Pay to Enter','Proof to Execute','Protocol to Ecosystem'],answer:'Play to Earn'},
    {tag:'WEB3',prompt:'What is a token bridge?',word:'Bridge',options:['A DEX','Transfer tokens between blockchains','A staking pool','An NFT standard'],answer:'Transfer tokens between blockchains'},
    {tag:'WEB3',prompt:'What is minting?',word:'Minting',options:['Selling an NFT','Creating an NFT on-chain','Staking an NFT','Burning an NFT'],answer:'Creating an NFT on-chain'},
  ],
  science:[
    {tag:'SCIENCE',prompt:'Chemical symbol for water?',word:'Water',options:['HO','H2O','H3O','OH2'],answer:'H2O'},
    {tag:'SCIENCE',prompt:'Powerhouse of the cell?',word:'Cell power',options:['Nucleus','Ribosome','Mitochondria','Vacuole'],answer:'Mitochondria'},
    {tag:'SCIENCE',prompt:'Largest planet?',word:'Largest planet',options:['Saturn','Neptune','Jupiter','Uranus'],answer:'Jupiter'},
    {tag:'SCIENCE',prompt:'Symbol for gold?',word:'Gold symbol',options:['Go','Gd','Au','Ag'],answer:'Au'},
    {tag:'SCIENCE',prompt:'pH of pure water?',word:'Water pH',options:['5','6','7','8'],answer:'7'},
    {tag:'SCIENCE',prompt:'Most common gas in air?',word:'Air is mostly',options:['Oxygen','CO2','Nitrogen','Argon'],answer:'Nitrogen'},
    {tag:'SCIENCE',prompt:'Symbol for iron?',word:'Iron symbol',options:['Ir','In','Fe','Fn'],answer:'Fe'},
    {tag:'SCIENCE',prompt:'Boiling point of water?',word:'Water boils',options:['90°C','95°C','100°C','105°C'],answer:'100°C'},
    {tag:'SCIENCE',prompt:'Hardest natural substance?',word:'Hardest',options:['Gold','Iron','Diamond','Quartz'],answer:'Diamond'},
    {tag:'SCIENCE',prompt:'Octopus hearts?',word:'Octopus hearts',options:['1','2','3','4'],answer:'3'},
  ],
  geography:[
    {tag:'GEO',prompt:'Capital of France?',word:'France 🇫🇷',options:['Lyon','Marseille','Paris','Bordeaux'],answer:'Paris'},
    {tag:'GEO',prompt:'Largest country?',word:'Largest country',options:['USA','Canada','China','Russia'],answer:'Russia'},
    {tag:'GEO',prompt:'Capital of Japan?',word:'Japan 🇯🇵',options:['Osaka','Kyoto','Hiroshima','Tokyo'],answer:'Tokyo'},
    {tag:'GEO',prompt:'Tallest mountain?',word:'Tallest peak',options:['K2','Kangchenjunga','Everest','Lhotse'],answer:'Everest'},
    {tag:'GEO',prompt:'Capital of Nigeria?',word:'Nigeria 🇳🇬',options:['Lagos','Kano','Ibadan','Abuja'],answer:'Abuja'},
    {tag:'GEO',prompt:'Largest ocean?',word:'Largest ocean',options:['Atlantic','Indian','Arctic','Pacific'],answer:'Pacific'},
    {tag:'GEO',prompt:'Capital of Australia?',word:'Australia 🇦🇺',options:['Sydney','Melbourne','Brisbane','Canberra'],answer:'Canberra'},
    {tag:'GEO',prompt:'Capital of Germany?',word:'Germany 🇩🇪',options:['Munich','Hamburg','Frankfurt','Berlin'],answer:'Berlin'},
    {tag:'GEO',prompt:'Smallest country?',word:'Smallest country',options:['Monaco','San Marino','Liechtenstein','Vatican City'],answer:'Vatican City'},
    {tag:'GEO',prompt:'Capital of Brazil?',word:'Brazil 🇧🇷',options:['São Paulo','Rio de Janeiro','Brasília','Salvador'],answer:'Brasília'},
  ],
  sports:[
    {tag:'SPORTS',prompt:'Players on a football team?',word:'Football team',options:['9','10','11','12'],answer:'11'},
    {tag:'SPORTS',prompt:'Olympic rings?',word:'Olympic rings',options:['4','5','6','7'],answer:'5'},
    {tag:'SPORTS',prompt:'Basketball team size?',word:'Basketball team',options:['4','5','6','7'],answer:'5'},
    {tag:'SPORTS',prompt:'Golf holes?',word:'Golf holes',options:['9','12','16','18'],answer:'18'},
    {tag:'SPORTS',prompt:'Points for touchdown?',word:'Touchdown',options:['4','5','6','7'],answer:'6'},
    {tag:'SPORTS',prompt:'Hat-trick means?',word:'Hat-trick',options:['2 goals','3 goals','4 goals','5 goals'],answer:'3 goals'},
    {tag:'SPORTS',prompt:'Highest bowling score?',word:'Bowling max',options:['250','275','300','325'],answer:'300'},
    {tag:'SPORTS',prompt:'Soccer match length?',word:'Soccer match',options:['80 min','85 min','90 min','95 min'],answer:'90 min'},
    {tag:'SPORTS',prompt:'Events in decathlon?',word:'Decathlon',options:['8','9','10','12'],answer:'10'},
    {tag:'SPORTS',prompt:'Usain Bolt known for?',word:'Usain Bolt',options:['Football','Swimming','Sprinting','Cycling'],answer:'Sprinting'},
  ],
  emojiMerge:[
    {tag:'EMOJI MERGE',prompt:'What do these represent?',word:'🌊 + 🏄',answer:'SURFING',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What place?',word:'🗼 + 🇫🇷',answer:'PARIS',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What concept?',word:'💰 + 🔗',answer:'BLOCKCHAIN',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What sport?',word:'⚽ + 👟',answer:'FOOTBALL',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What does this describe?',word:'🌧️ + 🌈',answer:'RAINBOW',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What technology?',word:'🤖 + 🧠',answer:'AI',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What drink?',word:'🍋 + 💧',answer:'LEMONADE',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What concept?',word:'💡 + 🧠',answer:'IDEA',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What animal?',word:'🦁 + 👑',answer:'LION',type:'type'},
    {tag:'EMOJI MERGE',prompt:'What holiday?',word:'🎃 + 👻',answer:'HALLOWEEN',type:'type'},
  ],
  unscramble:[
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'OLIARI',answer:'RIALO',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'KBCHINOLA',answer:'BLOCKCHAIN',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'TNOKE',answer:'TOKEN',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'TGNSAKI',answer:'STAKING',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'LATELW',answer:'WALLET',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'TNFM',answer:'MINT',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'PCYORT',answer:'CRYPTO',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'NETEHRMU',answer:'ETHEREUM',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'NBOCEKI',answer:'BITCOIN',type:'type'},
    {tag:'UNSCRAMBLE',prompt:'Unscramble:',word:'ADGTRNI',answer:'TRADING',type:'type'},
  ],
};

const CATEGORY_META = [
  { key:'math', label:'Math', icon:'🔢' },
  { key:'rialo', label:'Rialo & Web3', icon:'🎮' },
  { key:'science', label:'Science', icon:'🔬' },
  { key:'geography', label:'Geography', icon:'🌍' },
  { key:'sports', label:'Sports', icon:'⚽' },
  { key:'emojiMerge', label:'Emoji Merge', icon:'🧩' },
  { key:'unscramble', label:'Unscramble', icon:'⌨️' },
];

const Q_COUNTS = [5, 10, 15, 20];
const TIME_LIMITS = { mcq: 8000, type: 12000 };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Solo() {
  const router = useRouter();
  const { username } = useGame();
  const [screen, setScreen] = useState('menu');
  const [selectedCats, setSelectedCats] = useState(['math','rialo']);
  const [qCount, setQCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestCombo, setBestCombo] = useState(1);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState({ text:'', type:'' });
  const [timerPct, setTimerPct] = useState(100);
  const [answered, setAnswered] = useState(false);
  const [typeVal, setTypeVal] = useState('');
  const [shuffledOpts, setShuffledOpts] = useState([]);
  const [answerStates, setAnswerStates] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeWord, setShakeWord] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const speedTimesRef = useRef([]);

  useEffect(() => { if (!username) router.replace('/'); }, [username]);

  function toggleCat(key) {
    setSelectedCats(prev => prev.includes(key) ? (prev.length > 1 ? prev.filter(k => k !== key) : prev) : [...prev, key]);
  }

  function startGame() {
    let pool = [];
    selectedCats.forEach(cat => { if (ALL_Q[cat]) pool.push(...ALL_Q[cat]); });
    const qs = shuffle(pool).slice(0, qCount);
    setQuestions(qs);
    setQIndex(0); setScore(0); setStreak(0); setBestCombo(1);
    setCorrect(0); speedTimesRef.current = [];
    setScreen('game');
  }

  const q = questions[qIndex];
  const isType = q?.type === 'type';

  useEffect(() => {
    if (screen !== 'game' || !q) return;
    setAnswered(false); setFeedback({ text:'', type:'' });
    setTypeVal(''); setAnswerStates({}); setShakeWord(false);
    if (!isType) setShuffledOpts(shuffle([...q.options]));
    startTimeRef.current = Date.now();
    clearInterval(timerRef.current);
    const limit = isType ? TIME_LIMITS.type : TIME_LIMITS.mcq;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.max(0, 100 - (elapsed / limit) * 100);
      setTimerPct(pct);
      if (elapsed >= limit) { clearInterval(timerRef.current); handleTimeout(); }
    }, 80);
    return () => clearInterval(timerRef.current);
  }, [qIndex, screen]);

  function getMult(s) { return s >= 5 ? 3 : s >= 3 ? 2 : 1; }

  function onCorrect(elapsed, ns) {
    const mult = getMult(ns);
    let pts = 100 * mult;
    if (elapsed < 500) pts += 100;
    else if (elapsed < 1000) pts += 50;
    setScore(s => s + pts);
    if (mult > bestCombo) setBestCombo(mult);
    setCorrect(c => c + 1);
    speedTimesRef.current.push(elapsed);
    setFeedback({ text: elapsed < 500 ? `⚡ PERFECT! +${pts}` : `✓ +${pts}`, type:'correct' });
  }

  function onWrong(correctAns) {
    setShakeWord(true);
    setFeedback({ text: correctAns ? `✗ Answer: ${correctAns}` : '✗ WRONG!', type:'wrong' });
  }

  function next() {
    clearInterval(timerRef.current);
    setTimeout(() => {
      if (qIndex + 1 >= qCount) { endGame(); return; }
      setQIndex(i => i + 1);
    }, 800);
  }

  function endGame() {
    setScreen('over');
    setShowConfetti(true);
  }

  function handleMCQ(opt) {
    if (answered) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    const elapsed = Date.now() - startTimeRef.current;
    if (opt === q.answer) {
      const ns = streak + 1; setStreak(ns);
      setAnswerStates({ [opt]:'correct' });
      onCorrect(elapsed, ns);
    } else {
      setStreak(0);
      setAnswerStates({ [opt]:'wrong', [q.answer]:'correct' });
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
      const ns = streak + 1; setStreak(ns);
      onCorrect(elapsed, ns);
    } else {
      setStreak(0);
      onWrong(q.answer);
    }
    next();
  }

  function handleTimeout() {
    if (answered) return;
    setAnswered(true); setStreak(0);
    onWrong(null);
    setFeedback({ text:'⏰ TOO SLOW!', type:'wrong' });
    next();
  }

  const mult = getMult(streak);
  const timerColor = timerPct < 30 ? '#FF3B3B' : timerPct < 60 ? '#FFB800' : '#00FF9C';
  const avgSpeed = speedTimesRef.current.length
    ? (speedTimesRef.current.reduce((a,b) => a+b,0) / speedTimesRef.current.length / 1000).toFixed(1)
    : '—';

  if (screen === 'menu') return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.back} onClick={() => router.push('/')}>← Back</button>
        <div className={styles.topTitle}>Solo Play</div>
        <div />
      </div>
      <div className={styles.section}>
        <div className={styles.sLabel}>CATEGORIES (tap to toggle)</div>
        <div className={styles.catGrid}>
          {CATEGORY_META.map(c => (
            <button key={c.key}
              className={`${styles.catChip} ${selectedCats.includes(c.key) ? styles.catActive : ''}`}
              onClick={() => toggleCat(c.key)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <div className={styles.sLabel}>NUMBER OF QUESTIONS</div>
        <div className={styles.qBtns}>
          {Q_COUNTS.map(n => (
            <button key={n} className={`${styles.qBtn} ${qCount === n ? styles.qBtnActive : ''}`}
              onClick={() => setQCount(n)}>{n}</button>
          ))}
        </div>
      </div>
      <div className={styles.startWrap}>
        <button className={styles.startBtn} onClick={startGame}>
          Start {qCount} Questions →
        </button>
      </div>
    </div>
  );

  if (screen === 'over') return (
    <div className={styles.root}>
      <Confetti trigger={showConfetti} />
      <div className={styles.overWrap}>
        <div className={styles.overLabel}>GAME OVER</div>
        <div className={styles.overScore}>{score}</div>
        <div className={styles.overSub}>SOLO PLAY</div>
        <div className={styles.statsCard}>
          <div className={styles.stat}><span>Correct</span><span>{correct} / {qCount}</span></div>
          <div className={styles.stat}><span>Best combo</span><span>x{bestCombo}</span></div>
          <div className={styles.stat}><span>Avg speed</span><span>{avgSpeed}s</span></div>
        </div>
        <button className={styles.playAgain} onClick={startGame}>Play Again</button>
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
        <div className={styles.qCount}>Q {qIndex + 1}/{qCount}</div>
        <div className={styles.comboBox}>
          <div className={styles.comboVal} style={{ color: mult >= 3 ? '#FF9C00' : mult >= 2 ? '#00FF9C' : '#555' }}>x{mult}</div>
          <div className={styles.comboLabel}>COMBO</div>
        </div>
      </div>
      <div className={styles.timerWrap}>
        <div className={styles.timerBg}>
          <div className={styles.timerFill} style={{ width:`${timerPct}%`, background:timerColor }} />
        </div>
      </div>
      <div className={styles.promptArea}>
        <div className={styles.promptTag}>{q?.tag}</div>
        <div className={`${styles.promptText} ${shakeWord ? 'animate-shake' : ''}`}>{q?.word}</div>
        <div className={styles.promptSub}>{q?.prompt}</div>
        <div className={`${styles.feedback} ${feedback.type === 'correct' ? styles.feedCorrect : feedback.type === 'wrong' ? styles.feedWrong : ''}`}>
          {feedback.text}
        </div>
      </div>
      {!isType ? (
        <div className={styles.mcqGrid}>
          {shuffledOpts.map(opt => (
            <button key={opt}
              className={`${styles.optBtn} ${answerStates[opt] === 'correct' ? styles.optCorrect : answerStates[opt] === 'wrong' ? styles.optWrong : ''}`}
              onClick={() => handleMCQ(opt)} disabled={answered}>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.typeArea}>
          <input className={styles.typeInput} value={typeVal}
            onChange={e => setTypeVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleType()}
            placeholder="TYPE ANSWER..." disabled={answered} autoFocus />
          <button className={styles.submitBtn} onClick={handleType} disabled={answered}>GO</button>
        </div>
      )}
    </div>
  );
}
