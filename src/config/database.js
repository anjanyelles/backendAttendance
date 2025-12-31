const { Pool } = require('pg');
require('dotenv').config();

let poolConfig;

// Check if DATABASE_URL is provided (Railway/Heroku style)
if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL format: postgresql://user:password@host:port/database
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log('✅ Using DATABASE_URL connection string');
} else {
  // Use individual environment variables (local development)
  if (!process.env.DB_PASSWORD) {
    console.error('❌ ERROR: DB_PASSWORD is not set in .env file!');
    console.error('Please create a .env file in the backend directory with your database credentials.');
    console.error('Or set DATABASE_URL for Railway/Heroku deployment.');
    console.error('See QUICKSTART.md or SETUP_PASSWORD.md for instructions.');
    process.exit(1);
  }

  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'attendance_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log('✅ Using individual database environment variables');
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;