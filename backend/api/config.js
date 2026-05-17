/**
 * UniHive API Configuration
 * Database and environment settings
 */

const { loadEnv } = require('./loadEnv');
loadEnv();
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'unihive',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8',
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com') ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    } : undefined
};

// Create pool
let pool;
function getPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'YOUR_PAYSTACK_SECRET_KEY';

// Email configuration
const emailConfig = {
    from: process.env.EMAIL_FROM || 'noreply@uniHive.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'noreply@uniHive.com'
};

// Helper to alter tables for required schema columns
async function initSchema() {
    const p = getPool();
    try {
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS manager_id VARCHAR(50) DEFAULT NULL");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS subaccount_code VARCHAR(100) DEFAULT NULL");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) DEFAULT NULL");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS account_number VARCHAR(100) DEFAULT NULL");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS gallery JSON DEFAULT NULL");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS lat DOUBLE DEFAULT NULL");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS lng DOUBLE DEFAULT NULL");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'split'");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0");
        await p.execute("ALTER TABLE hostels ADD COLUMN IF NOT EXISTS payment_period ENUM('semester', 'academic_year') DEFAULT 'semester'");
        await p.execute("ALTER TABLE universities ADD COLUMN IF NOT EXISTS lat DOUBLE DEFAULT NULL");
        await p.execute("ALTER TABLE universities ADD COLUMN IF NOT EXISTS lng DOUBLE DEFAULT NULL");
        await p.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gender ENUM('male','female','unisex') DEFAULT 'unisex'");
        await p.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS manual_occupancy INT DEFAULT 0");
        await p.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gallery JSON DEFAULT NULL");
        await p.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT current_timestamp()");
        await p.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE");
        
        // Create OTPs table for email verification
        await p.execute(`
            CREATE TABLE IF NOT EXISTS otps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                otp_code VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Create messages table
        await p.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id VARCHAR(50) NOT NULL,
                receiver_id VARCHAR(50) NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Create push subscriptions table
        await p.execute(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                endpoint VARCHAR(500) NOT NULL,
                p256dh VARCHAR(200) NOT NULL,
                auth VARCHAR(200) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
    } catch (e) {
        // Ignore errors if columns already exist
        console.warn("Schema init error (often safe to ignore):", e.message);
    }
}

module.exports = {
    getPool,
    PAYSTACK_SECRET_KEY,
    emailConfig,
    initSchema
};
