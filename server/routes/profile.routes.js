import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  seedDemoTransactions,
} from '../controllers/profile.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { uploadAvatarMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

// Protect all profile routes with JWT verification
router.use(verifyJWT);

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/avatar', uploadAvatarMiddleware, uploadAvatar);
router.post('/seed-demo', seedDemoTransactions);

export default router;
