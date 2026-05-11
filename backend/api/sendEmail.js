const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER || 'noreply@unihive.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'UniHive';
const EMAIL_SUPPORT = process.env.EMAIL_SUPPORT || EMAIL_FROM;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_TLS_REJECT_UNAUTHORIZED = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

const FROM_ADDRESS = (EMAIL_USER && EMAIL_FROM && EMAIL_FROM.toLowerCase() !== EMAIL_USER.toLowerCase())
    ? EMAIL_USER
    : EMAIL_FROM;

if (EMAIL_USER && EMAIL_FROM && EMAIL_FROM.toLowerCase() !== EMAIL_USER.toLowerCase()) {
    console.warn(`[EMAIL] WARNING: EMAIL_FROM (${EMAIL_FROM}) differs from EMAIL_USER (${EMAIL_USER}). Using EMAIL_USER as sender address to avoid SMTP rejection.`);
}

if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('[EMAIL] WARNING: EMAIL_USER or EMAIL_PASS is not configured. Email delivery will be disabled.');
} else {
    console.log('[EMAIL] Config loaded - USER:', EMAIL_USER, '| PASS length:', EMAIL_PASS.length);
}

const transportOptions = {
    service: 'Gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000
};

const transporter = nodemailer.createTransport(transportOptions);

transporter.verify()
    .then(() => {
        console.log('[EMAIL] SMTP transporter verified successfully');
    })
    .catch(error => {
        console.error('[EMAIL] SMTP transporter verification FAILED');
        console.error('[EMAIL] Error message:', error?.message || error);
        console.error('[EMAIL] Error code:', error?.code);
        console.error('[EMAIL] Error command:', error?.command);
        console.error('[EMAIL] Full error:', error);
    });

function buildHtmlEmail(title, intro, contentHtml, closing) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);">
          <tr>
            <td style="padding: 30px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; color: #1f2937;">${title}</h1>
              <p style="margin: 0 0 20px; color: #4b5563; line-height: 1.6;">${intro}</p>
              ${contentHtml}
              <p style="margin: 30px 0 0; color: #4b5563; line-height: 1.6;">${closing}</p>
            </td>
          </tr>
        </table>
        <p style="margin: 14px 0 0; color: #9ca3af; font-size: 12px;">UniHive • Student housing made simple.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendMail(options) {
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.log('[EMAIL] Email delivery skipped because credentials are not configured.');
        return false;
    }

    const mailOptions = {
        from: `"${EMAIL_FROM_NAME}" <${FROM_ADDRESS}>`,
        replyTo: EMAIL_SUPPORT,
        headers: {
            'X-Mailer': 'UniHive Mailer',
            'List-Unsubscribe': `<mailto:${EMAIL_SUPPORT}>`
        },
        ...options
    };

    // Retry loop for transient network errors on Render
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[EMAIL] Sent to ${options.to}. messageId=${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EMAIL] sendMail attempt ${attempt}/3 FAILED:`, error.message);
            if (attempt === 3) {
                console.error('[EMAIL] All retry attempts failed');
                return false;
            }
            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    return false;
}


/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(email, full_name, user_id) {
    const subject = 'Welcome to UniHive — Your Student Home Journey Starts Here';
    const text = `Hi ${full_name},\n\nWelcome to UniHive! Your account is now active and ready for bookings.\n\nAccount ID: ${user_id}\n\nIf you have any questions, reply to this email and our support team will help.\n\nBest regards,\nUniHive Team`;
    const html = buildHtmlEmail(
        'Welcome to UniHive!',
        `Hi ${full_name}, welcome aboard! Your UniHive account is set up and ready to use.`,
        `<div style="background: #eef2ff; border-left: 4px solid #6366f1; padding: 18px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1f2937;"><strong>Account ID:</strong> ${user_id}</p>
          </div>
          <p style="margin: 0 0 12px; color: #4b5563;">You can now search hostels, book rooms, and manage your accommodation from your UniHive dashboard.</p>
          <ul style="margin: 0 0 20px; padding-left: 18px; color: #4b5563;">
            <li>Browse verified hostels</li>
            <li>Reserve rooms quickly</li>
            <li>Track bookings and payments</li>
          </ul>`,
        'Need help? Simply reply to this email and a UniHive team member will assist you.'
    );

    return sendMail({ to: email, subject, text, html });
}

/**
 * Send booking confirmation email with auth code
 */
async function sendBookingEmail(email, full_name, booking_id, room_number, hostel_name, auth_code) {
    const subject = 'UniHive Booking Confirmed — Your Check-in Code is Ready';
    const text = `Hi ${full_name},\n\nYour UniHive booking has been confirmed.\n\nBooking ID: ${booking_id}\nHostel: ${hostel_name}\nRoom: ${room_number}\nCheck-in Code: ${auth_code}\n\nShow this code at check-in.\n\nBest,\nUniHive Team`;
    const html = buildHtmlEmail(
        'Booking Confirmed!',
        `Hi ${full_name}, your booking is confirmed. Keep this email for your check-in details.`,
        `<div style="background: #ecfdf5; border-left: 4px solid #22c55e; padding: 18px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px; color: #1f2937;"><strong>Booking ID:</strong> ${booking_id}</p>
            <p style="margin: 0 0 8px; color: #1f2937;"><strong>Hostel:</strong> ${hostel_name}</p>
            <p style="margin: 0; color: #1f2937;"><strong>Room:</strong> ${room_number}</p>
          </div>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px; color: #92400e; font-weight: 700; font-size: 18px;">Check-in Code</p>
            <p style="margin: 0; font-size: 28px; letter-spacing: 4px; color: #111; font-weight: 700;">${auth_code}</p>
          </div>
          <p style="margin: 0 0 12px; color: #4b5563;">Please present this code at the hostel reception when you arrive.</p>`,
        'Reply to this email if you need help with your booking or check-in.'
    );

    return sendMail({ to: email, subject, text, html });
}

/**
 * Send OTP Verification email
 */
async function sendOtpEmail(email, full_name, otp_code) {
    const subject = 'UniHive Verification Code';
    const text = `Hi ${full_name},\n\nYour verification code is ${otp_code}. It expires in 15 minutes.\n\nIf you did not request this, please ignore this message.\n\nBest,\nUniHive Team`;
    const html = buildHtmlEmail(
        'Verify Your Email Address',
        `Hi ${full_name}, use the code below to verify your email and continue registration.`,
        `<div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 10px; color: #1f2937; font-size: 16px;">Your verification code</p>
            <p style="margin: 0; color: #111; font-size: 40px; letter-spacing: 8px; font-weight: 700;">${otp_code}</p>
          </div>`,
        'The code expires in 15 minutes. If you did not request this, no action is required.'
    );

    return sendMail({ to: email, subject, text, html });
}

/**
 * Send Password Reset Verification email
 */
async function sendPasswordResetEmail(email, full_name, reset_code) {
    const subject = 'UniHive Password Reset Code';
    const text = `Hi ${full_name},\n\nYour password reset code is ${reset_code}. It expires in 15 minutes.\n\nIf you did not request this, ignore this message.\n\nBest,\nUniHive Team`;
    const html = buildHtmlEmail(
        'Reset Your UniHive Password',
        `Hi ${full_name}, a password reset was requested for your UniHive account.`,
        `<div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0 0 10px; color: #1f2937; font-size: 16px;">Your reset code</p>
            <p style="margin: 0; color: #111; font-size: 40px; letter-spacing: 8px; font-weight: 700;">${reset_code}</p>
          </div>`,
        'If you did not request this password reset, please ignore this email.'
    );

    return sendMail({ to: email, subject, text, html });
}

module.exports = {
    sendWelcomeEmail,
    sendBookingEmail,
    sendOtpEmail,
    sendPasswordResetEmail
};
