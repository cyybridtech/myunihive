const mysql = require('mysql2/promise');

async function check() {
  const c = await mysql.createConnection({host: 'localhost', user: 'root', database: 'unihive'});
  const [rows] = await c.query("SELECT r.id, (SELECT COUNT(*) FROM bookings b WHERE b.room_id = r.id AND (b.status = 'approved' OR b.payment_status = 'paid')) as occupancy FROM rooms r WHERE r.id = 'r1777865796176545100'");
  console.log(rows);
  await c.end();
}
check();
