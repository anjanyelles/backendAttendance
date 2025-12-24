# Railway Deployment - Quick Fix

## The Problem

Your Railway deployment is failing because:

1. ✅ **Fixed:** Missing `.gitignore` file (causing `node_modules` warning)
2. ⚠️ **Action Required:** Missing environment variables in Railway
3. ⚠️ **Action Required:** Database schema may not be set up

## Immediate Fix Steps

### Step 1: Connect PostgreSQL Service (if not already connected)

1. Go to your Railway project: https://railway.app
2. If you don't have a PostgreSQL service, add one:
   - Click **+ New** → **Database** → **Add PostgreSQL**
3. **Link the PostgreSQL service to your backend service:**
   - Click on your backend service
   - Go to **Settings** tab
   - Under **Service Connections**, connect your PostgreSQL service
   - This automatically shares the database variables (PGHOST, PGPORT, etc.)

**✅ Good news:** The code now automatically supports Railway's PostgreSQL variables (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`) and `DATABASE_URL`, so you don't need to manually copy them!

### Step 2: Set Application Environment Variables

1. Click on your backend service
2. Go to the **Variables** tab
3. Add these required variables:

```
JWT_SECRET=<generate-a-random-secret>
JWT_EXPIRES_IN=24h
DEFAULT_OFFICE_LATITUDE=28.6139
DEFAULT_OFFICE_LONGITUDE=77.2090
DEFAULT_OFFICE_RADIUS=60
DEFAULT_OFFICE_PUBLIC_IP=203.0.113.1
NODE_ENV=production
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Note:** If Railway PostgreSQL variables aren't automatically available, you can also set `DATABASE_URL` instead. Railway often provides this in the PostgreSQL service's Variables tab.

### Step 3: Set Up Database Schema

After adding the PostgreSQL service and setting variables:

1. Go to your PostgreSQL service in Railway
2. Click the **Query** tab
3. Copy the entire contents of `src/config/schema.sql`
4. Paste and execute it

### Step 4: Redeploy

After setting all variables:
1. Railway will automatically redeploy, OR
2. Go to **Deployments** tab and click **Redeploy**

## Verify It's Working

Once deployed, check the logs. You should see:
```
Server is running on port <PORT>
Environment: production
Connected to PostgreSQL database
```

Test the health endpoint:
```bash
curl https://your-railway-app.railway.app/health
```

## Still Having Issues?

Check the deployment logs for:
- "Database password is not set" → Connect PostgreSQL service to backend service, or set DATABASE_URL
- "Cannot find module" → Check package.json is in root
- Database connection errors → Verify schema is set up and PostgreSQL service is connected

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

