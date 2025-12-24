# Quick Start Guide

## Step 1: Install Dependencies (if not already done)
```bash
npm install
```

## Step 2: Set Up PostgreSQL Database

### Option A: Using command line
```bash
# Create database
createdb attendance_db

# Run schema
psql -U postgres -d attendance_db -f src/config/schema.sql
```

### Option B: Using psql
```bash
psql -U postgres
```
Then in psql:
```sql
CREATE DATABASE attendance_db;
\q
```

Then run:
```bash
psql -U postgres -d attendance_db -f src/config/schema.sql
```

## Step 3: Configure Environment Variables

Edit the `.env` file with your database credentials:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_db
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h

DEFAULT_OFFICE_LATITUDE=28.6139
DEFAULT_OFFICE_LONGITUDE=77.2090
DEFAULT_OFFICE_RADIUS=60
DEFAULT_OFFICE_PUBLIC_IP=203.0.113.1
```

**Important:** Replace `your_actual_password_here` with your PostgreSQL password!

## Step 4: Create an Admin User (Optional)

You can create an admin user via SQL:

```bash
psql -U postgres -d attendance_db
```

Then run this SQL (replace password with your desired password):
```sql
-- First, generate a password hash using Node.js:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(console.log);"

-- Then insert (replace the hash with the one generated above):
INSERT INTO employees (name, email, password, role)
VALUES ('Admin User', 'admin@example.com', '$2b$10$YOUR_HASHED_PASSWORD_HERE', 'ADMIN');
```

Or use this Node.js script:
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(hash => console.log('INSERT INTO employees (name, email, password, role) VALUES (\'Admin User\', \'admin@example.com\', \'' + hash + '\', \'ADMIN\');'));"
```

## Step 5: Run the Application

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Step 6: Test the API

### Health Check:
```bash
curl http://localhost:3000/health
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

## Troubleshooting

### Database Connection Error
- Make sure PostgreSQL is running: `pg_isready`
- Check your database credentials in `.env`
- Verify database exists: `psql -U postgres -l | grep attendance_db`

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or kill the process using port 3000

### Module Not Found
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

## Next Steps

1. Test login endpoint
2. Create employees via Admin API
3. Configure office settings via Admin API
4. Start using the attendance system!

