const mysql = require('mysql2/promise');

async function fix() {
  const c = await mysql.createConnection({host: 'localhost', user: 'root', database: 'unihive'});
  const [rooms] = await c.query("SELECT id, capacity FROM rooms");
  for (const r of rooms) {
    const [occ] = await c.query("SELECT COUNT(*) as c FROM bookings WHERE room_id=? AND (status='approved' OR payment_status='paid')", [r.id]);
    const occupancy = occ[0].c;
    if (occupancy < r.capacity) {
      await c.query("UPDATE rooms SET available=1 WHERE id=?", [r.id]);
    }
  }
  console.log('Done');
  await c.end();
}
fix();
