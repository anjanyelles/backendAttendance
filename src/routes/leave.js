const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const leaveController = require('../controllers/leaveController');

// All routes require authentication
router.use(authenticate);

// POST /api/leave/apply
router.post('/apply', leaveController.applyForLeave);

// GET /api/leave/my
router.get('/my', leaveController.getMyLeaveRequests);

module.exports = router;

