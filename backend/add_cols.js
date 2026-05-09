require('./api/loadEnv').loadEnv();
const mysql = require('mysql2/promise');
async function addCols() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: process.env.DB_HOST.includes('tidbcloud.com') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
    });
    try {
        await conn.execute("ALTER TABLE hostels ADD COLUMN commission_type ENUM('split', 'flat') DEFAULT 'split'");
        await conn.execute("ALTER TABLE hostels ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0.00");
        console.log('Columns added successfully');
    } catch(e) {
        if(e.code === 'ER_DUP_FIELDNAME') console.log('Columns already exist');
        else console.error(e);
    }
    await conn.end();
}
addCols().catch(console.error);
