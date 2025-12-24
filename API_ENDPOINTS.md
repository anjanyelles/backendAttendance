# Available API Endpoints

## Base URL: `http://localhost:3000`

## Health Check
- `GET /health` - Check if server is running

## Authentication
- `POST /api/auth/login` - Login with email and password

## Employee Attendance (requires authentication)
- `POST /api/attendance/punch-in` - Punch in
- `POST /api/attendance/punch-out` - Punch out
- `GET /api/attendance/my` - Get own attendance

## Employee Leave (requires authentication)
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/my` - Get own leave requests

## Employee Regularization (requires authentication)
- `POST /api/regularization/apply` - Apply for regularization
- `GET /api/regularization/my` - Get own regularization requests

## Manager Routes (requires authentication + MANAGER role)
- `GET /api/manager/team-attendance` - View team attendance
- `GET /api/manager/leave-requests` - View team leave requests
- `PUT /api/manager/leave-requests/:id` - Approve/reject leave
- `GET /api/manager/regularization-requests` - View team regularization requests
- `PUT /api/manager/regularization-requests/:id` - Approve/reject regularization

## HR Routes (requires authentication + HR role)
- `GET /api/hr/leave-requests` - View all leave requests
- `PUT /api/hr/leave-requests/:id` - Final approval/rejection
- `GET /api/hr/regularization-requests` - View all regularization requests
- `PUT /api/hr/regularization-requests/:id` - Final approval/rejection
- `GET /api/hr/reports` - Get attendance reports
- `GET /api/hr/reports/export` - Export CSV

## Admin Routes (requires authentication + ADMIN role)
- `POST /api/admin/employees` - Create employee
- `GET /api/admin/employees` - Get all employees
- `PUT /api/admin/employees/:id` - Update employee
- `DELETE /api/admin/employees/:id` - Disable employee
- `GET /api/admin/office-settings` - Get office settings
- `PUT /api/admin/office-settings` - Update office settings
- `GET /api/admin/reports` - Get system reports

