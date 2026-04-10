import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import Confetti from '../components/Confetti';
import styles from '../styles/Game.module.css';

export default function Game() {
  const router = useRouter();
  const { username } = useGame();
  const { socket } = useSocket();
  const [phase, setPhase] = useState('countdown');
  const [countdown, setCountdown] = useState(3);
  const [question, setQuestion] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [timeLimit, setTimeLimit] = useState(8000);
  const [timerPct, setTimerPct] = useState(100);
  const [answered, setAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [feedback, setFeedback] = useState({ text:'', type:'' });
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [typeVal, setTypeVal] = useState('');
  const [shuffledOpts, setShuffledOpts] = useState([]);
  const [answerStates, setAnswerStates] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeWord, setShakeWord] = useState(false);
  const [timeAttackLeft, setTimeAttackLeft] = useState(null);
  const timerRef = useRef(null);
  const taTimerRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!username || !socket) { router.replace('/'); return; }

    socket.on('game:countdown', ({ seconds }) => {
      setPhase('countdown'); setCountdown(seconds);
    });

    socket.on('timeattack:start', ({ duration, endsAt }) => {
      setTimeAttackLeft(60);
      taTimerRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        setTimeAttackLeft(left);
        if (left <= 0) clearInterval(taTimerRef.current);
      }, 500);
    });

    socket.on('round:start', ({ question, qIndex, total, timeLimit }) => {
      setPhase('playing');
      setQuestion(question); setQIndex(qIndex); setTotal(total); setTimeLimit(timeLimit);
      setAnswered(false); setFeedback({ text:'', type:'' });
      setTypeVal(''); setAnswerStates({}); setCorrectAnswer(''); setShakeWord(false);
      if (question.options) setShuffledOpts(shuffle([...question.options]));
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      setTimerPct(100);
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setTimerPct(Math.max(0, 100 - (elapsed / timeLimit) * 100));
        if (elapsed >= timeLimit) clearInterval(timerRef.current);
      }, 80);
    });

    socket.on('player:answered', ({ playerId, correct, pts, leaderboard }) => {
      setLeaderboard(leaderboard);
      if (playerId === socket.id) {
        if (correct) {
          setMyScore(s => s + pts);
          setFeedback({ text:`✓ +${pts}`, type:'correct' });
        } else {
          setShakeWord(true);
          setFeedback({ text:'✗ WRONG!', type:'wrong' });
        }
      }
    });

    socket.on('round:end', ({ correctAnswer, leaderboard }) => {
      clearInterval(timerRef.current);
      setPhase('roundover'); setCorrectAnswer(correctAnswer);
      setLeaderboard(leaderboard);
    });

    socket.on('game:over', ({ leaderboard }) => {
      clearInterval(timerRef.current);
      clearInterval(taTimerRef.current);
      setLeaderboard(leaderboard);
      setPhase('gameover');
      const winner = leaderboard[0];
      if (winner?.username === username) setShowConfetti(true);
      // Save to DB
      const myData = leaderboard.find(p => p.id === socket.id);
      if (myData) {
        socket.emit('game:save', {
          score: myData.score,
          correct: myData.correct,
          answered: myData.answers,
          won: leaderboard[0]?.id === socket.id,
          streak: myData.bestCombo,
        });
      }
    });

    return () => {
      clearInterval(timerRef.current);
      clearInterval(taTimerRef.current);
      socket.off('game:countdown'); socket.off('round:start');
      socket.off('player:answered'); socket.off('round:end');
      socket.off('game:over'); socket.off('timeattack:start');
    };
  }, [socket]);

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function submitAnswer(answer) {
    if (answered || !socket) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    socket.emit('answer:submit', { answer });
  }

  const timerColor = timerPct < 30 ? '#FF3B3B' : timerPct < 60 ? '#FFB800' : '#00FF9C';
  const myRank = leaderboard.findIndex(p => p.id === socket?.id) + 1;
  const isType = !question?.options;

  if (phase === 'countdown') return (
    <div className={styles.centerScreen}>
      <div className={styles.cdLabel}>GET READY</div>
      <div className={styles.cdNum} key={countdown}>{countdown}</div>
    </div>
  );

  if (phase === 'gameover') return (
    <div className={styles.root}>
      <Confetti trigger={showConfetti} />
      <div className={styles.overTitle}>
        {leaderboard[0]?.username === username ? '🏆 YOU WON!' : 'GAME OVER'}
      </div>
      <div className={styles.lbList}>
        {leaderboard.map((p, i) => (
          <div key={p.id} className={`${styles.lbRow} ${p.id === socket?.id ? styles.lbMe : ''} ${i === 0 ? styles.lbFirst : ''}`}>
            <div className={styles.lbRank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</div>
            <div className={styles.lbName}>{p.username} {p.id === socket?.id ? '(you)' : ''}</div>
            <div className={styles.lbScore}>{p.score}</div>
          </div>
        ))}
      </div>
      <div className={styles.overActions}>
        <button className={styles.primaryBtn} onClick={() => router.push('/lobby')}>Play Again</button>
        <button className={styles.secondaryBtn} onClick={() => router.push('/')}>Home</button>
      </div>
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <div className={styles.scoreBox}>
          <div className={styles.scoreLabel}>SCORE</div>
          <div className={styles.scoreVal}>{myScore}</div>
        </div>
        <div style={{ textAlign:'center' }}>
          {timeAttackLeft !== null ? (
            <>
              <div className={styles.taTimer} style={{ color: timeAttackLeft <= 10 ? '#FF3B3B' : '#00FF9C' }}>
                {timeAttackLeft}s
              </div>
              <div className={styles.taLabel}>LEFT</div>
            </>
          ) : (
            <div className={styles.qCount}>Q {qIndex + 1}/{total}</div>
          )}
        </div>
        <div className={styles.rankBox}>
          <div className={styles.rankVal}>#{myRank || '—'}</div>
          <div className={styles.rankLabel}>RANK</div>
        </div>
      </div>

      <div className={styles.timerWrap}>
        <div className={styles.timerBg}>
          <div className={styles.timerFill} style={{ width:`${timerPct}%`, background:timerColor }} />
        </div>
      </div>

      {/* Live leaderboard strip */}
      <div className={styles.lbStrip}>
        {leaderboard.slice(0, 4).map((p, i) => (
          <div key={p.id} className={`${styles.lbPill} ${p.id === socket?.id ? styles.lbPillMe : ''}`}>
            #{i+1} {p.username.slice(0,6)} · {p.score}
          </div>
        ))}
      </div>

      <div className={styles.promptArea}>
        <div className={styles.promptTag}>{question?.tag}</div>
        <div className={`${styles.promptText} ${shakeWord ? 'animate-shake' : ''}`}>{question?.word}</div>
        <div className={styles.promptSub}>{question?.prompt}</div>
        {correctAnswer && phase === 'roundover' && (
          <div className={styles.correctReveal}>Answer: {correctAnswer}</div>
        )}
        <div className={`${styles.feedback} ${feedback.type === 'correct' ? styles.feedCorrect : feedback.type === 'wrong' ? styles.feedWrong : ''}`}>
          {feedback.text}
        </div>
      </div>

      {!isType ? (
        <div className={styles.mcqGrid}>
          {shuffledOpts.map(opt => (
            <button key={opt}
              className={`${styles.optBtn}
                ${answerStates[opt] === 'correct' || (phase === 'roundover' && opt === correctAnswer) ? styles.optCorrect : ''}
                ${answerStates[opt] === 'wrong' ? styles.optWrong : ''}
              `}
              onClick={() => submitAnswer(opt)}
              disabled={answered || phase === 'roundover'}>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.typeArea}>
          <input className={styles.typeInput} value={typeVal}
            onChange={e => setTypeVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitAnswer(typeVal.trim())}
            placeholder="TYPE ANSWER..."
            disabled={answered || phase === 'roundover'} autoFocus />
          <button className={styles.submitBtn}
            onClick={() => submitAnswer(typeVal.trim())}
            disabled={answered || phase === 'roundover'}>GO</button>
        </div>
      )}
    </div>
  );
}
