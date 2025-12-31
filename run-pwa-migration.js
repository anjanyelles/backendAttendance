/**
 * Run PWA Database Migration
 * 
 * This script runs the PWA schema update to add:
 * - Heartbeat tracking columns
 * - OUT time and count tracking
 * - Attendance status calculation
 * - OUT periods table
 */

const pool = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting PWA database migration...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'src/config/pwa-schema-update.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and execute each statement
    // Note: PostgreSQL doesn't support multiple statements in one query easily
    // So we'll execute the whole file as one query (PostgreSQL supports this)
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('\nNew features added:');
    console.log('  - Heartbeat tracking');
    console.log('  - OUT time and count tracking');
    console.log('  - Automatic status calculation');
    console.log('  - OUT periods table');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();

