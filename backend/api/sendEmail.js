/**
 * Email Sending Functions using Nodemailer
 */

require('./loadEnv');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Add these settings to improve deliverability
    secure: true,
    tls: {
        rejectUnauthorized: false
    }
});

// Test email connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('[EMAIL] SMTP connection failed:', error.message);
    } else {
        console.log('[EMAIL] SMTP connection successful');
    }
});

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(email, full_name, user_id) {
    if (!process.env.EMAIL_USER) {
        console.log(`[EMAIL-SKIP] Welcome email to ${email} (No EMAIL_USER configured)`);
        return false;
    }
    
    const subject = 'Welcome to UniHive!';
    const text = `Hi ${full_name},\n\nWelcome to UniHive! We're excited to have you on board. Your account (ID: ${user_id}) was created successfully.\n\nBest,\nUniHive Team`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d97706;">Welcome to UniHive!</h2>
            <p>Hi ${full_name},</p>
            <p>Welcome to UniHive! We're excited to have you on board. Your account was created successfully.</p>
            <br>
            <p>Best regards,<br><strong>UniHive Team</strong></p>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"UniHive" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text,
            html
        });
        console.log(`[EMAIL] Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] Failed to send welcome email:`, error.message);
        return false;
    }
}

/**
 * Send booking confirmation email with auth code
 */
async function sendBookingEmail(email, full_name, booking_id, room_number, hostel_name, auth_code) {
    if (!process.env.EMAIL_USER) {
        console.log(`[EMAIL-SKIP] Booking email to ${email} (No EMAIL_USER configured)`);
        return false;
    }
    
    const subject = 'Booking Confirmed - Check-in Ready';
    const text = `Hi ${full_name},\n\nYour Booking is Confirmed!\n\nBooking ID: ${booking_id}\nRoom: ${room_number}\nHostel: ${hostel_name}\n\n🔐 Secret Check-in Code: ${auth_code}\n\nShow this code to the hostel manager during check-in.\n\nBest,\nUniHive Team`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #10b981;">Your Booking is Confirmed! 🎉</h2>
            <p>Hi ${full_name},</p>
            <p>Your room booking has been successfully paid and approved.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Booking ID:</strong> ${booking_id}</p>
                <p><strong>Hostel:</strong> ${hostel_name}</p>
                <p><strong>Room:</strong> ${room_number}</p>
            </div>
            
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #d97706;">🔐 Secret Check-in Code: ${auth_code}</h3>
                <p style="margin-bottom: 0;">Please show this code to the hostel manager when you arrive to check in. Do not share this code with anyone else.</p>
            </div>
            
            <br>
            <p>Best regards,<br><strong>UniHive Team</strong></p>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"UniHive" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text,
            html
        });
        console.log(`[EMAIL] Booking email #${booking_id} sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] Failed to send booking email:`, error.message);
        return false;
    }
}

/**
 * Send OTP Verification email
 */
async function sendOtpEmail(email, full_name, otp_code) {
    if (!process.env.EMAIL_USER) {
        console.log(`[EMAIL-SKIP] OTP email to ${email} (No EMAIL_USER configured)`);
        return false;
    }

    if (!process.env.EMAIL_PASS) {
        console.log(`[EMAIL-SKIP] OTP email to ${email} (No EMAIL_PASS configured)`);
        return false;
    }
    
    const subject = 'Your UniHive Verification Code';
    const text = `Hi ${full_name},\n\nYour email verification code is: ${otp_code}\n\nIt expires in 15 minutes.\n\nBest,\nUniHive Team`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #d97706;">Verify Your Email</h2>
            <p>Hi ${full_name},</p>
            <p>Thank you for signing up for UniHive. Please use the following code to verify your email address:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h1 style="margin: 0; color: #1f2937; letter-spacing: 5px; font-size: 32px;">${otp_code}</h1>
            </div>
            
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not create an account, no further action is required.</p>
            <br>
            <p>Best regards,<br><strong>UniHive Team</strong></p>
        </div>
    `;

    try {
        console.log(`[EMAIL] Attempting to send OTP email to ${email} from ${process.env.EMAIL_USER}`);
        const info = await transporter.sendMail({
            from: `"UniHive" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text,
            html
        });
        console.log(`[EMAIL] OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] Failed to send OTP email to ${email}:`, {
            error: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode
        });
        return false;
    }
}

/**
 * Send Password Reset Verification email
 */
async function sendPasswordResetEmail(email, full_name, reset_code) {
    if (!process.env.EMAIL_USER) {
        console.log(`[EMAIL-SKIP] Password Reset email to ${email} (No EMAIL_USER configured)`);
        return false;
    }
    
    const subject = 'Your UniHive Password Reset Code';
    const text = `Hi ${full_name},\n\nYour password reset code is: ${reset_code}\n\nIt expires in 15 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest,\nUniHive Team`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #ef4444;">Password Reset Request</h2>
            <p>Hi ${full_name},</p>
            <p>We received a request to reset your UniHive password. Please use the following code to reset it:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h1 style="margin: 0; color: #1f2937; letter-spacing: 5px; font-size: 32px;">${reset_code}</h1>
            </div>
            
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <br>
            <p>Best regards,<br><strong>UniHive Team</strong></p>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"UniHive" <${process.env.EMAIL_USER}>`,
            to: email,
            subject,
            text,
            html
        });
        console.log(`[EMAIL] Password reset email sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`[EMAIL] Failed to send password reset email:`, error.message);
        return false;
    }
}

module.exports = {
    sendWelcomeEmail,
    sendBookingEmail,
    sendOtpEmail,
    sendPasswordResetEmail
};
