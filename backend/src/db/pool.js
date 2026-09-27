const { Pool } = require('pg');

// Render's managed Postgres requires SSL from external connections.
// Locally (no DATABASE_URL set to a render.com host) SSL is disabled.
const useSsl = (process.env.DATABASE_URL || '').includes('render.com') || process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;
