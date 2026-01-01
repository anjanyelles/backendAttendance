# 🎯 EASIEST Way to Setup Database (No CLI Needed!)

Skip the Railway CLI login hassle. Use this method instead:

## Step 1: Get DATABASE_URL from Railway

1. Open your browser and go to: **https://railway.app**
2. Click on your **backend service** (the one named "backendAttendance")
3. Click the **"Variables"** tab
4. Find **`DATABASE_URL`** in the list
5. Click the **eye icon** 👁️ next to it to reveal the value
6. **Copy the ENTIRE connection string**

It should look something like:
```
postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@postgres.railway.internal:5432/railway
```

## Step 2: Run This Command

In your terminal, paste this command and replace `YOUR_CONNECTION_STRING` with what you copied:

```bash
DATABASE_URL="YOUR_CONNECTION_STRING" node setup-database.js
```

**Example (replace with YOUR actual string):**
```bash
DATABASE_URL="postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@postgres.railway.internal:5432/railway" node setup-database.js
```

## Step 3: Done! ✅

You should see:
```
🔌 Connecting to database...
📄 Schema file loaded
🚀 Creating database tables...
✅ Database schema created successfully!
```

---

## That's It!

No CLI login needed. No browserless authentication. Just:
1. Copy DATABASE_URL from Railway
2. Run the command
3. Done!

Your database tables will be created and your backend will work! 🎉

