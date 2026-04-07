require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createRoom, joinRoom, leaveRoom, startRound, submitAnswer, getLeaderboard, rooms } = require('./gameLogic');
const { getQuestionsForMode } = require('./questions');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'https://*.vercel.app'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', game: 'Rialo Arena' }));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

// ─── Socket.io ───────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // Create a room
  socket.on('room:create', ({ username, mode }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = createRoom(roomCode, socket.id, mode);
    joinRoom(roomCode, socket.id, username);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.username = username;

    socket.emit('room:created', {
      roomCode,
      mode,
      players: getLeaderboard(room),
    });
    console.log(`[Room] Created: ${roomCode} | Mode: ${mode} | Host: ${username}`);
  });

  // Join a room
  socket.on('room:join', ({ roomCode, username }) => {
    const code = roomCode.toUpperCase();
    const room = joinRoom(code, socket.id, username);
    if (!room) {
      socket.emit('room:error', { message: 'Room not found or game already started.' });
      return;
    }
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.username = username;

    io.to(code).emit('room:updated', {
      players: getLeaderboard(room),
      hostId: room.hostId,
    });
    socket.emit('room:joined', { roomCode: code, mode: room.mode, hostId: room.hostId });
    console.log(`[Room] ${username} joined ${code}`);
  });

  // Host starts game
  socket.on('game:start', () => {
    const roomCode = socket.data.roomCode;
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;

    room.questions = getQuestionsForMode(room.mode, 10);
    room.currentQ = 0;
    room.state = 'countdown';

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

  // Player submits answer
  socket.on('answer:submit', ({ answer }) => {
    const roomCode = socket.data.roomCode;
    if (roomCode) submitAnswer(io, roomCode, socket.id, answer);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (roomCode) {
      const room = leaveRoom(roomCode, socket.id);
      if (room) {
        io.to(roomCode).emit('room:updated', {
          players: getLeaderboard(room),
          hostId: room.hostId,
        });
      }
    }
    console.log(`[-] Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Rialo Arena server running on port ${PORT}`);
});
