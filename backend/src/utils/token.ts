// ============================================
// JWT Token Utilities
// ============================================
import jwt from 'jsonwebtoken';
import env from '../config/env';

interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Generate a short-lived access token (default 15 minutes).
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE,
  } as jwt.SignOptions);
};

/**
 * Generate a long-lived refresh token (default 7 days).
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRE,
  } as jwt.SignOptions);
};

/**
 * Verify an access token and return the decoded payload.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

/**
 * Verify a refresh token and return the decoded payload.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};

/**
 * Generate a random hex token for password resets.
 */
export const generateResetToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};
