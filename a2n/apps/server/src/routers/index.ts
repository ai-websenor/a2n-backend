import { protectedProcedure, publicProcedure } from "../lib/orpc";
import type { RouterClient } from "@orpc/server";
import { authController } from "../controllers/auth.controller";
import { userController } from "../controllers/user.controller";
import { sessionController } from "../controllers/session.controller";

export const appRouter = {
	// Health check endpoint
	healthCheck: publicProcedure.handler(() => {
		return { status: "OK", timestamp: new Date(), version: "1.0.0" };
	}),

	// Example protected endpoint
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),

	// Authentication routes
	auth: {
		// Public authentication endpoints
		signIn: authController.signIn,
		signUp: authController.signUp,
		refreshToken: authController.refreshToken,
		resetPasswordRequest: authController.resetPasswordRequest,
		resetPassword: authController.resetPassword,
		verifyEmail: authController.verifyEmail,
		resendVerification: authController.resendVerification,

		// Protected authentication endpoints
		signOut: authController.signOut,
		changePassword: authController.changePassword,
		setupTwoFactor: authController.setupTwoFactor,
		verifyTwoFactor: authController.verifyTwoFactor,
		disableTwoFactor: authController.disableTwoFactor,
		getSession: authController.getSession,
		validateSession: authController.validateSession,
	},

	// User management routes
	user: {
		// Profile management
		getProfile: userController.getProfile,
		getProfileById: userController.getProfileById,
		updateProfile: userController.updateProfile,
		updateProfileById: userController.updateProfileById,

		// User statistics
		getStats: userController.getStats,
		getStatsById: userController.getStatsById,

		// Admin endpoints
		updateRole: userController.updateRole,
		deactivateUser: userController.deactivateUser,
		reactivateUser: userController.reactivateUser,
		deleteUser: userController.deleteUser,

		// Search and listing
		searchUsers: userController.searchUsers,
		getUsers: userController.getUsers,
		getUsersByRole: userController.getUsersByRole,
		getTotalUserCount: userController.getTotalUserCount,

		// Utility endpoints
		checkEmailExists: userController.checkEmailExists,
		incrementWorkflowCount: userController.incrementWorkflowCount,
	},

	// Session management routes
	session: {
		// Session information
		getSessions: sessionController.getSessions,
		getSessionsByUserId: sessionController.getSessionsByUserId,
		getCurrentSession: sessionController.getCurrentSession,

		// Session management
		revokeSession: sessionController.revokeSession,
		revokeOtherSessions: sessionController.revokeOtherSessions,
		revokeAllUserSessions: sessionController.revokeAllUserSessions,
		extendSession: sessionController.extendSession,

		// Statistics and monitoring
		getSessionStats: sessionController.getSessionStats,
		getSessionStatsByUserId: sessionController.getSessionStatsByUserId,
		getTokenStats: sessionController.getTokenStats,

		// Token management
		getRefreshTokens: sessionController.getRefreshTokens,
		revokeRefreshToken: sessionController.revokeRefreshToken,
		revokeAllRefreshTokens: sessionController.revokeAllRefreshTokens,

		// Security features
		detectSuspiciousActivity: sessionController.detectSuspiciousActivity,
		validateSessionOwnership: sessionController.validateSessionOwnership,
		updateSessionMetadata: sessionController.updateSessionMetadata,

		// Admin endpoints
		getSessionsByIP: sessionController.getSessionsByIP,
		cleanupExpiredSessions: sessionController.cleanupExpiredSessions,
	},
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
