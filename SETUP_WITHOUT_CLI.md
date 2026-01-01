# 🗄️ Setup Database WITHOUT Railway CLI

If Railway CLI login is giving you trouble, use this method instead:

## Step 1: Get DATABASE_URL from Railway Dashboard

1. Go to **https://railway.app**
2. Click on your **backend service** (backendAttendance)
3. Go to **"Variables"** tab
4. Find **`DATABASE_URL`** in the list
5. Click the **eye icon** 👁️ to reveal the value
6. **Copy the ENTIRE connection string** (it looks like: `postgresql://postgres:password@host:port/railway`)

## Step 2: Run the Setup Script

In your terminal, run this command (replace with your actual DATABASE_URL):

```bash
DATABASE_URL="paste-your-actual-connection-string-here" node setup-database.js
```

**Example:**
```bash
DATABASE_URL="postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@postgres.railway.internal:5432/railway" node setup-database.js
```

**Important:** 
- Replace the entire connection string with your actual one
- Keep the quotes around it
- Make sure there are no extra spaces

## Step 3: Verify It Worked

You should see:
```
🔌 Connecting to database...
📄 Schema file loaded
🚀 Creating database tables...
✅ Database schema created successfully!

📊 Tables created:
  - employees
  - attendance
  - leave_requests
  - regularization_requests
  - office_settings
```

## Alternative: Save to .env File

If you prefer, you can save the DATABASE_URL to a .env file:

1. Create/edit `.env` file in your project root:
```bash
echo 'DATABASE_URL=your-actual-connection-string-here' > .env
```

2. Then run:
```bash
node setup-database.js
```

**Note:** Make sure `.env` is in your `.gitignore` (it already is) so you don't commit secrets!

---

## Troubleshooting

### ❌ "getaddrinfo ENOTFOUND base"
- You're using placeholder text instead of the real connection string
- Get the actual DATABASE_URL from Railway Variables tab
- Make sure you copied the ENTIRE string

### ❌ "Connection refused" or "ENOTFOUND"
- Check that your Railway PostgreSQL service is running
- Verify the connection string is correct
- Make sure you copied the entire string including `postgresql://`

### ❌ "password authentication failed"
- The connection string might be expired
- Go back to Railway and get a fresh DATABASE_URL
- Make sure you're copying from the backend service Variables, not the Postgres service

---

**After this works, your database will be ready and your backend should work!** 🎉

