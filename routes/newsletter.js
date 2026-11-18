const express = require('express');
const db = require('../db');
const router = express.Router();
router.post('/', (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email required.' });
  try {
    db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email.trim().toLowerCase());
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(200).json({ success: true, message: 'Already subscribed.' });
    console.error(err); res.status(500).json({ error: 'Server error.' });
  }
});
module.exports = router;
