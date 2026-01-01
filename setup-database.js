/**
 * Script to set up Railway PostgreSQL database
 * 
 * Usage:
 * 1. Make sure DATABASE_URL is set in your environment or .env file
 * 2. Run: node setup-database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL is not set!');
  console.error('');
  console.error('For Railway:');
  console.error('  1. Go to your Railway project');
  console.error('  2. Click on your backend service → Variables tab');
  console.error('  3. Copy the DATABASE_URL value');
  console.error('  4. Run: DATABASE_URL="your-connection-string" node setup-database.js');
  console.error('');
  console.error('Or create a .env file with:');
  console.error('  DATABASE_URL=postgresql://user:password@host:port/database');
  process.exit(1);
}

console.log('🔌 Connecting to database...');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('railway') || databaseUrl.includes('amazonaws') 
    ? { rejectUnauthorized: false } 
    : false,
});

// Read the schema file
const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
let schema;

try {
  schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('📄 Schema file loaded');
} catch (error) {
  console.error('❌ ERROR: Could not read schema.sql file');
  console.error('   Make sure src/config/schema.sql exists');
  process.exit(1);
}

// Execute the schema
async function setupDatabase() {
  try {
    console.log('🚀 Creating database tables...');
    
    // Execute the entire schema
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - employees');
    console.log('  - attendance');
    console.log('  - leave_requests');
    console.log('  - regularization_requests');
    console.log('  - office_settings');
    console.log('');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('✅ Verification: Found', result.rows.length, 'tables');
    result.rows.forEach(row => {
      console.log('   -', row.table_name);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR creating database schema:');
    console.error(error.message);
    
    // Check if tables already exist
    if (error.message.includes('already exists')) {
      console.error('');
      console.error('⚠️  Some tables might already exist.');
      console.error('   This is okay - the schema uses "CREATE TABLE IF NOT EXISTS"');
      console.error('   Your database should be ready to use!');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();

