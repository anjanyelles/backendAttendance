# 🚀 Simple Deployment Guide - Railway

This guide will help you deploy your attendance management backend to Railway in simple steps.

## What This Backend Does

- Employee attendance tracking (punch in/out)
- Leave management system
- Role-based access (Employee, Manager, HR, Admin)
- Location and Wi-Fi validation
- RESTful API with JWT authentication

---

## Step 1: Push Code to GitHub ✅

Your code is already on GitHub at: `https://github.com/anjanyelles/backendAttendance.git`

Make sure all your changes are committed and pushed:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Step 2: Create Railway Account & Project

1. Go to **https://railway.app**
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository: **`anjanyelles/backendAttendance`**
6. Railway will automatically detect it's a Node.js project

---

## Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait for PostgreSQL to be created (takes ~30 seconds)
4. **Important:** Note the PostgreSQL service name (e.g., "PostgreSQL")

---

## Step 4: Connect Database to Backend

1. Click on your **PostgreSQL service** in Railway
2. Go to **"Connect"** tab (or **"Variables"** tab)
3. You'll see connection instructions. Note the service name (e.g., "Postgres" or "PostgreSQL")
4. Click on your **backend service** (the one with your code)
5. Go to **"Variables"** tab
6. Click **"New Variable"**
7. **Variable Name:** `DATABASE_URL`
8. **Variable Value:** `${{ Postgres.DATABASE_URL }}`
   - Replace `Postgres` with your actual PostgreSQL service name if different
   - This references the PostgreSQL service's DATABASE_URL automatically
9. Click **"Add"**

**Note:** Railway will automatically replace `${{ Postgres.DATABASE_URL }}` with the actual connection string from your PostgreSQL service.

---

## Step 5: Set Environment Variables

1. Click on your **backend service**
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these one by one:

### Required Variables:

```
JWT_SECRET=<generate-this-secret>
```

**To generate JWT_SECRET, run this locally:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as the value.

```
JWT_EXPIRES_IN=24h
NODE_ENV=production
DEFAULT_OFFICE_LATITUDE=28.6139
DEFAULT_OFFICE_LONGITUDE=77.2090
DEFAULT_OFFICE_RADIUS=60
DEFAULT_OFFICE_PUBLIC_IP=203.0.113.1
```

**Important:** You should have already set `DATABASE_URL` in Step 4. Your code automatically uses this connection string, so you don't need to set individual database variables (DB_HOST, DB_PORT, etc.)!

---

## Step 6: Set Up Database Tables

1. Go to your **PostgreSQL service** in Railway
2. Click **"Query"** tab
3. Open `src/config/schema.sql` from your project
4. Copy **ALL** the SQL code from that file
5. Paste it into the Query tab
6. Click **"Run"** or press `Ctrl+Enter`
7. You should see "Success" message

---

## Step 7: Create Admin User (Optional)

After setting up tables, create an admin user:

1. In the PostgreSQL Query tab, run this (replace password hash):

```sql
-- First, generate password hash locally:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(console.log);"

-- Then insert admin (replace HASHED_PASSWORD with the hash from above):
INSERT INTO employees (name, email, password, role)
VALUES ('Admin User', 'admin@example.com', 'HASHED_PASSWORD_HERE', 'ADMIN');
```

**Or use the create-admin-user.js script:**
```bash
# Run locally (make sure .env has database connection)
node create-admin-user.js
```

---

## Step 8: Deploy & Test

1. Railway will **automatically deploy** when you:
   - Push code to GitHub
   - Add environment variables
   - Connect services

2. Check deployment status:
   - Go to **"Deployments"** tab
   - Wait for build to complete (green checkmark ✅)

3. Get your app URL:
   - Click **"Settings"** tab
   - Under **"Domains"**, you'll see your app URL
   - Or Railway provides: `https://your-app-name.railway.app`

4. Test the API:
   ```bash
   # Health check
   curl https://your-app-name.railway.app/health
   
   # Should return:
   # {"success":true,"message":"Server is running",...}
   ```

---

## Step 9: Verify Everything Works

### Check Logs:
1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. You should see:
   ```
   ✅ Using DATABASE_URL connection string
   ✅ Connected to PostgreSQL database
   Server is running on port <PORT>
   Environment: production
   ```

### Test Login:
```bash
curl -X POST https://your-app-name.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

If successful, you'll get a JWT token!

---

## 🎉 You're Done!

Your backend is now live on Railway!

### Quick Reference:

- **App URL:** `https://your-app-name.railway.app`
- **Health Check:** `https://your-app-name.railway.app/health`
- **API Base:** `https://your-app-name.railway.app/api`

---

## Troubleshooting

### ❌ "Database password is not set"
- Make sure you created `DATABASE_URL` variable in Step 4
- Verify the variable value is: `${{ Postgres.DATABASE_URL }}` (replace "Postgres" with your service name)
- Check that your PostgreSQL service name matches in the variable reference

### ❌ "Cannot find module"
- Make sure `package.json` is in the root directory
- Check build logs for npm install errors

### ❌ Database connection errors
- Verify database schema was run (Step 6)
- Check PostgreSQL service is running
- Verify service connection (Step 4)

### ❌ App keeps restarting
- Check logs for errors
- Verify all environment variables are set
- Make sure database tables exist

---

## Next Steps

1. **Update Frontend:** Point your frontend to the Railway URL
2. **Set CORS:** Add your frontend URL to `FRONTEND_URL` variable if needed
3. **Monitor:** Use Railway's metrics to monitor your app
4. **Backup:** Railway automatically backs up your PostgreSQL database

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Auto | Provided by Railway PostgreSQL |
| `JWT_SECRET` | ✅ Yes | Random secret for JWT tokens |
| `JWT_EXPIRES_IN` | ✅ Yes | Token expiration (e.g., "24h") |
| `NODE_ENV` | ✅ Yes | Set to "production" |
| `DEFAULT_OFFICE_LATITUDE` | ✅ Yes | Office latitude |
| `DEFAULT_OFFICE_LONGITUDE` | ✅ Yes | Office longitude |
| `DEFAULT_OFFICE_RADIUS` | ✅ Yes | Radius in meters (e.g., 60) |
| `DEFAULT_OFFICE_PUBLIC_IP` | ✅ Yes | Office public IP address |
| `FRONTEND_URL` | ⚠️ Optional | Frontend URL for CORS |
| `PORT` | ❌ No | Railway sets this automatically |

---

## Support

If you encounter issues:
1. Check Railway logs
2. Verify all steps above
3. Check `src/config/database.js` for connection logic
4. Review `README.md` for API documentation

**Happy Deploying! 🚀**

