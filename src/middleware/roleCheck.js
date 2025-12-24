/**
 * Role-based Authorization Middleware
 * Checks if user has required role(s)
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Authentication required',
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - Insufficient permissions',
      });
    }
    
    next();
  };
};

/**
 * Check if user is ADMIN
 */
const requireAdmin = requireRole('ADMIN');

/**
 * Check if user is HR or ADMIN
 */
const requireHR = requireRole('HR', 'ADMIN');

/**
 * Check if user is MANAGER, HR, or ADMIN
 */
const requireManager = requireRole('MANAGER', 'HR', 'ADMIN');

module.exports = {
  requireRole,
  requireAdmin,
  requireHR,
  requireManager,
};

