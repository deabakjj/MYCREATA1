/**
 * Response Handler Utility
 * 
 * Provides standardized functions for API responses
 * Ensures consistent response format across the application
 */

/**
 * Sends a success response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {*} data - Response data (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response
 */
const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Sends an error response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} errors - Detailed error information (optional)
 * @returns {Object} Express response
 */
const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Sends a paginated response
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response
 */
const paginatedResponse = (res, message = 'Success', data = [], page = 1, limit = 10, total = 0, statusCode = 200) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse
};
