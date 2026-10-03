const { Pool } = require('pg');

// Hosted Postgres providers (Neon, Render, Supabase, etc.) require SSL from
// external connections. Only disable it for a plain local database.
const useSsl = !(process.env.DATABASE_URL || '').includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;