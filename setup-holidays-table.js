/**
 * Script to create the holidays table in the database
 * Run this once: node setup-holidays-table.js
 */

require('dotenv').config();
const pool = require('./src/config/database');

async function setupHolidaysTable() {
  try {
    console.log('Creating holidays table...');
    
    // Create holidays table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INTEGER REFERENCES employees(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date)
    `);
    
    console.log('✅ Holidays table created successfully!');
    console.log('✅ Index created successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating holidays table:', error.message);
    process.exit(1);
  }
}

setupHolidaysTable();

