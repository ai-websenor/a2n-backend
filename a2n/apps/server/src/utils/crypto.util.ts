import crypto from 'crypto';
import { AuthError } from '../types/auth.types';

/**
 * Generate a cryptographically secure random token
 * @param length - The length of the token in bytes (default: 32)
 * @returns string - A hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  try {
    return crypto.randomBytes(length).toString('hex');
  } catch (error) {
    throw new AuthError('Failed to generate secure token', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Generate a cryptographically secure random ID
 * @param length - The length of the ID in bytes (default: 16)
 * @returns string - A base64url-encoded random ID
 */
export function generateSecureId(length: number = 16): string {
  try {
    return crypto.randomBytes(length).toString('base64url');
  } catch (error) {
    throw new AuthError('Failed to generate secure ID', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Generate a numeric verification code
 * @param length - The length of the code (default: 6)
 * @returns string - A numeric verification code
 */
export function generateVerificationCode(length: number = 6): string {
  try {
    const max = Math.pow(10, length) - 1;
    const min = Math.pow(10, length - 1);
    const randomValue = crypto.randomInt(min, max + 1);
    return randomValue.toString().padStart(length, '0');
  } catch (error) {
    throw new AuthError('Failed to generate verification code', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Generate Two-Factor Authentication secret
 * @returns string - A base32-encoded secret for TOTP
 */
export function generateTwoFactorSecret(): string {
  try {
    // Generate 20 bytes (160 bits) of entropy for TOTP secret
    const secret = crypto.randomBytes(20);
    return base32Encode(secret);
  } catch (error) {
    throw new AuthError('Failed to generate 2FA secret', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Generate backup codes for Two-Factor Authentication
 * @param count - Number of backup codes to generate (default: 10)
 * @returns string[] - Array of backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  try {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character backup codes (4 digits - 4 digits)
      const code1 = crypto.randomInt(1000, 9999);
      const code2 = crypto.randomInt(1000, 9999);
      codes.push(`${code1}-${code2}`);
    }
    return codes;
  } catch (error) {
    throw new AuthError('Failed to generate backup codes', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Hash a value using SHA-256
 * @param value - The value to hash
 * @returns string - The hex-encoded hash
 */
export function sha256Hash(value: string): string {
  try {
    return crypto.createHash('sha256').update(value).digest('hex');
  } catch (error) {
    throw new AuthError('Failed to hash value', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Create HMAC signature
 * @param data - The data to sign
 * @param secret - The secret key
 * @param algorithm - The hash algorithm (default: sha256)
 * @returns string - The hex-encoded HMAC signature
 */
export function createHmacSignature(
  data: string, 
  secret: string, 
  algorithm: string = 'sha256'
): string {
  try {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  } catch (error) {
    throw new AuthError('Failed to create HMAC signature', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Verify HMAC signature
 * @param data - The original data
 * @param signature - The signature to verify
 * @param secret - The secret key
 * @param algorithm - The hash algorithm (default: sha256)
 * @returns boolean - True if signature is valid
 */
export function verifyHmacSignature(
  data: string, 
  signature: string, 
  secret: string, 
  algorithm: string = 'sha256'
): boolean {
  try {
    const expectedSignature = createHmacSignature(data, secret, algorithm);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - The data to encrypt
 * @param key - The encryption key (32 bytes)
 * @returns { encrypted: string; iv: string; tag: string } - The encrypted data with IV and authentication tag
 */
export function encrypt(data: string, key: string): { encrypted: string; iv: string; tag: string } {
  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (error) {
    throw new AuthError('Failed to encrypt data', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param encrypted - The encrypted data
 * @param key - The encryption key (32 bytes)
 * @param iv - The initialization vector
 * @param tag - The authentication tag
 * @returns string - The decrypted data
 */
export function decrypt(encrypted: string, key: string, iv: string, tag: string): string {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new AuthError('Failed to decrypt data', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Generate a constant-time comparison safe token
 * @param length - The length of the token in bytes (default: 32)
 * @returns string - A URL-safe base64-encoded token
 */
export function generateSafeToken(length: number = 32): string {
  try {
    return crypto.randomBytes(length).toString('base64url');
  } catch (error) {
    throw new AuthError('Failed to generate safe token', 'CRYPTO_ERROR', 500);
  }
}

/**
 * Constant-time string comparison
 * @param a - First string
 * @param b - Second string
 * @returns boolean - True if strings are equal
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (error) {
    return false;
  }
}

// Base32 encoding for TOTP secrets
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encode buffer to base32
 * @param buffer - The buffer to encode
 * @returns string - Base32-encoded string
 */
function base32Encode(buffer: Buffer): string {
  let result = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  
  return result;
}

/**
 * Generate an encryption key
 * @returns string - A hex-encoded 256-bit encryption key
 */
export function generateEncryptionKey(): string {
  try {
    return crypto.randomBytes(32).toString('hex');
  } catch (error) {
    throw new AuthError('Failed to generate encryption key', 'CRYPTO_ERROR', 500);
  }
}