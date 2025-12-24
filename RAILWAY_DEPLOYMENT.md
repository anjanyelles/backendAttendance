# Railway Deployment Guide

## Required Environment Variables

You must configure these environment variables in your Railway project settings:

### Database Configuration
```
DB_HOST=<your-railway-postgres-host>
DB_PORT=5432
DB_NAME=railway
DB_USER=postgres
DB_PASSWORD=<your-railway-postgres-password>
```

**Note:** If you're using Railway's PostgreSQL service, these values are automatically provided. Check your Railway PostgreSQL service's "Variables" tab for the connection details.

### Application Configuration
```
PORT=3000
NODE_ENV=production
```

**Note:** Railway automatically sets the `PORT` environment variable, so you may not need to set this manually.

### JWT Configuration
```
JWT_SECRET=<generate-a-random-secret-key>
JWT_EXPIRES_IN=24h
```

**To generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Office Location Configuration
```
DEFAULT_OFFICE_LATITUDE=28.6139
DEFAULT_OFFICE_LONGITUDE=77.2090
DEFAULT_OFFICE_RADIUS=60
DEFAULT_OFFICE_PUBLIC_IP=203.0.113.1
```

**Note:** Update these values to match your actual office location and public IP.

### CORS Configuration (Optional)
```
FRONTEND_URL=https://your-frontend-domain.com
```

If you have a frontend deployed, add its URL here. You can add multiple URLs separated by commas.

## Setting Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Click "New Variable" for each required variable
5. Add the variable name and value
6. Save and redeploy

## Database Setup on Railway

If you're using Railway's PostgreSQL service:

1. Add a PostgreSQL service to your Railway project
2. Railway will automatically provide connection variables
3. You need to run the database schema manually:

### Option 1: Using Railway CLI
```bash
railway connect
railway run psql $DATABASE_URL -f src/config/schema.sql
```

### Option 2: Using Railway's Database Tab
1. Go to your PostgreSQL service in Railway
2. Click "Query" tab
3. Copy and paste the contents of `src/config/schema.sql`
4. Execute the query

### Option 3: Using a one-time script
Create a temporary script to run the schema, then remove it after deployment.

## Troubleshooting

### Error: "DB_PASSWORD is not set"
- Make sure you've added all database environment variables in Railway
- Check that variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Error: "Cannot find module"
- Make sure `package.json` is in the root directory
- Railway should automatically run `npm ci` during build
- Check build logs for any npm install errors

### Database Connection Errors
- Verify your PostgreSQL service is running in Railway
- Check that all database environment variables are set correctly
- Ensure the database schema has been run

### Port Errors
- Railway automatically sets the PORT variable
- Make sure your server.js uses `process.env.PORT || 3000`

## Quick Checklist

- [ ] All environment variables are set in Railway
- [ ] Database schema has been executed
- [ ] `.gitignore` includes `node_modules` (to avoid build warnings)
- [ ] JWT_SECRET is set to a secure random value
- [ ] Office location variables are configured
- [ ] Frontend URL is set (if applicable)

