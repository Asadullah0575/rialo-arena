require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createRoom, joinRoom, leaveRoom, startRound, submitAnswer, getLeaderboard, rooms } = require('./gameLogic');
const { getQuestionsForMode, getCategoryList, getTotalQuestions, getDailySeed } = require('./questions');
const { connectDB, upsertPlayer, getLeaderboard: getDBLeaderboard, saveDailyScore, getTodayLeaderboard } = require('./db');

const app = express();
const server = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: { origin: [CLIENT_URL, /\.vercel\.app$/], methods: ['GET', 'POST'] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Connect to MongoDB
connectDB();

// ─── REST API ─────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'ok', game: 'Rialo Arena v2', questions: getTotalQuestions() }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));
app.get('/categories', (req, res) => res.json(getCategoryList()));
app.get('/leaderboard', async (req, res) => {
  const { sort = 'score', limit = 100 } = req.query;
  const data = await getDBLeaderboard({ sort, limit: parseInt(limit) });
  res.json(data);
});
app.get('/leaderboard/today', async (req, res) => {
  const data = await getTodayLeaderboard();
  res.json(data);
});

// ─── Socket.io ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // Create room
  socket.on('room:create', ({ username, mode, categories = [], questionCount = 10, daily = false }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = createRoom(roomCode, socket.id, { mode, categories, questionCount, daily });
    joinRoom(roomCode, socket.id, username);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.username = username;
    socket.emit('room:created', { roomCode, mode, categories, questionCount, daily, players: getLeaderboard(room) });
  });

  // Join room
  socket.on('room:join', ({ roomCode, username }) => {
    const code = roomCode.toUpperCase().trim();
    const room = joinRoom(code, socket.id, username);
    if (!room) { socket.emit('room:error', { message: 'Room not found or game already started.' }); return; }
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.username = username;
    io.to(code).emit('room:updated', { players: getLeaderboard(room), hostId: room.hostId });
    socket.emit('room:joined', { roomCode: code, mode: room.mode, categories: room.categories, questionCount: room.questionCount, hostId: room.hostId });
  });

  // Start game
  socket.on('game:start', () => {
    const roomCode = socket.data.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.questions = getQuestionsForMode({
      mode: room.mode,
      categories: room.categories,
      count: room.mode === 'timeattack' ? 999 : room.questionCount,
      daily: room.daily,
    });
    room.currentQ = 0;
    room.state = 'countdown';

    // Time attack: 60 second timer
    if (room.mode === 'timeattack') {
      room.timeAttackEnd = Date.now() + 63000; // 3s countdown + 60s play
      io.to(roomCode).emit('timeattack:start', { duration: 60000, endsAt: room.timeAttackEnd });
    }

    io.to(roomCode).emit('game:countdown', { seconds: 3 });
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        startRound(io, roomCode);
      } else {
        io.to(roomCode).emit('game:countdown', { seconds: count });
      }
    }, 1000);
  });

  // Submit answer
  socket.on('answer:submit', ({ answer }) => {
    const roomCode = socket.data.roomCode;
    if (roomCode) submitAnswer(io, roomCode, socket.id, answer);
  });

  // Game over — save to DB
  socket.on('game:save', async ({ score, correct, answered, won, streak, mode, daily, date }) => {
    const username = socket.data.username;
    if (!username) return;
    await upsertPlayer(username, { scoreToAdd: score, correct, answered, won, streak });
    if (daily) await saveDailyScore(username, { date: date || getDailySeed(), score, correct, mode });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      const room = leaveRoom(roomCode, socket.id);
      if (room) io.to(roomCode).emit('room:updated', { players: getLeaderboard(room), hostId: room.hostId });
    }
    console.log(`[-] ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Rialo Arena v2 on port ${PORT} | ${getTotalQuestions()} questions loaded`));
