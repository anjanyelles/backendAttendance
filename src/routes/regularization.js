const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const regularizationController = require('../controllers/regularizationController');

// All routes require authentication
router.use(authenticate);

// POST /api/regularization/apply
router.post('/apply', regularizationController.applyForRegularization);

// GET /api/regularization/my
router.get('/my', regularizationController.getMyRegularizationRequests);

module.exports = router;

