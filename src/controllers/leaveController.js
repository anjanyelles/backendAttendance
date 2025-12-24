const pool = require('../config/database');
const { isValidDate, isPastDate } = require('../utils/validators');

/**
 * Apply for leave
 */
const applyForLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    const employeeId = req.user.id;
    
    // Validate input
    if (!leaveType || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: 'Leave type, from date, and to date are required',
      });
    }
    
    if (!['CASUAL', 'SICK', 'WFH'].includes(leaveType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid leave type. Must be CASUAL, SICK, or WFH',
      });
    }
    
    if (!isValidDate(fromDate) || !isValidDate(toDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }
    
    // Check if dates are in the past
    if (isPastDate(fromDate)) {
      return res.status(400).json({
        success: false,
        error: 'Leave dates cannot be in the past',
      });
    }
    
    // Check if fromDate <= toDate
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      return res.status(400).json({
        success: false,
        error: 'From date must be less than or equal to to date',
      });
    }
    
    // Insert leave request
    const result = await pool.query(
      'INSERT INTO leave_requests (employee_id, leave_type, from_date, to_date, reason, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employeeId, leaveType, fromDate, toDate, reason || null, 'PENDING']
    );
    
    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      leaveRequest: result.rows[0],
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get my leave requests
 */
const getMyLeaveRequests = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status } = req.query;
    
    let query = 'SELECT * FROM leave_requests WHERE employee_id = $1';
    const params = [employeeId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      leaveRequests: result.rows,
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  applyForLeave,
  getMyLeaveRequests,
};

