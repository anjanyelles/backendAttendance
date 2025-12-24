# Railway Deployment - Quick Fix

## The Problem

Your Railway deployment is failing because:

1. ✅ **Fixed:** Missing `.gitignore` file (causing `node_modules` warning)
2. ⚠️ **Action Required:** Missing environment variables in Railway
3. ⚠️ **Action Required:** Database schema may not be set up

## Immediate Fix Steps

### Step 1: Set Environment Variables in Railway

1. Go to your Railway project: https://railway.app
2. Click on your backend service
3. Go to the **Variables** tab
4. Add these required variables:

#### If using Railway PostgreSQL:
Railway automatically provides these when you add a PostgreSQL service. Check your PostgreSQL service's Variables tab and copy these values:
- `PGHOST` → Set as `DB_HOST`
- `PGPORT` → Set as `DB_PORT`  
- `PGDATABASE` → Set as `DB_NAME`
- `PGUSER` → Set as `DB_USER`
- `PGPASSWORD` → Set as `DB_PASSWORD`

#### Required Application Variables:
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

### Step 2: Set Up Database Schema

After adding the PostgreSQL service and setting variables:

1. Go to your PostgreSQL service in Railway
2. Click the **Query** tab
3. Copy the entire contents of `src/config/schema.sql`
4. Paste and execute it

### Step 3: Redeploy

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
- "DB_PASSWORD is not set" → Add database variables
- "Cannot find module" → Check package.json is in root
- Database connection errors → Verify schema is set up and variables are correct

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

