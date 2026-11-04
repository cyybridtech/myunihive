const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER || 'noreply@unihive.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'UniHive';
const EMAIL_SUPPORT = process.env.EMAIL_SUPPORT || EMAIL_FROM;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_TLS_REJECT_UNAUTHORIZED = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

const BASE_APP_URL = process.env.APP_URL || 'https://testhive-zeta.vercel.app';

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
        pass: EMAIL_PASS ? String(EMAIL_PASS).replace(/\s+/g, '') : ''
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
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
            console.error('[EMAIL] Note: If SMTP ports are blocked, configure BREVO_API_KEY to use the HTTP API fallback.');
        });
} else {
    console.log('[EMAIL] BREVO_API_KEY detected. Bypassing SMTP transporter verification.');
}

function buildHtmlEmail(title, intro, contentHtml, closing, badgeText = 'SECURITY NOTIFICATION') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 36px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          <!-- Top Amber Accent -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); width: 40px; height: 40px; border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
                          <span style="color: #ffffff; font-weight: 900; font-size: 20px; line-height: 40px; font-family: -apple-system, sans-serif;">H</span>
                        </td>
                        <td style="padding-left: 14px; vertical-align: middle;">
                          <span style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; font-family: -apple-system, sans-serif;">Uni<span style="color: #f59e0b;">Hive</span></span>
                          <span style="display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-top: 3px;">Verified Student Hostels • Ghana</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; padding: 6px 12px; border-radius: 20px; display: inline-block;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px 32px 36px;">
              <h1 style="margin: 0 0 14px 0; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.3; letter-spacing: -0.3px;">${title}</h1>
              <p style="margin: 0 0 28px 0; color: #475569; font-size: 15px; line-height: 1.65;">${intro}</p>
              
              <!-- Custom content insertion -->
              ${contentHtml}
              
              <!-- Closing segment -->
              <p style="margin: 28px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">${closing}</p>
            </td>
          </tr>

          <!-- Security Note -->
          <tr>
            <td style="padding: 0 36px 28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px;">
                <tr>
                  <td width="24" style="vertical-align: top; padding-right: 10px;">
                    <span style="font-size: 16px;">🛡️</span>
                  </td>
                  <td style="font-size: 12px; color: #64748b; line-height: 1.5;">
                    <strong style="color: #334155;">Security Reminder:</strong> UniHive staff will never ask for your passwords, OTP codes, or MoMo PINs over email, phone, or chat.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafbfd; padding: 28px 36px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #0f172a; font-size: 14px; font-weight: 800;">
                Uni<span style="color: #f59e0b;">Hive</span> Ghana
              </p>
              <p style="margin: 0 0 16px 0; color: #64748b; font-size: 12px;">
                Safe, verified student accommodation near Legon, KNUST, UCC, UPSA, and major Ghanaian campuses.
              </p>
              
              <table align="center" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td>
                    <a href="https://wa.me/233533143634" target="_blank" style="display: inline-block; background: #25D366; color: #ffffff; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 6px rgba(37, 211, 102, 0.25);">
                      💬 Student Support WhatsApp
                    </a>
                  </td>
                </tr>
              </table>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
                <p style="margin: 0; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                  This email was sent automatically to you regarding your UniHive account. © ${new Date().getFullYear()} UniHive Technologies. All rights reserved.
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
    // If a Brevo API key is provided, try Brevo HTTP API first
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
                console.warn(`[EMAIL] Brevo API rejected (code: ${data.code || response.status}). Falling back to Gmail SMTP...`);
            }
        } catch (error) {
            console.warn(`[EMAIL] Brevo API Request Error: ${error.message}. Falling back to Gmail SMTP...`);
        }
    }

    // Fallback to Nodemailer for local testing or custom SMTP providers
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
    const firstName = (full_name && full_name.split(' ')[0]) || 'Student';
    const subject = `Welcome to UniHive, ${firstName}! Your Verified Student Account is Ready 🎓`;
    const text = `Hi ${full_name},\n\nWelcome to UniHive! Your student account is active.\n\nAccount ID: ${user_id}\nRegistered Email: ${email}\n\nYou can now browse verified hostels near your university, connect with roommates, and book rooms with zero landlord scams.\n\nVisit: ${BASE_APP_URL}/dashboard\n\nBest regards,\nUniHive Team`;
    
    const html = buildHtmlEmail(
        `Welcome to UniHive, ${firstName}! 🎓`,
        `We are thrilled to welcome you to <strong>UniHive</strong> — Ghana's most trusted, verified student accommodation platform. Your account is fully active and ready to use.`,
        `<!-- Student ID Badge Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px; padding: 24px 28px; margin-bottom: 28px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15); border: 1px solid #334155;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: middle;">
                  <span style="color: #fbbf24; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">Verified Student Member</span>
                  <h3 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">${full_name}</h3>
                  <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">${email}</p>
                </td>
                <td align="right" style="vertical-align: middle;">
                  <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 14px; padding: 10px 16px; display: inline-block; text-align: center;">
                    <span style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; display: block;">Student ID</span>
                    <span style="color: #f59e0b; font-size: 18px; font-weight: 900; font-family: monospace;">#${user_id}</span>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Feature Cards -->
          <p style="margin: 0 0 14px 0; color: #0f172a; font-size: 15px; font-weight: 800;">Here is how UniHive protects &amp; empowers your campus life:</p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: block; margin-bottom: 10px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="36" style="vertical-align: top; font-size: 22px;">🏢</td>
                    <td style="vertical-align: top; padding-left: 10px;">
                      <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 2px;">100% Physically Verified Hostels</strong>
                      <span style="color: #64748b; font-size: 13px; line-height: 1.4;">Accurate room photos, live prices, direct manager WhatsApp contacts, and verified campus walking distance.</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="height: 10px;"></td>
            </tr>
            <tr>
              <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: block; margin-bottom: 10px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="36" style="vertical-align: top; font-size: 22px;">👥</td>
                    <td style="vertical-align: top; padding-left: 10px;">
                      <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 2px;">Smart Roommate Matching</strong>
                      <span style="color: #64748b; font-size: 13px; line-height: 1.4;">Match with fellow students based on lifestyle compatibility, sleep schedule, study habits, and campus major.</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="height: 10px;"></td>
            </tr>
            <tr>
              <td style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: block;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="36" style="vertical-align: top; font-size: 22px;">🔒</td>
                    <td style="vertical-align: top; padding-left: 10px;">
                      <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 2px;">Scam-Free Payments &amp; Auth Passcodes</strong>
                      <span style="color: #64748b; font-size: 13px; line-height: 1.4;">Your reservation is secured instantly via Mobile Money/Card and confirmed with a unique tamper-proof check-in code.</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 32px 0 20px 0;">
            <table align="center" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 0 6px;">
                  <a href="${BASE_APP_URL}/hostels?university=all" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; padding: 15px 32px; text-decoration: none; border-radius: 14px; font-weight: 800; display: inline-block; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35); font-size: 14px; letter-spacing: 0.2px;">
                    Browse Verified Hostels →
                  </a>
                </td>
                <td style="padding: 0 6px;">
                  <a href="${BASE_APP_URL}/roommate-finder" style="background: #0f172a; color: #ffffff; padding: 15px 26px; text-decoration: none; border-radius: 14px; font-weight: 700; display: inline-block; font-size: 14px;">
                    Find Roommates
                  </a>
                </td>
              </tr>
            </table>
          </div>`,
        'Have questions or need help finding a hostel? Simply reply directly to this email or reach our student concierge on WhatsApp.',
        'ACCOUNT ACTIVATED'
    );

    return sendMail({ to: email, subject, text, html });
}

/**
 * Send booking confirmation email with auth code
 */
async function sendBookingEmail(email, full_name, booking_id, room_number, hostel_name, auth_code) {
    const subject = `Booking Confirmed: ${hostel_name} — Check-in Code: ${auth_code}`;
    const text = `Hi ${full_name},\n\nCongratulations! Your booking at ${hostel_name} is confirmed.\n\nBooking ID: ${booking_id}\nRoom: ${room_number}\nCheck-in Code: ${auth_code}\n\nPresent this code to the manager upon arrival.\n\nBest regards,\nUniHive Team`;
    
    const html = buildHtmlEmail(
        'Booking Confirmed! 🎉',
        `Hi <strong style="color: #0f172a;">${full_name}</strong>, your accommodation booking at <strong>${hostel_name}</strong> has been approved and confirmed.`,
        `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; margin-bottom: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom: 10px;">
                  <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Hostel Name</span>
                  <p style="margin: 2px 0 0 0; color: #0f172a; font-size: 16px; font-weight: 800;">${hostel_name}</p>
                </td>
                <td style="padding-bottom: 10px; text-align: right;">
                  <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Room Allocated</span>
                  <p style="margin: 2px 0 0 0; color: #d97706; font-size: 16px; font-weight: 800;">Room ${room_number}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 10px; border-top: 1px solid #e2e8f0;">
                  <span style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700;">Booking Reference</span>
                  <p style="margin: 2px 0 0 0; color: #475569; font-size: 13px; font-family: monospace;">${booking_id}</p>
                </td>
                <td style="padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: right;">
                  <span style="background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; display: inline-block;">
                    ✓ PAID & RESERVED
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #f59e0b; padding: 26px 20px; border-radius: 18px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);">
            <p style="margin: 0 0 8px 0; color: #b45309; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Official Check-in Passcode</p>
            <div style="margin: 8px 0; display: inline-block; background: #ffffff; padding: 12px 24px; border-radius: 12px; border: 1px solid #fde68a;">
              <span style="font-size: 34px; letter-spacing: 8px; font-weight: 900; color: #78350f; font-family: monospace; line-height: 1;">${auth_code}</span>
            </div>
            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 12px; font-weight: 600;">
              Show this code to the hostel manager when checking in.
            </p>
          </div>

          <div style="text-align: center; margin: 28px 0 12px 0;">
            <a href="${BASE_APP_URL}/dashboard" style="background: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; display: inline-block; font-size: 14px;">
              View in Student Dashboard →
            </a>
          </div>`,
        'Safe travels and enjoy your stay! Reply to this email if you need check-in assistance.',
        'CONFIRMED RESERVATION'
    );

    return sendMail({ to: email, subject, text, html });
}

/**
 * Send OTP Verification email
 */
async function sendOtpEmail(email, full_name, otp_code) {
    const subject = `${otp_code} is your UniHive verification code`;
    const text = `Hi ${full_name},\n\nYour 6-digit UniHive verification code is: ${otp_code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nUniHive Student Team`;
    
    const html = buildHtmlEmail(
        'Verify Your Account',
        `Hi <strong style="color: #0f172a;">${full_name}</strong>, please use the 6-digit confirmation code below to complete your verification on UniHive.`,
        `<div style="background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #f59e0b; padding: 32px 20px; border-radius: 20px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.1);">
            <p style="margin: 0 0 10px 0; color: #b45309; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">One-Time Confirmation Code</p>
            <div style="margin: 12px 0; display: inline-block; background: #ffffff; padding: 14px 28px; border-radius: 14px; border: 1px solid #fde68a; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);">
              <span style="font-size: 42px; letter-spacing: 12px; font-weight: 900; color: #78350f; font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; line-height: 1;">${otp_code}</span>
            </div>
            <p style="margin: 14px 0 0 0; color: #92400e; font-size: 12px; font-weight: 600;">
              ⏱️ Valid for 15 minutes • Single use only
            </p>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5; text-align: center;">
            Enter this code in your browser to verify your identity and activate your account.
          </p>`,
        'If you did not initiate this request, you can safely ignore this email. No changes will be made to your account.',
        'ACCOUNT VERIFICATION'
    );

    return sendMail({ to: email, subject, text, html });
}

/**
 * Send Password Reset Verification email
 */
async function sendPasswordResetEmail(email, full_name, reset_code) {
    const subject = `${reset_code} is your UniHive password reset code`;
    const text = `Hi ${full_name},\n\nA password reset request was received for your UniHive account.\n\nYour reset code is: ${reset_code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this message.\n\nBest regards,\nUniHive Support`;
    
    const html = buildHtmlEmail(
        'Reset Your Password',
        `Hi <strong style="color: #0f172a;">${full_name}</strong>, a request was made to reset the password associated with your UniHive account.`,
        `<div style="background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%); border: 2px dashed #ea580c; padding: 32px 20px; border-radius: 20px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.1);">
            <p style="margin: 0 0 10px 0; color: #c2410c; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Password Reset Code</p>
            <div style="margin: 12px 0; display: inline-block; background: #ffffff; padding: 14px 28px; border-radius: 14px; border: 1px solid #fed7aa; box-shadow: 0 2px 8px rgba(234, 88, 12, 0.15);">
              <span style="font-size: 42px; letter-spacing: 12px; font-weight: 900; color: #9a3412; font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; line-height: 1;">${reset_code}</span>
            </div>
            <p style="margin: 14px 0 0 0; color: #c2410c; font-size: 12px; font-weight: 600;">
              ⏱️ Valid for 15 minutes • Do not share this code
            </p>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5; text-align: center;">
            Enter this code on the password reset page to create a new secure password.
          </p>`,
        'If you did not request a password reset, your account is safe and you can ignore this email.',
        'SECURITY ALERT'
    );

    return sendMail({ to: email, subject, text, html });
}

module.exports = {
    sendWelcomeEmail,
    sendBookingEmail,
    sendOtpEmail,
    sendPasswordResetEmail
};
