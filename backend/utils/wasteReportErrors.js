/**
 * Custom error classes and error handling utilities for waste reports
 */

// Custom error classes
export class WasteReportError extends Error {
  constructor(message, statusCode = 500, code = 'WASTE_REPORT_ERROR') {
    super(message);
    this.name = 'WasteReportError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends WasteReportError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NotFoundError extends WasteReportError {
  constructor(resource = 'Report') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends WasteReportError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends WasteReportError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends WasteReportError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

// Error handling utilities
export const handleDatabaseError = (error) => {
  console.error('Database error:', error);

  // Handle specific Supabase/PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new ConflictError('Resource already exists');
      case '23503': // Foreign key violation
        return new ValidationError('Referenced resource does not exist');
      case '23502': // Not null violation
        return new ValidationError('Required field is missing');
      case '22001': // String data right truncation
        return new ValidationError('Data too long for field');
      case 'PGRST116': // No rows returned
        return new NotFoundError();
      default:
        return new WasteReportError('Database operation failed');
    }
  }

  // Handle Supabase specific errors
  if (error.message) {
    if (error.message.includes('not found')) {
      return new NotFoundError();
    }
    if (error.message.includes('permission')) {
      return new ForbiddenError();
    }
    if (error.message.includes('duplicate')) {
      return new ConflictError('Duplicate entry');
    }
  }

  return new WasteReportError('Database operation failed');
};

// Validation helpers
export const validateReportData = (data) => {
  const errors = [];

  if (!data.location || data.location.trim().length === 0) {
    errors.push(new ValidationError('Location is required', 'location'));
  }

  if (typeof data.latitude !== 'number' || isNaN(data.latitude)) {
    errors.push(new ValidationError('Valid latitude is required', 'latitude'));
  }

  if (typeof data.longitude !== 'number' || isNaN(data.longitude)) {
    errors.push(new ValidationError('Valid longitude is required', 'longitude'));
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push(new ValidationError('Description must be at least 10 characters', 'description'));
  }

  if (!data.waste_type || data.waste_type.trim().length === 0) {
    errors.push(new ValidationError('Waste type is required', 'waste_type'));
  }

  return errors;
};

export const validateUUID = (id, fieldName = 'id') => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!id || !uuidRegex.test(id)) {
    throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
  }
};

export const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new ValidationError('Latitude must be between -90 and 90', 'latitude');
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    throw new ValidationError('Longitude must be between -180 and 180', 'longitude');
  }

  return { latitude: lat, longitude: lng };
};

// Error response formatter
export const formatErrorResponse = (error) => {
  if (error instanceof WasteReportError) {
    return {
      success: false,
      error: error.code,
      message: error.message,
      statusCode: error.statusCode,
      ...(error.field && { field: error.field })
    };
  }

  // Handle validation errors from express-validator
  if (error.array && typeof error.array === 'function') {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      statusCode: 400,
      errors: error.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    };
  }

  // Generic error
  return {
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500
  };
};

// Async error wrapper for controllers
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error logging utility
export const logError = (error, context = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    },
    context
  };

  console.error('Waste Report Error:', JSON.stringify(logData, null, 2));
};

export default {
  WasteReportError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  handleDatabaseError,
  validateReportData,
  validateUUID,
  validateCoordinates,
  formatErrorResponse,
  asyncHandler,
  logError
};