const bcrypt = require('bcrypt');
const fs = require('fs');
const sql = fs.readFileSync(require('path').join(__dirname, '../../database/seed.sql'), 'utf8');
const hashes = [...sql.matchAll(/\$2b\$\d+\$[./A-Za-z0-9]{53}/g)].map((match) => match[0]);

Promise.all([
  bcrypt.compare('Admin@12345', hashes[0]),
  bcrypt.compare('Citizen@123', hashes[1]),
  bcrypt.compare('wrong-password', hashes[0])
]).then((results) => {
  if (!results[0] || !results[1] || results[2]) {
    console.error('hash mismatch', results, hashes);
    process.exit(1);
  }
  console.log('seed hashes match demo passwords');
});
