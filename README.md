# Gatnix - Backend

A comprehensive backend API for managing employee attendance with location and Wi-Fi validation, role-based access control, and leave/regularization workflows.

## Features

- **Location Validation**: Employees must be within 60 meters of the office to punch in/out
- **Wi-Fi Validation**: Employees must be connected to office Wi-Fi (validated via public IP)
- **Role-Based Access Control**: Four roles (EMPLOYEE, MANAGER, HR, ADMIN) with different permissions
- **Leave Management**: Multi-level approval workflow (Manager → HR)
- **Regularization**: Request attendance corrections for past dates
- **JWT Authentication**: Secure token-based authentication
- **PostgreSQL Database**: Robust relational database with proper indexing

## Tech Stack

- Node.js (v18+)
- Express.js
- PostgreSQL
- JWT Authentication
- bcrypt (password hashing)
- dotenv (environment variables)

## Prerequisites

- Node.js v18 or higher
- PostgreSQL 12 or higher
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd attendance-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb attendance_db
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE attendance_db;
   ```

4. **Run database schema**
   ```bash
   psql -U postgres -d attendance_db -f src/config/schema.sql
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=attendance_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=24h
   
   DEFAULT_OFFICE_LATITUDE=28.6139
   DEFAULT_OFFICE_LONGITUDE=77.2090
   DEFAULT_OFFICE_RADIUS=60
   DEFAULT_OFFICE_PUBLIC_IP=203.0.113.1
   ```

6. **Create an admin user** (optional - you can do this via API after starting server)
   ```sql
   INSERT INTO employees (name, email, password, role)
   VALUES ('Admin User', 'admin@example.com', '$2b$10$hashed_password_here', 'ADMIN');
   ```
   
   To generate a hashed password, you can use Node.js:
   ```javascript
   const bcrypt = require('bcrypt');
   bcrypt.hash('your_password', 10).then(console.log);
   ```

## Running the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email and password

### Employee Attendance

- `POST /api/attendance/punch-in` - Punch in (requires location and IP validation)
- `POST /api/attendance/punch-out` - Punch out (requires location and IP validation)
- `GET /api/attendance/my?month=11&year=2024` - Get own attendance history

### Employee Leave

- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/my?status=PENDING` - Get own leave requests

### Employee Regularization

- `POST /api/regularization/apply` - Apply for attendance regularization
- `GET /api/regularization/my` - Get own regularization requests

### Manager

- `GET /api/manager/team-attendance?month=11&year=2024` - View team attendance
- `GET /api/manager/leave-requests?status=PENDING` - View team leave requests
- `PUT /api/manager/leave-requests/:id` - Approve/reject leave request
- `GET /api/manager/regularization-requests?status=PENDING` - View team regularization requests
- `PUT /api/manager/regularization-requests/:id` - Approve/reject regularization request

### HR

- `GET /api/hr/leave-requests?status=MANAGER_APPROVED` - View all leave requests
- `PUT /api/hr/leave-requests/:id` - Final approval/rejection of leave
- `GET /api/hr/regularization-requests?status=MANAGER_APPROVED` - View all regularization requests
- `PUT /api/hr/regularization-requests/:id` - Final approval/rejection of regularization
- `GET /api/hr/reports?startDate=2024-01-01&endDate=2024-12-31` - Get attendance reports
- `GET /api/hr/reports/export?format=csv&month=11&year=2024` - Export attendance as CSV

### Admin

- `POST /api/admin/employees` - Create employee
- `GET /api/admin/employees?role=EMPLOYEE&isActive=true` - Get all employees
- `PUT /api/admin/employees/:id` - Update employee
- `DELETE /api/admin/employees/:id` - Disable employee
- `GET /api/admin/office-settings` - Get office settings
- `PUT /api/admin/office-settings` - Update office settings
- `GET /api/admin/reports?type=attendance&startDate=2024-01-01` - Get system reports

## Authentication

All endpoints except `/api/auth/login` require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Request/Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {...}
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Business Rules

### Location Validation
- Uses Haversine formula to calculate distance
- Employee must be within configured radius (default: 60 meters) of office location
- Both latitude and longitude are validated

### Wi-Fi Validation
- Compares request IP address with configured office public IP
- Must match exactly (VPN connections will be rejected)

### Punch In/Out Rules
- Employee can punch in only once per day
- Punch out allowed only if punch in exists for that day
- Both location AND Wi-Fi must be valid

### Leave Workflow
1. Employee submits leave request (status: PENDING)
2. Manager reviews and approves/rejects (status: MANAGER_APPROVED or REJECTED)
3. HR reviews manager-approved requests (status: HR_APPROVED or REJECTED)
4. Once HR_APPROVED, attendance is automatically marked

### Regularization Workflow
1. Employee submits regularization request for past date (status: PENDING)
2. Manager reviews and approves/rejects (status: MANAGER_APPROVED or REJECTED)
3. HR reviews manager-approved requests (status: HR_APPROVED or REJECTED)
4. Once HR_APPROVED, attendance record is updated

## Role Permissions

### EMPLOYEE
- Punch in/out
- View own attendance
- Apply for leave
- Apply for regularization

### MANAGER (includes EMPLOYEE permissions)
- View team attendance
- View team leave/regularization requests
- Approve/reject team requests

### HR (includes MANAGER permissions)
- Final approval of all leave/regularization requests
- View company-wide reports
- Export attendance data

### ADMIN (full access)
- Manage employees
- Configure office settings
- View all reports
- Override attendance (if implemented)

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with expiration
- Parameterized queries (SQL injection prevention)
- Input validation
- Role-based access control
- Generic error messages (no internal details exposed)

## Project Structure

```
attendance-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── schema.sql
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   ├── leave.js
│   │   ├── regularization.js
│   │   ├── manager.js
│   │   ├── hr.js
│   │   └── admin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   ├── leaveController.js
│   │   ├── regularizationController.js
│   │   ├── managerController.js
│   │   ├── hrController.js
│   │   └── adminController.js
│   ├── utils/
│   │   ├── haversine.js
│   │   └── validators.js
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Testing

You can test the API using tools like:
- Postman
- cURL
- Thunder Client (VS Code extension)
- REST Client

Example login request:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

## Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Notes

- Office settings can be configured via Admin API
- Default office location and IP are set in environment variables
- All timestamps are stored in UTC
- Passwords are never logged or returned in responses
- JWT secret should be changed in production

## License

ISC

