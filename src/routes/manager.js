const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { requireManager } = require('../middleware/roleCheck');
const managerController = require('../controllers/managerController');

// All routes require authentication and manager role
router.use(authenticate);
router.use(requireManager);

// GET /api/manager/team-attendance
router.get('/team-attendance', managerController.getTeamAttendance);

// GET /api/manager/leave-requests
router.get('/leave-requests', managerController.getTeamLeaveRequests);

// PUT /api/manager/leave-requests/:id
router.put('/leave-requests/:id', managerController.reviewLeaveRequest);

// GET /api/manager/regularization-requests
router.get('/regularization-requests', managerController.getTeamRegularizationRequests);

// PUT /api/manager/regularization-requests/:id
router.put('/regularization-requests/:id', managerController.reviewRegularizationRequest);

module.exports = router;

