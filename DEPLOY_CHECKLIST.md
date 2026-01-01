# ✅ Railway Deployment Checklist

Use this checklist to deploy your backend step by step.

## Pre-Deployment
- [ ] Code is pushed to GitHub (`git push origin main`)
- [ ] All changes are committed

## Railway Setup
- [ ] Created Railway account (login with GitHub)
- [ ] Created new project from GitHub repo
- [ ] Selected repository: `anjanyelles/backendAttendance`

## Database Setup
- [ ] Added PostgreSQL service to Railway project
- [ ] Created `DATABASE_URL` variable in backend service with value: `${{ Postgres.DATABASE_URL }}`
  - (Replace "Postgres" with your actual PostgreSQL service name)
- [ ] Ran database schema in PostgreSQL Query tab (`src/config/schema.sql`)

## Environment Variables
- [ ] Generated JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Added DATABASE_URL to backend Variables (value: `${{ Postgres.DATABASE_URL }}`)
- [ ] Added JWT_SECRET to backend Variables
- [ ] Added JWT_EXPIRES_IN=24h
- [ ] Added NODE_ENV=production
- [ ] Added DEFAULT_OFFICE_LATITUDE=28.6139
- [ ] Added DEFAULT_OFFICE_LONGITUDE=77.2090
- [ ] Added DEFAULT_OFFICE_RADIUS=60
- [ ] Added DEFAULT_OFFICE_PUBLIC_IP=203.0.113.1
- [ ] (Optional) Added FRONTEND_URL if you have a frontend

## Verification
- [ ] Deployment completed successfully (green checkmark ✅)
- [ ] Logs show: "✅ Using DATABASE_URL connection string"
- [ ] Logs show: "✅ Connected to PostgreSQL database"
- [ ] Logs show: "Server is running on port..."
- [ ] Health check works: `curl https://your-app.railway.app/health`
- [ ] Login endpoint works (test with admin credentials)

## Post-Deployment
- [ ] Saved app URL for frontend integration
- [ ] Created admin user (if not done already)
- [ ] Tested API endpoints

---

## Quick Commands

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Test Health:**
```bash
curl https://your-app.railway.app/health
```

**Test Login:**
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

---

**Your App URL:** `https://your-app-name.railway.app`

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

