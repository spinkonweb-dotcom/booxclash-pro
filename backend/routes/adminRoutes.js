// adminRoutes.js
import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  approveAdmin,
} from '../controllers/adminController.js'; 
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Change this line
router.route('/users') // The endpoint is now '/users' relative to the base
  .get(protect, authorize('superadmin', 'admin'), getAllUsers) 
  .post(protect, authorize('superadmin'), createUser);

// Also, you'll need to adjust the other routes to be nested under /users
router.route('/users/:id') // Use '/users/:id' for specific user actions
  .put(protect, authorize('superadmin'), updateUser)
  .delete(protect, authorize('superadmin'), deleteUser);

// The approve route would become:
router.put('/users/:id/approve', protect, authorize('superadmin'), approveAdmin);

export default router;