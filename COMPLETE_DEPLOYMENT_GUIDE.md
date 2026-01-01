# 🚀 Complete Deployment Guide - From Start to Finish

## 📋 Understanding Your Code

### What Your Application Does

Your backend is an **Employee Attendance Management System** with these features:

1. **Employee Attendance Tracking**
   - Punch in/out with location validation (must be within 60m of office)
   - Wi-Fi validation (must be on office network)
   - Automatic punch-out if employee goes offline

2. **Leave Management**
   - Employees can apply for leave (Casual, Sick, WFH)
   - Two-level approval: Manager → HR

3. **Regularization Requests**
   - Employees can request attendance corrections for past dates
   - Same approval workflow as leave

4. **Role-Based Access Control**
   - **EMPLOYEE**: Punch in/out, view own attendance, apply leave
   - **MANAGER**: All employee features + view team, approve requests
   - **HR**: All manager features + final approval, reports
   - **ADMIN**: Full access, manage employees, configure office settings

### Tech Stack

- **Node.js** + **Express.js** - Web server framework
- **PostgreSQL** - Database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin requests

### Code Structure

```
src/
├── server.js              # Main server file (starts the app)
├── config/
│   ├── database.js        # Database connection
│   └── schema.sql         # Database tables (auto-creates on startup)
├── routes/                # API endpoints
│   ├── auth.js           # Login endpoint
│   ├── attendance.js     # Punch in/out endpoints
│   ├── leave.js          # Leave requests
│   ├── regularization.js # Regularization requests
│   ├── manager.js        # Manager endpoints
│   ├── hr.js             # HR endpoints
│   └── admin.js          # Admin endpoints
├── controllers/          # Business logic
├── middleware/           # Authentication & authorization
└── utils/                # Helper functions
```

### How It Works

1. **Server starts** → `src/server.js` runs
2. **Database connects** → Uses `DATABASE_URL` from environment
3. **Tables auto-create** → Checks if tables exist, creates if needed
4. **API starts** → Listens on port (Railway sets this automatically)
5. **Heartbeat checker** → Runs every 5 minutes to auto punch-out inactive employees

---

## 🎯 Complete Deployment Steps

### Step 1: Prepare Your Code

Make sure your code is ready:

```bash
# Check you're in the project directory
cd "/Users/anjanyelle/Desktop/untitled folder 15"

# Make sure all files are saved
git status

# Commit any changes
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

### Step 2: Create Railway Account & Project

1. Go to **https://railway.app**
2. Sign up/Login with **GitHub**
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository: **`anjanyelles/backendAttendance`**
6. Railway will automatically detect it's a Node.js project

---

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait ~30 seconds for PostgreSQL to be created
4. Note the service name (usually "Postgres" or "PostgreSQL")

---

### Step 4: Connect Database to Backend

1. Click on your **PostgreSQL service**
2. Go to **"Connect"** tab (or **"Variables"** tab)
3. Note the service name (e.g., "Postgres")

4. Click on your **backend service** (backendAttendance)
5. Go to **"Variables"** tab
6. Click **"New Variable"**
7. Set:
   - **Variable Name:** `DATABASE_URL`
   - **Variable Value:** `${{ Postgres.DATABASE_URL }}`
     - ⚠️ Replace `Postgres` with your actual PostgreSQL service name!
8. Click **"Add"**

Railway will automatically replace this with the actual connection string.

---

### Step 5: Set Required Environment Variables

In your **backend service** → **Variables** tab, add these:

#### 1. JWT_SECRET (Required)
- **Name:** `JWT_SECRET`
- **Value:** Generate a random secret:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Copy the output and paste as the value

#### 2. JWT_EXPIRES_IN (Required)
- **Name:** `JWT_EXPIRES_IN`
- **Value:** `24h`

#### 3. NODE_ENV (Required)
- **Name:** `NODE_ENV`
- **Value:** `production`

#### 4. Office Location Settings (Required)
- **Name:** `DEFAULT_OFFICE_LATITUDE`
- **Value:** `28.6139` (or your office latitude)

- **Name:** `DEFAULT_OFFICE_LONGITUDE`
- **Value:** `77.2090` (or your office longitude)

- **Name:** `DEFAULT_OFFICE_RADIUS`
- **Value:** `60` (meters - how close employees must be)

- **Name:** `DEFAULT_OFFICE_PUBLIC_IP`
- **Value:** `203.0.113.1` (your office's public IP address)

#### 5. Frontend URL (Optional but Recommended)
- **Name:** `FRONTEND_URL`
- **Value:** `https://your-frontend-domain.com` (if you have a frontend)

#### 6. PORT (Optional)
- Railway sets this automatically, but you can set it to `3000` if needed

---

### Step 6: Deploy!

Railway will automatically deploy when you:
- Push code to GitHub
- Add environment variables
- Connect services

**Or manually trigger:**
1. Go to **"Deployments"** tab
2. Click **"Redeploy"**

---

### Step 7: Verify Deployment

#### Check Logs

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**

You should see:
```
✅ Using DATABASE_URL connection string
✅ Connected to PostgreSQL database
📊 Database tables not found. Setting up database...
✅ Database schema created successfully!
Server is running on port <PORT>
Environment: production
✅ Production server running
```

#### Test the API

1. Get your app URL:
   - Go to backend service → **Settings** tab
   - Under **"Domains"**, you'll see your URL
   - Or Railway provides: `https://your-app-name.railway.app`

2. Test health endpoint:
   ```bash
   curl https://your-app-name.railway.app/health
   ```

   Should return:
   ```json
   {
     "success": true,
     "message": "Server is running",
     "timestamp": "..."
   }
   ```

---

## 📝 Environment Variables Summary

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection (auto from Railway) | `${{ Postgres.DATABASE_URL }}` |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens | Random 64-byte hex string |
| `JWT_EXPIRES_IN` | ✅ Yes | Token expiration time | `24h` |
| `NODE_ENV` | ✅ Yes | Environment mode | `production` |
| `DEFAULT_OFFICE_LATITUDE` | ✅ Yes | Office latitude | `28.6139` |
| `DEFAULT_OFFICE_LONGITUDE` | ✅ Yes | Office longitude | `77.2090` |
| `DEFAULT_OFFICE_RADIUS` | ✅ Yes | Geofence radius (meters) | `60` |
| `DEFAULT_OFFICE_PUBLIC_IP` | ✅ Yes | Office public IP | `203.0.113.1` |
| `FRONTEND_URL` | ⚠️ Optional | Frontend URL for CORS | `https://your-frontend.com` |
| `PORT` | ❌ No | Server port (Railway sets automatically) | `3000` |

---

## 🔍 How Your Code Works on Railway

### Startup Sequence

1. **Railway starts your app:**
   ```bash
   npm start  # Runs: node src/server.js
   ```

2. **Server.js loads:**
   - Loads environment variables
   - Connects to database (via `database.js`)
   - Checks if tables exist
   - Creates tables if needed (from `schema.sql`)
   - Starts Express server
   - Sets up heartbeat checker

3. **Database auto-setup:**
   - Your code checks if `employees` table exists
   - If not, runs `schema.sql` automatically
   - Creates all tables: employees, attendance, leave_requests, etc.

4. **Server ready:**
   - Listens on Railway's assigned port
   - API endpoints are available
   - Health check at `/health`

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-app.railway.app/health
```

### 2. Create Admin User

You need to create an admin user to use the system. You can:

**Option A: Use the create-admin-user.js script locally**
```bash
# Set DATABASE_URL temporarily
DATABASE_URL="your-railway-database-url" node create-admin-user.js
```

**Option B: Use SQL directly in Railway**
1. Go to PostgreSQL service → Query tab (if available)
2. Generate password hash:
   ```bash
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(console.log);"
   ```
3. Insert admin:
   ```sql
   INSERT INTO employees (name, email, password, role)
   VALUES ('Admin User', 'admin@example.com', 'HASHED_PASSWORD_HERE', 'ADMIN');
   ```

### 3. Test Login
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

Should return a JWT token!

---

## 🐛 Troubleshooting

### ❌ "Database password is not set"
- Make sure `DATABASE_URL` is set in backend Variables
- Verify the variable value is: `${{ Postgres.DATABASE_URL }}`
- Check PostgreSQL service name matches

### ❌ "Cannot find module"
- Make sure `package.json` is in root directory
- Check Railway build logs for npm install errors

### ❌ Database connection errors
- Verify PostgreSQL service is running
- Check `DATABASE_URL` is correctly set
- Make sure service connection is established

### ❌ Tables not created
- Check deployment logs for database setup messages
- Verify `schema.sql` exists in `src/config/`
- Check database connection is working

### ❌ App keeps restarting
- Check logs for errors
- Verify all required environment variables are set
- Make sure database is accessible

---

## 📊 API Endpoints

Once deployed, your API will have these endpoints:

### Authentication
- `POST /api/auth/login` - Login

### Attendance
- `POST /api/attendance/punch-in` - Punch in
- `POST /api/attendance/punch-out` - Punch out
- `GET /api/attendance/my` - Get own attendance

### Leave
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/my` - Get own leave requests

### Regularization
- `POST /api/regularization/apply` - Apply for regularization
- `GET /api/regularization/my` - Get own requests

### Manager
- `GET /api/manager/team-attendance` - View team attendance
- `GET /api/manager/leave-requests` - View team leave requests
- `PUT /api/manager/leave-requests/:id` - Approve/reject leave

### HR
- `GET /api/hr/leave-requests` - View all leave requests
- `PUT /api/hr/leave-requests/:id` - Final approval
- `GET /api/hr/reports` - Get reports

### Admin
- `POST /api/admin/employees` - Create employee
- `GET /api/admin/employees` - Get all employees
- `PUT /api/admin/office-settings` - Update office settings

**All endpoints (except login) require JWT token in header:**
```
Authorization: Bearer <your-jwt-token>
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] PostgreSQL service added
- [ ] DATABASE_URL variable set in backend
- [ ] JWT_SECRET generated and set
- [ ] JWT_EXPIRES_IN set to "24h"
- [ ] NODE_ENV set to "production"
- [ ] Office location variables set
- [ ] Deployment successful (green checkmark)
- [ ] Logs show database connected
- [ ] Logs show tables created
- [ ] Health check endpoint works
- [ ] Admin user created
- [ ] Login endpoint tested

---

## 🎉 You're Done!

Your backend is now live on Railway! 

**Next Steps:**
1. Create admin user
2. Configure office settings via Admin API
3. Create employees
4. Connect your frontend (if you have one)
5. Start using the system!

---

## 📚 Additional Resources

- **API Documentation:** See `API_ENDPOINTS.md`
- **Project Structure:** See `PROJECT_STRUCTURE.txt`
- **Quick Start:** See `QUICKSTART.md`

**Your API URL:** `https://your-app-name.railway.app`

Happy deploying! 🚀

