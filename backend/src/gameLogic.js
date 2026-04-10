const { getQuestionsForMode } = require('./questions');

const rooms = new Map();

function createRoom(roomCode, hostId, { mode, categories = [], questionCount = 10, daily = false }) {
  const room = {
    code: roomCode,
    hostId,
    mode,
    categories,
    questionCount,
    daily,
    players: new Map(),
    questions: [],
    currentQ: 0,
    state: 'waiting',
    roundStartTime: null,
    roundAnswers: new Map(),
    roundTimer: null,
    timeAttackTimer: null,
    timeAttackEnd: null,
  };
  rooms.set(roomCode, room);
  return room;
}

function joinRoom(roomCode, playerId, username) {
  const room = rooms.get(roomCode);
  if (!room || room.state !== 'waiting') return null;
  room.players.set(playerId, {
    id: playerId,
    username,
    score: 0,
    streak: 0,
    winStreak: 0,
    bestCombo: 1,
    answers: 0,
    correct: 0,
  });
  return room;
}

function leaveRoom(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  room.players.delete(playerId);
  if (room.players.size === 0) {
    clearTimeout(room.roundTimer);
    clearTimeout(room.timeAttackTimer);
    rooms.delete(roomCode);
    return null;
  }
  if (room.hostId === playerId) {
    room.hostId = room.players.keys().next().value;
  }
  return room;
}

function getLeaderboard(room) {
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

function calcPoints(elapsed, streak, mode) {
  const mult = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
  let pts = 100 * mult;
  // Time attack gives fewer base pts but faster bonuses
  if (mode === 'timeattack') {
    pts = 50 * mult;
    if (elapsed < 300) pts += 100;
    else if (elapsed < 600) pts += 50;
  } else {
    if (elapsed < 500) pts += 100;
    else if (elapsed < 1000) pts += 50;
  }
  return { pts, mult };
}

function getTimeLimit(mode) {
  const limits = {
    reflex: 3000,
    'rialo-mcq': 8000,
    'rialo-type': 12000,
    emoji: 15000,
    unscramble: 12000,
    timeattack: 5000,
    daily: 8000,
  };
  return limits[mode] || 8000;
}

function startRound(io, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Time attack: check if time is up
  if (room.mode === 'timeattack' && room.timeAttackEnd) {
    if (Date.now() >= room.timeAttackEnd) {
      endTimeAttack(io, roomCode);
      return;
    }
  }

  if (room.currentQ >= room.questions.length) {
    endGame(io, roomCode);
    return;
  }

  room.state = 'playing';
  room.roundAnswers.clear();
  room.roundStartTime = Date.now();

  const q = room.questions[room.currentQ];
  const timeLimit = getTimeLimit(room.mode);
  const { answer, ...qPublic } = q;

  io.to(roomCode).emit('round:start', {
    question: qPublic,
    qIndex: room.currentQ,
    total: room.questions.length,
    timeLimit,
    timeAttackRemaining: room.timeAttackEnd ? Math.max(0, room.timeAttackEnd - Date.now()) : null,
  });

  room.roundTimer = setTimeout(() => endRound(io, roomCode), timeLimit + 500);
}

function submitAnswer(io, roomCode, playerId, answer) {
  const room = rooms.get(roomCode);
  if (!room || room.state !== 'playing') return;
  if (room.roundAnswers.has(playerId)) return;

  const elapsed = Date.now() - room.roundStartTime;
  const q = room.questions[room.currentQ];
  const correct = answer.toString().toUpperCase().trim() === q.answer.toString().toUpperCase().trim();

  room.roundAnswers.set(playerId, { answer, correct, elapsed });

  const player = room.players.get(playerId);
  if (player) {
    player.answers++;
    if (correct) {
      player.correct++;
      player.streak++;
      const { pts, mult } = calcPoints(elapsed, player.streak, room.mode);
      player.score += pts;
      if (mult > player.bestCombo) player.bestCombo = mult;
      io.to(roomCode).emit('player:answered', {
        playerId, correct: true, pts, leaderboard: getLeaderboard(room),
      });
    } else {
      player.streak = 0;
      io.to(roomCode).emit('player:answered', {
        playerId, correct: false, pts: 0, leaderboard: getLeaderboard(room),
      });
    }
  }

  if (room.roundAnswers.size >= room.players.size) {
    clearTimeout(room.roundTimer);
    endRound(io, roomCode);
  }
}

function endRound(io, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.state = 'roundover';

  const q = room.questions[room.currentQ];
  io.to(roomCode).emit('round:end', {
    correctAnswer: q.answer,
    leaderboard: getLeaderboard(room),
    qIndex: room.currentQ,
  });

  room.currentQ++;

  // For time attack, shorter pause between questions
  const pause = room.mode === 'timeattack' ? 1500 : 3000;

  setTimeout(() => {
    if (room.mode === 'timeattack' && room.timeAttackEnd && Date.now() >= room.timeAttackEnd) {
      endTimeAttack(io, roomCode);
    } else {
      startRound(io, roomCode);
    }
  }, pause);
}

function endTimeAttack(io, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  endGame(io, roomCode);
}

function endGame(io, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  clearTimeout(room.roundTimer);
  clearTimeout(room.timeAttackTimer);
  room.state = 'results';

  const leaderboard = getLeaderboard(room);

  // Assign win streaks
  if (leaderboard.length > 0) {
    leaderboard[0].isWinner = true;
  }

  io.to(roomCode).emit('game:over', { leaderboard });
}

module.exports = { rooms, createRoom, joinRoom, leaveRoom, startRound, submitAnswer, getLeaderboard, getTimeLimit };
