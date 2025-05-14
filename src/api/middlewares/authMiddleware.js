/**
 * Authentication Middleware
 * 
 * Provides middleware functions for authenticating API requests
 * Used for protecting admin panel API routes
 */

const jwt = require('jsonwebtoken');
const { errorResponse } = require('../../utils/responseHandler');
const User = require('../../models/user');
const logger = require('../../utils/logger');

/**
 * Verify JWT token middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return errorResponse(res, 'Authentication token missing', 401);
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nest-platform-jwt-secret');
    
    // Find user by ID
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return errorResponse(res, 'Invalid authentication token', 401);
    }
    
    // Add user to request object
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    
    return errorResponse(res, 'Authentication failed', 500);
  }
};

/**
 * Refresh token middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from request body
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token missing', 400);
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'nest-platform-refresh-secret');
    
    // Find user by ID
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return errorResponse(res, 'Invalid refresh token', 401);
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'nest-platform-jwt-secret',
      { expiresIn: '1h' }
    );
    
    // Return new access token
    return res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    logger.error('Refresh token middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid refresh token', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Refresh token expired', 401);
    }
    
    return errorResponse(res, 'Token refresh failed', 500);
  }
};

/**
 * Optional authentication middleware
 * Used for routes that can be accessed by both authenticated and anonymous users
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, proceed as anonymous user
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      // No token, proceed as anonymous user
      req.user = null;
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nest-platform-jwt-secret');
    
    // Find user by ID
    const user = await User.findById(decoded.id);
    
    // Add user to request object (or null if user not found)
    req.user = user || null;
    
    next();
  } catch (error) {
    // Token validation failed, proceed as anonymous user
    req.user = null;
    next();
  }
};
