const bcrypt = require('bcrypt');
const pool = require('./src/config/database');

async function createAdminUser() {
  try {
    const name = 'Admin User';
    const email = 'admin@example.com';
    const password = 'admin123';
    const role = 'ADMIN';
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert admin user
    const result = await pool.query(
      'INSERT INTO employees (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    console.log('\nYou can now login with these credentials.');
    
    process.exit(0);
  } catch (error) {
    if (error.code === '23505') {
      console.log('⚠️  Admin user already exists!');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
    process.exit(1);
  }
}

createAdminUser();

