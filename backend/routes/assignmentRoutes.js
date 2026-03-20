import express from 'express';
import { authenticate, isDriver, isAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  validateGetDriverTasks,
  validateAcceptAssignment,
  validateStartAssignment,
  validateCompleteAssignment,
  validateAssignReport
} from '../middleware/wasteReportValidation.js';
import {
  getDriverTasks,
  acceptAssignment,
  startAssignment,
  completeAssignment,
  assignReport
} from '../controllers/assignmentsController.js';

const router = express.Router();

// Get driver's assigned tasks
router.get('/driver', 
  authenticate, 
  isDriver, 
  validateGetDriverTasks, 
  validate, 
  getDriverTasks
);

// Accept assignment
router.put('/:id/accept', 
  authenticate, 
  isDriver, 
  validateAcceptAssignment, 
  validate, 
  acceptAssignment
);

// Start assignment
router.put('/:id/start', 
  authenticate, 
  isDriver, 
  validateStartAssignment, 
  validate, 
  startAssignment
);

// Complete assignment
router.put('/:id/complete', 
  authenticate, 
  isDriver, 
  validateCompleteAssignment, 
  validate, 
  completeAssignment
);


export default router;