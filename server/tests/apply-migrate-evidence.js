const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../../database/migrate_evidence.sql'), 'utf8');
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith('--'));
  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
        continue;
      }
      throw error;
    }
  }
  const [rows] = await pool.query('SHOW TABLES LIKE "complaint_evidence"');
  if (!rows.length) {
    throw new Error('complaint_evidence was not created');
  }
  console.log('migrate_evidence.sql applied');
  process.exit(0);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
