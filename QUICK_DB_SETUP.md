# 🚀 Quick Database Setup - Step by Step

Follow these exact steps:

## Step 1: Complete Railway CLI Login

Run this command in your terminal:
```bash
railway login
```

This will open a browser window. **Click "Authorize"** in the browser to complete login.

---

## Step 2: Link to Your Railway Project

After login, run:
```bash
railway link
```

Select your project when prompted (it should show "unique-embrace" or your project name).

---

## Step 3: Run Database Schema

Once linked, run:
```bash
railway run psql < src/config/schema.sql
```

**That's it!** Your database tables will be created.

---

## Alternative: If Railway CLI Doesn't Work

### Option A: Get DATABASE_URL from Railway Dashboard

1. Go to Railway dashboard: https://railway.app
2. Click on your **backend service** (backendAttendance)
3. Go to **Variables** tab
4. Find `DATABASE_URL` - click the eye icon to reveal it
5. Copy the entire connection string (starts with `postgresql://...`)

6. Run this command (replace with your actual connection string):
```bash
DATABASE_URL="postgresql://postgres:password@host:port/railway" node setup-database.js
```

**Important:** Replace the entire connection string with your actual one from Railway!

### Option B: Use a Database Client

1. In Railway, go to your **Postgres** service
2. Click **"Connect"** button
3. Copy the connection details
4. Use pgAdmin, DBeaver, or TablePlus to connect
5. Run the SQL from `src/config/schema.sql`

---

## Verify It Worked

After running the schema, verify tables exist:

**Using Railway CLI:**
```bash
railway run psql -c "\dt"
```

You should see:
- employees
- attendance  
- leave_requests
- regularization_requests
- office_settings

---

## Troubleshooting

### ❌ "Unauthorized. Please login"
- Run `railway login` and complete the browser authorization

### ❌ "getaddrinfo ENOTFOUND base"
- You're using a placeholder connection string
- Get the real DATABASE_URL from Railway Variables tab
- Make sure to copy the ENTIRE connection string

### ❌ "Could not read schema.sql"
- Make sure you're in the project root directory
- Verify `src/config/schema.sql` exists

---

**After tables are created, your backend will work!** 🎉

