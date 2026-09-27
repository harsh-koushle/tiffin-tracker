require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pool = require('./db/pool');

const authRoutes = require('./routes/auth');
const buttonsRoutes = require('./routes/buttons');
const entriesRoutes = require('./routes/entries');
const resetRoutes = require('./routes/reset');
const historyRoutes = require('./routes/history');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/buttons', buttonsRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/reset', resetRoutes);
app.use('/api/history', historyRoutes);

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
}

const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Set it in your environment before deploying.');
}

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Tiffin Tracker API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
