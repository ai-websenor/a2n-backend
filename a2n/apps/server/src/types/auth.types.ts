import { z } from 'zod';
import type { UserRole, AccountStatus } from '../db/schema/types';

// =================== AUTH REQUEST/RESPONSE SCHEMAS ===================

// Sign In Schema
export const signInSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  rememberMe: z.boolean().optional().default(false),
});

// Sign Up Schema
export const signUpSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Password Reset Schemas
export const resetPasswordRequestSchema = z.object({
  email: z.string().email().max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Email Verification Schemas
export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationSchema = z.object({
  email: z.string().email().max(255),
});

// Two Factor Authentication Schemas
export const twoFactorSetupSchema = z.object({
  password: z.string().min(1),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const twoFactorDisableSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
  password: z.string().min(1),
});

// Refresh Token Schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Update User Profile Schema
export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.string().url().optional(),
});

// Admin Update User Schema
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'ADMIN', 'OWNER']),
});

// =================== TYPESCRIPT TYPES ===================

// Inferred types from schemas
export type SignInRequest = z.infer<typeof signInSchema>;
export type SignUpRequest = z.infer<typeof signUpSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationRequest = z.infer<typeof resendVerificationSchema>;
export type TwoFactorSetupRequest = z.infer<typeof twoFactorSetupSchema>;
export type TwoFactorVerifyRequest = z.infer<typeof twoFactorVerifySchema>;
export type TwoFactorDisableRequest = z.infer<typeof twoFactorDisableSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleSchema>;

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: UserRole;
  status: AccountStatus;
  isActive: boolean;
  lastLoginAt?: Date | null;
  twoFactorEnabled: boolean;
  workflowsCreated: number;
  workflowsExecuted: number;
  createdAt: Date;
  updatedAt: Date;
}

// Internal user type with password for database operations
export interface InternalUser extends User {
  password?: string | null;
  twoFactorSecret?: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: UserRole;
  workflowsCreated: number;
  workflowsExecuted: number;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export interface UserStats {
  workflowsCreated: number;
  workflowsExecuted: number;
  lastLoginAt?: Date | null;
  totalSessions: number;
  activeSessions: number;
}

// Session related types
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  isActive: boolean;
  lastAccessedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Token related types
export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  sessionId?: string | null;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date | null;
  revokedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPayload {
  userId: string;
  sessionId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface VerificationToken {
  id: string;
  identifier: string;
  value: string;
  type: string;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Response types
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    image?: string;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// Service interface types
export interface AuthServiceInterface {
  signIn(credentials: SignInRequest, metadata: SessionMetadata): Promise<AuthResponse>;
  signUp(userData: SignUpRequest, metadata: SessionMetadata): Promise<AuthResponse>;
  signOut(sessionId: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<TokenResponse>;
  resetPasswordRequest(email: string): Promise<void>;
  resetPassword(data: ResetPasswordData): Promise<void>;
  changePassword(userId: string, data: ChangePasswordRequest): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  resendVerification(email: string): Promise<void>;
  setupTwoFactor(userId: string, password: string): Promise<TwoFactorSetupResponse>;
  verifyTwoFactor(userId: string, code: string): Promise<boolean>;
  disableTwoFactor(userId: string, data: TwoFactorDisableRequest): Promise<void>;
}

export interface UserServiceInterface {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: Omit<InternalUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  deactivateUser(id: string): Promise<void>;
  getUserProfile(id: string): Promise<UserProfile>;
  updateUserProfile(id: string, data: UpdateUserProfileRequest): Promise<UserProfile>;
  updateUserRole(id: string, role: UserRole): Promise<void>;
  getUserStats(id: string): Promise<UserStats>;
  incrementWorkflowCount(userId: string, type: 'created' | 'executed'): Promise<void>;
}

export interface SessionServiceInterface {
  createSession(userId: string, metadata: SessionMetadata): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  getSessionByToken(token: string): Promise<Session | null>;
  getUserSessions(userId: string): Promise<Session[]>;
  updateSessionActivity(sessionId: string): Promise<void>;
  revokeSession(sessionId: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
}

export interface TokenServiceInterface {
  generateAccessToken(user: User, sessionId: string): string;
  generateRefreshToken(userId: string, sessionId: string): Promise<RefreshToken>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<RefreshToken>;
  revokeRefreshToken(tokenId: string, reason?: string): Promise<void>;
  generateVerificationToken(identifier: string, type: string): Promise<VerificationToken>;
  verifyToken(token: string, type: string): Promise<VerificationToken>;
  cleanupExpiredTokens(): Promise<void>;
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AuthError {
  constructor(message: string = 'Not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AuthError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class TooManyRequestsError extends AuthError {
  constructor(message: string = 'Too many requests') {
    super(message, 'TOO_MANY_REQUESTS', 429);
  }
}

export class InternalServerError extends AuthError {
  constructor(message: string = 'Internal server error') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// Middleware context types
export interface AuthContext {
  user: User;
  session: Session;
}

export interface RequestContext {
  auth?: AuthContext;
  rateLimitInfo?: RateLimitInfo;
}