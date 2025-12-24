const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or missing token',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user from database to ensure they still exist and are active
      const result = await pool.query(
        'SELECT id, name, email, role, manager_id, is_active FROM employees WHERE id = $1',
        [decoded.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - User not found',
        });
      }
      
      const user = result.rows[0];
      
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - Account is disabled',
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - Token expired',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - Invalid token',
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = authenticate;

