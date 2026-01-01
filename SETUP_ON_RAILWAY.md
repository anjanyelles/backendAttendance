# 🚀 Setup Database Directly on Railway

Since the internal URL only works from within Railway, here's how to set it up directly on Railway:

## Method 1: Add Setup Script to Railway (Easiest!)

### Step 1: Add a One-Time Setup Script

1. In Railway, go to your **backend service**
2. Go to **"Settings"** tab
3. Find **"Deploy Command"** or **"Start Command"**
4. Temporarily change it to:
   ```
   node setup-database.js && node src/server.js
   ```
5. Save and deploy
6. After deployment succeeds, change it back to:
   ```
   node src/server.js
   ```

This will run the setup script once when the service starts, then start your server.

---

## Method 2: Use Railway's One-Click Deploy Script

1. In Railway, go to your **backend service**
2. Go to **"Variables"** tab
3. Add a new variable:
   - **Name:** `RUN_SETUP`
   - **Value:** `true`
4. Update your `src/server.js` to check this variable and run setup if needed

---

## Method 3: Run Setup Script via Railway Shell (If Available)

If Railway provides a shell/console access:
1. Open Railway shell for your backend service
2. Run: `node setup-database.js`

---

## Method 4: Use a Database Migration on Startup

Update your server to automatically set up tables if they don't exist. This is the most robust solution!

---

## Quick Solution: Try Public URL First

Before trying the above, try the **public URL** in your terminal:

```bash
DATABASE_URL="postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@switchyard.proxy.rlwy.net:52622/railway" node setup-database.js
```

If this works, you're done! ✅

If it doesn't work (connection refused), then use Method 1 above.

---

## Recommended: Auto-Setup on Server Start

The best approach is to make your server automatically create tables if they don't exist. This way, the database is always set up correctly.

Would you like me to modify your `server.js` to automatically run the schema on startup if tables don't exist?

