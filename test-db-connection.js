/**
 * Test Database Connection
 * Run this to verify your database configuration
 */

require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  DB_HOST:', process.env.DB_HOST || 'localhost (default)');
console.log('  DB_PORT:', process.env.DB_PORT || '5432 (default)');
console.log('  DB_NAME:', process.env.DB_NAME || 'attendance_db (default)');
console.log('  DB_USER:', process.env.DB_USER || 'postgres (default)');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***set***' : '❌ NOT SET');
console.log('');

if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD is not set!');
  console.error('Please create a .env file in the backend directory.');
  console.error('See DATABASE_SETUP.md for instructions.');
  process.exit(1);
}

// Try to connect
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'attendance_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check if PostgreSQL is running: brew services list');
    console.error('2. Verify password in .env file');
    console.error('3. Test connection manually: psql -U postgres -d attendance_db');
    console.error('4. See DATABASE_SETUP.md for detailed instructions');
    process.exit(1);
  } else {
    console.log('✅ Database connection successful!');
    console.log('   Current time:', res.rows[0].now);
    console.log('');
    console.log('You can now start the server with: npm start');
    process.exit(0);
  }
});

