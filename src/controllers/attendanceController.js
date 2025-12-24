const pool = require('../config/database');
const { calculateDistance } = require('../utils/haversine');
const { isValidLatitude, isValidLongitude, isValidIP } = require('../utils/validators');

/**
 * Get office settings
 */
const getOfficeSettings = async () => {
  const result = await pool.query(
    'SELECT latitude, longitude, radius_meters, office_public_ip FROM office_settings ORDER BY id DESC LIMIT 1'
  );
  
  if (result.rows.length === 0) {
    // Return defaults if no settings exist - Collabra Technologies, KPHB Colony, Hyderabad
    return {
      latitude: parseFloat(process.env.DEFAULT_OFFICE_LATITUDE || '17.489313654492967'),
      longitude: parseFloat(process.env.DEFAULT_OFFICE_LONGITUDE || '78.39285505628658'),
      radius_meters: parseInt(process.env.DEFAULT_OFFICE_RADIUS || '50'),
      office_public_ip: process.env.DEFAULT_OFFICE_PUBLIC_IP || '103.206.104.149',
    };
  }
  
  return result.rows[0];
};

/**
 * Validate location and IP
 * Returns detailed validation results for both location and Wi-Fi separately
 */
const validateLocationAndIP = async (latitude, longitude, ipAddress) => {
  const settings = await getOfficeSettings();
  
  // Validate location format
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return { 
      valid: false, 
      locationValid: false,
      wifiValid: false,
      error: 'Invalid latitude or longitude' 
    };
  }
  
  // Validate IP format
  if (!isValidIP(ipAddress)) {
    return { 
      valid: false, 
      locationValid: false,
      wifiValid: false,
      error: 'Invalid IP address format' 
    };
  }
  
  // Calculate distance
  const distance = calculateDistance(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(settings.latitude),
    parseFloat(settings.longitude)
  );
  
  // Check location (distance) - separate validation
  const locationValid = distance <= settings.radius_meters;
  const locationError = locationValid 
    ? null 
    : `Location is ${distance.toFixed(2)} meters away from office. Must be within ${settings.radius_meters} meters.`;
  
  // Check IP match (Wi-Fi) - separate validation
  const wifiValid = ipAddress === settings.office_public_ip;
  const wifiError = wifiValid 
    ? null 
    : `Not connected to office Wi-Fi. Your IP: ${ipAddress}, Office IP: ${settings.office_public_ip}`;
  
  // Both must be valid for overall validation
  const valid = locationValid && wifiValid;
  const error = !locationValid ? locationError : (!wifiValid ? wifiError : null);
  
  return { 
    valid, 
    locationValid,
    wifiValid,
    distance: distance.toFixed(2),
    error,
    locationError,
    wifiError,
  };
};

/**
 * Punch In
 */
const punchIn = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Validate input
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    // Validate location and IP
    const validation = await validateLocationAndIP(latitude, longitude, ipAddress);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }
    
    // Check if there's an approved leave for today
    const leaveCheck = await pool.query(
      `SELECT id FROM leave_requests 
       WHERE employee_id = $1 
         AND status IN ('MANAGER_APPROVED', 'HR_APPROVED')
         AND DATE(from_date) <= $2 
         AND DATE(to_date) >= $2`,
      [employeeId, today]
    );
    
    if (leaveCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark attendance on approved leave dates',
      });
    }
    
    // Check if already punched in today
    const existingCheck = await pool.query(
      'SELECT id, punch_in FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (existingCheck.rows.length > 0 && existingCheck.rows[0].punch_in) {
      return res.status(400).json({
        success: false,
        error: 'Already punched in for today',
      });
    }
    
    const punchInTime = new Date();
    
    // Insert or update attendance
    if (existingCheck.rows.length > 0) {
      // Update existing record
      await pool.query(
        'UPDATE attendance SET punch_in = $1, latitude = $2, longitude = $3, distance_meters = $4, ip_address = $5 WHERE id = $6',
        [
          punchInTime,
          latitude,
          longitude,
          validation.distance,
          ipAddress,
          existingCheck.rows[0].id,
        ]
      );
    } else {
      // Insert new record
      await pool.query(
        'INSERT INTO attendance (employee_id, date, punch_in, latitude, longitude, distance_meters, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [employeeId, today, punchInTime, latitude, longitude, validation.distance, ipAddress]
      );
    }
    
    // Fetch updated attendance
    const result = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    res.json({
      success: true,
      message: 'Punched in successfully',
      attendance: result.rows[0],
    });
  } catch (error) {
    console.error('Punch in error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Punch Out
 */
const punchOut = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Validate input
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    // Validate location and IP
    const validation = await validateLocationAndIP(latitude, longitude, ipAddress);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }
    
    // Check if there's an approved leave for today
    const leaveCheck = await pool.query(
      `SELECT id FROM leave_requests 
       WHERE employee_id = $1 
         AND status IN ('MANAGER_APPROVED', 'HR_APPROVED')
         AND DATE(from_date) <= $2 
         AND DATE(to_date) >= $2`,
      [employeeId, today]
    );
    
    if (leaveCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot mark attendance on approved leave dates',
      });
    }
    
    // Check if punched in today
    const existingCheck = await pool.query(
      'SELECT id, punch_in, punch_out FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (existingCheck.rows.length === 0 || !existingCheck.rows[0].punch_in) {
      return res.status(400).json({
        success: false,
        error: 'Must punch in before punching out',
      });
    }
    
    if (existingCheck.rows[0].punch_out) {
      return res.status(400).json({
        success: false,
        error: 'Already punched out for today',
      });
    }
    
    const punchOutTime = new Date();
    
    // Update attendance
    await pool.query(
      'UPDATE attendance SET punch_out = $1 WHERE id = $2',
      [punchOutTime, existingCheck.rows[0].id]
    );
    
    // Fetch updated attendance
    const result = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    res.json({
      success: true,
      message: 'Punched out successfully',
      attendance: result.rows[0],
    });
  } catch (error) {
    console.error('Punch out error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Validate location before punch-in (pre-check)
 * Returns separate validation for location and Wi-Fi
 */
const validateLocation = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        valid: false,
        locationValid: false,
        wifiValid: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    const validation = await validateLocationAndIP(latitude, longitude, ipAddress);
    const settings = await getOfficeSettings();
    
    res.json({
      success: validation.valid,
      valid: validation.valid,
      locationValid: validation.locationValid,
      wifiValid: validation.wifiValid,
      message: validation.valid 
        ? `Location and Wi-Fi validated successfully. Distance: ${validation.distance} meters from office.`
        : validation.error,
      locationError: validation.locationError || null,
      wifiError: validation.wifiError || null,
      distance: validation.distance || null,
      officeLocation: {
        latitude: settings.latitude,
        longitude: settings.longitude,
        radius: settings.radius_meters,
        ip: settings.office_public_ip,
      },
      employeeLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ip: ipAddress,
      },
    });
  } catch (error) {
    console.error('Validate location error:', error);
    res.status(500).json({
      success: false,
      valid: false,
      locationValid: false,
      wifiValid: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get today's attendance status
 */
const getTodayStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        punchedIn: false,
        punchInTime: null,
      });
    }
    
    const attendance = result.rows[0];
    res.json({
      success: true,
      punchedIn: !!attendance.punch_in,
      punchInTime: attendance.punch_in,
      punchOutTime: attendance.punch_out,
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get my attendance
 */
const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;
    
    let query = 'SELECT * FROM attendance WHERE employee_id = $1';
    const params = [employeeId];
    
    if (month && year) {
      query += ' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3 ORDER BY date DESC';
      params.push(parseInt(month), parseInt(year));
    } else {
      query += ' ORDER BY date DESC LIMIT 30';
    }
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get my monthly attendance calendar
 */
const getMyMonthlyCalendar = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required',
      });
    }
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Get first and last day of month (in UTC to avoid timezone issues)
    const firstDay = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const lastDay = new Date(Date.UTC(yearNum, monthNum, 0));
    const daysInMonth = lastDay.getUTCDate();
    
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
    
    const employee = empResult.rows[0];
    
    // Get attendance records for the month
    const attendanceResult = await pool.query(
      `SELECT 
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
       WHERE a.employee_id = $1
         AND EXTRACT(MONTH FROM a.date) = $2 
         AND EXTRACT(YEAR FROM a.date) = $3
       ORDER BY a.date`,
      [employeeId, monthNum, yearNum]
    );
    
    // Get approved leave requests for the month
    // Check if leave date range overlaps with the month
    // Use UTC methods to get date strings to avoid timezone issues
    const firstDayStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const lastDayStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    
    const leaveResult = await pool.query(
      `SELECT 
        lr.from_date,
        lr.to_date,
        lr.leave_type,
        lr.status
       FROM leave_requests lr
       WHERE lr.employee_id = $1
         AND lr.status IN ('MANAGER_APPROVED', 'HR_APPROVED')
         AND DATE(lr.from_date) <= $2
         AND DATE(lr.to_date) >= $3
       ORDER BY lr.from_date`,
      [employeeId, lastDayStr, firstDayStr]
    );
    
    console.log(`[getMyMonthlyCalendar] Employee ${employeeId}, Month ${monthNum}/${yearNum}`);
    console.log(`[getMyMonthlyCalendar] Date range: ${firstDayStr} to ${lastDayStr}`);
    console.log(`[getMyMonthlyCalendar] Found ${leaveResult.rows.length} approved leaves`);
    
    // Get holidays for the month (handle case where table doesn't exist)
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
    
    // Build calendar data
    const attendanceMap = new Map();
    const leaveMap = new Map();
    const holidaysSet = new Set();
    
    // Map attendance by date
    attendanceResult.rows.forEach(att => {
      const dateStr = att.date.toISOString().split('T')[0];
      attendanceMap.set(dateStr, att);
    });
    
    // Map leaves by date
    leaveResult.rows.forEach((leave, idx) => {
      console.log(`[getMyMonthlyCalendar] Processing leave ${idx + 1}: from_date=${leave.from_date}, to_date=${leave.to_date}, type=${leave.leave_type}`);
      // Handle date strings or Date objects from PostgreSQL
      // PostgreSQL returns dates as strings in ISO format or Date objects
      let fromDateStr, toDateStr;
      
      if (leave.from_date instanceof Date) {
        fromDateStr = leave.from_date.toISOString().split('T')[0];
      } else if (typeof leave.from_date === 'string') {
        // Handle both ISO strings and date-only strings
        fromDateStr = leave.from_date.split('T')[0];
      } else {
        fromDateStr = new Date(leave.from_date).toISOString().split('T')[0];
      }
      
      if (leave.to_date instanceof Date) {
        toDateStr = leave.to_date.toISOString().split('T')[0];
      } else if (typeof leave.to_date === 'string') {
        toDateStr = leave.to_date.split('T')[0];
      } else {
        toDateStr = new Date(leave.to_date).toISOString().split('T')[0];
      }
      
      // Parse dates in UTC to avoid timezone issues
      const fromDate = new Date(fromDateStr + 'T00:00:00.000Z');
      const toDate = new Date(toDateStr + 'T23:59:59.999Z');
      
      // Iterate through each day in the leave range
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        // Get date string in YYYY-MM-DD format (UTC)
        const year = currentDate.getUTCFullYear();
        const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const monthCheck = currentDate.getUTCMonth() + 1;
        const yearCheck = currentDate.getUTCFullYear();
        
        // Only add if it's in the requested month
        if (monthCheck === monthNum && yearCheck === yearNum) {
          if (!leaveMap.has(dateStr)) {
            leaveMap.set(dateStr, leave.leave_type);
            console.log(`[getMyMonthlyCalendar] Added leave for date: ${dateStr}, type: ${leave.leave_type}`);
          }
        }
        
        // Move to next day (in UTC)
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentDate.setUTCHours(0, 0, 0, 0);
      }
    });
    
    // Map holidays by date
    holidaysResult.rows.forEach(holiday => {
      const dateStr = holiday.date.toISOString().split('T')[0];
      holidaysSet.add(dateStr);
    });
    
    // Build calendar days
    const days = [];
    let summary = {
      totalDays: daysInMonth,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      incompleteDays: 0,
      holidayDays: 0,
    };
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Use UTC to avoid timezone issues - construct date string directly
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const currentDate = new Date(Date.UTC(yearNum, monthNum - 1, day));
      const dayOfWeek = currentDate.getUTCDay();
      
      let dayStatus = 'ABSENT';
      let dayType = 'WORKDAY';
      let leaveType = null;
      
      // Check if it's an admin-defined holiday
      if (holidaysSet.has(dateStr)) {
        dayType = 'HOLIDAY';
        dayStatus = 'HOLIDAY';
        summary.holidayDays++;
      }
      // Check if it's a weekend
      else if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayType = 'WEEKEND';
        dayStatus = 'HOLIDAY';
        summary.holidayDays++;
      } else {
        // Check for leave
        if (leaveMap.has(dateStr)) {
          dayType = 'LEAVE';
          dayStatus = 'LEAVE';
          leaveType = leaveMap.get(dateStr);
          summary.leaveDays++;
        } else {
          // Check attendance
          const attendance = attendanceMap.get(dateStr);
          if (attendance) {
            dayStatus = attendance.status;
            if (attendance.status === 'PRESENT') {
              summary.presentDays++;
            } else if (attendance.status === 'INCOMPLETE') {
              summary.incompleteDays++;
            } else {
              summary.absentDays++;
            }
          } else {
            summary.absentDays++;
          }
        }
      }
      
      days.push({
        day,
        date: dateStr,
        status: dayStatus,
        type: dayType,
        leaveType,
        punchIn: attendanceMap.get(dateStr)?.punch_in || null,
        punchOut: attendanceMap.get(dateStr)?.punch_out || null,
      });
    }
    
    res.json({
      success: true,
      month: monthNum,
      year: yearNum,
      daysInMonth,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
      days,
      summary,
    });
  } catch (error) {
    console.error('Get my monthly calendar error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  validateLocation,
  punchIn,
  punchOut,
  getTodayStatus,
  getMyAttendance,
  getMyMonthlyCalendar,
};

