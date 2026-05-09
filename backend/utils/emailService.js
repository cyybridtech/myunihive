const nodemailer = require('nodemailer');

/**
 * Configure your email transport here.
 * For Gmail, you will need an App Password if 2-Step Verification is enabled.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this if you're using another provider (e.g., 'SendGrid', 'Outlook')
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Sends an email
 * @param {string} to - The recipient email address
 * @param {string} subject - The subject of the email
 * @param {string} text - Plain text version of the email body
 * @param {string} html - HTML version of the email body
 * @returns {Promise<any>}
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: `"UniHive" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendEmail
};
