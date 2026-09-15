const fs = require('fs');
const path = require('path');

const databaseDir = __dirname;
const rootDir = path.join(__dirname, '..');

const tables = [
  'universities',
  'users',
  'hostels',
  'rooms',
  'bookings',
  'reviews',
  'roommate_profiles',
  'messages',
  'notifications',
  'otps',
  'push_subscriptions',
  'saved_cards',
  'audit_logs'
];

let sql = '';
sql += '-- ============================================================\n';
sql += '-- UniHive Consolidated Database Dump for Local Development (XAMPP)\n';
sql += '-- Compatible with MySQL 5.7+, MySQL 8.0+, and MariaDB (XAMPP / phpMyAdmin)\n';
sql += '-- Generated from TiDB Cloud Export\n';
sql += '-- ============================================================\n\n';
sql += 'SET FOREIGN_KEY_CHECKS = 0;\n';
sql += 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n';
sql += 'SET time_zone = "+00:00";\n';
sql += 'SET NAMES utf8mb4;\n\n';
sql += '-- Create database if it does not exist and use it\n';
sql += 'CREATE DATABASE IF NOT EXISTS `unihive` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;\n';
sql += 'USE `unihive`;\n\n';

for (const tbl of tables) {
  sql += '-- ------------------------------------------------------------\n';
  sql += `-- Table: \`${tbl}\`\n`;
  sql += '-- ------------------------------------------------------------\n\n';
  sql += `DROP TABLE IF EXISTS \`${tbl}\`;\n`;

  const schemaFile = path.join(databaseDir, `test.${tbl}-schema.sql`);
  if (fs.existsSync(schemaFile)) {
    let schema = fs.readFileSync(schemaFile, 'utf8');
    // Remove TiDB specific flags & headers
    schema = schema.replace(/\/\*!40014 SET FOREIGN_KEY_CHECKS=0\*\/?;\s*/gi, '');
    schema = schema.replace(/\/\*!40101 SET NAMES binary\*\/?;\s*/gi, '');
    schema = schema.replace(/\/\*T!\[clustered_index\] CLUSTERED \*\//gi, '');
    sql += schema.trim() + '\n\n';
  } else {
    console.warn(`[WARN] Schema file not found for table: ${tbl}`);
  }

  const dataFile = path.join(databaseDir, `test.${tbl}.0000000010000.sql`);
  if (fs.existsSync(dataFile)) {
    let data = fs.readFileSync(dataFile, 'utf8');
    data = data.replace(/\/\*!40014 SET FOREIGN_KEY_CHECKS=0\*\/?;\s*/gi, '');
    data = data.replace(/\/\*!40101 SET NAMES binary\*\/?;\s*/gi, '');
    sql += `-- Data for table \`${tbl}\`\n`;
    sql += data.trim() + '\n\n';
  }
}

sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

const outPath1 = path.join(databaseDir, 'unihive_xampp.sql');
const outPath2 = path.join(rootDir, 'unihive.sql');

fs.writeFileSync(outPath1, sql, 'utf8');
fs.writeFileSync(outPath2, sql, 'utf8');

console.log('Done!');
console.log(`- Created: ${outPath1}`);
console.log(`- Updated: ${outPath2}`);
console.log(`- Total size: ${(sql.length / 1024).toFixed(2)} KB`);
