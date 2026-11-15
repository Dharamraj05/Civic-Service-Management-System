const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { testConnection } = require('./config/db');

process.on('unhandledRejection', (error) => {
  console.error(
    'Unhandled rejection (request should still return an error if possible):',
    error
  );
});

const port = Number(process.env.PORT) || 5000;

testConnection()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${port}`);
      console.log(`LAN API: http://10.162.84.172:${port}`);
    });
  })
  .catch((error) => {
    console.error('Could not connect to MySQL.');
    console.error(error.message);
    console.error(
      'Check server/.env, then run database/schema.sql, views.sql, and seed.sql.'
    );
    process.exit(1);
  });