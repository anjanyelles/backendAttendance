const { Pool } = require('pg');
require('dotenv').config();

// Validate required environment variables
if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD is not set in .env file!');
  console.error('Please create a .env file in the backend directory with your database credentials.');
  console.error('See QUICKSTART.md or SETUP_PASSWORD.md for instructions.');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'attendance_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

