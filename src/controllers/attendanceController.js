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
      radius_meters: parseInt(process.env.DEFAULT_OFFICE_RADIUS || '50'), // 50m geofence
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
        'UPDATE attendance SET punch_in = $1, latitude = $2, longitude = $3, distance_meters = $4, ip_address = $5, last_heartbeat = $6, status = $7, total_out_time_minutes = 0, out_count = 0 WHERE id = $8',
        [
          punchInTime,
          latitude,
          longitude,
          validation.distance,
          ipAddress,
          punchInTime, // Set initial heartbeat
          'PRESENT',
          existingCheck.rows[0].id,
        ]
      );
    } else {
      // Insert new record
      await pool.query(
        'INSERT INTO attendance (employee_id, date, punch_in, latitude, longitude, distance_meters, ip_address, last_heartbeat, status, total_out_time_minutes, out_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [employeeId, today, punchInTime, latitude, longitude, validation.distance, ipAddress, punchInTime, 'PRESENT', 0, 0]
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
    
    // Close any active OUT periods
    const outPeriodResult = await pool.query(
      `SELECT * FROM attendance_out_periods 
       WHERE attendance_id = $1 AND in_time IS NULL 
       ORDER BY out_time DESC LIMIT 1`,
      [existingCheck.rows[0].id]
    );
    
    if (outPeriodResult.rows.length > 0) {
      const outPeriod = outPeriodResult.rows[0];
      const outTime = new Date(outPeriod.out_time);
      const durationMinutes = Math.floor((punchOutTime - outTime) / 1000 / 60);
      
      await pool.query(
        `UPDATE attendance_out_periods 
         SET in_time = $1, duration_minutes = $2, reason = 'MANUAL'
         WHERE id = $3`,
        [punchOutTime, durationMinutes, outPeriod.id]
      );
      
      await pool.query(
        'UPDATE attendance SET total_out_time_minutes = total_out_time_minutes + $1 WHERE id = $2',
        [durationMinutes, existingCheck.rows[0].id]
      );
    }
    
    // Calculate final status based on total OUT time
    const attendance = existingCheck.rows[0];
    const totalOutMinutes = (attendance.total_out_time_minutes || 0);
    let finalStatus = 'PRESENT';
    
    if (totalOutMinutes > 240) {
      finalStatus = 'ABSENT';
    } else if (totalOutMinutes > 120) {
      finalStatus = 'HALF_DAY';
    }
    
    // Update attendance
    await pool.query(
      'UPDATE attendance SET punch_out = $1, status = $2 WHERE id = $3',
      [punchOutTime, finalStatus, existingCheck.rows[0].id]
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
    
    // Check if there's an active OUT period
    const outPeriodResult = await pool.query(
      `SELECT * FROM attendance_out_periods 
       WHERE attendance_id = $1 AND in_time IS NULL 
       ORDER BY out_time DESC LIMIT 1`,
      [attendance.id]
    );
    
    const isOutside = outPeriodResult.rows.length > 0;
    
    res.json({
      success: true,
      punchedIn: !!attendance.punch_in,
      punchInTime: attendance.punch_in,
      punchOutTime: attendance.punch_out,
      insideOffice: attendance.punch_in && !attendance.punch_out ? !isOutside : null,
      lastHeartbeat: attendance.last_heartbeat,
      outCount: attendance.out_count || 0,
      totalOutTimeMinutes: attendance.total_out_time_minutes || 0,
      status: attendance.status || 'PRESENT',
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

/**
 * Send heartbeat - monitors user presence
 * Auto punches out if user is outside geofence or IP changed
 */
const sendHeartbeat = async (req, res) => {
  try {
    const { latitude, longitude, ipAddress } = req.body;
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Validate input
    if (!latitude || !longitude || !ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'Latitude, longitude, and IP address are required',
      });
    }
    
    // Get today's attendance
    const attendanceResult = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (attendanceResult.rows.length === 0 || !attendanceResult.rows[0].punch_in) {
      return res.status(400).json({
        success: false,
        error: 'No active punch in found',
      });
    }
    
    const attendance = attendanceResult.rows[0];
    
    // If already punched out, return
    if (attendance.punch_out) {
      return res.json({
        success: true,
        message: 'Already punched out',
        punchedIn: false,
      });
    }
    
    // Validate location and IP
    const validation = await validateLocationAndIP(latitude, longitude, ipAddress);
    const settings = await getOfficeSettings();
    
    // Check if user is outside office (geo > 50m OR IP changed)
    const isOutsideOffice = !validation.locationValid || 
                           (ipAddress !== attendance.ip_address && ipAddress !== settings.office_public_ip);
    
    // Update last heartbeat
    await pool.query(
      'UPDATE attendance SET last_heartbeat = $1 WHERE id = $2',
      [now, attendance.id]
    );
    
    // If user is outside office, auto punch out
    if (isOutsideOffice) {
      // Check if we're already tracking an OUT period
      const outPeriodResult = await pool.query(
        `SELECT * FROM attendance_out_periods 
         WHERE attendance_id = $1 AND in_time IS NULL 
         ORDER BY out_time DESC LIMIT 1`,
        [attendance.id]
      );
      
      if (outPeriodResult.rows.length === 0) {
        // Start new OUT period
        const reason = !validation.locationValid ? 'GEO_FENCE_EXIT' : 'IP_CHANGE';
        
        // Check OUT count limit (max 2 per day)
        if (attendance.out_count >= 2) {
          // Auto punch out if max OUT count reached
          const punchOutTime = new Date();
          await pool.query(
            'UPDATE attendance SET punch_out = $1, is_auto_punched_out = true WHERE id = $2',
            [punchOutTime, attendance.id]
          );
          
          return res.json({
            success: true,
            message: 'Auto punched out: Maximum OUT count reached',
            punchedIn: false,
            autoPunchedOut: true,
            reason: 'MAX_OUT_COUNT',
          });
        }
        
        // Create new OUT period
        await pool.query(
          `INSERT INTO attendance_out_periods (attendance_id, out_time, reason) 
           VALUES ($1, $2, $3)`,
          [attendance.id, now, reason]
        );
        
        // Increment OUT count
        await pool.query(
          'UPDATE attendance SET out_count = out_count + 1 WHERE id = $1',
          [attendance.id]
        );
      }
      
      return res.json({
        success: true,
        message: 'Outside office - OUT period started',
        insideOffice: false,
        punchedIn: true,
        locationValid: validation.locationValid,
        wifiValid: validation.wifiValid,
      });
    } else {
      // User is inside office - check if there's an active OUT period to close
      const outPeriodResult = await pool.query(
        `SELECT * FROM attendance_out_periods 
         WHERE attendance_id = $1 AND in_time IS NULL 
         ORDER BY out_time DESC LIMIT 1`,
        [attendance.id]
      );
      
      if (outPeriodResult.rows.length > 0) {
        // Close the OUT period
        const outPeriod = outPeriodResult.rows[0];
        const outTime = new Date(outPeriod.out_time);
        const durationMinutes = Math.floor((now - outTime) / 1000 / 60);
        
        await pool.query(
          `UPDATE attendance_out_periods 
           SET in_time = $1, duration_minutes = $2 
           WHERE id = $3`,
          [now, durationMinutes, outPeriod.id]
        );
        
        // Update total OUT time
        await pool.query(
          'UPDATE attendance SET total_out_time_minutes = total_out_time_minutes + $1 WHERE id = $2',
          [durationMinutes, attendance.id]
        );
        
        // Check if total OUT time exceeds limits
        const updatedAttendance = await pool.query(
          'SELECT total_out_time_minutes, out_count FROM attendance WHERE id = $1',
          [attendance.id]
        );
        
        const totalOutMinutes = updatedAttendance.rows[0].total_out_time_minutes;
        
        // Update status based on OUT time
        let status = 'PRESENT';
        if (totalOutMinutes > 240) {
          status = 'ABSENT';
          // Auto punch out if > 240 minutes
          await pool.query(
            'UPDATE attendance SET punch_out = $1, status = $2, is_auto_punched_out = true WHERE id = $3',
            [now, status, attendance.id]
          );
          
          return res.json({
            success: true,
            message: 'Auto punched out: Total OUT time exceeds 240 minutes',
            punchedIn: false,
            autoPunchedOut: true,
            reason: 'MAX_OUT_TIME',
          });
        } else if (totalOutMinutes > 120) {
          status = 'HALF_DAY';
        }
        
        await pool.query(
          'UPDATE attendance SET status = $1 WHERE id = $2',
          [status, attendance.id]
        );
      }
      
      return res.json({
        success: true,
        message: 'Heartbeat received - Inside office',
        insideOffice: true,
        punchedIn: true,
        locationValid: validation.locationValid,
        wifiValid: validation.wifiValid,
      });
    }
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Check and auto punch out users with no heartbeat for > 10 minutes
 * This should be called by a cron job or scheduled task
 */
const checkHeartbeatTimeouts = async () => {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];
    
    // Find all users who punched in today, haven't punched out, and haven't sent heartbeat in 10+ minutes
    const result = await pool.query(
      `SELECT a.*, e.name, e.email 
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       WHERE a.date = $1 
         AND a.punch_in IS NOT NULL 
         AND a.punch_out IS NULL
         AND (a.last_heartbeat IS NULL OR a.last_heartbeat < $2)`,
      [today, tenMinutesAgo]
    );
    
    const now = new Date();
    
    for (const attendance of result.rows) {
      // Auto punch out
      await pool.query(
        'UPDATE attendance SET punch_out = $1, is_auto_punched_out = true, status = $2 WHERE id = $3',
        [now, 'INCOMPLETE', attendance.id]
      );
      
      // If there's an active OUT period, close it
      const outPeriodResult = await pool.query(
        `SELECT * FROM attendance_out_periods 
         WHERE attendance_id = $1 AND in_time IS NULL 
         ORDER BY out_time DESC LIMIT 1`,
        [attendance.id]
      );
      
      if (outPeriodResult.rows.length > 0) {
        const outPeriod = outPeriodResult.rows[0];
        const outTime = new Date(outPeriod.out_time);
        const durationMinutes = Math.floor((now - outTime) / 1000 / 60);
        
        await pool.query(
          `UPDATE attendance_out_periods 
           SET in_time = $1, duration_minutes = $2, reason = 'HEARTBEAT_TIMEOUT'
           WHERE id = $3`,
          [now, durationMinutes, outPeriod.id]
        );
        
        await pool.query(
          'UPDATE attendance SET total_out_time_minutes = total_out_time_minutes + $1 WHERE id = $2',
          [durationMinutes, attendance.id]
        );
      }
      
      console.log(`Auto punched out employee ${attendance.employee_id} (${attendance.name}) due to heartbeat timeout`);
    }
    
    return result.rows.length;
  } catch (error) {
    console.error('Check heartbeat timeouts error:', error);
    throw error;
  }
};

/**
 * Get presence status - Inside/Outside Office
 */
const getPresenceStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's attendance
    const attendanceResult = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, today]
    );
    
    if (attendanceResult.rows.length === 0 || !attendanceResult.rows[0].punch_in) {
      return res.json({
        success: true,
        punchedIn: false,
        insideOffice: false,
        status: 'NOT_PUNCHED_IN',
      });
    }
    
    const attendance = attendanceResult.rows[0];
    
    if (attendance.punch_out) {
      return res.json({
        success: true,
        punchedIn: false,
        insideOffice: false,
        status: 'PUNCHED_OUT',
        punchOutTime: attendance.punch_out,
      });
    }
    
    // Check if there's an active OUT period
    const outPeriodResult = await pool.query(
      `SELECT * FROM attendance_out_periods 
       WHERE attendance_id = $1 AND in_time IS NULL 
       ORDER BY out_time DESC LIMIT 1`,
      [attendance.id]
    );
    
    const isOutside = outPeriodResult.rows.length > 0;
    
    return res.json({
      success: true,
      punchedIn: true,
      insideOffice: !isOutside,
      status: isOutside ? 'OUTSIDE_OFFICE' : 'INSIDE_OFFICE',
      lastHeartbeat: attendance.last_heartbeat,
      outCount: attendance.out_count,
      totalOutTimeMinutes: attendance.total_out_time_minutes,
    });
  } catch (error) {
    console.error('Get presence status error:', error);
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
  sendHeartbeat,
  checkHeartbeatTimeouts,
  getPresenceStatus,
};

