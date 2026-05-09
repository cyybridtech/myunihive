const fs = require('fs');
const mysql = require('mysql2/promise');
require('./api/loadEnv').loadEnv();

async function run() {
    console.log('Connecting to TiDB...');
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        multipleStatements: true,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });
    console.log('Connected! Reading SQL dump...');
    let sql = fs.readFileSync('../unihive_dump.sql', 'utf16le');
    
    // Strip BOM if present
    if (sql.charCodeAt(0) === 0xFEFF) {
        sql = sql.slice(1);
    }
    
    // Remove comments
    sql = sql.replace(/--.*$/gm, '').replace(/\/\*.*?\*\//gs, '');
    
    console.log('Executing SQL dump...');
    await conn.query(sql);
    console.log('Migration Complete!');
    await conn.end();
}
run().catch(console.error);
