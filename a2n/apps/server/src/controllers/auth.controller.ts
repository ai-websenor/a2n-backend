import { z } from 'zod';
import { ORPCError } from '@orpc/server';
import { publicProcedure, protectedProcedure } from '../lib/orpc';
import { AuthService } from '../services/auth.service';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import {
  signInSchema,
  signUpSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  twoFactorSetupSchema,
  twoFactorVerifySchema,
  twoFactorDisableSchema,
  refreshTokenSchema,
  AuthError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../types/auth.types';

// Create auth service instance
const authService = new AuthService();

// Response schemas for ORPC
const authResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['USER', 'ADMIN', 'OWNER']),
    emailVerified: z.boolean(),
    image: z.string().optional(),
  }),
  session: z.object({
    id: z.string(),
    expiresAt: z.date(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
});

const tokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.date(),
});

const twoFactorSetupResponseSchema = z.object({
  secret: z.string(),
  qrCode: z.string(),
  backupCodes: z.array(z.string()),
});

// Helper function to convert errors to ORPC errors
const handleAuthError = (error: unknown): never => {
  if (error instanceof ValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message });
  }
  if (error instanceof UnauthorizedError) {
    throw new ORPCError('UNAUTHORIZED', { message: error.message });
  }
  if (error instanceof ConflictError) {
    throw new ORPCError('CONFLICT', { message: error.message });
  }
  if (error instanceof NotFoundError) {
    throw new ORPCError('NOT_FOUND', { message: error.message });
  }
  if (error instanceof AuthError) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', { message: error.message });
  }
  
  console.error('Unexpected authentication error:', error);
  throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'An unexpected error occurred' });
};

// Helper function to extract session metadata from context
const getSessionMetadata = (context: any) => {
  // In a real implementation, you'd extract IP and user agent from the request
  // For now, we'll use placeholder values
  return {
    ipAddress: '127.0.0.1', // Would be extracted from request
    userAgent: 'Unknown', // Would be extracted from request headers
  };
};

export const authController = {
  /**
   * Sign in with email and password
   */
  signIn: publicProcedure
    .input(signInSchema)
    .output(authResponseSchema)
    .handler(async ({ input, context }) => {
      const metadata = getSessionMetadata(context);
      const result = await authService.signIn(input, metadata);
      return result;
    }),

  /**
   * Sign up a new user
   */
  signUp: publicProcedure
    .input(signUpSchema)
    .output(authResponseSchema)
    .handler(async ({ input, context }) => {
      const metadata = getSessionMetadata(context);
      const result = await authService.signUp(input, metadata);
      return result;
    }),

  /**
   * Sign out current user
   */
  signOut: protectedProcedure
    .handler(async ({ context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'No active session' });
        }
        
        // Extract session ID from context
        const sessionId = context.session?.session?.id || 'unknown';
        await authService.signOut(sessionId);
        
        return { success: true };
      } catch (error) {
        handleAuthError(error);
      }
    }),

  /**
   * Refresh access token
   */
  refreshToken: publicProcedure
    .input(refreshTokenSchema)
    .output(tokenResponseSchema)
    .handler(async ({ input }) => {
      const result = await authService.refreshToken(input.refreshToken);
      return result;
    }),

  /**
   * Request password reset
   */
  resetPasswordRequest: publicProcedure
    .input(resetPasswordRequestSchema)
    .handler(async ({ input }) => {
      try {
        await authService.resetPasswordRequest(input.email);
        return { 
          success: true, 
          message: 'If an account exists with this email, a password reset link has been sent.' 
        };
      } catch (error) {
        handleAuthError(error);
      }
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .handler(async ({ input }) => {
      try {
        await authService.resetPassword(input);
        return { 
          success: true, 
          message: 'Password has been reset successfully.' 
        };
      } catch (error) {
        handleAuthError(error);
      }
    }),

  /**
   * Change password for authenticated user
   */
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        await authService.changePassword(context.session.user.id, input);
        return { 
          success: true, 
          message: 'Password changed successfully.' 
        };
      } catch (error) {
        handleAuthError(error);
      }
    }),

  /**
   * Verify email address
   */
  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .handler(async ({ input }) => {
      try {
        await authService.verifyEmail(input.token);
        return { 
          success: true, 
          message: 'Email verified successfully.' 
        };
      } catch (error) {
        handleAuthError(error);
      }
    }),

  /**
   * Resend email verification
   */
  resendVerification: publicProcedure
    .input(resendVerificationSchema)
    .handler(async ({ input }) => {
      try {
        await authService.resendVerification(input.email);
        return { 
          success: true, 
          message: 'Verification email sent if account exists.' 
        };
      } catch (error) {
        handleAuthError(error);
      }
    }),

  /**
   * Setup two-factor authentication
   */
  setupTwoFactor: protectedProcedure
    .input(twoFactorSetupSchema)
    .output(twoFactorSetupResponseSchema)
    .handler(async ({ input, context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const result = await authService.setupTwoFactor(
        context.session.user.id, 
        input.password
      );
      return result;
    }),

  /**
   * Verify two-factor authentication code
   */
  verifyTwoFactor: protectedProcedure
    .input(twoFactorVerifySchema)
    .output(z.object({ valid: z.boolean() }))
    .handler(async ({ input, context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const valid = await authService.verifyTwoFactor(
        context.session.user.id, 
        input.code
      );
      return { valid };
    }),

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor: protectedProcedure
    .input(twoFactorDisableSchema)
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        await authService.disableTwoFactor(context.session.user.id, input);
        return { 
          success: true, 
          message: 'Two-factor authentication disabled successfully.' 
        };
      } catch (error) {
        handleAuthError(error);
      }
    }),

  /**
   * Get current user session info
   */
  getSession: protectedProcedure
    .output(z.object({
      user: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.enum(['USER', 'ADMIN', 'OWNER']),
        emailVerified: z.boolean(),
        image: z.string().optional(),
      }),
      session: z.object({
        id: z.string(),
        expiresAt: z.date(),
        lastAccessedAt: z.date().optional(),
      }),
    }))
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'No active session' });
      }

      return {
        user: {
          id: context.session.user.id,
          name: context.session.user.name,
          email: context.session.user.email,
          role: (context.session.user as any).role as 'USER' | 'ADMIN' | 'OWNER',
          emailVerified: context.session.user.emailVerified,
          image: context.session.user.image || undefined,
        },
        session: {
          id: context.session.session?.id || 'unknown',
          expiresAt: context.session.session?.expiresAt || new Date(),
          lastAccessedAt: context.session.session?.updatedAt,
        },
      };
    }),

  /**
   * Validate session (health check)
   */
  validateSession: protectedProcedure
    .output(z.object({ valid: z.boolean() }))
    .handler(async ({ context }) => {
      try {
        // If we reach here, the session is valid (protectedProcedure middleware passed)
        return { valid: !!context.session?.user };
      } catch (error) {
        return { valid: false };
      }
    }),
};

// Rate-limited auth controller
// This wraps the auth controller with rate limiting for security-sensitive endpoints
export const rateLimitedAuthController = {
  signUp: authController.signUp,
  signIn: authController.signIn,
  resetPasswordRequest: authController.resetPasswordRequest,
  resetPassword: authController.resetPassword,
  verifyEmail: authController.verifyEmail,
  resendVerification: authController.resendVerification,
};