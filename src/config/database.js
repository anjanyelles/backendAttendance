const { Pool } = require('pg');
require('dotenv').config();

// Validate required environment variables
if (!process.env.DB_PASSWORD) {
  console.error('❌ ERROR: DB_PASSWORD is not set!');
  console.error('');
  console.error('For local development:');
  console.error('  Create a .env file with your database credentials.');
  console.error('  See QUICKSTART.md or SETUP_PASSWORD.md for instructions.');
  console.error('');
  console.error('For Railway deployment:');
  console.error('  1. Go to your Railway project dashboard');
  console.error('  2. Click on your service → Variables tab');
  console.error('  3. Add DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD');
  console.error('  4. If using Railway PostgreSQL, check the service Variables tab');
  console.error('  5. See RAILWAY_DEPLOYMENT.md for detailed instructions');
  console.error('');
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

