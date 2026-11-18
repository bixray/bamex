const express = require('express');
const db = require('../db');
const { sendNotifications, makeRef } = require('../mailer');
const router = express.Router();
const VALID = ['deals', 'goods', 'health', 'general'];

router.post('/', (req, res) => {
  const { name, email, phone, service, message, consent, website } = req.body || {};
  if (website) return res.status(200).json({ success: true, ref: 'BC-GEN-0000' });
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please provide a valid email.' });
  if (!service || !VALID.includes(service)) return res.status(400).json({ error: 'Please choose a service.' });
  if (service === 'health' && !consent) return res.status(400).json({ error: 'Consent is required for health enquiries.' });

  const info = db.prepare('INSERT INTO contacts (name, email, phone, service, message) VALUES (?, ?, ?, ?, ?)')
    .run(name.trim(), email.trim().toLowerCase(), phone?.trim() || null, service, message.trim());
  const contact = { id: info.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || null, service, message: message.trim() };
  sendNotifications(contact).catch(() => {});
  res.status(201).json({ success: true, id: contact.id, ref: makeRef(contact.service, contact.id) });
});
module.exports = router;
