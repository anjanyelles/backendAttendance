# Next Steps - Explore the System

## ✅ What's Done
- ✅ Database setup complete
- ✅ Server running on http://localhost:3000
- ✅ Admin user created (admin@example.com / admin123)

## 🚀 Next Steps

### 1. Test the API

Run the test script:
```bash
chmod +x test-api.sh
./test-api.sh
```

Or test manually:

#### A. Create Employees
```bash
# Get your admin token first
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Create an Employee
curl -X POST http://localhost:3000/api/admin/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "EMPLOYEE"
  }'

# Create a Manager
curl -X POST http://localhost:3000/api/admin/employees \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Manager",
    "email": "jane@example.com",
    "password": "password123",
    "role": "MANAGER"
  }'

# Assign employee to manager
curl -X PUT http://localhost:3000/api/admin/employees/2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"managerId": 3}'
```

#### B. Configure Office Settings
```bash
# Update office location and IP
curl -X PUT http://localhost:3000/api/admin/office-settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "radiusMeters": 60,
    "officePublicIp": "YOUR_OFFICE_PUBLIC_IP"
  }'
```

**Important:** Replace `YOUR_OFFICE_PUBLIC_IP` with your actual office public IP address.

### 2. Test Attendance Features

#### A. Punch In (requires valid location and IP)
```bash
# Login as employee first
EMP_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Punch In (replace with actual coordinates and IP)
curl -X POST http://localhost:3000/api/attendance/punch-in \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "ipAddress": "YOUR_OFFICE_PUBLIC_IP"
  }'
```

#### B. View Attendance
```bash
curl -X GET "http://localhost:3000/api/attendance/my?month=12&year=2024" \
  -H "Authorization: Bearer $EMP_TOKEN"
```

### 3. Test Leave Workflow

#### A. Employee applies for leave
```bash
curl -X POST http://localhost:3000/api/leave/apply \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveType": "CASUAL",
    "fromDate": "2024-12-25",
    "toDate": "2024-12-26",
    "reason": "Holiday vacation"
  }'
```

#### B. Manager reviews
```bash
# Login as manager
MGR_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# View team leave requests
curl -X GET "http://localhost:3000/api/manager/leave-requests?status=PENDING" \
  -H "Authorization: Bearer $MGR_TOKEN"

# Approve leave request (replace :id with actual ID)
curl -X PUT http://localhost:3000/api/manager/leave-requests/1 \
  -H "Authorization: Bearer $MGR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

#### C. HR final approval
```bash
# Login as HR (create HR user first via Admin)
HR_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@example.com","password":"password123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Final approval
curl -X PUT http://localhost:3000/api/hr/leave-requests/1 \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

### 4. Test Regularization Workflow

Similar to leave workflow:
1. Employee applies for regularization
2. Manager reviews
3. HR final approval

### 5. View Reports

```bash
# HR Reports
curl -X GET "http://localhost:3000/api/hr/reports?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $HR_TOKEN"

# Export CSV
curl -X GET "http://localhost:3000/api/hr/reports/export?format=csv&month=12&year=2024" \
  -H "Authorization: Bearer $HR_TOKEN" \
  -o attendance_report.csv
```

## 📝 Important Notes

1. **Location Validation**: Punch in/out requires:
   - Valid coordinates within 60 meters of office
   - Matching office public IP address

2. **IP Address**: You need to know your office's public IP. You can:
   - Check via: `curl ifconfig.me`
   - Or use a service like https://whatismyipaddress.com

3. **Testing Location**: For testing, you can:
   - Temporarily set office location to your current location
   - Use your current public IP as office IP
   - Or disable validation for testing (not recommended for production)

## 🛠️ Useful Commands

```bash
# Get your current public IP
curl ifconfig.me

# Get your current location (if you have location services)
# Or use Google Maps to get coordinates

# Check server logs
# Look at terminal where you ran `npm start` or `npm run dev`
```

## 📚 Documentation

- See `API_ENDPOINTS.md` for all available endpoints
- See `README.md` for full documentation
- See `QUICKSTART.md` for setup instructions

