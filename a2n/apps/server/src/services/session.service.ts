import { eq, and, lt, sql } from 'drizzle-orm';
import { db } from '../db';
import { session } from '../db/schema/auth';
import type { 
  SessionServiceInterface, 
  Session, 
  SessionMetadata 
} from '../types/auth.types';
import { 
  AuthError, 
  NotFoundError 
} from '../types/auth.types';
import { generateSecureId, generateSafeToken } from '../utils/crypto.util';

export class SessionService implements SessionServiceInterface {
  private readonly SESSION_EXPIRY_HOURS = 24 * 7; // 7 days
  private readonly REMEMBER_ME_EXPIRY_HOURS = 24 * 30; // 30 days

  /**
   * Create a new session for a user
   */
  async createSession(userId: string, metadata: SessionMetadata, rememberMe: boolean = false): Promise<Session> {
    try {
      const sessionId = generateSecureId();
      const sessionToken = generateSafeToken(48);
      const now = new Date();
      const expiresAt = new Date(now);
      
      // Set expiration based on remember me option
      if (rememberMe) {
        expiresAt.setHours(expiresAt.getHours() + this.REMEMBER_ME_EXPIRY_HOURS);
      } else {
        expiresAt.setHours(expiresAt.getHours() + this.SESSION_EXPIRY_HOURS);
      }

      const [newSession] = await db.insert(session).values({
        id: sessionId,
        userId,
        token: sessionToken,
        expiresAt,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        isActive: true,
        lastAccessedAt: now,
        createdAt: now,
        updatedAt: now,
      }).returning();

      return newSession;
    } catch (error) {
      throw new AuthError('Failed to create session', 'SESSION_CREATION_ERROR', 500);
    }
  }

  /**
   * Get a session by its ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const [sessionRecord] = await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.id, sessionId),
            eq(session.isActive, true)
          )
        );

      if (!sessionRecord) {
        return null;
      }

      // Check if session is expired
      if (sessionRecord.expiresAt < new Date()) {
        await this.revokeSession(sessionId);
        return null;
      }

      return sessionRecord;
    } catch (error) {
      throw new AuthError('Failed to get session', 'SESSION_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Get a session by its token
   */
  async getSessionByToken(token: string): Promise<Session | null> {
    try {
      const [sessionRecord] = await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.token, token),
            eq(session.isActive, true)
          )
        );

      if (!sessionRecord) {
        return null;
      }

      // Check if session is expired
      if (sessionRecord.expiresAt < new Date()) {
        await this.revokeSession(sessionRecord.id);
        return null;
      }

      return sessionRecord;
    } catch (error) {
      throw new AuthError('Failed to get session by token', 'SESSION_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const sessions = await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.userId, userId),
            eq(session.isActive, true)
          )
        )
        .orderBy(session.lastAccessedAt);

      // Filter out expired sessions and revoke them
      const activeSessions: Session[] = [];
      const now = new Date();

      for (const sessionRecord of sessions) {
        if (sessionRecord.expiresAt < now) {
          await this.revokeSession(sessionRecord.id);
        } else {
          activeSessions.push(sessionRecord);
        }
      }

      return activeSessions;
    } catch (error) {
      throw new AuthError('Failed to get user sessions', 'SESSION_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Update session activity (last accessed time)
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const now = new Date();
      
      await db
        .update(session)
        .set({
          lastAccessedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(session.id, sessionId),
            eq(session.isActive, true)
          )
        );
    } catch (error) {
      throw new AuthError('Failed to update session activity', 'SESSION_UPDATE_ERROR', 500);
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const now = new Date();
      
      await db
        .update(session)
        .set({
          isActive: false,
          updatedAt: now,
        })
        .where(eq(session.id, sessionId));
    } catch (error) {
      throw new AuthError('Failed to revoke session', 'SESSION_REVOCATION_ERROR', 500);
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const now = new Date();
      
      await db
        .update(session)
        .set({
          isActive: false,
          updatedAt: now,
        })
        .where(
          and(
            eq(session.userId, userId),
            eq(session.isActive, true)
          )
        );
    } catch (error) {
      throw new AuthError('Failed to revoke all user sessions', 'SESSION_REVOCATION_ERROR', 500);
    }
  }

  /**
   * Revoke all sessions except the current one
   */
  async revokeOtherUserSessions(userId: string, currentSessionId: string): Promise<void> {
    try {
      const now = new Date();
      
      await db
        .update(session)
        .set({
          isActive: false,
          updatedAt: now,
        })
        .where(
          and(
            eq(session.userId, userId),
            eq(session.isActive, true),
            // Use not equal for session ID
            sql`${session.id} != ${currentSessionId}`
          )
        );
    } catch (error) {
      throw new AuthError('Failed to revoke other user sessions', 'SESSION_REVOCATION_ERROR', 500);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      
      // Mark expired sessions as inactive
      await db
        .update(session)
        .set({
          isActive: false,
          updatedAt: now,
        })
        .where(
          and(
            lt(session.expiresAt, now),
            eq(session.isActive, true)
          )
        );
    } catch (error) {
      throw new AuthError('Failed to cleanup expired sessions', 'CLEANUP_ERROR', 500);
    }
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string, hours: number = 24): Promise<void> {
    try {
      const sessionRecord = await this.getSession(sessionId);
      if (!sessionRecord) {
        throw new NotFoundError('Session not found');
      }

      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + hours);

      await db
        .update(session)
        .set({
          expiresAt: newExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(session.id, sessionId));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to extend session', 'SESSION_UPDATE_ERROR', 500);
    }
  }

  /**
   * Get session statistics for a user
   */
  async getSessionStats(userId: string): Promise<{
    activeSessions: number;
    totalSessions: number;
    lastActiveSession?: Date;
  }> {
    try {
      // Get active sessions count
      const activeSessions = await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.userId, userId),
            eq(session.isActive, true)
          )
        );

      // Get total sessions count
      const [totalSessions] = await db
        .select({ count: session.id })
        .from(session)
        .where(eq(session.userId, userId));

      // Get last active session
      const [lastSession] = await db
        .select()
        .from(session)
        .where(eq(session.userId, userId))
        .orderBy(session.lastAccessedAt);

      return {
        activeSessions: activeSessions.length,
        totalSessions: Number(totalSessions?.count || 0),
        lastActiveSession: lastSession?.lastAccessedAt || undefined,
      };
    } catch (error) {
      throw new AuthError('Failed to get session statistics', 'STATS_ERROR', 500);
    }
  }

  /**
   * Check if session belongs to user
   */
  async validateSessionOwnership(sessionId: string, userId: string): Promise<boolean> {
    try {
      const [sessionRecord] = await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.id, sessionId),
            eq(session.userId, userId),
            eq(session.isActive, true)
          )
        );

      return !!sessionRecord && sessionRecord.expiresAt > new Date();
    } catch (error) {
      return false;
    }
  }

  /**
   * Update session metadata (IP address, user agent)
   */
  async updateSessionMetadata(sessionId: string, metadata: SessionMetadata): Promise<void> {
    try {
      await db
        .update(session)
        .set({
          ipAddress: metadata.ipAddress || null,
          userAgent: metadata.userAgent || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(session.id, sessionId),
            eq(session.isActive, true)
          )
        );
    } catch (error) {
      throw new AuthError('Failed to update session metadata', 'SESSION_UPDATE_ERROR', 500);
    }
  }

  /**
   * Get sessions by IP address (for security monitoring)
   */
  async getSessionsByIP(ipAddress: string, limit: number = 10): Promise<Session[]> {
    try {
      return await db
        .select()
        .from(session)
        .where(
          and(
            eq(session.ipAddress, ipAddress),
            eq(session.isActive, true)
          )
        )
        .limit(limit)
        .orderBy(session.createdAt);
    } catch (error) {
      throw new AuthError('Failed to get sessions by IP', 'SESSION_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Check for suspicious session activity
   */
  async detectSuspiciousActivity(userId: string): Promise<{
    multipleIPs: boolean;
    unusualUserAgents: boolean;
    rapidSessionCreation: boolean;
  }> {
    try {
      const userSessions = await this.getUserSessions(userId);
      
      // Check for multiple IP addresses in active sessions
      const uniqueIPs = new Set(userSessions.map(s => s.ipAddress).filter(Boolean));
      const multipleIPs = uniqueIPs.size > 3; // More than 3 different IPs

      // Check for unusual user agents
      const uniqueUserAgents = new Set(userSessions.map(s => s.userAgent).filter(Boolean));
      const unusualUserAgents = uniqueUserAgents.size > 5; // More than 5 different user agents

      // Check for rapid session creation (more than 5 sessions in last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const recentSessions = userSessions.filter(s => s.createdAt > oneHourAgo);
      const rapidSessionCreation = recentSessions.length > 5;

      return {
        multipleIPs,
        unusualUserAgents,
        rapidSessionCreation,
      };
    } catch (error) {
      throw new AuthError('Failed to detect suspicious activity', 'SECURITY_CHECK_ERROR', 500);
    }
  }
}