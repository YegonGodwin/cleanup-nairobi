import { body, query, param } from "express-validator";
import { REPORT_STATUS, ASSIGNMENT_STATUS } from "../config/database.js";

/**
 * Validation middleware for waste report operations
 */

// Waste types allowed in the system
const VALID_WASTE_TYPES = [
  "plastic",
  "organic",
  "metal",
  "glass",
  "paper",
  "electronic",
  "hazardous",
  "mixed",
  "other",
];

// Create report validation
export const validateCreateReport = [
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 3, max: 255 })
    .withMessage("Location must be between 3 and 255 characters"),

  body("latitude")
    .optional({ nullable: true })
    .custom((value) => {
      // Allow null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // If provided, must be a valid float
      const num = parseFloat(value);
      if (isNaN(num) || num < -90 || num > 90) {
        throw new Error("Latitude must be a valid number between -90 and 90");
      }
      return true;
    }),

  body("longitude")
    .optional({ nullable: true })
    .custom((value) => {
      // Allow null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // If provided, must be a valid float
      const num = parseFloat(value);
      if (isNaN(num) || num < -180 || num > 180) {
        throw new Error("Longitude must be a valid number between -180 and 180");
      }
      return true;
    }),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),

  body("waste_type")
    .trim()
    .notEmpty()
    .withMessage("Waste type is required")
    .isIn(VALID_WASTE_TYPES)
    .withMessage(`Waste type must be one of: ${VALID_WASTE_TYPES.join(", ")}`),

  body("image_url")
    .optional()
    .isURL()
    .withMessage("Image URL must be a valid URL"),
];

// Update report status validation
export const validateUpdateReportStatus = [
  param("id").isUUID().withMessage("Report ID must be a valid UUID"),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(Object.values(REPORT_STATUS))
    .withMessage(
      `Status must be one of: ${Object.values(REPORT_STATUS).join(", ")}`
    ),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

// Middleware to transform camelCase query parameters to snake_case
export const transformReportQueryParams = (req, res, next) => {
  // Convert camelCase to snake_case parameters
  if (req.query) {
    // Map of camelCase to snake_case conversions
    const paramMap = {
      'sortBy': 'sort_by',
      'order': 'sort_order',
      'search': 'search',
      'dateFrom': 'dateFrom',
      'dateTo': 'dateTo',
      'status': 'status',
      'category': 'waste_type',
      'zone': 'zone', // Keep zone as zone, don't map to location
      'priority': 'priority',
      'page': 'page',
      'limit': 'limit'
    };

    // Handle dateRange if provided and convert to dateFrom and dateTo
    if (req.query.dateRange) {
      const dateRange = req.query.dateRange;
      let dateFrom, dateTo;

      const now = new Date();
      switch(dateRange) {
        case 'Today':
          dateFrom = new Date(now);
          dateFrom.setHours(0, 0, 0, 0);
          dateTo = new Date(now);
          dateTo.setHours(23, 59, 59, 999);
          break;
        case 'Yesterday':
          dateFrom = new Date(now);
          dateFrom.setDate(now.getDate() - 1);
          dateFrom.setHours(0, 0, 0, 0);
          dateTo = new Date(now);
          dateTo.setDate(now.getDate() - 1);
          dateTo.setHours(23, 59, 59, 999);
          break;
        case 'Last 7 days':
          dateFrom = new Date(now);
          dateFrom.setDate(now.getDate() - 7);
          dateTo = now;
          break;
        case 'Last 30 days':
          dateFrom = new Date(now);
          dateFrom.setDate(now.getDate() - 30);
          dateTo = now;
          break;
        case 'Last 90 days':
          dateFrom = new Date(now);
          dateFrom.setDate(now.getDate() - 90);
          dateTo = now;
          break;
        default:
          // If dateRange is not recognized, just continue without conversion
          break;
      }

      if (dateFrom && dateTo) {
        req.query.dateFrom = dateFrom.toISOString();
        req.query.dateTo = dateTo.toISOString();
      }
    }

    // Convert other parameters from camelCase to snake_case
    Object.keys(paramMap).forEach(camelKey => {
      if (req.query[camelKey] !== undefined && paramMap[camelKey] !== camelKey) {
        req.query[paramMap[camelKey]] = req.query[camelKey];
        delete req.query[camelKey]; // Remove the camelCase version
      }
    });

    // Convert specific camelCase values to snake_case
    if (req.query.sort_by) {
      if (req.query.sort_by === 'createdAt') {
        req.query.sort_by = 'created_at';
      } else if (req.query.sort_by === 'updatedAt') {
        req.query.sort_by = 'updated_at';
      }
    }

    // Filter out "All" values as they mean no filter should be applied
    Object.keys(req.query).forEach(key => {
      if (req.query[key] === 'All' || req.query[key] === '') {
        delete req.query[key];
      }
    });
  }

  next();
};

// Get reports validation (query parameters)
export const validateGetReports = [
  query("status")
    .optional()
    .custom((value) => {
      if (value === 'All' || value === '') return true;
      return Object.values(REPORT_STATUS).includes(value);
    })
    .withMessage(
      `Status must be one of: ${Object.values(REPORT_STATUS).join(", ")} or 'All'`
    ),

  query("waste_type")
    .optional()
    .custom((value) => {
      if (value === 'All' || value === '') return true;
      return VALID_WASTE_TYPES.includes(value);
    })
    .withMessage(`Waste type must be one of: ${VALID_WASTE_TYPES.join(", ")} or 'All'`),

  query("user_id")
    .optional()
    .isUUID()
    .withMessage("User ID must be a valid UUID"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Date from must be a valid ISO 8601 date"),

  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("Date to must be a valid ISO 8601 date"),

  query("search")
    .optional()
    .custom((value) => {
      if (!value || value.trim() === '') return true; // Allow empty search
      return value.trim().length >= 2 && value.trim().length <= 100;
    })
    .withMessage("Search term must be between 2 and 100 characters when provided"),

  query("priority")
    .optional()
    .custom((value) => {
      if (value === 'All' || value === '') return true;
      return ['low', 'medium', 'high', 'urgent'].includes(value.toLowerCase());
    })
    .withMessage("Priority must be one of: low, medium, high, urgent or 'All'"),

  query("zone")
    .optional()
    .custom((value) => {
      if (value === 'All' || value === '') return true;
      return ['central', 'east', 'west', 'north', 'south'].includes(value.toLowerCase());
    })
    .withMessage("Zone must be one of: central, east, west, north, south or 'All'"),

  query("sort_by")
    .optional()
    .custom((value) => {
      const validValues = ['created_at', 'status', 'waste_type', 'location', 'updated_at', 'createdAt', 'updatedAt'];
      return validValues.includes(value);
    })
    .withMessage("Sort by must be one of: created_at, status, waste_type, location, updated_at"),

  query("sort_order")
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("Sort order must be either 'asc' or 'desc'"),
];

// Get report by ID validation
export const validateGetReportById = [
  param("id").isUUID().withMessage("Report ID must be a valid UUID"),
];

// Delete report validation
export const validateDeleteReport = [
  param("id").isUUID().withMessage("Report ID must be a valid UUID"),
];

// Get nearby reports validation
export const validateGetNearbyReports = [
  query("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a valid number between -90 and 90"),

  query("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a valid number between -180 and 180"),

  query("radius")
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage("Radius must be between 0.1 and 50 kilometers"),
];

// Get user reports validation
export const validateGetUserReports = [
  query("status")
    .optional()
    .custom((value) => {
      if (value === 'All' || value === '') return true;
      return Object.values(REPORT_STATUS).includes(value);
    })
    .withMessage(
      `Status must be one of: ${Object.values(REPORT_STATUS).join(", ")} or 'All'`
    ),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort_by")
    .optional()
    .isIn(['created_at', 'status', 'waste_type', 'location'])
    .withMessage("Sort by must be one of: created_at, status, waste_type, location"),

  query("sort_order")
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("Sort order must be either 'asc' or 'desc'"),
];

// Get available reports validation
export const validateGetAvailableReports = [
  query("wasteType")
    .optional()
    .isIn(VALID_WASTE_TYPES)
    .withMessage(`Waste type must be one of: ${VALID_WASTE_TYPES.join(", ")}`),

  query("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Location filter must be between 2 and 100 characters"),
];

// Get reports statistics validation
export const validateGetReportsStats = [
  query("userId")
    .optional()
    .isUUID()
    .withMessage("User ID must be a valid UUID"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Date from must be a valid ISO 8601 date"),

  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("Date to must be a valid ISO 8601 date"),
];

// Custom validation to check date range
export const validateDateRange = (req, res, next) => {
  const { dateFrom, dateTo } = req.query;

  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "Date from cannot be later than date to",
        errors: [
          {
            field: "dateRange",
            message: "Invalid date range",
          },
        ],
      });
    }

    // Check if date range is not too large (e.g., more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000; // milliseconds
    if (toDate - fromDate > oneYear) {
      return res.status(400).json({
        success: false,
        message: "Date range cannot exceed one year",
        errors: [
          {
            field: "dateRange",
            message: "Date range too large",
          },
        ],
      });
    }
  }

  next();
};

// Custom validation to check coordinates are within Nairobi bounds (only when coordinates are provided)
export const validateNairobiCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body || req.query;

  // Only validate if both coordinates are provided and not null/empty
  if (latitude !== null && latitude !== undefined && latitude !== '' &&
      longitude !== null && longitude !== undefined && longitude !== '') {
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Skip validation if coordinates are invalid numbers (let other validators handle this)
    if (isNaN(lat) || isNaN(lng)) {
      return next();
    }

    // Expanded bounds for greater Nairobi area (more inclusive)
    const NAIROBI_BOUNDS = {
      north: -0.1,   // Extended north (Kiambu, Ruiru, Thika area)
      south: -1.8,   // Extended south (Athi River, Machakos area)  
      east: 37.8,    // Extended east (Thika, Ruiru, Juja area)
      west: 36.2,    // Extended west (Ngong, Karen, Kikuyu area)
    };

    // Log coordinates for debugging
    console.log('Validating coordinates:', { lat, lng, bounds: NAIROBI_BOUNDS });

    if (
      lat < NAIROBI_BOUNDS.south ||
      lat > NAIROBI_BOUNDS.north ||
      lng < NAIROBI_BOUNDS.west ||
      lng > NAIROBI_BOUNDS.east
    ) {
      console.log('Coordinates outside bounds:', { 
        lat, lng, 
        withinBounds: {
          latOk: lat >= NAIROBI_BOUNDS.south && lat <= NAIROBI_BOUNDS.north,
          lngOk: lng >= NAIROBI_BOUNDS.west && lng <= NAIROBI_BOUNDS.east
        }
      });
      
      return res.status(400).json({
        success: false,
        message: "Coordinates must be within Nairobi area",
        errors: [
          {
            field: "coordinates",
            message: "Location outside service area",
          },
        ],
      });
    }
  }

  // If no coordinates provided or coordinates are null/empty, skip validation
  next();
};

// Assign report validation
export const validateAssignReport = [
  param("id").isUUID().withMessage("Report ID must be a valid UUID"),

  body("driver_id")
    .notEmpty()
    .withMessage("Driver ID is required")
    .isUUID()
    .withMessage("Driver ID must be a valid UUID"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),
];

// Get driver tasks validation
export const validateGetDriverTasks = [
  query("status")
    .optional()
    .isIn(Object.values(ASSIGNMENT_STATUS))
    .withMessage(
      `Status must be one of: ${Object.values(ASSIGNMENT_STATUS).join(", ")}`
    ),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sort_by")
    .optional()
    .isIn(['assigned_at', 'status', 'accepted_at', 'started_at'])
    .withMessage("Sort by must be one of: assigned_at, status, accepted_at, started_at"),

  query("sort_order")
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("Sort order must be either 'asc' or 'desc'"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Date from must be a valid ISO 8601 date"),

  query("dateTo")
    .optional()
    .isISO8601()
    .withMessage("Date to must be a valid ISO 8601 date"),
];

// Accept assignment validation
export const validateAcceptAssignment = [
  param("id").isUUID().withMessage("Assignment ID must be a valid UUID"),
];

// Start assignment validation
export const validateStartAssignment = [
  param("id").isUUID().withMessage("Assignment ID must be a valid UUID"),
];

// Complete assignment validation
export const validateCompleteAssignment = [
  param("id").isUUID().withMessage("Assignment ID must be a valid UUID"),

  body("completion_notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Completion notes must not exceed 1000 characters"),

  body("completion_image_url")
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value === '') {
        return true; // Allow empty/null values
      }
      
      // More flexible URL validation
      try {
        new URL(value);
        return true;
      } catch (error) {
        // If it's not a valid URL, check if it's a reasonable image URL pattern
        const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
        const generalUrlPattern = /^https?:\/\/.+/i;
        
        if (urlPattern.test(value) || generalUrlPattern.test(value)) {
          return true;
        }
        
        throw new Error("Completion image URL must be a valid URL");
      }
    }),
];

export default {
  validateCreateReport,
  validateUpdateReportStatus,
  validateGetReports,
  validateGetReportById,
  validateDeleteReport,
  validateGetNearbyReports,
  validateGetUserReports,
  validateGetAvailableReports,
  validateGetReportsStats,
  validateDateRange,
  validateNairobiCoordinates,
  validateAssignReport,
  validateGetDriverTasks,
  validateAcceptAssignment,
  validateStartAssignment,
  validateCompleteAssignment,
  VALID_WASTE_TYPES,
};
