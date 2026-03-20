import express from 'express';
import { validate } from '../middleware/validation.js';
import { authenticate, isAdmin, isDriver } from '../middleware/auth.js';
import {
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
  transformReportQueryParams,
  validateAssignReport
} from '../middleware/wasteReportValidation.js';
import {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
  deleteReport,
  getUserReports,
  getNearbyReports,
  getAvailableReportsForAssignment,
  getReportsStats,
  checkReportAssignability
} from '../controllers/wasteReportController.js';
import { assignReport } from '../controllers/assignmentsController.js';

const router = express.Router();

// Routes with enhanced validation

// Create new waste report (Users)
router.post('/', 
  authenticate, 
  validateCreateReport, 
  validateNairobiCoordinates,
  validate, 
  createReport
);

// Get all reports with filters (Admin)
router.get('/',
  authenticate,
  isAdmin,
  transformReportQueryParams,
  validateGetReports,
  validateDateRange,
  validate,
  getReports
);

// Get user's own reports (legacy endpoint)
router.get('/my-reports', 
  authenticate, 
  validateGetUserReports, 
  validate, 
  getUserReports
);

// Get user's own reports (new endpoint with pagination and sorting)
router.get('/user', 
  authenticate, 
  validateGetUserReports, 
  validate, 
  getUserReports
);

// Get reports available for assignment (Admin)
router.get('/available',
  authenticate,
  isAdmin,
  transformReportQueryParams,
  validateGetAvailableReports,
  validate,
  getAvailableReportsForAssignment
);

// Get reports statistics (Admin)
router.get('/stats',
  authenticate,
  isAdmin,
  transformReportQueryParams,
  validateGetReportsStats,
  validateDateRange,
  validate,
  getReportsStats
);

// Get nearby reports (Drivers)
router.get('/nearby', 
  authenticate, 
  isDriver, 
  validateGetNearbyReports, 
  validate, 
  getNearbyReports
);

// Get single report by ID
router.get('/:id', 
  authenticate, 
  validateGetReportById, 
  validate, 
  getReportById
);

// Check if report can be assigned (Admin)
router.get('/:id/assignable',
  authenticate,
  isAdmin,
  validateGetReportById,
  validate,
  checkReportAssignability
);

// Assign report to driver (Admin only)
router.post('/:id/assign',
  authenticate,
  isAdmin,
  validateGetReportById,
  validateAssignReport,
  validate,
  assignReport
);

// Update report status (Admin/Driver)
router.put('/:id/status', 
  authenticate, 
  validateUpdateReportStatus, 
  validate, 
  updateReportStatus
);



// Delete report (Admin only)
router.delete('/:id', 
  authenticate, 
  isAdmin, 
  validateDeleteReport, 
  validate, 
  deleteReport
);

export default router;
