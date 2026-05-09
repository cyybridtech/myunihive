const mysql = require('mysql2/promise');

async function alterDB() {
  const c = await mysql.createConnection({host: 'localhost', user: 'root', database: 'unihive'});
  try {
      await c.query('ALTER TABLE users ADD COLUMN otp_code VARCHAR(10) NULL, ADD COLUMN otp_expires DATETIME NULL');
      console.log('Added columns');
  } catch (e) {
      console.error(e.message);
  }
  await c.end();
}
alterDB();
