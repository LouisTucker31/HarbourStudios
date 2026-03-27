'use strict';

require('dotenv').config();

const express     = require('express');
const { Resend }  = require('resend');
const path        = require('path');
const fs          = require('fs');
const cors        = require('cors');
const compression = require('compression');

const app     = express();
const PORT    = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Disable fingerprinting ────────────────────────────────────────────────────
app.disable('x-powered-by');
app.disable('etag');

// ── Gzip ─────────────────────────────────────────────────────────────────────
app.use(compression());

// ── Trust proxy (Railway) ─────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ── Request timeout — 30 s, protects against slowloris ───────────────────────
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(408).json({ success: false, error: 'Request timeout.' });
  });
  next();
});

// ── File paths ────────────────────────────────────────────────────────────────
const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');
if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');

// ── Rate limiting — 5 per IP per 15 min ──────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT   = 5;
const RATE_WINDOW  = 15 * 60 * 1000;

function rateLimit(req, res, next) {
  const ip     = req.ip || 'unknown';
  const now    = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, windowStart: now };
  if (now - record.windowStart > RATE_WINDOW) { record.count = 0; record.windowStart = now; }
  record.count++;
  rateLimitMap.set(ip, record);
  if (record.count > RATE_LIMIT) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, r] of rateLimitMap.entries()) {
    if (now - r.windowStart > RATE_WINDOW * 2) rateLimitMap.delete(ip);
  }
}, 60 * 60 * 1000).unref();

// ── Security headers ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options',    'nosniff');
  res.setHeader('X-Frame-Options',           'DENY');
  res.setHeader('X-XSS-Protection',          '1; mode=block');
  res.setHeader('Referrer-Policy',           'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',        'geolocation=(), microphone=(), camera=()');
  res.setHeader('Vary',                      'Accept-Encoding');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "frame-src https://www.google.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.harbourstudios.uk',
  'https://harbourstudios.uk',
  'https://harbourstudios-production.up.railway.app',
  ...(!IS_PROD ? ['http://localhost:3000'] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods:     ['GET', 'POST'],
  credentials: false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Static files ──────────────────────────────────────────────────────────────
const PUBLIC = path.join(__dirname, '..', 'public');

app.use(express.static(PUBLIC, {
  maxAge: '1y',
  etag:   false,
  lastModified: true,
  setHeaders: (res, filePath, stat) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (/\.(css|js)$/i.test(filePath)) {
      // CSS/JS use ?v= query param for cache busting — use long cache but NOT immutable
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (/\.(webp|jpg|jpeg|png|svg|woff2?)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// ── Clean URLs ────────────────────────────────────────────────────────────────
app.get('/services',                (_req, res) => res.redirect(301, '/'));
app.get('/work',                    (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'work.html')));
app.get('/about',                   (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'about.html')));
app.get('/contact',                 (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'contact.html')));
app.get('/privacy',                 (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'privacy.html')));
app.get('/cookie-policy',           (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'cookie-policy.html')));
app.get('/work/iron-forge-gym',     (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'iron-forge-gym',    'index.html')));
app.get('/work/trustflow-plumbing', (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'trustflow-plumbing','index.html')));
app.get('/work/velvet-room-salon',  (_req, res) => res.sendFile(path.join(PUBLIC, 'pages', 'velvet-room-salon', 'index.html')));

// ── Sanitisation ──────────────────────────────────────────────────────────────
function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
            .replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;').trim().slice(0, 2000);
}
function sanitiseEmail(str) {
  if (typeof str !== 'string') return '';
  const t = str.trim().toLowerCase().slice(0, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : '';
}
function sanitiseShort(str, max = 200) { return sanitise(str).slice(0, max); }

function saveSubmission(entry) {
  let list = [];
  try { list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); if (!Array.isArray(list)) list = []; } catch { list = []; }
  list.push(entry);
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function serviceLabel(v) {
  return { landing:'Landing Page', business:'Business Website', growth:'Growth Website', redesign:'Website Redesign', unsure:"Not sure yet, let's talk" }[v] || 'Not specified';
}
function budgetLabel(v) {
  return { under500:'Under £500', '500-1000':'£500 to £1,000', '1000-2000':'£1,000 to £2,000', '2000plus':'£2,000+', unsure:'Not sure' }[v] || 'Not specified';
}

// ── POST /api/contact ─────────────────────────────────────────────────────────
app.post('/api/contact', rateLimit, async (req, res) => {
  // Honeypot — bots fill hidden fields, humans don't
  if (req.body._hp && req.body._hp.length > 0) return res.status(200).json({ success: true });

  const firstName = sanitiseShort(req.body.firstName, 100);
  const lastName  = sanitiseShort(req.body.lastName,  100);
  const email     = sanitiseEmail(req.body.email);
  const business  = sanitiseShort(req.body.business,  200);
  const service   = sanitiseShort(req.body.service,    50);
  const budget    = sanitiseShort(req.body.budget,     50);
  const message   = sanitise(req.body.message);

  if (!firstName || !lastName || !email || !message)
    return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
  if (message.length < 10)
    return res.status(400).json({ success: false, error: 'Please write a message of at least 10 characters.' });

  const fullName    = `${firstName} ${lastName}`;
  const submittedAt = new Date().toISOString();
  const submitted   = new Date(submittedAt).toLocaleString('en-GB', { timeZone: 'Europe/London' });

  try { saveSubmission({ id: Date.now(), submittedAt, firstName, lastName, email, business, service: serviceLabel(service), budget: budgetLabel(budget), message }); }
  catch (err) { console.error('Could not save submission:', err.message); }

  const ownerHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e8e0d0;">
  <div style="background:#0d1b2a;padding:28px 36px;"><p style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#fff;margin:0;">Harbour Studios</p><p style="color:rgba(245,240,232,0.55);font-size:12px;margin:5px 0 0;">New enquiry received</p></div>
  <div style="background:#fff;padding:32px 36px;">
    <h2 style="font-family:Georgia,serif;color:#0d1b2a;font-size:18px;margin:0 0 22px;">New enquiry from <strong>${fullName}</strong></h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#3a3a3a;">
      <tr style="border-bottom:1px solid #f0ebe0;"><td style="padding:9px 0;color:#7a8a99;width:130px;">Name</td><td style="padding:9px 0;font-weight:500;">${fullName}</td></tr>
      <tr style="border-bottom:1px solid #f0ebe0;"><td style="padding:9px 0;color:#7a8a99;">Email</td><td style="padding:9px 0;">${email}</td></tr>
      <tr style="border-bottom:1px solid #f0ebe0;"><td style="padding:9px 0;color:#7a8a99;">Business</td><td style="padding:9px 0;">${business || 'Not provided'}</td></tr>
      <tr style="border-bottom:1px solid #f0ebe0;"><td style="padding:9px 0;color:#7a8a99;">Service</td><td style="padding:9px 0;">${serviceLabel(service)}</td></tr>
      <tr style="border-bottom:1px solid #f0ebe0;"><td style="padding:9px 0;color:#7a8a99;">Budget</td><td style="padding:9px 0;">${budgetLabel(budget)}</td></tr>
      <tr><td style="padding:9px 0;color:#7a8a99;">Submitted</td><td style="padding:9px 0;">${submitted}</td></tr>
    </table>
    <div style="margin-top:22px;"><p style="font-size:12px;color:#7a8a99;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Message</p>
    <div style="background:#f5f0e8;border-left:3px solid #c9a84c;padding:14px 18px;border-radius:0 6px 6px 0;font-size:14px;line-height:1.7;">${message.replace(/\n/g,'<br>')}</div></div>
    <div style="margin-top:26px;"><p style="font-size:14px;color:#3a3a3a;">Reply to: <strong>${email}</strong></p></div>
  </div>
  <div style="background:#07111c;padding:16px 36px;"><p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">Sent from the Harbour Studios contact form.</p></div>
</div>`;

  const confirmHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden;border:1px solid #e8e0d0;">
  <div style="background:#0d1b2a;padding:28px 36px;"><p style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#fff;margin:0;">Harbour Studios</p><p style="color:rgba(245,240,232,0.55);font-size:12px;margin:5px 0 0;">Enquiry Confirmation</p></div>
  <div style="background:#fff;padding:32px 36px;">
    <h2 style="font-family:Georgia,serif;color:#0d1b2a;font-size:18px;margin:0 0 14px;">Thanks, ${firstName}. We've got your message.</h2>
    <p style="color:#3a3a3a;font-size:15px;line-height:1.75;margin:0 0 22px;">We'll be in touch within <strong>24 hours</strong> with a clear, no-obligation quote.</p>
    <div style="background:#f5f0e8;border-radius:8px;padding:18px 22px;margin-bottom:24px;">
      <p style="font-size:12px;color:#7a8a99;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 10px;">Your enquiry summary</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:5px 0;color:#7a8a99;width:110px;">Service</td><td style="padding:5px 0;color:#0d1b2a;font-weight:500;">${serviceLabel(service)}</td></tr>
        <tr><td style="padding:5px 0;color:#7a8a99;">Budget</td><td style="padding:5px 0;color:#0d1b2a;">${budgetLabel(budget)}</td></tr>
        ${business ? `<tr><td style="padding:5px 0;color:#7a8a99;">Business</td><td style="padding:5px 0;color:#0d1b2a;">${business}</td></tr>` : ''}
      </table>
    </div>
  </div>
  <div style="background:#f5f0e8;padding:24px 36px;">
    <p style="font-size:12px;color:#7a8a99;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 14px;">What happens next</p>
    <table style="font-size:14px;color:#3a3a3a;width:100%;">
      <tr><td style="padding:5px 0;width:24px;color:#c9a84c;font-weight:700;">1.</td><td style="padding:5px 0;">We review your project details</td></tr>
      <tr><td style="padding:5px 0;color:#c9a84c;font-weight:700;">2.</td><td style="padding:5px 0;">We put together a clear, fixed-price proposal</td></tr>
      <tr><td style="padding:5px 0;color:#c9a84c;font-weight:700;">3.</td><td style="padding:5px 0;">We get back to you within 24 hours, no obligation</td></tr>
    </table>
  </div>
  <div style="background:#07111c;padding:16px 36px;"><p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0 0 3px;">Harbour Studios</p><p style="color:rgba(255,255,255,0.15);font-size:11px;margin:0;">You received this because you submitted an enquiry on our website.</p></div>
</div>`;

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ success: false, error: 'Email service not configured. Please contact us directly.' });
    }
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: 'Harbour Studios <hello@harbourstudios.uk>', to: 'hello@harbourstudios.uk', subject: `New enquiry from ${fullName}`, html: ownerHtml });
    await resend.emails.send({ from: 'Harbour Studios <hello@harbourstudios.uk>', to: email, subject: 'We have received your enquiry', html: confirmHtml });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send failed:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send your message. Please try again or contact us directly.' });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).sendFile(path.join(PUBLIC, '404.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  if (!IS_PROD) console.log(`Harbour Studios dev server → http://localhost:${PORT}`);
});
