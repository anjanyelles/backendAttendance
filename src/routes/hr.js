const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { requireHR } = require('../middleware/roleCheck');
const hrController = require('../controllers/hrController');

// All routes require authentication and HR role
router.use(authenticate);
router.use(requireHR);

// GET /api/hr/leave-requests
router.get('/leave-requests', hrController.getLeaveRequests);

// PUT /api/hr/leave-requests/:id
router.put('/leave-requests/:id', hrController.reviewLeaveRequest);

// GET /api/hr/regularization-requests
router.get('/regularization-requests', hrController.getRegularizationRequests);

// PUT /api/hr/regularization-requests/:id
router.put('/regularization-requests/:id', hrController.reviewRegularizationRequest);

// GET /api/hr/reports
router.get('/reports', hrController.getReports);

// GET /api/hr/reports/export
router.get('/reports/export', hrController.exportReports);

module.exports = router;

