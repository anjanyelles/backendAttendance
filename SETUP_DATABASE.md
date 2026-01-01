# 🗄️ How to Set Up Database Tables in Railway

Since Railway's interface doesn't show a "Query" tab, here are **3 easy methods**:

---

## Method 1: Use Railway CLI (Easiest) ⭐

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Link to your project
```bash
railway link
```
Select your project when prompted.

### Step 4: Run the schema
```bash
railway run psql < src/config/schema.sql
```

**That's it!** Your tables will be created.

---

## Method 2: Use psql (Local PostgreSQL Client)

### Step 1: Get Database Connection String
1. In Railway, go to your **Postgres** service
2. Click **"Connect"** button (top right)
3. Copy the **"Connection URL"** (it looks like: `postgresql://postgres:password@host:port/railway`)

### Step 2: Run Schema Locally
```bash
# Replace the connection string with your actual one
psql "postgresql://postgres:password@host:port/railway" -f src/config/schema.sql
```

Or if you have the connection string in an environment variable:
```bash
psql $DATABASE_URL -f src/config/schema.sql
```

---

## Method 3: Use a Database Client (pgAdmin, DBeaver, etc.)

### Step 1: Get Connection Details
1. In Railway, go to your **Postgres** service
2. Click **"Connect"** button
3. Note down:
   - Host
   - Port
   - Database
   - User
   - Password

### Step 2: Connect with Database Client
1. Open your database client (pgAdmin, DBeaver, TablePlus, etc.)
2. Create a new connection with the details from Step 1
3. Connect to the database
4. Open a SQL query window
5. Copy the entire contents of `src/config/schema.sql`
6. Paste and execute

---

## Method 4: Use Node.js Script (If you have access)

Create a temporary script to run the schema:

```javascript
// run-schema.js
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const schema = fs.readFileSync('src/config/schema.sql', 'utf8');

pool.query(schema)
  .then(() => {
    console.log('✅ Database schema created successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
```

Then run:
```bash
node run-schema.js
```

---

## Quick Check: Verify Tables Were Created

After running any method above, verify the tables exist:

**Using Railway CLI:**
```bash
railway run psql -c "\dt"
```

**Using psql:**
```bash
psql $DATABASE_URL -c "\dt"
```

You should see these tables:
- employees
- attendance
- leave_requests
- regularization_requests
- office_settings

---

## Which Method Should You Use?

- **Method 1 (Railway CLI)** - Best if you're comfortable with command line
- **Method 2 (psql)** - Good if you have PostgreSQL installed locally
- **Method 3 (Database Client)** - Best if you prefer a visual interface
- **Method 4 (Node.js)** - Good if you want to automate it

---

## Troubleshooting

### ❌ "Command not found: railway"
- Install Railway CLI: `npm install -g @railway/cli`

### ❌ "psql: command not found"
- Install PostgreSQL locally, or use Method 1 or 3

### ❌ Connection refused
- Make sure your Railway PostgreSQL service is running
- Check the connection string is correct
- Verify you're using the right credentials

---

**After setting up tables, your backend should work!** 🎉

