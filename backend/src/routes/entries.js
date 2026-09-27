const router = require('express').Router();
const pool = require('../db/pool');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, label, price, entry_date AS date FROM entries WHERE user_id = $1 ORDER BY created_at ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { label, price, date } = req.body || {};
  if (!label || price === undefined || price === null) {
    return res.status(400).json({ error: 'label and price are required' });
  }
  const entryDate = date || new Date().toISOString().slice(0, 10);
  try {
    const result = await pool.query(
      'INSERT INTO entries (user_id, label, price, entry_date) VALUES ($1, $2, $3, $4) RETURNING id, label, price, entry_date AS date',
      [req.userId, label, Number(price), entryDate]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM entries WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
