/**
 * Test email script - run from backend folder
 * Usage: node test_email.cjs
 * 
 * Requires env vars:
 *   EMAIL_USER=your@gmail.com
 *   EMAIL_PASS=yourapppassword
 */

require('./api/loadEnv');

const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('Missing credentials. Set EMAIL_USER and EMAIL_PASS env vars.');
  console.log('Example: EMAIL_USER=you@gmail.com EMAIL_PASS=xxxx node test_email.cjs');
  process.exit(1);
}

console.log('=== Email Test Script ===');
console.log('EMAIL_USER:', EMAIL_USER);
console.log('EMAIL_PASS:', EMAIL_PASS ? '(set - ' + EMAIL_PASS.length + ' chars)' : '(missing)');
console.log('SMTP_HOST: smtp.gmail.com');
console.log('SMTP_PORT: 587');
console.log('');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  connectionTimeout: 10000,
  greetingTimeout: 8000,
  socketTimeout: 10000,
  family: 4 // IPv4 only
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ VERIFY FAILED:', err.message);
    console.error('Code:', err.code);
    console.error('Command:', err.command);
    process.exit(1);
  } else {
    console.log('✅ SMTP connection verified!');
    
    // Try sending a test email
    transporter.sendMail({
      from: EMAIL_USER,
      to: EMAIL_USER, // send to self
      subject: 'UniHive Email Test',
      text: 'This is a test email from UniHive backend.'
    }, (err, info) => {
      if (err) {
        console.error('❌ SEND FAILED:', err.message);
        console.error('Code:', err.code);
        console.error('Command:', err.command);
        console.error('ResponseCode:', err.responseCode);
        process.exit(1);
      } else {
        console.log('✅ EMAIL SENT! MessageId:', info.messageId);
        process.exit(0);
      }
    });
  }
});
