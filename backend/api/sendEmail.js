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
    connectionTimeout: 3000,
    greetingTimeout: 3000,
    socketTimeout: 3000
};

const transporter = nodemailer.createTransport(transportOptions);

if (!process.env.BREVO_API_KEY) {
    transporter.verify()
        .then(() => {
            console.log('[EMAIL] SMTP transporter verified successfully');
        })
        .catch(error => {
            console.error('[EMAIL] SMTP transporter verification FAILED');
            console.error('[EMAIL] Error message:', error?.message || error);
            console.error('[EMAIL] Error code:', error?.code);
            console.error('[EMAIL] Error command:', error?.command);
            console.error('[EMAIL] Note: If you are hosted on Render free tier, SMTP ports are blocked. Please configure BREVO_API_KEY to use the HTTP API fallback.');
        });
} else {
    console.log('[EMAIL] BREVO_API_KEY detected. Bypassing SMTP transporter verification.');
}

function buildHtmlEmail(title, intro, contentHtml, closing) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fa; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f6f8fa; padding: 30px 0;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04); border: 1px solid #e1e8ed;">
          <!-- Top Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);"></td>
          </tr>
          <!-- Header (Branded Logo Section) -->
          <tr>
            <td style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Stylized Hexagon/Hive Box -->
                        <td style="background-color: #f59e0b; padding: 7px 10px; border-radius: 8px; vertical-align: middle; text-align: center;">
                          <span style="color: #ffffff; font-weight: 900; font-size: 16px; font-family: -apple-system, sans-serif; line-height: 1; display: block;">H</span>
                        </td>
                        <td style="padding-left: 10px; font-size: 20px; font-weight: 800; color: #1f2937; vertical-align: middle; font-family: -apple-system, sans-serif;">
                          Uni<span style="color: #f59e0b;">Hive</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content Area -->
          <tr>
            <td style="padding: 36px 32px 30px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #1f2937; line-height: 1.3;">${title}</h1>
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">${intro}</p>
              
              <!-- Custom content insertion -->
              ${contentHtml}
              
              <!-- Closing segment -->
              <p style="margin: 24px 0 0 0; color: #4b5563; font-size: 15px; line-height: 1.6;">${closing}</p>
            </td>
          </tr>
          <!-- Footer Branding Bar -->
          <tr>
            <td style="background-color: #fafbfd; padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 700;">Uni<span style="color: #f59e0b;">Hive</span></p>
              <p style="margin: 4px 0 16px 0; color: #6b7280; font-size: 11px;">Student housing made simple.</p>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <p style="margin: 0; color: #9ca3af; font-size: 10px; line-height: 1.4;">
                  This is an automated notification from your UniHive account. Please do not reply directly to this email.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendMail(options) {
    // If a Brevo API key is provided, use the HTTP API (Port 443) to completely bypass Render's SMTP blocks
    if (process.env.BREVO_API_KEY) {
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: EMAIL_FROM_NAME, email: FROM_ADDRESS },
                    to: [{ email: options.to }],
                    subject: options.subject,
                    htmlContent: options.html,
                    textContent: options.text,
                    replyTo: { email: EMAIL_SUPPORT }
                })
            });

            const data = await response.json();
            if (response.ok) {
                console.log(`[EMAIL] Sent to ${options.to} via Brevo HTTP API. messageId=${data.messageId}`);
                return true;
            } else {
                console.error(`[EMAIL] Brevo API FAILED:`, data);
                return false;
            }
        } catch (error) {
            console.error(`[EMAIL] Brevo API Request Error:`, error.message);
            return false;
        }
    }

    // Fallback to Nodemailer for local testing or custom SMTP providers (like SMTP2GO on port 2525)
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.log('[EMAIL] Email delivery skipped because credentials/API keys are not configured.');
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

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Sent to ${options.to} via SMTP. messageId=${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] sendMail SMTP FAILED:`, error.message);
        return false;
    }
}


/**
 * Send welcome email to new user
 */
/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(email, full_name, user_id) {
    const subject = 'Welcome to UniHive — Your Student Home Journey Starts Here';
    const text = `Hi ${full_name},\n\nWelcome to UniHive! Your account is now active and ready for bookings.\n\nAccount ID: ${user_id}\n\nIf you have any questions, reply to this email and our support team will help.\n\nBest regards,\nUniHive Team`;
    const html = buildHtmlEmail(
        'Welcome to UniHive!',
        `Hi ${full_name}, welcome aboard! Your UniHive account is set up and ready to use.`,
        `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 10px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1f2937; font-size: 15px;"><strong>Account ID:</strong> ${user_id}</p>
          </div>
          <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">You can now search hostels, book rooms, and manage your accommodation from your UniHive dashboard.</p>
          <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
            <li style="margin-bottom: 6px;">Browse verified hostels near your campus</li>
            <li style="margin-bottom: 6px;">Reserve rooms quickly and securely</li>
            <li style="margin-bottom: 6px;">Track your bookings and check-in status</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://unihive-9k0l.onrender.com/dashboard" style="background-color: #f59e0b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); font-size: 15px;">Go to Dashboard</a>
          </div>`,
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
        `Hi ${full_name}, your room booking is successfully confirmed. Keep this email for your check-in details.`,
        `<div style="background: #f8fafc; border-left: 4px solid #1f2937; padding: 18px; border-radius: 10px; margin-bottom: 24px; border: 1px solid #e2e8f0; border-left-width: 4px;">
            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;"><strong>Booking ID:</strong> <span style="color: #1f2937;">${booking_id}</span></p>
            <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;"><strong>Hostel:</strong> <span style="color: #1f2937; font-weight: 700;">${hostel_name}</span></p>
            <p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Room:</strong> <span style="color: #1f2937; font-weight: 700;">${room_number}</span></p>
          </div>
          <div style="background: #fffbeb; border: 1px dashed #f59e0b; padding: 22px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #b45309; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Secure Check-in Code</p>
            <p style="margin: 0; font-size: 32px; letter-spacing: 6px; color: #78350f; font-weight: 800; font-family: monospace; line-height: 1.2;">${auth_code}</p>
            <p style="margin: 8px 0 0 0; color: #92400e; font-size: 12px; line-height: 1.4;">Present this code to the hostel manager at check-in.</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://unihive-9k0l.onrender.com/dashboard" style="background-color: #f59e0b; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); font-size: 15px;">View Bookings</a>
          </div>`,
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
        'Verify Your Email',
        `Hi ${full_name}, use the verification code below to confirm your email address and continue registration.`,
        `<div style="background: #fffbeb; border: 1px dashed #f59e0b; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #b45309; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Your verification code</p>
            <p style="margin: 0; color: #78350f; font-size: 36px; letter-spacing: 8px; font-weight: 800; font-family: monospace; line-height: 1.2;">${otp_code}</p>
          </div>`,
        'This code will expire in 15 minutes. If you did not request this verification code, please ignore this email.'
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
        'Reset Your Password',
        `Hi ${full_name}, a password reset request was received for your UniHive account.`,
        `<div style="background: #fffbeb; border: 1px dashed #f59e0b; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #b45309; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">Your reset code</p>
            <p style="margin: 0; color: #78350f; font-size: 36px; letter-spacing: 8px; font-weight: 800; font-family: monospace; line-height: 1.2;">${reset_code}</p>
          </div>`,
        'If you did not request a password reset, no action is required and you can ignore this email.'
    );

    return sendMail({ to: email, subject, text, html });
}

module.exports = {
    sendWelcomeEmail,
    sendBookingEmail,
    sendOtpEmail,
    sendPasswordResetEmail
};
