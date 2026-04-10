const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  totalScore: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalAnswered: { type: Number, default: 0 },
  dailyScores: [{
    date: String,
    score: Number,
    correct: Number,
    mode: String,
  }],
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

PlayerSchema.index({ totalScore: -1 });
PlayerSchema.index({ currentStreak: -1 });
PlayerSchema.index({ gamesWon: -1 });

const Player = mongoose.model('Player', PlayerSchema);

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[DB] No MONGODB_URI set — leaderboard disabled');
    return false;
  }
  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected');
    return true;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    return false;
  }
}

async function upsertPlayer(username, { scoreToAdd = 0, correct = 0, answered = 0, won = false, streak = 0 } = {}) {
  try {
    const player = await Player.findOneAndUpdate(
      { username },
      {
        $inc: { totalScore: scoreToAdd, gamesPlayed: 1, totalCorrect: correct, totalAnswered: answered, gamesWon: won ? 1 : 0 },
        $max: { bestStreak: streak },
        $set: { currentStreak: won ? streak : 0, lastSeen: new Date() },
      },
      { upsert: true, new: true }
    );
    return player;
  } catch (err) {
    console.error('[DB] upsertPlayer error:', err.message);
    return null;
  }
}

async function getLeaderboard({ limit = 100, sort = 'score' } = {}) {
  try {
    const sortMap = {
      score: { totalScore: -1 },
      streak: { bestStreak: -1 },
      wins: { gamesWon: -1 },
    };
    const players = await Player.find({})
      .sort(sortMap[sort] || sortMap.score)
      .limit(limit)
      .select('username totalScore gamesPlayed gamesWon currentStreak bestStreak totalCorrect totalAnswered lastSeen')
      .lean();
    return players.map((p, i) => ({ ...p, rank: i + 1 }));
  } catch (err) {
    console.error('[DB] getLeaderboard error:', err.message);
    return [];
  }
}

async function saveDailyScore(username, { date, score, correct, mode }) {
  try {
    await Player.findOneAndUpdate(
      { username },
      { $push: { dailyScores: { date, score, correct, mode } }, $set: { lastSeen: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[DB] saveDailyScore error:', err.message);
  }
}

async function getTodayLeaderboard() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const players = await Player.find({ 'dailyScores.date': today })
      .select('username dailyScores')
      .lean();
    return players
      .map(p => {
        const todayScore = p.dailyScores.filter(d => d.date === today).reduce((a, b) => a + b.score, 0);
        return { username: p.username, score: todayScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  } catch (err) {
    return [];
  }
}

module.exports = { connectDB, upsertPlayer, getLeaderboard, saveDailyScore, getTodayLeaderboard, Player };
