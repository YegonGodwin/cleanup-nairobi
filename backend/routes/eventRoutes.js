import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getUserEvents
} from '../controllers/eventController.js';

const router = express.Router();

// Validation rules
const createEventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1')
];

// Routes
router.post('/', authenticate, isAdmin, createEventValidation, validate, createEvent);
router.get('/', getEvents);
router.get('/my-events', authenticate, getUserEvents);
router.get('/:id', getEventById);
router.put('/:id', authenticate, isAdmin, updateEvent);
router.delete('/:id', authenticate, isAdmin, deleteEvent);
router.post('/:id/join', authenticate, joinEvent);
router.delete('/:id/leave', authenticate, leaveEvent);

export default router;
