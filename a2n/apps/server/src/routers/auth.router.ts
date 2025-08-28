import { protectedProcedure, publicProcedure } from '../lib/orpc';
import { authController, rateLimitedAuthController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { sessionController } from '../controllers/session.controller';

/**
 * Authentication Router
 * 
 * This router contains all authentication-related endpoints with proper
 * rate limiting and security measures applied.
 */
export const authRouter = {
  // =============================================================================
  // PUBLIC AUTHENTICATION ENDPOINTS
  // =============================================================================
  
  /**
   * User Registration and Login
   */
  signUp: rateLimitedAuthController.signUp,
  signIn: rateLimitedAuthController.signIn,
  
  /**
   * Token Management
   */
  refreshToken: authController.refreshToken,
  
  /**
   * Password Recovery
   */
  resetPasswordRequest: rateLimitedAuthController.resetPasswordRequest,
  resetPassword: rateLimitedAuthController.resetPassword,
  
  /**
   * Email Verification
   */
  verifyEmail: rateLimitedAuthController.verifyEmail,
  resendVerification: rateLimitedAuthController.resendVerification,
  
  /**
   * Account Utilities
   */
  checkEmailExists: userController.checkEmailExists,

  // =============================================================================
  // PROTECTED AUTHENTICATION ENDPOINTS
  // =============================================================================
  
  /**
   * Session Management
   */
  signOut: authController.signOut,
  getSession: authController.getSession,
  validateSession: authController.validateSession,
  
  /**
   * Password Management
   */
  changePassword: authController.changePassword,
  
  /**
   * Two-Factor Authentication
   */
  setupTwoFactor: authController.setupTwoFactor,
  verifyTwoFactor: authController.verifyTwoFactor,
  disableTwoFactor: authController.disableTwoFactor,
};

/**
 * User Management Router
 * 
 * This router contains user profile and account management endpoints.
 */
export const userRouter = {
  // =============================================================================
  // PROFILE MANAGEMENT
  // =============================================================================
  
  /**
   * Current User Profile
   */
  getProfile: userController.getProfile,
  updateProfile: userController.updateProfile,
  getStats: userController.getStats,
  
  /**
   * User Profile by ID (Admin or Self)
   */
  getProfileById: userController.getProfileById,
  getStatsById: userController.getStatsById,
  
  // =============================================================================
  // ADMIN USER MANAGEMENT
  // =============================================================================
  
  /**
   * User Administration
   */
  updateProfileById: userController.updateProfileById,
  updateRole: userController.updateRole,
  deactivateUser: userController.deactivateUser,
  reactivateUser: userController.reactivateUser,
  deleteUser: userController.deleteUser,
  
  /**
   * User Search and Listing
   */
  searchUsers: userController.searchUsers,
  getUsers: userController.getUsers,
  getUsersByRole: userController.getUsersByRole,
  getTotalUserCount: userController.getTotalUserCount,
  
  /**
   * Workflow Statistics
   */
  incrementWorkflowCount: userController.incrementWorkflowCount,
};

/**
 * Session Management Router
 * 
 * This router contains session and token management endpoints.
 */
export const sessionRouter = {
  // =============================================================================
  // SESSION INFORMATION
  // =============================================================================
  
  /**
   * Current User Sessions
   */
  getSessions: sessionController.getSessions,
  getCurrentSession: sessionController.getCurrentSession,
  getSessionStats: sessionController.getSessionStats,
  
  /**
   * Session by User ID (Admin or Self)
   */
  getSessionsByUserId: sessionController.getSessionsByUserId,
  getSessionStatsByUserId: sessionController.getSessionStatsByUserId,
  
  // =============================================================================
  // SESSION MANAGEMENT
  // =============================================================================
  
  /**
   * Session Control
   */
  revokeSession: sessionController.revokeSession,
  revokeOtherSessions: sessionController.revokeOtherSessions,
  extendSession: sessionController.extendSession,
  validateSessionOwnership: sessionController.validateSessionOwnership,
  updateSessionMetadata: sessionController.updateSessionMetadata,
  
  // =============================================================================
  // TOKEN MANAGEMENT
  // =============================================================================
  
  /**
   * Refresh Token Management
   */
  getTokenStats: sessionController.getTokenStats,
  getRefreshTokens: sessionController.getRefreshTokens,
  revokeRefreshToken: sessionController.revokeRefreshToken,
  revokeAllRefreshTokens: sessionController.revokeAllRefreshTokens,
  
  // =============================================================================
  // SECURITY FEATURES
  // =============================================================================
  
  /**
   * Security Monitoring
   */
  detectSuspiciousActivity: sessionController.detectSuspiciousActivity,
  
  // =============================================================================
  // ADMIN SESSION MANAGEMENT
  // =============================================================================
  
  /**
   * Admin Session Operations
   */
  revokeAllUserSessions: sessionController.revokeAllUserSessions,
  getSessionsByIP: sessionController.getSessionsByIP,
  cleanupExpiredSessions: sessionController.cleanupExpiredSessions,
};

/**
 * Complete Authentication API Router
 * 
 * This combines all authentication-related routers into a single namespace.
 */
export const authApiRouter = {
  auth: authRouter,
  user: userRouter,
  session: sessionRouter,
};

// Export types for client generation
export type AuthRouter = typeof authRouter;
export type UserRouter = typeof userRouter;
export type SessionRouter = typeof sessionRouter;
export type AuthApiRouter = typeof authApiRouter;