import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  sendEmail,
} from '../utils/token.utils.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const user = new User({
    name,
    email,
    password,
  });

  // Generate Email Verification Token
  const verificationToken = user.generateEmailVerificationToken();

  // Generate Initial Tokens & Store Refresh Token
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenHash = hashToken(refreshToken);

  user.refreshTokens.push({
    tokenHash: refreshTokenHash,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  });

  await user.save();

  // Send Verification Email
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Email Verification - MyFinance',
    html: `
      <h2>Welcome to MyFinance, ${user.name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" target="_blank" style="padding:10px 15px; background:#4F46E5; color:#fff; text-decoration:none; border-radius:5px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
  });

  setRefreshTokenCookie(res, refreshToken);

  const registeredUser = await User.findById(user._id).select('-refreshTokens -password');

  return res.status(201).json(
    new ApiResponse(
      201,
      { user: registeredUser, accessToken },
      'User registered successfully. Verification email sent.'
    )
  );
});

/**
 * @desc    Verify user email
 * @route   GET /api/v1/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired email verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, 'Email verified successfully! You can now log in.')
  );
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.authProvider === 'google' && !user.password) {
    throw new ApiError(
      400,
      'This account was created using Google Sign-In. Please log in with Google.'
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenHash = hashToken(refreshToken);

  // Maintain max 5 active sessions
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift();
  }

  user.refreshTokens.push({
    tokenHash: refreshTokenHash,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  });

  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  const loggedInUser = await User.findById(user._id).select('-refreshTokens -password');

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: loggedInUser, accessToken },
      'Logged in successfully'
    )
  );
});

/**
 * @desc    Refresh Access Token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public (Cookie / Token based)
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    clearRefreshTokenCookie(res);
    throw new ApiError(401, 'Expired or invalid refresh token');
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    clearRefreshTokenCookie(res);
    throw new ApiError(401, 'User not found for refresh token');
  }

  const incomingHash = hashToken(incomingRefreshToken);
  const tokenIndex = user.refreshTokens.findIndex(
    (rt) => rt.tokenHash === incomingHash
  );

  // Token Reuse Detection / Revocation Check
  if (tokenIndex === -1) {
    // Possible token reuse attack! Revoke all tokens for user.
    user.refreshTokens = [];
    await user.save();
    clearRefreshTokenCookie(res);
    throw new ApiError(
      401,
      'Invalid refresh token state detected. All sessions revoked.'
    );
  }

  // Refresh Token Rotation: Replace old token with new token
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  const newRefreshTokenHash = hashToken(newRefreshToken);

  user.refreshTokens[tokenIndex] = {
    tokenHash: newRefreshTokenHash,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    createdAt: new Date(),
  };

  await user.save();

  setRefreshTokenCookie(res, newRefreshToken);

  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken: newAccessToken },
      'Access token refreshed successfully'
    )
  );
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (refreshToken) {
    const refreshTokenHash = hashToken(refreshToken);
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { tokenHash: refreshTokenHash } },
    });
  }

  clearRefreshTokenCookie(res);

  return res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
});

/**
 * @desc    Forgot Password Request
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // For security, do not disclose whether user exists or not
    return res.status(200).json(
      new ApiResponse(
        200,
        {},
        'If an account with that email exists, a password reset link has been sent.'
      )
    );
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request - MyFinance',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your MyFinance account.</p>
      <p>Click the link below to set a new password:</p>
      <a href="${resetUrl}" target="_blank" style="padding:10px 15px; background:#EF4444; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a>
      <p>This link is valid for 15 minutes. If you did not request this, please ignore this email.</p>
    `,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'If an account with that email exists, a password reset link has been sent.'
    )
  );
});

/**
 * @desc    Reset Password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  // Set new password (pre-save hook will hash it automatically)
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Invalidate all active sessions for security
  user.refreshTokens = [];

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      'Password reset successfully. You can now log in with your new password.'
    )
  );
});

/**
 * @desc    Change Password (Authenticated User)
 * @route   POST /api/v1/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (user.authProvider === 'google' && !user.password) {
    throw new ApiError(
      400,
      'Accounts signed up via Google OAuth cannot change password here.'
    );
  }

  const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordCorrect) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, 'Password changed successfully')
  );
});

/**
 * @desc    Google OAuth Login / Register
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, 'Google OAuth Client ID is not configured on server');
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw new ApiError(400, 'Invalid Google ID token');
  }

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // If user exists with email but no googleId, link account
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      if (picture && !user.avatar) user.avatar = picture;
    }
  } else {
    // Create new Google user
    user = new User({
      name,
      email,
      googleId,
      authProvider: 'google',
      isEmailVerified: true,
      avatar: picture || '',
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  const refreshTokenHash = hashToken(refreshToken);

  user.refreshTokens.push({
    tokenHash: refreshTokenHash,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  });

  await user.save();

  setRefreshTokenCookie(res, refreshToken);

  const authenticatedUser = await User.findById(user._id).select('-refreshTokens -password');

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: authenticatedUser, accessToken },
      'Google login successful'
    )
  );
});

/**
 * @desc    Get Current Authenticated User Profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, { user: req.user }, 'Current user profile fetched')
  );
});
