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
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table width="100%" maxWidth="600" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background: #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
          <!-- Header Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); padding: 40px 30px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; text-transform: uppercase;">UNIHIVE</h1>
                    <p style="margin: 4px 0 0; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 0.1em;">Student Housing Platform</p>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <a href="https://unihivegh.com" style="display: inline-block; padding: 8px 16px; background: rgba(255,255,255,0.2); border-radius: 99px; text-decoration: none; color: #ffffff; font-size: 11px; font-weight: 700;">unihivegh.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.05em;">${title}</p>
              <h2 style="margin: 0 0 20px; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.1;">${intro}</h2>

              <div style="margin-bottom: 30px;">
                ${contentHtml}
              </div>

              <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.6;">${closing}</p>
            </td>
          </tr>

          <!-- Footer Footer -->
          <tr>
            <td style="padding: 30px; border-top: 1px solid #334155; background: #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">&copy; 2026 UniHive Ghana. All rights reserved.</p>
              <a href="https://unihivegh.com" style="display: inline-block; margin-top: 10px; font-size: 12px; color: #f59e0b; text-decoration: none; font-weight: 600;">unihivegh.com</a>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #475569; font-size: 11px;">You received this because you have a UniHive account. No longer want emails? Update your preferences in dashboard.</p>
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
async function sendWelcomeEmail(email, full_name, user_id) {
    const subject = 'Welcome to UniHive — Your Student Home Journey Starts Here';
    const text = `Hi ${full_name},\n\nWelcome to UniHive! Your account is now active and ready for bookings.\n\nAccount ID: ${user_id}\n\nIf you have any questions, reply to this email and our support team will help.\n\nBest regards,\nUniHive Team`;
    const html = buildHtmlEmail(
        'WELCOME TO UNIHIVE',
        `Hi ${full_name}, welcome aboard!`,
        `<p style="margin: 0 0 20px; color: #f1f5f9; font-size: 16px; line-height: 1.6;">Your account is officially set up and ready to use. Start exploring verified hostels today!</p>
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 24px; border-radius: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Your Account ID</p>
            <p style="margin: 8px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">${user_id}</p>
        </div>
        <p style="margin: 0 0 12px; color: #f1f5f9;">What's next?</p>
        <ul style="margin: 0 0 20px; padding-left: 20px; color: #94a3b8; line-height: 1.8;">
          <li>Browse physically verified hostels</li>
          <li>Save your favorites to your dashboard</li>
          <li>Message managers directly for inquiries</li>
        </ul>`,
        'Need help? Simply reply to this email and our support team will assist you.'
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
        'BOOKING CONFIRMED',
        `Hi ${full_name}, your home is ready.`,
        `<p style="margin: 0 0 20px; color: #f1f5f9; font-size: 16px; line-height: 1.6;">Your booking at <strong>${hostel_name}</strong> has been successfully confirmed. Please keep your check-in code safe.</p>
        <div style="background: #334155; border-radius: 20px; padding: 24px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 11px; text-transform: uppercase;">Hostel</span><br/><strong style="color: #ffffff; font-size: 15px;">${hostel_name}</strong></td>
                    <td style="padding-bottom: 12px;"><span style="color: #64748b; font-size: 11px; text-transform: uppercase;">Room</span><br/><strong style="color: #ffffff; font-size: 15px;">#${room_number}</strong></td>
                </tr>
                <tr>
                    <td><span style="color: #64748b; font-size: 11px; text-transform: uppercase;">Booking ID</span><br/><strong style="color: #ffffff; font-size: 15px;">#${booking_id}</strong></td>
                    <td><span style="color: #64748b; font-size: 11px; text-transform: uppercase;">Status</span><br/><strong style="color: #22c55e; font-size: 15px;">PAID</strong></td>
                </tr>
            </table>
        </div>
        <div style="background: rgba(245, 158, 11, 0.05); border: 2px dashed rgba(245, 158, 11, 0.3); padding: 30px; text-align: center; border-radius: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #f59e0b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Check-in Code</p>
            <p style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: 8px;">${auth_code}</p>
        </div>
        <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #f59e0b; font-size: 13px;">⚠️ <strong>Important:</strong> Present this code to the hostel manager when you arrive for check-in.</p>
        </div>`,
        'Safe travels! If you have any issues with check-in, please reach out to us.'
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
        'EMAIL VERIFICATION',
        `Verify your account`,
        `<p style="margin: 0 0 20px; color: #f1f5f9; font-size: 16px; line-height: 1.6;">Hi ${full_name}, use the code below to verify your UniHive account. This code expires in <strong>15 minutes</strong>.</p>
        <div style="background: rgba(255, 255, 255, 0.03); border: 2px dashed #475569; padding: 40px 30px; text-align: center; border-radius: 24px; margin-bottom: 24px;">
            <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 800; letter-spacing: 12px;">${otp_code}</p>
        </div>
        <div style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #f59e0b; font-size: 13px;">⚠️ <strong>Never share this code</strong> with anyone, including UniHive staff. We will never ask for it.</p>
        </div>`,
        'If you didn&apos;t request this, you can safely ignore this email.'
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
        'PASSWORD RESET',
        `Reset your password`,
        `<p style="margin: 0 0 20px; color: #f1f5f9; font-size: 16px; line-height: 1.6;">Hi ${full_name}, a password reset was requested for your account. Use the code below to proceed.</p>
        <div style="background: rgba(255, 255, 255, 0.03); border: 2px dashed #475569; padding: 40px 30px; text-align: center; border-radius: 24px; margin-bottom: 24px;">
            <p style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 800; letter-spacing: 12px;">${reset_code}</p>
        </div>
        <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #ef4444; font-size: 13px;">⚠️ If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        </div>`,
        'This code will expire in 15 minutes.'
    );

    return sendMail({ to: email, subject, text, html });
}

module.exports = {
    sendWelcomeEmail,
    sendBookingEmail,
    sendOtpEmail,
    sendPasswordResetEmail
};
