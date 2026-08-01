import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * Generate Access Token (Short-lived)
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    }
  );
};

/**
 * Generate Refresh Token (Long-lived)
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    }
  );
};

/**
 * Hash raw token string with SHA-256 for secure DB storage
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Set Refresh Token in httpOnly Cookie
 */
export const setRefreshTokenCookie = (res, refreshToken) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('refreshToken', refreshToken, options);
};

/**
 * Clear Refresh Token Cookie
 */
export const clearRefreshTokenCookie = (res) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });
};

/**
 * Send Email helper (Nodemailer)
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // If no SMTP configured, log to console in dev mode
  if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('mailtrap')) {
    console.log(`\n================ EMAIL SIMULATION ================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log(`==================================================\n`);
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Auth App" <noreply@example.com>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[Email Sending Error]:`, error.message);
    // Don't crash process, but log error
  }
};
