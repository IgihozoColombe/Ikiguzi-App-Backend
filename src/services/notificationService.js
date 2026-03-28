const nodemailer = require('nodemailer')

async function sendEmail({ to, subject, text }) {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM || user || 'no-reply@ikiguzi.local'

  if (!host || !user || !pass) {
    // eslint-disable-next-line no-console
    console.log('[Email simulated]', { to, subject, text })
    return { simulated: true }
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  })
  return { simulated: false }
}

async function sendSMS({ to, text }) {
  const provider = process.env.SMS_PROVIDER || 'console'
  if (provider !== 'console') {
    // Later: integrate Twilio / Africa's Talking etc.
    // eslint-disable-next-line no-console
    console.log('[SMS provider not implemented; simulate]', { to, text })
    return { simulated: true }
  }

  // eslint-disable-next-line no-console
  console.log('[SMS simulated]', { to, text })
  return { simulated: true }
}

module.exports = { sendEmail, sendSMS }

