import express from 'express';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles
} from '../controllers/vehicleController.js';

const router = express.Router();

// All routes are protected and admin-only
router.use(authenticate);
router.use(isAdmin);

router.get('/available', getAvailableVehicles);

router.route('/')
  .get(getAllVehicles)
  .post(createVehicle);

router.route('/:id')
  .get(getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

export default router;
