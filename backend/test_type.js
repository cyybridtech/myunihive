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
    const [hostels] = await pool.query('SELECT university_id FROM hostels LIMIT 1');
    if (hostels.length > 0) {
        console.log('Value:', hostels[0].university_id);
        console.log('Type:', typeof hostels[0].university_id);
    }
    process.exit(0); 
  } catch(e) { 
    console.error('DB ERROR:', e.message); 
    process.exit(1); 
  } 
} 
run();
