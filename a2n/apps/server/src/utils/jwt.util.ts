import jwt from 'jsonwebtoken';
import type { TokenPayload, User } from '../types/auth.types';
import { AuthError, UnauthorizedError } from '../types/auth.types';

// JWT Configuration
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'; // 7 days

/**
 * Generate an access token for a user
 * @param user - The user object
 * @param sessionId - The session ID
 * @returns string - The JWT access token
 */
export function generateAccessToken(user: User, sessionId: string): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    sessionId,
    role: user.role,
  };

  try {
    return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'a2n-auth',
      audience: 'a2n-app',
    } as jwt.SignOptions);
  } catch (error) {
    throw new AuthError('Failed to generate access token', 'TOKEN_GENERATION_ERROR', 500);
  }
}

/**
 * Generate a refresh token
 * @param userId - The user ID
 * @param sessionId - The session ID
 * @returns string - The JWT refresh token
 */
export function generateRefreshToken(userId: string, sessionId: string): string {
  const payload = {
    userId,
    sessionId,
    type: 'refresh',
  };

  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET as jwt.Secret, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'a2n-auth',
      audience: 'a2n-app',
    } as jwt.SignOptions);
  } catch (error) {
    throw new AuthError('Failed to generate refresh token', 'TOKEN_GENERATION_ERROR', 500);
  }
}

/**
 * Verify and decode an access token
 * @param token - The JWT access token
 * @returns Promise<TokenPayload> - The decoded token payload
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'a2n-auth',
      audience: 'a2n-app',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid access token');
    } else {
      throw new AuthError('Failed to verify access token', 'TOKEN_VERIFICATION_ERROR', 500);
    }
  }
}

/**
 * Verify and decode a refresh token
 * @param token - The JWT refresh token
 * @returns Promise<{ userId: string; sessionId: string; type: string }> - The decoded token payload
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string; sessionId: string; type: string }> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'a2n-auth',
      audience: 'a2n-app',
    }) as { userId: string; sessionId: string; type: string };

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    } else {
      throw new AuthError('Failed to verify refresh token', 'TOKEN_VERIFICATION_ERROR', 500);
    }
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns string | null - The extracted token or null if not found
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Get token expiration time
 * @param token - The JWT token
 * @returns Date | null - The expiration date or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 * @param token - The JWT token
 * @returns boolean - True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true;
  }
  return expiration.getTime() < Date.now();
}

/**
 * Generate a verification token for email verification or password reset
 * @param identifier - The identifier (email, user ID, etc.)
 * @param type - The token type (email_verification, password_reset, etc.)
 * @param expiresIn - Token expiration time (default: 1h)
 * @returns string - The verification token
 */
export function generateVerificationToken(
  identifier: string, 
  type: string, 
  expiresIn: string = '1h'
): string {
  const payload = {
    identifier,
    type,
  };

  try {
    return jwt.sign(payload, JWT_SECRET as jwt.Secret, {
      expiresIn,
      issuer: 'a2n-auth',
      audience: 'a2n-app',
    } as jwt.SignOptions);
  } catch (error) {
    throw new AuthError('Failed to generate verification token', 'TOKEN_GENERATION_ERROR', 500);
  }
}

/**
 * Verify a verification token
 * @param token - The verification token
 * @param expectedType - The expected token type
 * @returns Promise<{ identifier: string; type: string }> - The decoded token payload
 */
export async function verifyVerificationToken(
  token: string, 
  expectedType: string
): Promise<{ identifier: string; type: string }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'a2n-auth',
      audience: 'a2n-app',
    }) as { identifier: string; type: string };

    if (decoded.type !== expectedType) {
      throw new UnauthorizedError('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Verification token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid verification token');
    } else {
      throw new AuthError('Failed to verify verification token', 'TOKEN_VERIFICATION_ERROR', 500);
    }
  }
}