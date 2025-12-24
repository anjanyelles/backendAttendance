const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { isValidEmail, isValidPassword, isValidLatitude, isValidLongitude, isValidIP } = require('../utils/validators');

/**
 * Create employee
 */
const createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;
    
    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, and role are required',
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }
    
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }
    
    if (!['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be EMPLOYEE, MANAGER, HR, or ADMIN',
      });
    }
    
    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT id FROM employees WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
      });
    }
    
    // Validate manager if provided
    if (managerId) {
      const managerCheck = await pool.query(
        'SELECT id, role FROM employees WHERE id = $1',
        [managerId]
      );
      
      if (managerCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Manager not found',
        });
      }
      
      if (!['MANAGER', 'HR', 'ADMIN'].includes(managerCheck.rows[0].role)) {
        return res.status(400).json({
          success: false,
          error: 'Manager must have MANAGER, HR, or ADMIN role',
        });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert employee
    const result = await pool.query(
      'INSERT INTO employees (name, email, password, role, manager_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, manager_id, is_active, created_at',
      [name, email.toLowerCase(), hashedPassword, role, managerId || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: result.rows[0],
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get all employees
 */
const getEmployees = async (req, res) => {
  try {
    const { role, isActive } = req.query;
    
    let query = 'SELECT id, name, email, role, manager_id, is_active, created_at FROM employees WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(role);
    }
    
    if (isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(isActive === 'true');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      employees: result.rows,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update employee
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, managerId, isActive } = req.body;
    
    // Check if employee exists
    const empCheck = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }
    
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }
      
      // Check if email already exists (excluding current employee)
      const emailCheck = await pool.query(
        'SELECT id FROM employees WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
        });
      }
      
      paramCount++;
      updates.push(`email = $${paramCount}`);
      params.push(email.toLowerCase());
    }
    
    if (role !== undefined) {
      if (!['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
        });
      }
      
      paramCount++;
      updates.push(`role = $${paramCount}`);
      params.push(role);
    }
    
    if (managerId !== undefined) {
      if (managerId === null) {
        paramCount++;
        updates.push(`manager_id = $${paramCount}`);
        params.push(null);
      } else {
        // Validate manager
        const managerCheck = await pool.query(
          'SELECT id, role FROM employees WHERE id = $1',
          [managerId]
        );
        
        if (managerCheck.rows.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Manager not found',
          });
        }
        
        if (!['MANAGER', 'HR', 'ADMIN'].includes(managerCheck.rows[0].role)) {
          return res.status(400).json({
            success: false,
            error: 'Manager must have MANAGER, HR, or ADMIN role',
          });
        }
        
        // Prevent self-assignment
        if (parseInt(managerId) === parseInt(id)) {
          return res.status(400).json({
            success: false,
            error: 'Employee cannot be their own manager',
          });
        }
        
        paramCount++;
        updates.push(`manager_id = $${paramCount}`);
        params.push(managerId);
      }
    }
    
    if (isActive !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(isActive === true || isActive === 'true');
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }
    
    paramCount++;
    params.push(id);
    
    const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, email, role, manager_id, is_active, created_at`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: result.rows[0],
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete employee (soft delete by setting is_active = false)
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if employee exists
    const empCheck = await pool.query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );
    
    if (empCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }
    
    // Soft delete (set is_active = false)
    await pool.query(
      'UPDATE employees SET is_active = false WHERE id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Employee disabled successfully',
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get office settings
 */
const getOfficeSettings = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM office_settings ORDER BY id DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      // Return defaults - Collabra Technologies, KPHB Colony, Hyderabad
      return res.json({
        success: true,
        settings: {
          latitude: parseFloat(process.env.DEFAULT_OFFICE_LATITUDE || '17.489313654492967'),
          longitude: parseFloat(process.env.DEFAULT_OFFICE_LONGITUDE || '78.39285505628658'),
          radius_meters: parseInt(process.env.DEFAULT_OFFICE_RADIUS || '50'),
          office_public_ip: process.env.DEFAULT_OFFICE_PUBLIC_IP || '103.206.104.149',
        },
      });
    }
    
    res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Get office settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update office settings
 */
const updateOfficeSettings = async (req, res) => {
  try {
    const { latitude, longitude, radiusMeters, officePublicIp } = req.body;
    
    // Validate input
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }
    
    if (!officePublicIp) {
      return res.status(400).json({
        success: false,
        error: 'Office public IP is required',
      });
    }
    
    if (!isValidLatitude(latitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude. Must be between -90 and 90',
      });
    }
    
    if (!isValidLongitude(longitude)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid longitude. Must be between -180 and 180',
      });
    }
    
    if (!isValidIP(officePublicIp)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IP address format',
      });
    }
    
    const radius = radiusMeters || 60;
    if (radius < 1 || radius > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Radius must be between 1 and 10000 meters',
      });
    }
    
    // Check if settings exist
    const existingCheck = await pool.query(
      'SELECT id FROM office_settings ORDER BY id DESC LIMIT 1'
    );
    
    let result;
    if (existingCheck.rows.length > 0) {
      // Update existing
      result = await pool.query(
        'UPDATE office_settings SET latitude = $1, longitude = $2, radius_meters = $3, office_public_ip = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [latitude, longitude, radius, officePublicIp, existingCheck.rows[0].id]
      );
    } else {
      // Insert new
      result = await pool.query(
        'INSERT INTO office_settings (latitude, longitude, radius_meters, office_public_ip) VALUES ($1, $2, $3, $4) RETURNING *',
        [latitude, longitude, radius, officePublicIp]
      );
    }
    
    res.json({
      success: true,
      message: 'Office settings updated successfully',
      settings: result.rows[0],
    });
  } catch (error) {
    console.error('Update office settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get employee attendance summary (grouped by employee)
 */
const getEmployeeAttendanceSummary = async (req, res) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [];
    let paramIndex = 1;
    
    if (startDate && endDate) {
      dateFilter = `AND a.date >= $${paramIndex} AND a.date <= $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
    } else if (month && year) {
      dateFilter = `AND EXTRACT(MONTH FROM a.date) = $${paramIndex} AND EXTRACT(YEAR FROM a.date) = $${paramIndex + 1}`;
      params.push(parseInt(month), parseInt(year));
      paramIndex += 2;
    } else {
      // Default: current month
      const now = new Date();
      dateFilter = `AND EXTRACT(MONTH FROM a.date) = $${paramIndex} AND EXTRACT(YEAR FROM a.date) = $${paramIndex + 1}`;
      params.push(now.getMonth() + 1, now.getFullYear());
      paramIndex += 2;
    }
    
    // Build the query with date filter in JOIN condition
    let query = `SELECT 
        e.id,
        e.name,
        e.email,
        e.role,
        COUNT(DISTINCT a.date) as total_days,
        COUNT(CASE WHEN a.punch_in IS NOT NULL AND a.punch_out IS NOT NULL THEN 1 END) as present_days,
        COUNT(CASE WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 1 END) as incomplete_days,
        COUNT(CASE WHEN a.punch_in IS NULL AND a.date IS NOT NULL THEN 1 END) as absent_days,
        MIN(a.date) as first_date,
        MAX(a.date) as last_date
       FROM employees e
       LEFT JOIN attendance a ON e.id = a.employee_id`;
    
    if (dateFilter) {
      // Remove the leading AND and add it properly to the JOIN condition
      const cleanFilter = dateFilter.replace(/^AND\s+/, '');
      query += ` AND ${cleanFilter}`;
    }
    
    query += ` WHERE e.is_active = true
       GROUP BY e.id, e.name, e.email, e.role
       ORDER BY e.name`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      employees: result.rows,
    });
  } catch (error) {
    console.error('Get employee attendance summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get employee detailed attendance
 */
const getEmployeeAttendanceDetails = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month, year, startDate, endDate } = req.query;
    
    let dateFilter = '';
    const params = [employeeId];
    
    if (startDate && endDate) {
      dateFilter = 'AND a.date >= $2 AND a.date <= $3';
      params.push(startDate, endDate);
    } else if (month && year) {
      dateFilter = `AND EXTRACT(MONTH FROM a.date) = $2 AND EXTRACT(YEAR FROM a.date) = $3`;
      params.push(parseInt(month), parseInt(year));
    } else {
      // Default: current month
      const now = new Date();
      dateFilter = `AND EXTRACT(MONTH FROM a.date) = $2 AND EXTRACT(YEAR FROM a.date) = $3`;
      params.push(now.getMonth() + 1, now.getFullYear());
    }
    
    // Get employee info
    const empResult = await pool.query(
      'SELECT id, name, email, role FROM employees WHERE id = $1',
      [employeeId]
    );
    
    if (empResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found',
      });
    }
    
    // Get attendance records
    const attendanceResult = await pool.query(
      `SELECT a.* 
       FROM attendance a
       WHERE a.employee_id = $1 ${dateFilter}
       ORDER BY a.date DESC`,
      params
    );
    
    res.json({
      success: true,
      employee: empResult.rows[0],
      attendance: attendanceResult.rows,
    });
  } catch (error) {
    console.error('Get employee attendance details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get monthly attendance calendar (all employees, all days)
 * Returns a grid format: employees (rows) x days (columns)
 */
const getMonthlyAttendanceCalendar = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required',
      });
    }
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month or year',
      });
    }
    
    // Get first and last day of month
    const firstDay = new Date(yearNum, monthNum - 1, 1);
    const lastDay = new Date(yearNum, monthNum, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get all active employees
    const employeesResult = await pool.query(
      'SELECT id, name, email, role FROM employees WHERE is_active = true ORDER BY name'
    );
    
    // Get all attendance records for the month
    const attendanceResult = await pool.query(
      `SELECT 
        a.employee_id,
        a.date,
        a.punch_in,
        a.punch_out,
        CASE 
          WHEN a.punch_in IS NOT NULL AND a.punch_out IS NOT NULL THEN 'PRESENT'
          WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 'INCOMPLETE'
          WHEN a.punch_in IS NULL AND a.punch_out IS NULL THEN 'ABSENT'
          ELSE 'ABSENT'
        END as status
       FROM attendance a
       WHERE EXTRACT(MONTH FROM a.date) = $1 AND EXTRACT(YEAR FROM a.date) = $2
       ORDER BY a.employee_id, a.date`,
      [monthNum, yearNum]
    );
    
    // Get all approved leave requests for the month (MANAGER_APPROVED or HR_APPROVED)
    const leaveResult = await pool.query(
      `SELECT 
        lr.employee_id,
        lr.from_date,
        lr.to_date,
        lr.leave_type,
        lr.status
       FROM leave_requests lr
       WHERE lr.status IN ('MANAGER_APPROVED', 'HR_APPROVED')
         AND lr.from_date <= $1
         AND lr.to_date >= $2`,
      [lastDay.toISOString().split('T')[0], firstDay.toISOString().split('T')[0]]
    );
    
    // Get all holidays for the month (handle case where table doesn't exist)
    let holidaysResult = { rows: [] };
    try {
      holidaysResult = await pool.query(
        `SELECT date, name, description
         FROM holidays
         WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
         ORDER BY date`,
        [monthNum, yearNum]
      );
    } catch (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('Holidays table does not exist. Please run: node setup-holidays-table.js');
      } else {
        throw error;
      }
    }
    
    // Build calendar data structure
    const calendarData = [];
    const attendanceMap = new Map();
    const leaveMap = new Map();
    const holidaysSet = new Set();
    
    // Map attendance by employee_id and date
    attendanceResult.rows.forEach(att => {
      if (!att.date) return; // Skip if date is null/undefined
      // Handle date - PostgreSQL returns date as string, convert to Date if needed
      let dateStr;
      try {
        if (att.date instanceof Date) {
          dateStr = att.date.toISOString().split('T')[0];
        } else if (typeof att.date === 'string') {
          dateStr = att.date.split('T')[0]; // Already in ISO format or just date
        } else {
          dateStr = new Date(att.date).toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Error parsing attendance date:', att.date, e);
        return; // Skip this record
      }
      const key = `${att.employee_id}_${dateStr}`;
      attendanceMap.set(key, att);
    });
    
    // Map leaves by employee_id and date
    leaveResult.rows.forEach(leave => {
      if (!leave.from_date || !leave.to_date) return; // Skip if dates are null
      try {
        const fromDate = new Date(leave.from_date);
        const toDate = new Date(leave.to_date);
        
        // Validate dates
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          console.warn('Invalid leave dates:', leave.from_date, leave.to_date);
          return;
        }
        
        for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const monthCheck = d.getMonth() + 1;
          const yearCheck = d.getFullYear();
          
          if (monthCheck === monthNum && yearCheck === yearNum) {
            const key = `${leave.employee_id}_${dateStr}`;
            if (!leaveMap.has(key)) {
              leaveMap.set(key, leave.leave_type);
            }
          }
        }
      } catch (e) {
        console.warn('Error processing leave dates:', leave, e);
        return; // Skip this leave record
      }
    });
    
    // Map holidays by date
    holidaysResult.rows.forEach(holiday => {
      if (!holiday.date) return; // Skip if date is null/undefined
      // Handle date - PostgreSQL returns date as string, convert to Date if needed
      let dateStr;
      try {
        if (holiday.date instanceof Date) {
          dateStr = holiday.date.toISOString().split('T')[0];
        } else if (typeof holiday.date === 'string') {
          dateStr = holiday.date.split('T')[0]; // Already in ISO format or just date
        } else {
          dateStr = new Date(holiday.date).toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Error parsing holiday date:', holiday.date, e);
        return; // Skip this record
      }
      holidaysSet.add(dateStr);
    });
    
    // Build calendar for each employee
    employeesResult.rows.forEach(employee => {
      const employeeRow = {
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        employeeRole: employee.role,
        days: [],
        summary: {
          totalDays: daysInMonth,
          presentDays: 0,
          absentDays: 0,
          leaveDays: 0,
          incompleteDays: 0,
          holidayDays: 0,
        }
      };
      
      // Process each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(yearNum, monthNum - 1, day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        const key = `${employee.id}_${dateStr}`;
        
        let dayStatus = 'ABSENT';
        let dayType = 'WORKDAY';
        let leaveType = null;
        
        // Check if it's an admin-defined holiday
        if (holidaysSet.has(dateStr)) {
          dayType = 'HOLIDAY';
          dayStatus = 'HOLIDAY';
          employeeRow.summary.holidayDays++;
        }
        // Check if it's a weekend (Saturday = 6, Sunday = 0)
        else if (dayOfWeek === 0 || dayOfWeek === 6) {
          dayType = 'WEEKEND';
          dayStatus = 'HOLIDAY';
          employeeRow.summary.holidayDays++;
        } else {
          // Check for leave
          if (leaveMap.has(key)) {
            dayType = 'LEAVE';
            dayStatus = 'LEAVE';
            leaveType = leaveMap.get(key);
            employeeRow.summary.leaveDays++;
          } else {
            // Check attendance
            const attendance = attendanceMap.get(key);
            if (attendance) {
              dayStatus = attendance.status;
              if (attendance.status === 'PRESENT') {
                employeeRow.summary.presentDays++;
              } else if (attendance.status === 'INCOMPLETE') {
                employeeRow.summary.incompleteDays++;
              } else {
                employeeRow.summary.absentDays++;
              }
            } else {
              employeeRow.summary.absentDays++;
            }
          }
        }
        
        employeeRow.days.push({
          day,
          date: dateStr,
          status: dayStatus,
          type: dayType,
          leaveType,
          punchIn: attendanceMap.get(key)?.punch_in || null,
          punchOut: attendanceMap.get(key)?.punch_out || null,
        });
      }
      
      calendarData.push(employeeRow);
    });
    
    res.json({
      success: true,
      month: monthNum,
      year: yearNum,
      daysInMonth,
      calendar: calendarData,
    });
  } catch (error) {
    console.error('Get monthly attendance calendar error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
};

/**
 * Export monthly attendance calendar as CSV
 * Note: CSV generation is handled on the frontend for better performance
 * This endpoint just returns the calendar data
 */
const exportMonthlyAttendanceCSV = async (req, res) => {
  // This is just an alias - frontend will generate CSV from calendar data
  return getMonthlyAttendanceCalendar(req, res);
};

/**
 * Get all holidays
 */
const getHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    
    let query = 'SELECT * FROM holidays';
    const params = [];
    
    if (year) {
      query += ' WHERE EXTRACT(YEAR FROM date) = $1';
      params.push(parseInt(year));
    }
    
    query += ' ORDER BY date';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      holidays: result.rows,
    });
  } catch (error) {
    if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({
        success: false,
        error: 'Holidays table does not exist. Please run: node setup-holidays-table.js',
      });
    }
    console.error('Get holidays error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create holiday
 */
const createHoliday = async (req, res) => {
  try {
    const { date, name, description } = req.body;
    const adminId = req.user.id;
    
    if (!date || !name) {
      return res.status(400).json({
        success: false,
        error: 'Date and name are required',
      });
    }
    
    const result = await pool.query(
      'INSERT INTO holidays (date, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [date, name, description || null, adminId]
    );
    
    res.json({
      success: true,
      message: 'Holiday created successfully',
      holiday: result.rows[0],
    });
  } catch (error) {
    if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({
        success: false,
        error: 'Holidays table does not exist. Please run: node setup-holidays-table.js',
      });
    }
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'Holiday already exists for this date',
      });
    }
    console.error('Create holiday error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update holiday
 */
const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, name, description } = req.body;
    
    if (!date || !name) {
      return res.status(400).json({
        success: false,
        error: 'Date and name are required',
      });
    }
    
    const result = await pool.query(
      'UPDATE holidays SET date = $1, name = $2, description = $3 WHERE id = $4 RETURNING *',
      [date, name, description || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Holiday not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Holiday updated successfully',
      holiday: result.rows[0],
    });
  } catch (error) {
    if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({
        success: false,
        error: 'Holidays table does not exist. Please run: node setup-holidays-table.js',
      });
    }
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'Holiday already exists for this date',
      });
    }
    console.error('Update holiday error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Delete holiday
 */
const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM holidays WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Holiday not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  } catch (error) {
    if (error.code === '42P01') { // Table doesn't exist
      return res.status(500).json({
        success: false,
        error: 'Holidays table does not exist. Please run: node setup-holidays-table.js',
      });
    }
    console.error('Delete holiday error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get all leave requests (for Admin view)
 */
const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    
    let query = `SELECT 
                   lr.*, 
                   e.name as employee_name, 
                   e.email as employee_email,
                   reviewer.name as reviewer_name,
                   reviewer.email as reviewer_email
                 FROM leave_requests lr 
                 JOIN employees e ON lr.employee_id = e.id 
                 LEFT JOIN employees reviewer ON lr.reviewed_by = reviewer.id
                 WHERE 1=1`;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND lr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (employeeId) {
      query += ` AND lr.employee_id = $${paramIndex}`;
      params.push(parseInt(employeeId));
      paramIndex++;
    }
    
    query += ' ORDER BY lr.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      leaveRequests: result.rows,
    });
  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    if (type === 'attendance' && startDate) {
      // Get attendance report
      const attendanceResult = await pool.query(
        `SELECT 
          e.id,
          e.name,
          e.email,
          e.role,
          COUNT(a.id) as total_days,
          COUNT(CASE WHEN a.punch_in IS NOT NULL AND a.punch_out IS NOT NULL THEN 1 END) as full_days,
          COUNT(CASE WHEN a.punch_in IS NOT NULL AND a.punch_out IS NULL THEN 1 END) as incomplete_days,
          COUNT(CASE WHEN a.punch_in IS NULL AND a.punch_out IS NULL THEN 1 END) as absent_days
         FROM employees e
         LEFT JOIN attendance a ON e.id = a.employee_id AND a.date >= $1
         WHERE e.is_active = true
         GROUP BY e.id, e.name, e.email, e.role
         ORDER BY e.name`,
        [startDate]
      );
      
      return res.json({
        success: true,
        report: {
          type: 'attendance',
          startDate,
          data: attendanceResult.rows,
        },
      });
    }
    
    // Default: return summary
    const summaryResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as active_employees,
        COUNT(*) FILTER (WHERE role = 'EMPLOYEE') as employees,
        COUNT(*) FILTER (WHERE role = 'MANAGER') as managers,
        COUNT(*) FILTER (WHERE role = 'HR') as hr,
        COUNT(*) FILTER (WHERE role = 'ADMIN') as admins
       FROM employees`
    );
    
    res.json({
      success: true,
      report: {
        summary: summaryResult.rows[0],
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

module.exports = {
  createEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  getOfficeSettings,
  updateOfficeSettings,
  getReports,
  getEmployeeAttendanceSummary,
  getEmployeeAttendanceDetails,
  getMonthlyAttendanceCalendar,
  exportMonthlyAttendanceCSV,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getAllLeaveRequests,
};

