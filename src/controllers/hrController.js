const pool = require('../config/database');

/**
 * Get all leave requests (for HR approval)
 */
const getLeaveRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `SELECT 
                   lr.*, 
                   e.name as employee_name, 
                   e.email as employee_email,
                   reviewer.name as reviewer_name,
                   reviewer.email as reviewer_email
                 FROM leave_requests lr 
                 JOIN employees e ON lr.employee_id = e.id 
                 LEFT JOIN employees reviewer ON lr.reviewed_by = reviewer.id`;
    const params = [];
    
    if (status) {
      query += ` WHERE lr.status = $1`;
      params.push(status);
    }
    
    query += ' ORDER BY lr.created_at DESC';
    
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

/**
 * Approve/reject leave request (HR final approval)
 */
const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;
    const hrId = req.user.id;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be "approve" or "reject"',
      });
    }
    
    // Get leave request
    const leaveResult = await pool.query(
      'SELECT * FROM leave_requests WHERE id = $1',
      [id]
    );
    
    if (leaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Leave request not found',
      });
    }
    
    const leaveRequest = leaveResult.rows[0];
    
    // Check if status is MANAGER_APPROVED
    if (leaveRequest.status !== 'MANAGER_APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Leave request must be approved by manager first',
      });
    }
    
    const newStatus = action === 'approve' ? 'HR_APPROVED' : 'REJECTED';
    
    // Update leave request
    const updateResult = await pool.query(
      'UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [newStatus, hrId, id]
    );
    
    // If approved, mark attendance for leave dates
    if (action === 'approve') {
      const fromDate = new Date(leaveRequest.from_date);
      const toDate = new Date(leaveRequest.to_date);
      
      // Mark attendance for each day in the leave period
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        // Check if attendance record exists
        const attCheck = await pool.query(
          'SELECT id FROM attendance WHERE employee_id = $1 AND date = $2',
          [leaveRequest.employee_id, dateStr]
        );
        
        if (attCheck.rows.length === 0) {
          // Create attendance record marked as leave
          await pool.query(
            'INSERT INTO attendance (employee_id, date, punch_in, punch_out) VALUES ($1, $2, $3, $4)',
            [leaveRequest.employee_id, dateStr, null, null]
          );
        }
      }
    }
    
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
 * Get all regularization requests (for HR approval)
 */
const getRegularizationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `SELECT rr.*, e.name as employee_name, e.email as employee_email 
                 FROM regularization_requests rr 
                 JOIN employees e ON rr.employee_id = e.id`;
    const params = [];
    
    if (status) {
      query += ` WHERE rr.status = $1`;
      params.push(status);
    }
    
    query += ' ORDER BY rr.created_at DESC';
    
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

/**
 * Approve/reject regularization request (HR final approval)
 */
const reviewRegularizationRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;
    const hrId = req.user.id;
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action must be "approve" or "reject"',
      });
    }
    
    // Get regularization request
    const regResult = await pool.query(
      'SELECT * FROM regularization_requests WHERE id = $1',
      [id]
    );
    
    if (regResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Regularization request not found',
      });
    }
    
    const regRequest = regResult.rows[0];
    
    // Check if status is MANAGER_APPROVED
    if (regRequest.status !== 'MANAGER_APPROVED') {
      return res.status(400).json({
        success: false,
        error: 'Regularization request must be approved by manager first',
      });
    }
    
    const newStatus = action === 'approve' ? 'HR_APPROVED' : 'REJECTED';
    
    // Update regularization request
    const updateResult = await pool.query(
      'UPDATE regularization_requests SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [newStatus, hrId, id]
    );
    
    // If approved, update attendance record
    if (action === 'approve') {
      const dateStr = regRequest.attendance_date;
      
      // Check if attendance record exists
      const attCheck = await pool.query(
        'SELECT id FROM attendance WHERE employee_id = $1 AND date = $2',
        [regRequest.employee_id, dateStr]
      );
      
      if (attCheck.rows.length > 0) {
        // Update existing record
        await pool.query(
          'UPDATE attendance SET punch_in = $1, punch_out = $2 WHERE id = $3',
          [
            regRequest.requested_punch_in,
            regRequest.requested_punch_out,
            attCheck.rows[0].id,
          ]
        );
      } else {
        // Create new record
        await pool.query(
          'INSERT INTO attendance (employee_id, date, punch_in, punch_out) VALUES ($1, $2, $3, $4)',
          [
            regRequest.employee_id,
            dateStr,
            regRequest.requested_punch_in,
            regRequest.requested_punch_out,
          ]
        );
      }
    }
    
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

/**
 * Get attendance reports
 */
const getReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }
    
    // Get attendance summary
    const attendanceResult = await pool.query(
      `SELECT 
        e.id,
        e.name,
        e.email,
        COUNT(a.id) as total_days,
        COUNT(CASE WHEN a.punch_in IS NOT NULL AND a.punch_out IS NOT NULL THEN 1 END) as full_days,
        COUNT(CASE WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 1 END) as incomplete_days,
        COUNT(CASE WHEN a.punch_in IS NULL AND a.punch_out IS NULL THEN 1 END) as absent_days
       FROM employees e
       LEFT JOIN attendance a ON e.id = a.employee_id AND a.date BETWEEN $1 AND $2
       WHERE e.is_active = true
       GROUP BY e.id, e.name, e.email
       ORDER BY e.name`,
      [startDate, endDate]
    );
    
    // Get leave summary
    const leaveResult = await pool.query(
      `SELECT 
        leave_type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'HR_APPROVED' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected,
        COUNT(CASE WHEN status IN ('PENDING', 'MANAGER_APPROVED') THEN 1 END) as pending
       FROM leave_requests
       WHERE from_date <= $2 AND to_date >= $1
       GROUP BY leave_type`,
      [startDate, endDate]
    );
    
    res.json({
      success: true,
      report: {
        period: {
          startDate,
          endDate,
        },
        attendance: attendanceResult.rows,
        leaveSummary: leaveResult.rows,
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Export attendance data as CSV
 */
const exportReports = async (req, res) => {
  try {
    const { format, month, year } = req.query;
    
    if (format !== 'csv') {
      return res.status(400).json({
        success: false,
        error: 'Only CSV format is supported',
      });
    }
    
    let query = `SELECT 
      e.name as employee_name,
      e.email,
      a.date,
      a.punch_in,
      a.punch_out,
      CASE 
        WHEN a.punch_in IS NOT NULL AND a.punch_out IS NOT NULL THEN 'Present'
        WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 'Incomplete'
        ELSE 'Absent'
      END as status
     FROM employees e
     LEFT JOIN attendance a ON e.id = a.employee_id`;
    
    const params = [];
    
    if (month && year) {
      query += ` WHERE EXTRACT(MONTH FROM a.date) = $1 AND EXTRACT(YEAR FROM a.date) = $2`;
      params.push(parseInt(month), parseInt(year));
    }
    
    query += ' ORDER BY e.name, a.date';
    
    const result = await pool.query(query, params);
    
    // Generate CSV
    const headers = ['Employee Name', 'Email', 'Date', 'Punch In', 'Punch Out', 'Status'];
    const rows = result.rows.map(row => [
      row.employee_name || '',
      row.email || '',
      row.date || '',
      row.punch_in || '',
      row.punch_out || '',
      row.status || '',
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${month || 'all'}_${year || 'all'}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  getLeaveRequests,
  reviewLeaveRequest,
  getRegularizationRequests,
  reviewRegularizationRequest,
  getReports,
  exportReports,
};

