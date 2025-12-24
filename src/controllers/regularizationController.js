const pool = require('../config/database');
const { isValidDate, isPastDate } = require('../utils/validators');

/**
 * Apply for regularization
 */
const applyForRegularization = async (req, res) => {
  try {
    const { attendanceDate, requestedPunchIn, requestedPunchOut, reason } = req.body;
    const employeeId = req.user.id;
    
    // Validate input
    if (!attendanceDate || !requestedPunchIn || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Attendance date, requested punch in time, and reason are required',
      });
    }
    
    if (!isValidDate(attendanceDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }
    
    // Check if date is in the past
    if (!isPastDate(attendanceDate)) {
      return res.status(400).json({
        success: false,
        error: 'Regularization can only be requested for past dates',
      });
    }
    
    // Validate timestamps
    const punchIn = new Date(requestedPunchIn);
    const punchOut = requestedPunchOut ? new Date(requestedPunchOut) : null;
    
    if (isNaN(punchIn.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid punch in timestamp',
      });
    }
    
    if (punchOut && isNaN(punchOut.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid punch out timestamp',
      });
    }
    
    if (punchOut && punchIn >= punchOut) {
      return res.status(400).json({
        success: false,
        error: 'Punch in must be before punch out',
      });
    }
    
    // Insert regularization request
    const result = await pool.query(
      'INSERT INTO regularization_requests (employee_id, attendance_date, requested_punch_in, requested_punch_out, reason, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employeeId, attendanceDate, requestedPunchIn, requestedPunchOut || null, reason, 'PENDING']
    );
    
    res.status(201).json({
      success: true,
      message: 'Regularization request submitted successfully',
      request: result.rows[0],
    });
  } catch (error) {
    console.error('Apply regularization error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get my regularization requests
 */
const getMyRegularizationRequests = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status } = req.query;
    
    let query = 'SELECT * FROM regularization_requests WHERE employee_id = $1';
    const params = [employeeId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Get regularization requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  applyForRegularization,
  getMyRegularizationRequests,
};

