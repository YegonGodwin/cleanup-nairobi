import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  createDriver,
  getAllDrivers,
  assignDriver,
  updateUserRole,
  deleteUser,
  getRecentActivities
} from '../controllers/adminController.js';

const router = express.Router();

// Validation rules
const createDriverValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('vehicleNumber').trim().notEmpty().withMessage('Vehicle number is required'),
  body('vehicleType').trim().notEmpty().withMessage('Vehicle type is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required')
];

const assignDriverValidation = [
  body('reportId').notEmpty().withMessage('Report ID is required'),
  body('driverId').notEmpty().withMessage('Driver ID is required')
];

const updateRoleValidation = [
  body('role').trim().notEmpty().withMessage('Role is required')
];

// Routes
router.get('/stats', authenticate, isAdmin, getDashboardStats);
router.get('/users', authenticate, isAdmin, getAllUsers);
router.get('/users/:id', authenticate, isAdmin, getUserById);
router.post('/drivers', authenticate, isAdmin, createDriverValidation, validate, createDriver);
router.get('/drivers', authenticate, isAdmin, getAllDrivers);
router.post('/assign-driver', authenticate, isAdmin, assignDriverValidation, validate, assignDriver);
router.put('/users/:id/role', authenticate, isAdmin, updateRoleValidation, validate, updateUserRole);
router.delete('/users/:id', authenticate, isAdmin, deleteUser);
router.get('/activities', authenticate, isAdmin, getRecentActivities);

export default router;
