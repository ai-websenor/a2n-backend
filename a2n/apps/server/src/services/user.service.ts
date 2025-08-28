import { eq, and, count, sql } from 'drizzle-orm';
import { db } from '../db';
import { user } from '../db/schema/auth';
import type { 
  UserServiceInterface, 
  User,
  InternalUser, 
  UserProfile, 
  UserStats,
  UpdateUserProfileRequest 
} from '../types/auth.types';
import type { UserRole } from '../db/schema/types';
import { 
  AuthError, 
  NotFoundError, 
  ConflictError 
} from '../types/auth.types';
import { generateSecureId } from '../utils/crypto.util';
import { hashPassword } from '../utils/password.util';

export class UserService implements UserServiceInterface {
  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, id));

      return userRecord || null;
    } catch (error) {
      throw new AuthError('Failed to get user by ID', 'USER_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.email, email.toLowerCase()));

      return userRecord || null;
    } catch (error) {
      throw new AuthError('Failed to get user by email', 'USER_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<InternalUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      // Check if user with email already exists
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      const userId = generateSecureId();
      const now = new Date();

      const [newUser] = await db.insert(user).values({
        id: userId,
        name: userData.name,
        email: userData.email.toLowerCase(),
        emailVerified: userData.emailVerified,
        image: userData.image || null,
        password: userData.password,
        role: userData.role,
        status: userData.status,
        isActive: userData.isActive,
        lastLoginAt: userData.lastLoginAt || null,
        twoFactorEnabled: userData.twoFactorEnabled,
        twoFactorSecret: userData.twoFactorSecret || null,
        workflowsCreated: userData.workflowsCreated,
        workflowsExecuted: userData.workflowsExecuted,
        createdAt: now,
        updatedAt: now,
      }).returning();

      return newUser;
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      throw new AuthError('Failed to create user', 'USER_CREATION_ERROR', 500);
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // If email is being updated, check for conflicts
      if (data.email && data.email !== existingUser.email) {
        const emailConflict = await this.getUserByEmail(data.email);
        if (emailConflict && emailConflict.id !== id) {
          throw new ConflictError('Email already in use by another user');
        }
      }

      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      // Lowercase email if provided
      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.createdAt;

      const [updatedUser] = await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, id))
        .returning();

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new AuthError('Failed to update user', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Delete a user (hard delete)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db.delete(user).where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to delete user', 'USER_DELETION_ERROR', 500);
    }
  }

  /**
   * Deactivate a user (soft delete)
   */
  async deactivateUser(id: string): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db
        .update(user)
        .set({
          isActive: false,
          status: 'INACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to deactivate user', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Reactivate a user
   */
  async reactivateUser(id: string): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db
        .update(user)
        .set({
          isActive: true,
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to reactivate user', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Get user profile (public information)
   */
  async getUserProfile(id: string): Promise<UserProfile> {
    try {
      const userRecord = await this.getUserById(id);
      if (!userRecord) {
        throw new NotFoundError('User not found');
      }

      return {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        image: userRecord.image,
        role: userRecord.role,
        workflowsCreated: userRecord.workflowsCreated,
        workflowsExecuted: userRecord.workflowsExecuted,
        twoFactorEnabled: userRecord.twoFactorEnabled,
        createdAt: userRecord.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to get user profile', 'USER_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(id: string, data: UpdateUserProfileRequest): Promise<UserProfile> {
    try {
      const updatedUser = await this.updateUser(id, data);
      return this.getUserProfile(updatedUser.id);
    } catch (error) {
      throw error; // Re-throw the error from updateUser
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(id: string, role: UserRole): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db
        .update(user)
        .set({
          role,
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to update user role', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Update user password
   */
  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db
        .update(user)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to update user password', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Verify user email
   */
  async verifyUserEmail(id: string): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db
        .update(user)
        .set({
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to verify user email', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Update last login time
   */
  async updateLastLogin(id: string): Promise<void> {
    try {
      await db
        .update(user)
        .set({
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      throw new AuthError('Failed to update last login', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(id: string): Promise<UserStats> {
    try {
      const userRecord = await this.getUserById(id);
      if (!userRecord) {
        throw new NotFoundError('User not found');
      }

      // Get session count from SessionService (we'll need to inject this)
      // For now, we'll return basic stats from user table
      return {
        workflowsCreated: userRecord.workflowsCreated,
        workflowsExecuted: userRecord.workflowsExecuted,
        lastLoginAt: userRecord.lastLoginAt || undefined,
        totalSessions: 0, // Will be populated by SessionService
        activeSessions: 0, // Will be populated by SessionService
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to get user statistics', 'STATS_ERROR', 500);
    }
  }

  /**
   * Increment workflow count
   */
  async incrementWorkflowCount(userId: string, type: 'created' | 'executed'): Promise<void> {
    try {
      const column = type === 'created' ? user.workflowsCreated : user.workflowsExecuted;
      
      await db
        .update(user)
        .set({
          [type === 'created' ? 'workflowsCreated' : 'workflowsExecuted']: sql`${column} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));
    } catch (error) {
      throw new AuthError('Failed to increment workflow count', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Enable Two-Factor Authentication
   */
  async enableTwoFactor(id: string, secret: string): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db
        .update(user)
        .set({
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to enable two-factor authentication', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Disable Two-Factor Authentication
   */
  async disableTwoFactor(id: string): Promise<void> {
    try {
      const existingUser = await this.getUserById(id);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      await db
        .update(user)
        .set({
          twoFactorEnabled: false,
          twoFactorSecret: null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Failed to disable two-factor authentication', 'USER_UPDATE_ERROR', 500);
    }
  }

  /**
   * Check if user exists
   */
  async userExists(id: string): Promise<boolean> {
    try {
      const userRecord = await this.getUserById(id);
      return !!userRecord;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const userRecord = await this.getUserByEmail(email);
      return !!userRecord;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole, limit: number = 50): Promise<User[]> {
    try {
      return await db
        .select()
        .from(user)
        .where(
          and(
            eq(user.role, role),
            eq(user.isActive, true)
          )
        )
        .limit(limit)
        .orderBy(user.createdAt);
    } catch (error) {
      throw new AuthError('Failed to get users by role', 'USER_RETRIEVAL_ERROR', 500);
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    try {
      const users = await db
        .select()
        .from(user)
        .where(
          and(
            eq(user.isActive, true),
            // Note: This is a simple contains search. In production, you might want to use full-text search
            sql`(LOWER(${user.name}) LIKE LOWER(${'%' + query + '%'}) OR LOWER(${user.email}) LIKE LOWER(${'%' + query + '%'}))`
          )
        )
        .limit(limit)
        .orderBy(user.name);

      return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        role: u.role,
        workflowsCreated: u.workflowsCreated,
        workflowsExecuted: u.workflowsExecuted,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt,
      }));
    } catch (error) {
      throw new AuthError('Failed to search users', 'USER_SEARCH_ERROR', 500);
    }
  }

  /**
   * Get total user count
   */
  async getTotalUserCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(user)
        .where(eq(user.isActive, true));

      return Number(result?.count || 0);
    } catch (error) {
      throw new AuthError('Failed to get total user count', 'USER_COUNT_ERROR', 500);
    }
  }

  /**
   * Get users with pagination
   */
  async getUsers(offset: number = 0, limit: number = 50): Promise<UserProfile[]> {
    try {
      const users = await db
        .select()
        .from(user)
        .where(eq(user.isActive, true))
        .offset(offset)
        .limit(limit)
        .orderBy(user.createdAt);

      return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        image: u.image,
        role: u.role,
        workflowsCreated: u.workflowsCreated,
        workflowsExecuted: u.workflowsExecuted,
        twoFactorEnabled: u.twoFactorEnabled,
        createdAt: u.createdAt,
      }));
    } catch (error) {
      throw new AuthError('Failed to get users', 'USER_RETRIEVAL_ERROR', 500);
    }
  }
}