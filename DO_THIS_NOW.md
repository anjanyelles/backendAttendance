# ✅ DO THIS NOW - Simple Database Setup

Skip the CLI login. Follow these 3 steps:

## Step 1: Get DATABASE_URL from Railway Dashboard

1. **Open your browser**
2. Go to: **https://railway.app**
3. Click on your **backend service** (named "backendAttendance")
4. Click the **"Variables"** tab at the top
5. Find **`DATABASE_URL`** in the list
6. Click the **👁️ eye icon** next to it to reveal the hidden value
7. **Copy the ENTIRE connection string** (starts with `postgresql://...`)

## Step 2: Run This Command

Open your terminal and run this command. **Replace the connection string** with what you copied:

```bash
DATABASE_URL="paste-your-connection-string-here" node setup-database.js
```

**Make sure to:**
- Keep the quotes `""` around the connection string
- Replace `paste-your-connection-string-here` with your actual string
- No extra spaces

## Step 3: Check the Results

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

---

## Example

If your DATABASE_URL is:
```
postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@postgres.railway.internal:5432/railway
```

Then run:
```bash
DATABASE_URL="postgresql://postgres:rbJEfHJiOQdcZyhjPTzafPsdYgYDUOwl@postgres.railway.internal:5432/railway" node setup-database.js
```

---

## That's It! 🎉

No CLI needed. No login issues. Just copy, paste, and run!

After this works, your database will be ready and your backend will work perfectly.

