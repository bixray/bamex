require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const contactRouter = require('./routes/contact');
const newsletterRouter = require('./routes/newsletter');
const adminRouter = require('./routes/admin');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '50kb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.get('/api/health', (_, res) => res.json({ ok: true, service: 'bamex-crue' }));
app.use('/api/contact', limiter, contactRouter);
app.use('/api/newsletter', limiter, newsletterRouter);
app.use('/api/admin', adminRouter);
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Bamex Crue running on http://localhost:${PORT}`));
