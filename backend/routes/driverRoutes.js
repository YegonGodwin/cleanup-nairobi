import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, isAdmin, isDriver } from '../middleware/auth.js';
import {
  getDriverProfile,
  updateDriverProfile,
  getDriverAssignments,
  acceptAssignment,
  startAssignment,
  completeAssignment,
  cancelAssignment,
  getDriverStats,
  getDriverVehicle
} from '../controllers/driverController.js';
import { getAllDrivers } from '../controllers/adminController.js';

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('vehicleNumber').optional().trim().notEmpty().withMessage('Vehicle number cannot be empty'),
  body('vehicleType').optional().trim().notEmpty().withMessage('Vehicle type cannot be empty'),
  body('licenseNumber').optional().trim().notEmpty().withMessage('License number cannot be empty')
];

const completeAssignmentValidation = [
  body('notes').optional().trim()
];

const cancelAssignmentValidation = [
  body('reason').trim().notEmpty().withMessage('Cancellation reason is required')
];

// Routes
router.get('/profile', authenticate, isDriver, getDriverProfile);
router.put('/profile', authenticate, isDriver, updateProfileValidation, validate, updateDriverProfile);
router.get('/vehicle', authenticate, isDriver, getDriverVehicle);
router.get('/assignments', authenticate, isDriver, getDriverAssignments);
router.get('/stats', authenticate, isDriver, getDriverStats);
router.put('/assignments/:id/accept', authenticate, isDriver, acceptAssignment);
router.put('/assignments/:id/start', authenticate, isDriver, startAssignment);
router.put('/assignments/:id/complete', authenticate, isDriver, completeAssignmentValidation, validate, completeAssignment);
router.put('/assignments/:id/cancel', authenticate, isDriver, cancelAssignmentValidation, validate, cancelAssignment);

// Get available drivers (Admin only) - matches the expected client-side route
router.get('/available', authenticate, isAdmin, getAllDrivers);

export default router;
