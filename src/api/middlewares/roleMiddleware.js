/**
 * Role Middleware
 * 
 * Provides middleware functions for role-based access control
 * Used for restricting admin panel API routes to specific user roles
 */

const { errorResponse } = require('../../utils/responseHandler');
const logger = require('../../utils/logger');

/**
 * Check role middleware
 * Verifies if the authenticated user has the required role
 * 
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} Express middleware function
 */
exports.checkRole = (roles) => {
  // Convert single role to array for consistent handling
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }
      
      // Check if user's role is allowed
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`User ${req.user._id} with role ${req.user.role} attempted to access resource restricted to ${allowedRoles.join(', ')}`);
        return errorResponse(res, 'Insufficient permissions', 403);
      }
      
      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      return errorResponse(res, 'Role verification failed', 500);
    }
  };
};

/**
 * Check ownership middleware
 * Verifies if the authenticated user is the owner of the resource
 * 
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware function
 */
exports.checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }
      
      // Get owner ID of the resource
      const ownerId = await getResourceOwnerId(req);
      
      // Check if user is the owner
      if (ownerId && req.user._id.toString() !== ownerId.toString()) {
        logger.warn(`User ${req.user._id} attempted to access resource owned by ${ownerId}`);
        return errorResponse(res, 'You do not have permission to access this resource', 403);
      }
      
      next();
    } catch (error) {
      logger.error('Ownership middleware error:', error);
      return errorResponse(res, 'Ownership verification failed', 500);
    }
  };
};

/**
 * Check permission middleware
 * Verifies if the authenticated user has the required permission
 * 
 * @param {string|Array} permissions - Required permission(s)
 * @returns {Function} Express middleware function
 */
exports.checkPermission = (permissions) => {
  // Convert single permission to array for consistent handling
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  
  return (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }
      
      // Check if user has the required permissions
      if (!req.user.permissions) {
        return errorResponse(res, 'Insufficient permissions', 403);
      }
      
      const hasAllPermissions = requiredPermissions.every(permission => 
        req.user.permissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        logger.warn(`User ${req.user._id} with permissions ${req.user.permissions.join(', ')} attempted to access resource requiring ${requiredPermissions.join(', ')}`);
        return errorResponse(res, 'Insufficient permissions', 403);
      }
      
      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      return errorResponse(res, 'Permission verification failed', 500);
    }
  };
};

/**
 * Admin or owner middleware
 * Allows access if the user is an admin or the owner of the resource
 * 
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware function
 */
exports.adminOrOwner = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return errorResponse(res, 'Authentication required', 401);
      }
      
      // If user is an admin, allow access
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Otherwise, check ownership
      const ownerId = await getResourceOwnerId(req);
      
      // Check if user is the owner
      if (ownerId && req.user._id.toString() !== ownerId.toString()) {
        logger.warn(`User ${req.user._id} attempted to access resource owned by ${ownerId}`);
        return errorResponse(res, 'You do not have permission to access this resource', 403);
      }
      
      next();
    } catch (error) {
      logger.error('Admin or owner middleware error:', error);
      return errorResponse(res, 'Access verification failed', 500);
    }
  };
};
