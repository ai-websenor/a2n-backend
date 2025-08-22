import { z } from 'zod';
import { ORPCError } from '@orpc/server';
import { publicProcedure, protectedProcedure } from '../lib/orpc';
import { UserService } from '../services/user.service';
import {
  updateUserProfileSchema,
  updateUserRoleSchema,
  AuthError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../types/auth.types';

// Create user service instance
const userService = new UserService();

// Response schemas for ORPC
const userProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'OWNER']),
  workflowsCreated: z.number(),
  workflowsExecuted: z.number(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.date(),
});

const userStatsSchema = z.object({
  workflowsCreated: z.number(),
  workflowsExecuted: z.number(),
  lastLoginAt: z.date().optional(),
  totalSessions: z.number(),
  activeSessions: z.number(),
});

const paginationSchema = z.object({
  offset: z.number().int().min(0).optional().default(0),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

const searchQuerySchema = z.object({
  query: z.string().min(2).max(100),
  ...paginationSchema.shape,
});

// Helper function to convert errors to ORPC errors
const handleUserError = (error: unknown): never => {
  if (error instanceof ValidationError) {
    throw new ORPCError('BAD_REQUEST', { message: error.message });
  }
  if (error instanceof UnauthorizedError) {
    throw new ORPCError('UNAUTHORIZED', { message: error.message });
  }
  if (error instanceof ForbiddenError) {
    throw new ORPCError('FORBIDDEN', { message: error.message });
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
  
  console.error('Unexpected user error:', error);
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

export const userController = {
  /**
   * Get current user profile
   */
  getProfile: protectedProcedure
    .output(userProfileSchema)
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const profile = await userService.getUserProfile(context.session.user.id);
      return {
        ...profile,
        image: profile.image ?? undefined,
      };
    }),

  /**
   * Get user profile by ID (admin or self only)
   */
  getProfileById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .output(userProfileSchema)
    .handler(async ({ input, context }) => {
      requireOwnershipOrAdmin(context, input.userId);

      const profile = await userService.getUserProfile(input.userId);
      return {
        ...profile,
        image: profile.image ?? undefined,
      };
    }),

  /**
   * Update current user profile
   */
  updateProfile: protectedProcedure
    .input(updateUserProfileSchema)
    .output(userProfileSchema)
    .handler(async ({ input, context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const updatedProfile = await userService.updateUserProfile(
        context.session.user.id, 
        input
      );
      return {
        ...updatedProfile,
        image: updatedProfile.image ?? undefined,
      };
    }),

  /**
   * Update user profile by ID (admin only)
   */
  updateProfileById: protectedProcedure
    .input(z.object({
      userId: z.string(),
      data: updateUserProfileSchema,
    }))
    .output(userProfileSchema)
    .handler(async ({ input, context }) => {
      requireAdmin(context);

      const updatedProfile = await userService.updateUserProfile(
        input.userId, 
        input.data
      );
      return {
        ...updatedProfile,
        image: updatedProfile.image ?? undefined,
      };
    }),

  /**
   * Get user statistics
   */
  getStats: protectedProcedure
    .output(userStatsSchema)
    .handler(async ({ context }) => {
      if (!context.session?.user) {
        throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
      }

      const stats = await userService.getUserStats(context.session.user.id);
      return {
        ...stats,
        lastLoginAt: stats.lastLoginAt ?? undefined,
      };
    }),

  /**
   * Get user statistics by ID (admin or self only)
   */
  getStatsById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .output(userStatsSchema)
    .handler(async ({ input, context }) => {
      requireOwnershipOrAdmin(context, input.userId);

      const stats = await userService.getUserStats(input.userId);
      return {
        ...stats,
        lastLoginAt: stats.lastLoginAt ?? undefined,
      };
    }),

  /**
   * Update user role (admin only)
   */
  updateRole: protectedProcedure
    .input(updateUserRoleSchema)
    .handler(async ({ input, context }) => {
      try {
        requireAdmin(context);

        // Prevent non-owners from creating owners
        if (input.role === 'OWNER' && (context.session.user as any).role !== 'OWNER') {
          throw new ORPCError('FORBIDDEN', { message: 'Only owners can assign owner role' });
        }

        // Prevent users from modifying their own role
        if (input.userId === context.session.user.id) {
          throw new ORPCError('FORBIDDEN', { message: 'Cannot modify your own role' });
        }

        await userService.updateUserRole(input.userId, input.role);
        return { 
          success: true, 
          message: 'User role updated successfully' 
        };
      } catch (error) {
        handleUserError(error);
      }
    }),

  /**
   * Deactivate user account (admin only)
   */
  deactivateUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        requireAdmin(context);

        // Prevent users from deactivating their own account
        if (input.userId === context.session.user.id) {
          throw new ORPCError('FORBIDDEN', { message: 'Cannot deactivate your own account' });
        }

        // Prevent non-owners from deactivating owners
        const targetUser = await userService.getUserById(input.userId);
        if (targetUser?.role === 'OWNER' && (context.session.user as any).role !== 'OWNER') {
          throw new ORPCError('FORBIDDEN', { message: 'Cannot deactivate owner accounts' });
        }

        await userService.deactivateUser(input.userId);
        return { 
          success: true, 
          message: 'User account deactivated successfully' 
        };
      } catch (error) {
        handleUserError(error);
      }
    }),

  /**
   * Reactivate user account (admin only)
   */
  reactivateUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        requireAdmin(context);

        await userService.reactivateUser(input.userId);
        return { 
          success: true, 
          message: 'User account reactivated successfully' 
        };
      } catch (error) {
        handleUserError(error);
      }
    }),

  /**
   * Delete user account (admin only - hard delete)
   */
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        requireAdmin(context);

        // Prevent users from deleting their own account
        if (input.userId === context.session.user.id) {
          throw new ORPCError('FORBIDDEN', { message: 'Cannot delete your own account' });
        }

        // Prevent non-owners from deleting owners
        const targetUser = await userService.getUserById(input.userId);
        if (targetUser?.role === 'OWNER' && (context.session.user as any).role !== 'OWNER') {
          throw new ORPCError('FORBIDDEN', { message: 'Cannot delete owner accounts' });
        }

        await userService.deleteUser(input.userId);
        return { 
          success: true, 
          message: 'User account deleted successfully' 
        };
      } catch (error) {
        handleUserError(error);
      }
    }),

  /**
   * Search users (admin only)
   */
  searchUsers: protectedProcedure
    .input(searchQuerySchema)
    .output(z.object({
      users: z.array(userProfileSchema),
      total: z.number(),
      offset: z.number(),
      limit: z.number(),
    }))
    .handler(async ({ input, context }) => {
      requireAdmin(context);

      const users = await userService.searchUsers(input.query, input.limit);
      const total = users.length; // In a real implementation, you'd get the total count

      return {
        users: users.map(user => ({
          ...user,
          image: user.image ?? undefined,
        })),
        total,
        offset: input.offset,
        limit: input.limit,
      };
    }),

  /**
   * Get all users with pagination (admin only)
   */
  getUsers: protectedProcedure
    .input(paginationSchema)
    .output(z.object({
      users: z.array(userProfileSchema),
      total: z.number(),
      offset: z.number(),
      limit: z.number(),
    }))
    .handler(async ({ input, context }) => {
      requireAdmin(context);

      const users = await userService.getUsers(input.offset, input.limit);
      const total = await userService.getTotalUserCount();

      return {
        users: users.map(user => ({
          ...user,
          image: user.image ?? undefined,
        })),
        total,
        offset: input.offset,
        limit: input.limit,
      };
    }),

  /**
   * Get users by role (admin only)
   */
  getUsersByRole: protectedProcedure
    .input(z.object({
      role: z.enum(['USER', 'ADMIN', 'OWNER']),
      limit: z.number().int().min(1).max(100).optional().default(50),
    }))
    .output(z.object({
      users: z.array(userProfileSchema),
      count: z.number(),
    }))
    .handler(async ({ input, context }) => {
      requireAdmin(context);

      const users = await userService.getUsersByRole(input.role, input.limit);

      return {
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image ?? undefined,
          role: user.role,
          workflowsCreated: user.workflowsCreated,
          workflowsExecuted: user.workflowsExecuted,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
        })),
        count: users.length,
      };
    }),

  /**
   * Check if email exists
   */
  checkEmailExists: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .output(z.object({ exists: z.boolean() }))
    .handler(async ({ input }) => {
      const exists = await userService.emailExists(input.email);
      return { exists };
    }),

  /**
   * Increment workflow count
   */
  incrementWorkflowCount: protectedProcedure
    .input(z.object({ 
      type: z.enum(['created', 'executed']),
      userId: z.string().optional(),
    }))
    .handler(async ({ input, context }) => {
      try {
        if (!context.session?.user) {
          throw new ORPCError('UNAUTHORIZED', { message: 'Authentication required' });
        }

        const userId = input.userId || context.session.user.id;

        // If updating another user's count, require admin access
        if (userId !== context.session.user.id) {
          requireAdmin(context);
        }

        await userService.incrementWorkflowCount(userId, input.type);
        return { 
          success: true, 
          message: 'Workflow count updated successfully' 
        };
      } catch (error) {
        handleUserError(error);
      }
    }),

  /**
   * Get total user count (admin only)
   */
  getTotalUserCount: protectedProcedure
    .output(z.object({ count: z.number() }))
    .handler(async ({ context }) => {
      requireAdmin(context);

      const count = await userService.getTotalUserCount();
      return { count };
    }),
};