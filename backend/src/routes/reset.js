const router = require('express').Router();
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const entriesResult = await client.query(
      'SELECT id, label, price, entry_date AS date FROM entries WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    const entries = entriesResult.rows;
    const total = entries.reduce((sum, e) => sum + Number(e.price), 0);

    if (entries.length > 0) {
      await client.query(
        'INSERT INTO history (user_id, total, entries_json) VALUES ($1, $2, $3)',
        [req.userId, total, JSON.stringify(entries)]
      );
    }
    await client.query('DELETE FROM entries WHERE user_id = $1', [req.userId]);
    // Housekeeping: drop history older than 7 days
    await client.query(
      "DELETE FROM history WHERE user_id = $1 AND reset_at < NOW() - INTERVAL '7 days'",
      [req.userId]
    );
    await client.query('COMMIT');
    res.json({ ok: true, total });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
