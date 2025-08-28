import { z } from 'zod';
import { ORPCError } from '@orpc/server';
import { protectedProcedure } from '../lib/orpc';
import { SessionService } from '../services/session.service';
import { TokenService } from '../services/token.service';
import {
  AuthError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '../types/auth.types';

// Create service instances
const sessionService = new SessionService();
const tokenService = new TokenService();

// Response schemas for ORPC
const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  isActive: z.boolean(),
  lastAccessedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const sessionStatsSchema = z.object({
  activeSessions: z.number(),
  totalSessions: z.number(),
  lastActiveSession: z.date().optional(),
});

const tokenStatsSchema = z.object({
  activeRefreshTokens: z.number(),
  totalRefreshTokens: z.number(),
  pendingVerifications: z.number(),
});

const refreshTokenSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string().optional(),
  expiresAt: z.date(),
  isRevoked: z.boolean(),
  revokedAt: z.date().optional(),
  revokedReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const suspiciousActivitySchema = z.object({
  multipleIPs: z.boolean(),
  unusualUserAgents: z.boolean(),
  rapidSessionCreation: z.boolean(),
});

// Helper function to convert errors to ORPC errors
const handleSessionError = (error: unknown): never => {
  if (error instanceof ValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message });
  }
  if (error instanceof UnauthorizedError) {
    throw new ORPCError('UNAUTHORIZED', { message: error.message });
  }
  if (error instanceof NotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message });
  }
  if (error instanceof AuthError) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
  }
  
  console.error('Unexpected session error:', error);
  throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'An unexpected error occurred' });
};

// Helper function to check admin permissions
const requireAdmin = (context: any) => {
  if (!context.session?.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
  }
  
  const userRole = (context.session.user as any).role;
  if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
    throw new ORPCError('FORBIDDEN', { message: 'Admin access required' });
  }
};

// Helper function to check resource ownership or admin access
const requireOwnershipOrAdmin = (context: any, resourceUserId: string) => {
  if (!context.session?.user) {
    throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
  }
  
  const currentUser = context.session.user;
  const isAdmin = (currentUser as any).role === 'ADMIN' || (currentUser as any).role === 'OWNER';
  const isOwner = currentUser.id === resourceUserId;
  
  if (!isAdmin && !isOwner) {
    throw new ORPCError('FORBIDDEN', { message: 'Access denied' });
  }
};

export const sessionController = {
  /**
   * Get current user's sessions
   */
  getSessions: protectedProcedure
    .output(z.object({
      sessions: z.array(sessionSchema),
      currentSessionId: z.string(),
    }))
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const sessions = await sessionService.getUserSessions(context.session.user.id);
      const currentSessionId = context.session.session?.id || 'unknown';

      return {
        sessions: sessions.map(session => ({
          ...session,
          ipAddress: session.ipAddress ?? undefined,
          userAgent: session.userAgent ?? undefined,
          lastAccessedAt: session.lastAccessedAt ?? undefined,
        })),
        currentSessionId,
      };
    }),

  /**
   * Get sessions for a specific user (admin or self only)
   */
  getSessionsByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .output(z.object({
      sessions: z.array(sessionSchema),
      userId: z.string(),
    }))
    .handler(async ({ input, context }) => {
      requireOwnershipOrAdmin(context, input.userId);

      const sessions = await sessionService.getUserSessions(input.userId);

      return {
        sessions: sessions.map(session => ({
          ...session,
          ipAddress: session.ipAddress ?? undefined,
          userAgent: session.userAgent ?? undefined,
          lastAccessedAt: session.lastAccessedAt ?? undefined,
        })),
        userId: input.userId,
      };
    }),

  /**
   * Get current session details
   */
  getCurrentSession: protectedProcedure
    .output(sessionSchema)
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const sessionId = context.session.session?.id || 'unknown';
      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        throw new ORPCError('NOT_FOUND', { message: 'Current session not found' });
      }

      return {
        ...session,
        ipAddress: session.ipAddress ?? undefined,
        userAgent: session.userAgent ?? undefined,
        lastAccessedAt: session.lastAccessedAt ?? undefined,
      };
    }),

  /**
   * Revoke a specific session
   */
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        // Get the session to check ownership
        const session = await sessionService.getSession(input.sessionId);
        if (!session) {
          throw new ORPCError('NOT_FOUND', { message: 'Session not found' });
        }

        // Check if user owns the session or is admin
        requireOwnershipOrAdmin(context, session.userId);

        // Prevent revoking current session (use signOut instead)
        if (input.sessionId === context.session.session?.id) {
          throw new ORPCError('BAD_REQUEST', { message: 'Use signOut to revoke current session' });
        }

        await sessionService.revokeSession(input.sessionId);
        
        return { 
          success: true, 
          message: 'Session revoked successfully' 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),

  /**
   * Revoke all sessions except current
   */
  revokeOtherSessions: protectedProcedure
    .handler(async ({ context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        const currentSessionId = context.session.session?.id || 'unknown';
        await sessionService.revokeOtherUserSessions(
          context.session.user.id, 
          currentSessionId
        );

        return { 
          success: true, 
          message: 'All other sessions revoked successfully' 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),

  /**
   * Revoke all user sessions (admin only)
   */
  revokeAllUserSessions: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        requireAdmin(context);

        await sessionService.revokeAllUserSessions(input.userId);

        return { 
          success: true, 
          message: 'All user sessions revoked successfully' 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),

  /**
   * Extend current session
   */
  extendSession: protectedProcedure
    .input(z.object({ 
      hours: z.number().int().min(1).max(720).optional().default(24) // Max 30 days
    }))
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        const sessionId = context.session.session?.id || 'unknown';
        await sessionService.extendSession(sessionId, input.hours);

        return { 
          success: true, 
          message: `Session extended by ${input.hours} hours` 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),

  /**
   * Get session statistics
   */
  getSessionStats: protectedProcedure
    .output(sessionStatsSchema)
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const stats = await sessionService.getSessionStats(context.session.user.id);
      return stats;
    }),

  /**
   * Get session statistics for a specific user (admin or self only)
   */
  getSessionStatsByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .output(sessionStatsSchema)
    .handler(async ({ input, context }) => {
      requireOwnershipOrAdmin(context, input.userId);

      const stats = await sessionService.getSessionStats(input.userId);
      return stats;
    }),

  /**
   * Get refresh token statistics
   */
  getTokenStats: protectedProcedure
    .output(tokenStatsSchema)
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const stats = await tokenService.getTokenStats(context.session.user.id);
      return stats;
    }),

  /**
   * Get refresh tokens for current user
   */
  getRefreshTokens: protectedProcedure
    .output(z.object({
      tokens: z.array(refreshTokenSchema),
    }))
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const tokens = await tokenService.getUserRefreshTokens(context.session.user.id);
      return { 
        tokens: tokens.map(token => ({
          ...token,
          sessionId: token.sessionId ?? undefined,
          revokedAt: token.revokedAt ?? undefined,
          revokedReason: token.revokedReason ?? undefined,
        }))
      };
    }),

  /**
   * Revoke a specific refresh token
   */
  revokeRefreshToken: protectedProcedure
    .input(z.object({ 
      tokenId: z.string(),
      reason: z.string().optional().default('USER_REQUEST'),
    }))
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        // Verify token ownership by getting user tokens first
        const tokens = await tokenService.getUserRefreshTokens(context.session.user.id);
        const tokenExists = tokens.some(token => token.id === input.tokenId);
        
        if (!tokenExists) {
          throw new ORPCError('NOT_FOUND', { message: 'Refresh token not found' });
        }

        await tokenService.revokeRefreshToken(input.tokenId, input.reason);

        return { 
          success: true, 
          message: 'Refresh token revoked successfully' 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),

  /**
   * Revoke all refresh tokens for current user
   */
  revokeAllRefreshTokens: protectedProcedure
    .input(z.object({ 
      reason: z.string().optional().default('USER_REQUEST'),
    }))
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        await tokenService.revokeAllUserRefreshTokens(
          context.session.user.id, 
          input.reason
        );

        return { 
          success: true, 
          message: 'All refresh tokens revoked successfully' 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),

  /**
   * Detect suspicious activity
   */
  detectSuspiciousActivity: protectedProcedure
    .output(suspiciousActivitySchema)
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const activity = await sessionService.detectSuspiciousActivity(
        context.session.user.id
      );
      return activity;
    }),

  /**
   * Get sessions by IP address (admin only)
   */
  getSessionsByIP: protectedProcedure
    .input(z.object({ 
      ipAddress: z.string(),
      limit: z.number().int().min(1).max(50).optional().default(10),
    }))
    .output(z.object({
      sessions: z.array(sessionSchema),
      ipAddress: z.string(),
    }))
    .handler(async ({ input, context }) => {
      requireAdmin(context);

      const sessions = await sessionService.getSessionsByIP(
        input.ipAddress, 
        input.limit
      );

      return {
        sessions: sessions.map(session => ({
          ...session,
          ipAddress: session.ipAddress ?? undefined,
          userAgent: session.userAgent ?? undefined,
          lastAccessedAt: session.lastAccessedAt ?? undefined,
        })),
        ipAddress: input.ipAddress,
      };
    }),

  /**
   * Cleanup expired sessions (admin only)
   */
  cleanupExpiredSessions: protectedProcedure
    .handler(async ({ context }) => {
      try {
        requireAdmin(context);

        await sessionService.cleanupExpiredSessions();
        await tokenService.cleanupExpiredTokens();

        return { 
          success: true, 
          message: 'Expired sessions and tokens cleaned up successfully' 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),

  /**
   * Validate session ownership
   */
  validateSessionOwnership: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .output(z.object({ valid: z.boolean() }))
    .handler(async ({ input, context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const valid = await sessionService.validateSessionOwnership(
        input.sessionId, 
        context.session.user.id
      );

      return { valid };
    }),

  /**
   * Update session metadata
   */
  updateSessionMetadata: protectedProcedure
    .input(z.object({
      sessionId: z.string().optional(),
      metadata: z.object({
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      }),
    }))
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        const sessionId = input.sessionId || context.session.session?.id || 'unknown';
        
        // Verify session ownership
        const valid = await sessionService.validateSessionOwnership(
          sessionId, 
          context.session.user.id
        );
        
        if (!valid) {
          throw new ORPCError('FORBIDDEN', { message: 'Access denied' });
        }

        await sessionService.updateSessionMetadata(sessionId, input.metadata);

        return { 
          success: true, 
          message: 'Session metadata updated successfully' 
        };
      } catch (error) {
        handleSessionError(error);
      }
    }),
};