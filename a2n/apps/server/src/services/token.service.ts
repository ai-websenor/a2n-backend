import { eq, and, lt } from 'drizzle-orm';
import { db } from '../db';
import { refreshToken, verification } from '../db/schema/auth';
import type { 
  TokenServiceInterface, 
  RefreshToken, 
  VerificationToken, 
  TokenPayload, 
  User 
} from '../types/auth.types';
import { 
  AuthError, 
  UnauthorizedError, 
  NotFoundError 
} from '../types/auth.types';
import { 
  generateAccessToken, 
  generateRefreshToken as generateRefreshJWT,
  verifyAccessToken, 
  verifyRefreshToken as verifyRefreshJWT,
  generateVerificationToken as generateVerificationJWT,
  verifyVerificationToken
} from '../utils/jwt.util';
import { generateSecureId, generateSafeToken } from '../utils/crypto.util';

export class TokenService implements TokenServiceInterface {
  /**
   * Generate an access token for a user
   */
  generateAccessToken(user: User, sessionId: string): string {
    return generateAccessToken(user, sessionId);
  }

  /**
   * Generate and store a refresh token
   */
  async generateRefreshToken(userId: string, sessionId: string): Promise<RefreshToken> {
    try {
      const tokenId = generateSecureId();
      const tokenValue = generateRefreshJWT(userId, sessionId);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const [newRefreshToken] = await db.insert(refreshToken).values({
        id: tokenId,
        token: tokenValue,
        userId,
        sessionId,
        expiresAt,
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return newRefreshToken;
    } catch (error) {
      throw new AuthError('Failed to generate refresh token', 'TOKEN_GENERATION_ERROR', 500);
    }
  }

  /**
   * Verify an access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return await verifyAccessToken(token);
  }

  /**
   * Verify a refresh token and check if it's valid in the database
   */
  async verifyRefreshToken(token: string): Promise<RefreshToken> {
    try {
      // First verify the JWT
      const decoded = await verifyRefreshJWT(token);

      // Check if the token exists in the database and is not revoked
      const [dbToken] = await db
        .select()
        .from(refreshToken)
        .where(
          and(
            eq(refreshToken.token, token),
            eq(refreshToken.isRevoked, false),
            eq(refreshToken.userId, decoded.userId)
          )
        );

      if (!dbToken) {
        throw new UnauthorizedError('Refresh token not found or revoked');
      }

      // Check if token is expired
      if (dbToken.expiresAt < new Date()) {
        // Automatically revoke expired token
        await this.revokeRefreshToken(dbToken.id, 'TOKEN_EXPIRED');
        throw new UnauthorizedError('Refresh token expired');
      }

      return dbToken;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new AuthError('Failed to verify refresh token', 'TOKEN_VERIFICATION_ERROR', 500);
    }
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(tokenId: string, reason?: string): Promise<void> {
    try {
      await db
        .update(refreshToken)
        .set({
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason || 'MANUAL_REVOCATION',
          updatedAt: new Date(),
        })
        .where(eq(refreshToken.id, tokenId));
    } catch (error) {
      throw new AuthError('Failed to revoke refresh token', 'TOKEN_REVOCATION_ERROR', 500);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserRefreshTokens(userId: string, reason?: string): Promise<void> {
    try {
      await db
        .update(refreshToken)
        .set({
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason || 'REVOKE_ALL_SESSIONS',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(refreshToken.userId, userId),
            eq(refreshToken.isRevoked, false)
          )
        );
    } catch (error) {
      throw new AuthError('Failed to revoke user refresh tokens', 'TOKEN_REVOCATION_ERROR', 500);
    }
  }

  /**
   * Revoke all refresh tokens for a session
   */
  async revokeSessionRefreshTokens(sessionId: string, reason?: string): Promise<void> {
    try {
      await db
        .update(refreshToken)
        .set({
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason || 'SESSION_REVOKED',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(refreshToken.sessionId, sessionId),
            eq(refreshToken.isRevoked, false)
          )
        );
    } catch (error) {
      throw new AuthError('Failed to revoke session refresh tokens', 'TOKEN_REVOCATION_ERROR', 500);
    }
  }

  /**
   * Generate and store a verification token
   */
  async generateVerificationToken(identifier: string, type: string): Promise<VerificationToken> {
    try {
      const tokenId = generateSecureId();
      const tokenValue = generateSafeToken(32);
      const expiresAt = new Date();
      
      // Set expiration based on token type
      switch (type) {
        case 'EMAIL_VERIFICATION':
          expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
          break;
        case 'PASSWORD_RESET':
          expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour
          break;
        case 'TWO_FACTOR':
          expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes
          break;
        default:
          expiresAt.setHours(expiresAt.getHours() + 1); // Default 1 hour
      }

      const [newVerificationToken] = await db.insert(verification).values({
        id: tokenId,
        identifier,
        value: tokenValue,
        type,
        expiresAt,
        isUsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return newVerificationToken;
    } catch (error) {
      throw new AuthError('Failed to generate verification token', 'TOKEN_GENERATION_ERROR', 500);
    }
  }

  /**
   * Verify a verification token
   */
  async verifyToken(token: string, type: string): Promise<VerificationToken> {
    try {
      const [dbToken] = await db
        .select()
        .from(verification)
        .where(
          and(
            eq(verification.value, token),
            eq(verification.type, type),
            eq(verification.isUsed, false)
          )
        );

      if (!dbToken) {
        throw new NotFoundError('Verification token not found or already used');
      }

      // Check if token is expired
      if (dbToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Verification token expired');
      }

      return dbToken;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new AuthError('Failed to verify token', 'TOKEN_VERIFICATION_ERROR', 500);
    }
  }

  /**
   * Mark a verification token as used
   */
  async markTokenAsUsed(tokenId: string): Promise<void> {
    try {
      await db
        .update(verification)
        .set({
          isUsed: true,
          usedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(verification.id, tokenId));
    } catch (error) {
      throw new AuthError('Failed to mark token as used', 'TOKEN_UPDATE_ERROR', 500);
    }
  }

  /**
   * Get verification token by identifier and type
   */
  async getVerificationToken(identifier: string, type: string): Promise<VerificationToken | null> {
    try {
      const [token] = await db
        .select()
        .from(verification)
        .where(
          and(
            eq(verification.identifier, identifier),
            eq(verification.type, type),
            eq(verification.isUsed, false)
          )
        )
        .orderBy(verification.createdAt);

      return token || null;
    } catch (error) {
      throw new AuthError('Failed to get verification token', 'TOKEN_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();

      // Clean up expired refresh tokens
      await db
        .update(refreshToken)
        .set({
          isRevoked: true,
          revokedAt: now,
          revokedReason: 'TOKEN_EXPIRED',
          updatedAt: now,
        })
        .where(
          and(
            lt(refreshToken.expiresAt, now),
            eq(refreshToken.isRevoked, false)
          )
        );

      // Delete old expired verification tokens (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await db
        .delete(verification)
        .where(
          and(
            lt(verification.expiresAt, sevenDaysAgo),
            eq(verification.isUsed, true)
          )
        );

    } catch (error) {
      throw new AuthError('Failed to cleanup expired tokens', 'CLEANUP_ERROR', 500);
    }
  }

  /**
   * Get all active refresh tokens for a user
   */
  async getUserRefreshTokens(userId: string): Promise<RefreshToken[]> {
    try {
      return await db
        .select()
        .from(refreshToken)
        .where(
          and(
            eq(refreshToken.userId, userId),
            eq(refreshToken.isRevoked, false)
          )
        )
        .orderBy(refreshToken.createdAt);
    } catch (error) {
      throw new AuthError('Failed to get user refresh tokens', 'TOKEN_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Rotate refresh token (revoke old, create new)
   */
  async rotateRefreshToken(oldToken: string, userId: string, sessionId: string): Promise<RefreshToken> {
    try {
      // Verify and get the old token
      const oldRefreshToken = await this.verifyRefreshToken(oldToken);

      // Revoke the old token
      await this.revokeRefreshToken(oldRefreshToken.id, 'TOKEN_ROTATION');

      // Generate new refresh token
      const newRefreshToken = await this.generateRefreshToken(userId, sessionId);

      return newRefreshToken;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new AuthError('Failed to rotate refresh token', 'TOKEN_ROTATION_ERROR', 500);
    }
  }

  /**
   * Get token statistics for a user
   */
  async getTokenStats(userId: string): Promise<{
    activeRefreshTokens: number;
    totalRefreshTokens: number;
    pendingVerifications: number;
  }> {
    try {
      const [activeTokens] = await db
        .select({ count: refreshToken.id })
        .from(refreshToken)
        .where(
          and(
            eq(refreshToken.userId, userId),
            eq(refreshToken.isRevoked, false)
          )
        );

      const [totalTokens] = await db
        .select({ count: refreshToken.id })
        .from(refreshToken)
        .where(eq(refreshToken.userId, userId));

      const [pendingVerifications] = await db
        .select({ count: verification.id })
        .from(verification)
        .where(
          and(
            eq(verification.identifier, userId),
            eq(verification.isUsed, false)
          )
        );

      return {
        activeRefreshTokens: Number(activeTokens?.count || 0),
        totalRefreshTokens: Number(totalTokens?.count || 0),
        pendingVerifications: Number(pendingVerifications?.count || 0),
      };
    } catch (error) {
      throw new AuthError('Failed to get token statistics', 'STATS_ERROR', 500);
    }
  }
}