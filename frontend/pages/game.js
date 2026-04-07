import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import styles from '../styles/Game.module.css';

export default function Game() {
  const router = useRouter();
  const { username, mode } = useGame();
  const { socket } = useSocket();

  const [phase, setPhase] = useState('countdown'); // countdown | playing | roundover | gameover
  const [countdown, setCountdown] = useState(3);
  const [question, setQuestion] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [timeLimit, setTimeLimit] = useState(8000);
  const [timerPct, setTimerPct] = useState(100);
  const [answered, setAnswered] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [typeVal, setTypeVal] = useState('');
  const [shuffledOpts, setShuffledOpts] = useState([]);
  const [answerStates, setAnswerStates] = useState({});
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!username || !socket) { router.replace('/'); return; }

    socket.on('game:countdown', ({ seconds }) => {
      setPhase('countdown');
      setCountdown(seconds);
    });

    socket.on('round:start', ({ question, qIndex, total, timeLimit }) => {
      setPhase('playing');
      setQuestion(question);
      setQIndex(qIndex);
      setTotal(total);
      setTimeLimit(timeLimit);
      setAnswered(false);
      setFeedback({ text: '', type: '' });
      setTypeVal('');
      setAnswerStates({});
      setCorrectAnswer('');
      if (question.options) {
        setShuffledOpts(shuffle([...question.options]));
      }
      startTimeRef.current = Date.now();
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.max(0, 100 - (elapsed / timeLimit) * 100);
        setTimerPct(pct);
        if (elapsed >= timeLimit) clearInterval(timerRef.current);
      }, 80);
    });

    socket.on('player:answered', ({ playerId, correct, pts, leaderboard }) => {
      setLeaderboard(leaderboard);
      if (playerId === socket.id) {
        if (correct) {
          setMyScore(s => s + pts);
          setFeedback({ text: `CORRECT! +${pts}`, type: 'correct' });
          setAnswerStates(prev => {
            const opt = question?.options?.find(o => o === prev._selected);
            return opt ? { [opt]: 'correct' } : prev;
          });
        } else {
          setFeedback({ text: 'WRONG!', type: 'wrong' });
        }
      }
    });

    socket.on('round:end', ({ correctAnswer, leaderboard, qIndex }) => {
      clearInterval(timerRef.current);
      setPhase('roundover');
      setCorrectAnswer(correctAnswer);
      setLeaderboard(leaderboard);
      setAnswerStates(prev => ({
        ...prev,
        [correctAnswer]: 'correct',
      }));
    });

    socket.on('game:over', ({ leaderboard }) => {
      clearInterval(timerRef.current);
      setLeaderboard(leaderboard);
      setPhase('gameover');
    });

    return () => {
      clearInterval(timerRef.current);
      socket.off('game:countdown');
      socket.off('round:start');
      socket.off('player:answered');
      socket.off('round:end');
      socket.off('game:over');
    };
  }, [socket, question]);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function submitAnswer(answer) {
    if (answered || !socket) return;
    setAnswered(true);
    clearInterval(timerRef.current);
    setAnswerStates(prev => ({ ...prev, _selected: answer, [answer]: 'selected' }));
    socket.emit('answer:submit', { answer });
  }

  function handleMCQ(opt) {
    if (answered) return;
    submitAnswer(opt);
  }

  function handleType() {
    if (answered || !typeVal.trim()) return;
    submitAnswer(typeVal.trim());
  }

  const timerColor = timerPct < 30 ? '#FF3B3B' : timerPct < 60 ? '#FFB800' : '#00FF9C';
  const myRank = leaderboard.findIndex(p => p.id === socket?.id) + 1;

  if (phase === 'countdown') return (
    <div className={styles.centerScreen}>
      <div className={styles.cdLabel}>GET READY</div>
      <div className={styles.cdNum}>{countdown}</div>
    </div>
  );

  if (phase === 'gameover') return (
    <div className={styles.root}>
      <div className={styles.overTitle}>GAME OVER</div>
      <div className={styles.lbList}>
        {leaderboard.map((p, i) => (
          <div key={p.id} className={`${styles.lbRow} ${p.id === socket?.id ? styles.lbMe : ''}`}>
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
        <div className={styles.qCount}>Q {qIndex + 1}/{total}</div>
        <div className={styles.rankBox}>
          <div className={styles.rankVal}>#{myRank || '—'}</div>
          <div className={styles.rankLabel}>RANK</div>
        </div>
      </div>

      <div className={styles.timerWrap}>
        <div className={styles.timerBg}>
          <div className={styles.timerFill} style={{ width: `${timerPct}%`, background: timerColor }} />
        </div>
      </div>

      {/* Live leaderboard strip */}
      <div className={styles.lbStrip}>
        {leaderboard.slice(0, 4).map((p, i) => (
          <div key={p.id} className={`${styles.lbPill} ${p.id === socket?.id ? styles.lbPillMe : ''}`}>
            #{i+1} {p.username.slice(0, 6)} · {p.score}
          </div>
        ))}
      </div>

      <div className={styles.promptArea}>
        <div className={styles.promptTag}>{question?.tag}</div>
        <div className={styles.promptText}>{question?.word}</div>
        <div className={styles.promptSub}>{question?.prompt}</div>
        {correctAnswer && phase === 'roundover' && (
          <div className={styles.correctReveal}>Answer: {correctAnswer}</div>
        )}
        <div className={`${styles.feedback} ${feedback.type === 'correct' ? styles.feedCorrect : feedback.type === 'wrong' ? styles.feedWrong : ''}`}>
          {feedback.text}
        </div>
      </div>

      {question?.options ? (
        <div className={styles.mcqGrid}>
          {shuffledOpts.map(opt => (
            <button
              key={opt}
              className={`${styles.optBtn}
                ${answerStates[opt] === 'correct' ? styles.optCorrect : ''}
                ${answerStates[opt] === 'wrong' ? styles.optWrong : ''}
                ${answerStates[opt] === 'selected' ? styles.optSelected : ''}
              `}
              onClick={() => handleMCQ(opt)}
              disabled={answered || phase === 'roundover'}
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
            disabled={answered || phase === 'roundover'}
            autoFocus
          />
          <button className={styles.submitBtn} onClick={handleType} disabled={answered || phase === 'roundover'}>GO</button>
        </div>
      )}
    </div>
  );
}
