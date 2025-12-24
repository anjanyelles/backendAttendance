const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// All routes require authentication
router.use(authenticate);

// POST /api/attendance/validate-location (pre-check before punch-in)
router.post('/validate-location', attendanceController.validateLocation);

// POST /api/attendance/punch-in
router.post('/punch-in', attendanceController.punchIn);

// POST /api/attendance/punch-out
router.post('/punch-out', attendanceController.punchOut);

// GET /api/attendance/today
router.get('/today', attendanceController.getTodayStatus);

// GET /api/attendance/my
router.get('/my', attendanceController.getMyAttendance);

// GET /api/attendance/my-calendar
router.get('/my-calendar', attendanceController.getMyMonthlyCalendar);

module.exports = router;

