import { eq } from 'drizzle-orm';
import { db } from '../db';
import { user as userTable } from '../db/schema/auth';
import type { 
  AuthServiceInterface, 
  SignInRequest, 
  SignUpRequest, 
  ResetPasswordData,
  ChangePasswordRequest,
  TwoFactorSetupResponse,
  TwoFactorDisableRequest,
  AuthResponse, 
  TokenResponse,
  SessionMetadata,
  User
} from '../types/auth.types';
import type { UserRole } from '../db/schema/types';
import { 
  AuthError, 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError,
  ValidationError
} from '../types/auth.types';

import { UserService } from './user.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { ValidationService } from './validation.service';

import { hashPassword, verifyPassword } from '../utils/password.util';
import { generateTwoFactorSecret, generateBackupCodes } from '../utils/crypto.util';

export class AuthService implements AuthServiceInterface {
  private userService: UserService;
  private sessionService: SessionService;
  private tokenService: TokenService;
  private emailService: EmailService;
  private validationService: ValidationService;

  constructor() {
    this.userService = new UserService();
    this.sessionService = new SessionService();
    this.tokenService = new TokenService();
    this.emailService = new EmailService();
    this.validationService = new ValidationService();
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(credentials: SignInRequest, metadata: SessionMetadata): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedCredentials = this.validationService.validateSignIn(credentials);
      const validatedMetadata = this.validationService.validateSessionMetadata(metadata);

      // Get user by email
      const user = await this.userService.getUserByEmail(validatedCredentials.email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Get full user data including password from database
      const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, user.id));
      if (!dbUser) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is inactive or suspended');
      }

      // Verify password
      if (!dbUser.password) {
        throw new UnauthorizedError('Account does not have password authentication enabled');
      }

      const isPasswordValid = await verifyPassword(validatedCredentials.password, dbUser.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Create session
      const session = await this.sessionService.createSession(
        user.id, 
        validatedMetadata, 
        validatedCredentials.rememberMe
      );

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(user, session.id);
      const refreshToken = await this.tokenService.generateRefreshToken(user.id, session.id);

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Send login notification email (optional)
      if (process.env.SEND_LOGIN_NOTIFICATIONS === 'true') {
        try {
          await this.emailService.sendLoginNotificationEmail(
            user.email,
            {
              ipAddress: validatedMetadata.ipAddress,
              userAgent: validatedMetadata.userAgent,
              timestamp: new Date(),
            },
            user.name
          );
        } catch (emailError) {
          console.warn('Failed to send login notification email:', emailError);
        }
      }

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          image: user.image || undefined,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
        accessToken,
        refreshToken: refreshToken.token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ValidationError) {
        throw error;
      }
      throw new AuthError('Sign-in failed', 'SIGNIN_ERROR', 500);
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(userData: SignUpRequest, metadata: SessionMetadata): Promise<AuthResponse> {
    try {
      // Validate input
      const validatedUserData = this.validationService.validateSignUp(userData);
      const validatedMetadata = this.validationService.validateSessionMetadata(metadata);

      // Check if user already exists
      const existingUser = await this.userService.getUserByEmail(validatedUserData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedUserData.password);

      // Create user
      const newUser = await this.userService.createUser({
        name: validatedUserData.name,
        email: validatedUserData.email,
        emailVerified: false,
        password: hashedPassword,
        role: 'USER' as UserRole,
        status: 'ACTIVE',
        isActive: true,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        workflowsCreated: 0,
        workflowsExecuted: 0,
        lastLoginAt: undefined,
        image: undefined,
      });

      // Create session
      const session = await this.sessionService.createSession(
        newUser.id, 
        validatedMetadata, 
        false
      );

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(newUser, session.id);
      const refreshToken = await this.tokenService.generateRefreshToken(newUser.id, session.id);

      // Generate email verification token and send email
      const verificationToken = await this.tokenService.generateVerificationToken(
        newUser.email, 
        'EMAIL_VERIFICATION'
      );

      try {
        await this.emailService.sendVerificationEmail(
          newUser.email, 
          verificationToken.value, 
          newUser.name
        );
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError);
      }

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          emailVerified: newUser.emailVerified,
          image: newUser.image || undefined,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
        accessToken,
        refreshToken: refreshToken.token,
      };
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }
      throw new AuthError('Sign-up failed', 'SIGNUP_ERROR', 500);
    }
  }

  /**
   * Sign out a user
   */
  async signOut(sessionId: string): Promise<void> {
    try {
      // Revoke session
      await this.sessionService.revokeSession(sessionId);

      // Revoke all refresh tokens for this session
      await this.tokenService.revokeSessionRefreshTokens(sessionId, 'USER_LOGOUT');
    } catch (error) {
      throw new AuthError('Sign-out failed', 'SIGNOUT_ERROR', 500);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenValue: string): Promise<TokenResponse> {
    try {
      // Verify refresh token
      const refreshToken = await this.tokenService.verifyRefreshToken(refreshTokenValue);

      // Get user and session
      const user = await this.userService.getUserById(refreshToken.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is inactive or suspended');
      }

      const session = await this.sessionService.getSession(refreshToken.sessionId!);
      if (!session) {
        throw new UnauthorizedError('Session not found');
      }

      // Update session activity
      await this.sessionService.updateSessionActivity(session.id);

      // Rotate refresh token (revoke old, create new)
      const newRefreshToken = await this.tokenService.rotateRefreshToken(
        refreshTokenValue, 
        user.id, 
        session.id
      );

      // Generate new access token
      const accessToken = this.tokenService.generateAccessToken(user, session.id);

      return {
        accessToken,
        refreshToken: newRefreshToken.token,
        expiresAt: session.expiresAt,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new AuthError('Token refresh failed', 'TOKEN_REFRESH_ERROR', 500);
    }
  }

  /**
   * Request password reset
   */
  async resetPasswordRequest(email: string): Promise<void> {
    try {
      // Validate email
      const validatedRequest = this.validationService.validateResetPasswordRequest({ email });

      // Check if user exists (but don't reveal if they don't)
      const user = await this.userService.getUserByEmail(validatedRequest.email);
      
      if (user && user.isActive && user.status === 'ACTIVE') {
        // Generate reset token
        const resetToken = await this.tokenService.generateVerificationToken(
          user.email, 
          'PASSWORD_RESET'
        );

        // Send reset email
        await this.emailService.sendPasswordResetEmail(
          user.email, 
          resetToken.value, 
          user.name
        );
      }

      // Always return success to prevent email enumeration
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new AuthError('Password reset request failed', 'PASSWORD_RESET_REQUEST_ERROR', 500);
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      // Validate input
      const validatedData = this.validationService.validateResetPassword(data);

      // Verify reset token
      const verificationToken = await this.tokenService.verifyToken(
        validatedData.token, 
        'PASSWORD_RESET'
      );

      // Get user by email from token
      const user = await this.userService.getUserByEmail(verificationToken.identifier);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (!user.isActive || user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is inactive or suspended');
      }

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.password);

      // Update user password
      await this.userService.updateUserPassword(user.id, hashedPassword);

      // Mark verification token as used
      await this.tokenService.markTokenAsUsed(verificationToken.id);

      // Revoke all user sessions and refresh tokens for security
      await this.sessionService.revokeAllUserSessions(user.id);
      await this.tokenService.revokeAllUserRefreshTokens(user.id, 'PASSWORD_RESET');

      // Send password changed notification
      try {
        await this.emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (emailError) {
        console.warn('Failed to send password changed email:', emailError);
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new AuthError('Password reset failed', 'PASSWORD_RESET_ERROR', 500);
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    try {
      // Validate input
      const validatedData = this.validationService.validateChangePassword(data);

      // Get user
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get full user data including password from database
      const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, userId));
      if (!dbUser) {
        throw new NotFoundError('User not found');
      }

      if (!dbUser.password) {
        throw new UnauthorizedError('Account does not have password authentication enabled');
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(validatedData.currentPassword, dbUser.password);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.newPassword);

      // Update user password
      await this.userService.updateUserPassword(user.id, hashedPassword);

      // Revoke all other sessions and refresh tokens for security
      await this.tokenService.revokeAllUserRefreshTokens(user.id, 'PASSWORD_CHANGED');

      // Send password changed notification
      try {
        await this.emailService.sendPasswordChangedEmail(user.email, user.name);
      } catch (emailError) {
        console.warn('Failed to send password changed email:', emailError);
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new AuthError('Password change failed', 'PASSWORD_CHANGE_ERROR', 500);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Validate input
      const validatedData = this.validationService.validateVerifyEmail({ token });

      // Verify token
      const verificationToken = await this.tokenService.verifyToken(
        validatedData.token, 
        'EMAIL_VERIFICATION'
      );

      // Get user by email from token
      const user = await this.userService.getUserByEmail(verificationToken.identifier);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (user.emailVerified) {
        // Already verified, but don't throw error
        return;
      }

      // Verify user email
      await this.userService.verifyUserEmail(user.id);

      // Mark verification token as used
      await this.tokenService.markTokenAsUsed(verificationToken.id);

      // Send welcome email
      try {
        await this.emailService.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.warn('Failed to send welcome email:', emailError);
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new AuthError('Email verification failed', 'EMAIL_VERIFICATION_ERROR', 500);
    }
  }

  /**
   * Resend email verification
   */
  async resendVerification(email: string): Promise<void> {
    try {
      // Validate input
      const validatedData = this.validationService.validateResendVerification({ email });

      // Get user
      const user = await this.userService.getUserByEmail(validatedData.email);
      if (!user) {
        // Don't reveal if user doesn't exist
        return;
      }

      if (user.emailVerified) {
        // Already verified
        return;
      }

      if (!user.isActive || user.status !== 'ACTIVE') {
        return;
      }

      // Generate new verification token
      const verificationToken = await this.tokenService.generateVerificationToken(
        user.email, 
        'EMAIL_VERIFICATION'
      );

      // Send verification email
      await this.emailService.sendVerificationEmail(
        user.email, 
        verificationToken.value, 
        user.name
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new AuthError('Resend verification failed', 'RESEND_VERIFICATION_ERROR', 500);
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(userId: string, password: string): Promise<TwoFactorSetupResponse> {
    try {
      // Validate input
      const validatedData = this.validationService.validateTwoFactorSetup({ password });

      // Get user
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get full user data including password from database
      const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, userId));
      if (!dbUser) {
        throw new NotFoundError('User not found');
      }

      if (!dbUser.password) {
        throw new UnauthorizedError('Account does not have password authentication enabled');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(validatedData.password, dbUser.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Password is incorrect');
      }

      if (user.twoFactorEnabled) {
        throw new ConflictError('Two-factor authentication is already enabled');
      }

      // Generate 2FA secret and backup codes
      const secret = generateTwoFactorSecret();
      const backupCodes = generateBackupCodes();

      // Enable 2FA for user
      await this.userService.enableTwoFactor(user.id, secret);

      // Generate QR code URL (for authenticator apps)
      const qrCode = `otpauth://totp/${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent('A2N')}`;

      // Send backup codes via email
      try {
        await this.emailService.sendBackupCodesEmail(user.email, backupCodes, user.name);
      } catch (emailError) {
        console.warn('Failed to send backup codes email:', emailError);
      }

      return {
        secret,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof ConflictError) {
        throw error;
      }
      throw new AuthError('Two-factor setup failed', 'TWO_FACTOR_SETUP_ERROR', 500);
    }
  }

  /**
   * Verify two-factor authentication code
   */
  async verifyTwoFactor(userId: string, code: string): Promise<boolean> {
    try {
      // Validate input
      const validatedData = this.validationService.validateTwoFactorVerify({ code });

      // Get user
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get full user data including 2FA secret from database
      const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, userId));
      if (!dbUser) {
        throw new NotFoundError('User not found');
      }

      if (!user.twoFactorEnabled || !dbUser.twoFactorSecret) {
        throw new UnauthorizedError('Two-factor authentication is not enabled');
      }

      // In production, you would verify the TOTP code using the secret
      // For now, we'll implement a basic verification
      // TODO: Implement proper TOTP verification using libraries like speakeasy
      
      return true; // Placeholder
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
        throw error;
      }
      throw new AuthError('Two-factor verification failed', 'TWO_FACTOR_VERIFY_ERROR', 500);
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(userId: string, data: TwoFactorDisableRequest): Promise<void> {
    try {
      // Validate input
      const validatedData = this.validationService.validateTwoFactorDisable(data);

      // Get user
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get full user data including password from database
      const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, userId));
      if (!dbUser) {
        throw new NotFoundError('User not found');
      }

      if (!dbUser.password) {
        throw new UnauthorizedError('Account does not have password authentication enabled');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(validatedData.password, dbUser.password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Password is incorrect');
      }

      if (!user.twoFactorEnabled) {
        throw new ConflictError('Two-factor authentication is not enabled');
      }

      // Verify 2FA code
      const isCodeValid = await this.verifyTwoFactor(userId, validatedData.code);
      if (!isCodeValid) {
        throw new UnauthorizedError('Two-factor code is incorrect');
      }

      // Disable 2FA for user
      await this.userService.disableTwoFactor(user.id);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof UnauthorizedError || error instanceof ConflictError) {
        throw error;
      }
      throw new AuthError('Two-factor disable failed', 'TWO_FACTOR_DISABLE_ERROR', 500);
    }
  }

  /**
   * Get user by session token (for middleware)
   */
  async getUserBySessionToken(token: string): Promise<{ user: User; session: any } | null> {
    try {
      const session = await this.sessionService.getSessionByToken(token);
      if (!session) {
        return null;
      }

      const user = await this.userService.getUserById(session.userId);
      if (!user || !user.isActive || user.status !== 'ACTIVE') {
        return null;
      }

      // Update session activity
      await this.sessionService.updateSessionActivity(session.id);

      return { user, session };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify access token and get user (for middleware)
   */
  async verifyAccessTokenAndGetUser(token: string): Promise<{ user: User; session: any } | null> {
    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      
      const user = await this.userService.getUserById(payload.userId);
      if (!user || !user.isActive || user.status !== 'ACTIVE') {
        return null;
      }

      const session = await this.sessionService.getSession(payload.sessionId);
      if (!session) {
        return null;
      }

      // Update session activity
      await this.sessionService.updateSessionActivity(session.id);

      return { user, session };
    } catch (error) {
      return null;
    }
  }
}