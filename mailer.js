const nodemailer = require('nodemailer');
let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && !process.env.SMTP_PASS.includes('your_gmail')) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  console.log('✉️  Mailer configured');
} else {
  console.log('✉️  Mailer disabled (no SMTP credentials)');
}

const SERVICE_LABEL = { deals: 'Deals', goods: 'Goods', health: 'Health Support', general: 'General Enquiry' };
function makeRef(service, id) {
  const prefix = { deals: 'DEAL', goods: 'GOOD', health: 'HLTH', general: 'GEN' }[service] || 'GEN';
  return `BC-${prefix}-${String(id).padStart(4, '0')}`;
}
async function sendNotifications(contact) {
  if (!transporter) return;
  const ref = makeRef(contact.service, contact.id);
  const label = SERVICE_LABEL[contact.service] || contact.service;
  await Promise.all([
    transporter.sendMail({
      from: `"Bamex Crue" <${process.env.SMTP_USER}>`, to: process.env.NOTIFY_EMAIL || process.env.COMPANY_EMAIL,
      replyTo: contact.email, subject: `[${ref}] New ${label} lead — ${contact.name}`,
      text: `Reference: ${ref}\nName: ${contact.name}\nEmail: ${contact.email}\nPhone: ${contact.phone || '—'}\nService: ${label}\n\nMessage:\n${contact.message}`,
    }).catch(err => console.error('Admin email failed:', err.message)),
    transporter.sendMail({
      from: `"Bamex Crue" <${process.env.SMTP_USER}>`, to: contact.email, replyTo: process.env.COMPANY_EMAIL,
      subject: `We received your message — ${ref}`,
      text: `Hi ${contact.name},\n\nThank you for contacting Bamex Crue. We've received your ${label.toLowerCase()} request and will respond shortly.\n\nYour reference number: ${ref}\nPlease quote it if you call or WhatsApp us at ${process.env.COMPANY_PHONE}.\n\nWhat you sent:\n${contact.message}\n\n— The Bamex Crue team\nWhatsApp: ${process.env.COMPANY_PHONE}\nEmail: ${process.env.COMPANY_EMAIL}`,
    }).catch(err => console.error('Customer email failed:', err.message)),
  ]);
}
module.exports = { sendNotifications, makeRef };
