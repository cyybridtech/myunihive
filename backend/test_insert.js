require('./api/loadEnv').loadEnv(); 
const mysql = require('mysql2/promise'); 
async function run() { 
  try { 
    const pool = mysql.createPool({ 
      host: process.env.DB_HOST, 
      port: process.env.DB_PORT, 
      database: process.env.DB_NAME, 
      user: process.env.DB_USER, 
      password: process.env.DB_PASS, 
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } 
    }); 
    
    const [cols] = await pool.execute('SHOW COLUMNS FROM users WHERE Field = "role"'); 
    console.log("ROLE ENUM TYPE:", cols[0].Type);
    process.exit(0); 
  } catch(e) { 
    console.error('DB ERROR:', e.message); 
    process.exit(1); 
  } 
} 
run();
