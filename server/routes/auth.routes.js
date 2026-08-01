import { Router } from 'express';
import {
  registerUser,
  verifyEmail,
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  googleLogin,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  googleLoginValidation,
} from '../validations/auth.validation.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Public Routes (Rate limited & Validated)
router.post('/register', authRateLimiter, registerValidation, registerUser);
router.get('/verify-email', verifyEmailValidation, verifyEmail);
router.post('/login', authRateLimiter, loginValidation, loginUser);
router.post('/refresh-token', refreshAccessToken);
router.post('/forgot-password', authRateLimiter, forgotPasswordValidation, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPasswordValidation, resetPassword);
router.post('/google', googleLoginValidation, googleLogin);

// Protected Routes (Require valid JWT Access Token)
router.post('/logout', verifyJWT, logoutUser);
router.post('/change-password', verifyJWT, changePasswordValidation, changePassword);
router.get('/me', verifyJWT, getCurrentUser);

export default router;
