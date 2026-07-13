// ============================================
// User Routes
// ============================================
import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from '../validators/user.validator';

const router = Router();

// All routes require authentication
router.use(protect);

// All routes require admin or manager role
router.use(authorize('admin', 'manager'));

router.get('/', validate(userQuerySchema, 'query'), userController.getUsers);
router.post('/', validate(createUserSchema), userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);
router.put('/:id/suspend', authorize('admin'), userController.suspendUser);
router.put('/:id/reset-password', authorize('admin'), userController.resetPassword);

export default router;
