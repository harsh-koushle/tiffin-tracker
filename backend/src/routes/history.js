const router = require('express').Router();
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM history WHERE user_id = $1 AND reset_at < NOW() - INTERVAL '7 days'",
      [req.userId]
    );
    const result = await pool.query(
      'SELECT id, total, entries_json AS entries, reset_at FROM history WHERE user_id = $1 ORDER BY reset_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
