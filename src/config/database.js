const { Pool } = require('pg');
require('dotenv').config();

// Support multiple environment variable naming conventions
// Railway PostgreSQL provides: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
// Custom naming: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
// Also support DATABASE_URL connection string

let pool;

// If DATABASE_URL is provided, use it directly (Railway often provides this)
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // Extract database config from environment variables
  // Support both Railway (PG*) and custom (DB_*) naming conventions
  const dbConfig = {
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
    database: process.env.PGDATABASE || process.env.DB_NAME || 'attendance_db',
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  // Validate that we have a password
  if (!dbConfig.password) {
    console.error('❌ ERROR: Database password is not set!');
    console.error('');
    console.error('For local development:');
    console.error('  Create a .env file with your database credentials.');
    console.error('  See QUICKSTART.md or SETUP_PASSWORD.md for instructions.');
    console.error('');
    console.error('For Railway deployment:');
    console.error('  Railway PostgreSQL automatically provides these variables:');
    console.error('  - PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD');
    console.error('  OR');
    console.error('  - DATABASE_URL (connection string)');
    console.error('');
    console.error('  To set them manually:');
    console.error('  1. Go to your Railway project dashboard');
    console.error('  2. Click on your PostgreSQL service → Variables tab');
    console.error('  3. Copy PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD');
    console.error('  4. Go to your backend service → Variables tab');
    console.error('  5. Add these variables (or use DATABASE_URL)');
    console.error('  6. See RAILWAY_DEPLOYMENT.md for detailed instructions');
    console.error('');
    process.exit(1);
  }

  pool = new Pool(dbConfig);
}

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

