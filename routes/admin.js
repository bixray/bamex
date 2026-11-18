const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

(function () {
  const c = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
  if (c === 0) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASS || 'admin123', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')
      .run(process.env.ADMIN_USER || 'bamexadmin', hash);
    console.log('✅ Admin seeded');
  }
})();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials.' });
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return res.status(401).json({ error: 'Invalid credentials.' });
  res.json({ token: jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '8h' }) });
});
router.get('/contacts', requireAuth, (req, res) => {
  const clauses = [], params = [];
  if (req.query.status) { clauses.push('status = ?'); params.push(req.query.status); }
  if (req.query.service) { clauses.push('service = ?'); params.push(req.query.service); }
  const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
  res.json(db.prepare(`SELECT * FROM contacts${where} ORDER BY created_at DESC`).all(...params));
});
router.patch('/contacts/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!['new', 'in_progress', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const r = db.prepare('UPDATE contacts SET status = ? WHERE id = ?').run(status, req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found.' });
  res.json({ success: true });
});
router.delete('/contacts/:id', requireAuth, (req, res) => {
  const r = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found.' });
  res.json({ success: true });
});
router.get('/stats', requireAuth, (req, res) => res.json({
  total: db.prepare('SELECT COUNT(*) AS c FROM contacts').get().c,
  new: db.prepare("SELECT COUNT(*) AS c FROM contacts WHERE status='new'").get().c,
  subscribers: db.prepare('SELECT COUNT(*) AS c FROM newsletter').get().c,
  byService: db.prepare('SELECT service, COUNT(*) AS c FROM contacts GROUP BY service').all(),
}));
module.exports = router;
