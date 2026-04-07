const { getQuestionsForMode } = require('./questions');

const rooms = new Map();

function createRoom(roomCode, hostId, mode) {
  const room = {
    code: roomCode,
    hostId,
    mode,
    players: new Map(),
    questions: [],
    currentQ: 0,
    state: 'waiting', // waiting | countdown | playing | results
    roundStartTime: null,
    roundAnswers: new Map(),
    roundTimer: null,
  };
  rooms.set(roomCode, room);
  return room;
}

function joinRoom(roomCode, playerId, username) {
  const room = rooms.get(roomCode);
  if (!room) return null;
  room.players.set(playerId, {
    id: playerId,
    username,
    score: 0,
    streak: 0,
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

function calcPoints(elapsed, streak) {
  const mult = streak >= 5 ? 3 : streak >= 3 ? 2 : 1;
  let pts = 100 * mult;
  if (elapsed < 500) pts += 100;
  else if (elapsed < 1000) pts += 50;
  return { pts, mult };
}

function startRound(io, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.currentQ >= room.questions.length) {
    room.state = 'results';
    io.to(roomCode).emit('game:over', { leaderboard: getLeaderboard(room) });
    return;
  }

  room.state = 'playing';
  room.roundAnswers.clear();
  room.roundStartTime = Date.now();

  const q = room.questions[room.currentQ];
  const timeLimit = room.mode === 'reflex' ? 3000 : room.mode === 'rialo-mcq' ? 8000 : 12000;

  // Strip answer before sending to clients
  const { answer, ...qPublic } = q;
  io.to(roomCode).emit('round:start', {
    question: qPublic,
    qIndex: room.currentQ,
    total: room.questions.length,
    timeLimit,
  });

  room.roundTimer = setTimeout(() => {
    endRound(io, roomCode);
  }, timeLimit + 500);
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
      const { pts, mult } = calcPoints(elapsed, player.streak);
      player.score += pts;
      if (mult > player.bestCombo) player.bestCombo = mult;
      io.to(roomCode).emit('player:answered', {
        playerId,
        correct: true,
        pts,
        leaderboard: getLeaderboard(room),
      });
    } else {
      player.streak = 0;
      io.to(roomCode).emit('player:answered', {
        playerId,
        correct: false,
        pts: 0,
        leaderboard: getLeaderboard(room),
      });
    }
  }

  // End round early if all players answered
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

  // Next round after 3s pause
  setTimeout(() => {
    startRound(io, roomCode);
  }, 3000);
}

module.exports = { rooms, createRoom, joinRoom, leaveRoom, startRound, submitAnswer, getLeaderboard };
