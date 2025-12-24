const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const adminController = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// POST /api/admin/employees
router.post('/employees', adminController.createEmployee);

// GET /api/admin/employees
router.get('/employees', adminController.getEmployees);

// PUT /api/admin/employees/:id
router.put('/employees/:id', adminController.updateEmployee);

// DELETE /api/admin/employees/:id
router.delete('/employees/:id', adminController.deleteEmployee);

// GET /api/admin/office-settings
router.get('/office-settings', adminController.getOfficeSettings);

// PUT /api/admin/office-settings
router.put('/office-settings', adminController.updateOfficeSettings);

// GET /api/admin/reports
router.get('/reports', adminController.getReports);

// GET /api/admin/employee-attendance (must come before :employeeId route)
router.get('/employee-attendance', adminController.getEmployeeAttendanceSummary);

// GET /api/admin/employee-attendance/:employeeId
router.get('/employee-attendance/:employeeId', adminController.getEmployeeAttendanceDetails);

// GET /api/admin/monthly-attendance-calendar
router.get('/monthly-attendance-calendar', adminController.getMonthlyAttendanceCalendar);

// GET /api/admin/export-attendance-csv
router.get('/export-attendance-csv', adminController.exportMonthlyAttendanceCSV);

// Holidays management
router.get('/holidays', adminController.getHolidays);
router.post('/holidays', adminController.createHoliday);
router.put('/holidays/:id', adminController.updateHoliday);
router.delete('/holidays/:id', adminController.deleteHoliday);

// Leave requests (Admin can view all)
router.get('/leave-requests', adminController.getAllLeaveRequests);

module.exports = router;

