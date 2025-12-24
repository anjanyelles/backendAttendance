const pool = require('../config/database');

/**
 * Get team attendance
 */
const getTeamAttendance = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { month, year } = req.query;
    
    // Get all direct reports
    const teamResult = await pool.query(
      'SELECT id FROM employees WHERE manager_id = $1 AND is_active = true',
      [managerId]
    );
    
    if (teamResult.rows.length === 0) {
      return res.json({
        success: true,
        teamAttendance: [],
      });
    }
    
    const teamIds = teamResult.rows.map(emp => emp.id);
    const placeholders = teamIds.map((_, i) => `$${i + 1}`).join(', ');
    
    let query = `SELECT a.*, e.name as employee_name, e.email as employee_email 
                 FROM attendance a 
                 JOIN employees e ON a.employee_id = e.id 
                 WHERE a.employee_id IN (${placeholders})`;
    const params = [...teamIds];
    
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM a.date) = $${params.length + 1} AND EXTRACT(YEAR FROM a.date) = $${params.length + 2}`;
      params.push(parseInt(month), parseInt(year));
    } else {
      query += ' AND a.date >= CURRENT_DATE - INTERVAL \'30 days\'';
    }
    
    query += ' ORDER BY a.date DESC, e.name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      teamAttendance: result.rows,
    });
  } catch (error) {
    console.error('Get team attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get team leave requests
 */
const getTeamLeaveRequests = async (req, res) => {
  try {
    const managerId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.query;
    
    let query = `SELECT 
                   lr.*, 
                   e.name as employee_name, 
                   e.email as employee_email,
                   e.manager_id,
                   reviewer.name as reviewer_name,
                   reviewer.email as reviewer_email
                 FROM leave_requests lr 
                 JOIN employees e ON lr.employee_id = e.id 
                 LEFT JOIN employees reviewer ON lr.reviewed_by = reviewer.id
                 WHERE 1=1`;
    const params = [];
    let paramIndex = 1;
    
    // If ADMIN, show all leave requests
    // If MANAGER, show only team members' requests
    if (userRole !== 'ADMIN') {
      // Get all direct reports
      const teamResult = await pool.query(
        'SELECT id FROM employees WHERE manager_id = $1 AND is_active = true',
        [managerId]
      );
      
      if (teamResult.rows.length === 0) {
        return res.json({
          success: true,
          leaveRequests: [],
        });
      }
      
      const teamIds = teamResult.rows.map(emp => emp.id);
      const placeholders = teamIds.map((_, i) => `$${paramIndex + i}`).join(', ');
      query += ` AND lr.employee_id IN (${placeholders})`;
      params.push(...teamIds);
      paramIndex += teamIds.length;
    }
    
    if (status) {
      query += ` AND lr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ' ORDER BY lr.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      leaveRequests: result.rows,
    });
  } catch (error) {
    console.error('Get team leave requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Review leave request (approve/reject)
 */
const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;
    const managerId = req.user.id;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be "approve" or "reject"',
      });
    }
    
    // Get leave request
    const leaveResult = await pool.query(
      `SELECT lr.*, e.manager_id 
       FROM leave_requests lr 
       JOIN employees e ON lr.employee_id = e.id 
       WHERE lr.id = $1`,
      [id]
    );
    
    if (leaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Leave request not found',
      });
    }
    
    const leaveRequest = leaveResult.rows[0];
    const userRole = req.user.role;
    
    // Admin can approve any request, Manager can only approve their team's requests
    if (userRole !== 'ADMIN') {
      // Check if manager is the employee's manager
      if (leaveRequest.manager_id !== managerId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden - You can only review requests from your team members',
        });
      }
    }
    
    // Check if already processed
    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Leave request has already been processed',
      });
    }
    
    const newStatus = action === 'approve' ? 'MANAGER_APPROVED' : 'REJECTED';
    
    // Update leave request
    const updateResult = await pool.query(
      'UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [newStatus, managerId, id]
    );
    
    res.json({
      success: true,
      message: `Leave request ${action}d successfully`,
      leaveRequest: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Review leave request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get team regularization requests
 */
const getTeamRegularizationRequests = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { status } = req.query;
    
    // Get all direct reports
    const teamResult = await pool.query(
      'SELECT id FROM employees WHERE manager_id = $1 AND is_active = true',
      [managerId]
    );
    
    if (teamResult.rows.length === 0) {
      return res.json({
        success: true,
        requests: [],
      });
    }
    
    const teamIds = teamResult.rows.map(emp => emp.id);
    const placeholders = teamIds.map((_, i) => `$${i + 1}`).join(', ');
    
    let query = `SELECT rr.*, e.name as employee_name, e.email as employee_email 
                 FROM regularization_requests rr 
                 JOIN employees e ON rr.employee_id = e.id 
                 WHERE rr.employee_id IN (${placeholders})`;
    const params = [...teamIds];
    
    if (status) {
      query += ` AND rr.status = $${params.length + 1}`;
      params.push(status);
    }
    
    query += ' ORDER BY rr.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      requests: result.rows,
    });
  } catch (error) {
    console.error('Get team regularization requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Review regularization request (approve/reject)
 */
const reviewRegularizationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;
    const managerId = req.user.id;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be "approve" or "reject"',
      });
    }
    
    // Get regularization request
    const regResult = await pool.query(
      `SELECT rr.*, e.manager_id 
       FROM regularization_requests rr 
       JOIN employees e ON rr.employee_id = e.id 
       WHERE rr.id = $1`,
      [id]
    );
    
    if (regResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Regularization request not found',
      });
    }
    
    const regRequest = regResult.rows[0];
    
    // Check if manager is the employee's manager
    if (regRequest.manager_id !== managerId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - You can only review requests from your team members',
      });
    }
    
    // Check if already processed
    if (regRequest.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Regularization request has already been processed',
      });
    }
    
    const newStatus = action === 'approve' ? 'MANAGER_APPROVED' : 'REJECTED';
    
    // Update regularization request
    const updateResult = await pool.query(
      'UPDATE regularization_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [newStatus, managerId, id]
    );
    
    res.json({
      success: true,
      message: `Regularization request ${action}d successfully`,
      request: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Review regularization request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  getTeamAttendance,
  getTeamLeaveRequests,
  reviewLeaveRequest,
  getTeamRegularizationRequests,
  reviewRegularizationRequest,
};

