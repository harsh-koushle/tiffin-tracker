const router = require('express').Router();
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, label, price FROM buttons WHERE user_id = $1 ORDER BY position ASC, id ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Replaces the full set of price buttons for this user
router.put('/', async (req, res) => {
  const { buttons } = req.body || {};
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return res.status(400).json({ error: 'buttons must be a non-empty array' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM buttons WHERE user_id = $1', [req.userId]);
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      await client.query(
        'INSERT INTO buttons (user_id, label, price, position) VALUES ($1, $2, $3, $4)',
        [req.userId, String(b.label || `Option ${i + 1}`), Number(b.price) || 0, i]
      );
    }
    await client.query('COMMIT');
    const result = await client.query(
      'SELECT id, label, price FROM buttons WHERE user_id = $1 ORDER BY position ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
