import { z } from 'zod';
import { 
  ValidationError, 
  AuthError,
  type SignInRequest,
  type SignUpRequest,
  type ResetPasswordRequest,
  type ResetPasswordData,
  type ChangePasswordRequest,
  type VerifyEmailRequest,
  type ResendVerificationRequest,
  type TwoFactorSetupRequest,
  type TwoFactorVerifyRequest,
  type TwoFactorDisableRequest,
  type RefreshTokenRequest,
  type UpdateUserProfileRequest,
  type UpdateUserRoleRequest,
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
  updateUserProfileSchema,
  updateUserRoleSchema
} from '../types/auth.types';

export interface ValidationServiceInterface {
  validateSignIn(data: unknown): SignInRequest;
  validateSignUp(data: unknown): SignUpRequest;
  validateResetPasswordRequest(data: unknown): ResetPasswordRequest;
  validateResetPassword(data: unknown): ResetPasswordData;
  validateChangePassword(data: unknown): ChangePasswordRequest;
  validateVerifyEmail(data: unknown): VerifyEmailRequest;
  validateResendVerification(data: unknown): ResendVerificationRequest;
  validateTwoFactorSetup(data: unknown): TwoFactorSetupRequest;
  validateTwoFactorVerify(data: unknown): TwoFactorVerifyRequest;
  validateTwoFactorDisable(data: unknown): TwoFactorDisableRequest;
  validateRefreshToken(data: unknown): RefreshTokenRequest;
  validateUpdateUserProfile(data: unknown): UpdateUserProfileRequest;
  validateUpdateUserRole(data: unknown): UpdateUserRoleRequest;
  sanitizeEmail(email: string): string;
  sanitizeString(str: string): string;
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] };
  validateEmail(email: string): boolean;
  validateFileUpload(file: { name: string; size: number; mimetype: string }): { isValid: boolean; errors: string[] };
  detectSuspiciousInput(input: string): boolean;
  validateSessionMetadata(metadata: unknown): { ipAddress?: string; userAgent?: string };
}

export class ValidationService implements ValidationServiceInterface {
  private readonly MAX_STRING_LENGTH = 1000;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly SUSPICIOUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /on\w+\s*=/gi, // Event handlers
    /data:(?!image\/)/gi, // Data URLs (except images)
    /\bexec\b/gi, // SQL exec
    /\bunion\b.*\bselect\b/gi, // SQL injection
    /\bdrop\b.*\btable\b/gi, // SQL drop table
    /\balert\b/gi, // JavaScript alert
    /\bconfirm\b/gi, // JavaScript confirm
    /\bprompt\b/gi, // JavaScript prompt
  ];

  /**
   * Validate sign-in request
   */
  validateSignIn(data: unknown): SignInRequest {
    try {
      const result = signInSchema.parse(data);
      return {
        ...result,
        email: this.sanitizeEmail(result.email),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid sign-in data');
    }
  }

  /**
   * Validate sign-up request
   */
  validateSignUp(data: unknown): SignUpRequest {
    try {
      const result = signUpSchema.parse(data);
      
      // Additional password strength validation
      const passwordValidation = this.validatePasswordStrength(result.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Check for suspicious input
      if (this.detectSuspiciousInput(result.name) || this.detectSuspiciousInput(result.email)) {
        throw new ValidationError('Invalid characters detected in input');
      }

      return {
        ...result,
        name: this.sanitizeString(result.name),
        email: this.sanitizeEmail(result.email),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid sign-up data');
    }
  }

  /**
   * Validate password reset request
   */
  validateResetPasswordRequest(data: unknown): ResetPasswordRequest {
    try {
      const result = resetPasswordRequestSchema.parse(data);
      return {
        ...result,
        email: this.sanitizeEmail(result.email),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid password reset request data');
    }
  }

  /**
   * Validate password reset
   */
  validateResetPassword(data: unknown): ResetPasswordData {
    try {
      const result = resetPasswordSchema.parse(data);
      
      // Additional password strength validation
      const passwordValidation = this.validatePasswordStrength(result.password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid password reset data');
    }
  }

  /**
   * Validate change password request
   */
  validateChangePassword(data: unknown): ChangePasswordRequest {
    try {
      const result = changePasswordSchema.parse(data);
      
      // Additional password strength validation
      const passwordValidation = this.validatePasswordStrength(result.newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid change password data');
    }
  }

  /**
   * Validate email verification request
   */
  validateVerifyEmail(data: unknown): VerifyEmailRequest {
    try {
      return verifyEmailSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid email verification data');
    }
  }

  /**
   * Validate resend verification request
   */
  validateResendVerification(data: unknown): ResendVerificationRequest {
    try {
      const result = resendVerificationSchema.parse(data);
      return {
        ...result,
        email: this.sanitizeEmail(result.email),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid resend verification data');
    }
  }

  /**
   * Validate two-factor setup request
   */
  validateTwoFactorSetup(data: unknown): TwoFactorSetupRequest {
    try {
      return twoFactorSetupSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid two-factor setup data');
    }
  }

  /**
   * Validate two-factor verification request
   */
  validateTwoFactorVerify(data: unknown): TwoFactorVerifyRequest {
    try {
      return twoFactorVerifySchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid two-factor verification data');
    }
  }

  /**
   * Validate two-factor disable request
   */
  validateTwoFactorDisable(data: unknown): TwoFactorDisableRequest {
    try {
      return twoFactorDisableSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid two-factor disable data');
    }
  }

  /**
   * Validate refresh token request
   */
  validateRefreshToken(data: unknown): RefreshTokenRequest {
    try {
      return refreshTokenSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid refresh token data');
    }
  }

  /**
   * Validate update user profile request
   */
  validateUpdateUserProfile(data: unknown): UpdateUserProfileRequest {
    try {
      const result = updateUserProfileSchema.parse(data);

      // Check for suspicious input
      if (result.name && this.detectSuspiciousInput(result.name)) {
        throw new ValidationError('Invalid characters detected in name');
      }

      return {
        ...result,
        name: result.name ? this.sanitizeString(result.name) : undefined,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid update profile data');
    }
  }

  /**
   * Validate update user role request
   */
  validateUpdateUserRole(data: unknown): UpdateUserRoleRequest {
    try {
      return updateUserRoleSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid update user role data');
    }
  }

  /**
   * Sanitize email address
   */
  sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Sanitize string input
   */
  sanitizeString(str: string): string {
    return str
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, this.MAX_STRING_LENGTH); // Limit length
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    // Check for consecutive characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password must not contain more than 2 consecutive identical characters');
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      errors.push('Password must not contain sequential characters (e.g., 123, abc)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: { name: string; size: number; mimetype: string }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size must not exceed ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      errors.push(`File type not allowed. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`);
    }

    // Check file name
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push('Invalid file extension');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect suspicious input patterns
   */
  detectSuspiciousInput(input: string): boolean {
    return this.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Validate session metadata
   */
  validateSessionMetadata(metadata: unknown): { ipAddress?: string; userAgent?: string } {
    const metadataSchema = z.object({
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
    });

    try {
      const result = metadataSchema.parse(metadata);
      
      // Validate IP address format if provided
      if (result.ipAddress && !this.validateIPAddress(result.ipAddress)) {
        delete result.ipAddress;
      }

      // Sanitize user agent if provided
      if (result.userAgent) {
        result.userAgent = this.sanitizeString(result.userAgent);
        if (this.detectSuspiciousInput(result.userAgent)) {
          delete result.userAgent;
        }
      }

      return result;
    } catch (error) {
      return {};
    }
  }

  /**
   * Validate IP address format
   */
  private validateIPAddress(ip: string): boolean {
    // IPv4 regex
    const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Check for sequential characters in password
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      '0123456789',
      'abcdefghijklmnopqrstuvwxyz',
      'qwertyuiopasdfghjklzxcvbnm', // QWERTY keyboard layout
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const substr = sequence.substring(i, i + 3);
        const reverseSubstr = substr.split('').reverse().join('');
        
        if (password.toLowerCase().includes(substr) || password.toLowerCase().includes(reverseSubstr)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Validate array of strings
   */
  validateStringArray(data: unknown, maxLength: number = 100): string[] {
    if (!Array.isArray(data)) {
      throw new ValidationError('Expected an array');
    }

    if (data.length > maxLength) {
      throw new ValidationError(`Array length must not exceed ${maxLength}`);
    }

    return data.map((item, index) => {
      if (typeof item !== 'string') {
        throw new ValidationError(`Array item at index ${index} must be a string`);
      }

      if (this.detectSuspiciousInput(item)) {
        throw new ValidationError(`Array item at index ${index} contains suspicious content`);
      }

      return this.sanitizeString(item);
    });
  }

  /**
   * Validate pagination parameters
   */
  validatePagination(data: unknown): { offset: number; limit: number } {
    const paginationSchema = z.object({
      offset: z.number().int().min(0).optional().default(0),
      limit: z.number().int().min(1).max(100).optional().default(20),
    });

    try {
      return paginationSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Pagination validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`);
      }
      throw new ValidationError('Invalid pagination parameters');
    }
  }

  /**
   * Validate search query
   */
  validateSearchQuery(query: string): string {
    if (typeof query !== 'string') {
      throw new ValidationError('Search query must be a string');
    }

    const sanitized = this.sanitizeString(query);
    
    if (sanitized.length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long');
    }

    if (sanitized.length > 100) {
      throw new ValidationError('Search query must not exceed 100 characters');
    }

    if (this.detectSuspiciousInput(sanitized)) {
      throw new ValidationError('Search query contains suspicious content');
    }

    return sanitized;
  }
}