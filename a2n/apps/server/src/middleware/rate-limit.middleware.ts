import type { FastifyRequest, FastifyReply } from 'fastify';
import type { RateLimitConfig, RateLimitInfo } from '../types/auth.types';
import { TooManyRequestsError } from '../types/auth.types';

// In-memory store for rate limiting (in production, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    firstAttempt: number;
  };
}

// Rate limit configurations for different endpoints
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  'auth.signIn': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true,
  },
  'auth.signUp': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    skipSuccessfulRequests: false,
  },
  'auth.resetPasswordRequest': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    skipSuccessfulRequests: false,
  },
  'auth.resetPassword': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true,
  },
  'auth.verifyEmail': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 attempts per 5 minutes
    skipSuccessfulRequests: true,
  },
  'auth.resendVerification': {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // 3 attempts per 10 minutes
    skipSuccessfulRequests: false,
  },
  'auth.changePassword': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true,
  },
  'auth.refreshToken': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 attempts per 5 minutes
    skipSuccessfulRequests: true,
  },
  'auth.twoFactorSetup': {
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 3, // 3 attempts per 30 minutes
    skipSuccessfulRequests: true,
  },
  'auth.twoFactorVerify': {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 attempts per 5 minutes
    skipSuccessfulRequests: true,
  },
  'auth.twoFactorDisable': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per 15 minutes
    skipSuccessfulRequests: true,
  },
  // General API rate limits
  'api.general': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    skipSuccessfulRequests: false,
  },
  'api.user': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
    skipSuccessfulRequests: false,
  },
  'api.admin': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    skipSuccessfulRequests: false,
  },
};

export class RateLimitMiddleware {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Create rate limiting middleware for a specific endpoint
   */
  createLimiter(endpointKey: string, customConfig?: Partial<RateLimitConfig>) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const config = {
        ...RATE_LIMIT_CONFIGS[endpointKey],
        ...customConfig,
      };

      if (!config) {
        throw new Error(`Rate limit configuration not found for endpoint: ${endpointKey}`);
      }

      const key = this.generateKey(request, endpointKey);
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get or create rate limit entry
      const entry = this.store[key] || {
        count: 0,
        resetTime: now + config.windowMs,
        firstAttempt: now,
      };

      // Reset if window has expired
      if (entry.resetTime <= now) {
        entry.count = 0;
        entry.resetTime = now + config.windowMs;
        entry.firstAttempt = now;
      }

      // Check if limit is exceeded
      if (entry.count >= config.max) {
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        
        reply.code(429).headers({
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
          'Retry-After': resetIn.toString(),
        }).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        });
        return;
      }

      // Increment counter
      entry.count++;
      this.store[key] = entry;

      // Add rate limit headers
      reply.headers({
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.max - entry.count).toString(),
        'X-RateLimit-Reset': entry.resetTime.toString(),
      });

      // Store rate limit info in request for potential logging
      (request as any).rateLimitInfo = {
        limit: config.max,
        current: entry.count,
        remaining: Math.max(0, config.max - entry.count),
        resetTime: new Date(entry.resetTime),
      } as RateLimitInfo;
    };
  }

  /**
   * Apply different rate limits based on user role
   */
  createRoleBased() {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const auth = (request as any).auth;
      let endpointKey = 'api.general';

      if (auth?.user) {
        switch (auth.user.role) {
          case 'ADMIN':
          case 'OWNER':
            endpointKey = 'api.admin';
            break;
          case 'USER':
            endpointKey = 'api.user';
            break;
        }
      }

      await this.createLimiter(endpointKey)(request, reply);
    };
  }

  /**
   * Sliding window rate limiter for more sophisticated rate limiting
   */
  createSlidingWindow(windowMs: number, maxRequests: number) {
    const slidingStore: Record<string, number[]> = {};

    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const key = this.generateKey(request, 'sliding');
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing timestamps or create new array
      const timestamps = slidingStore[key] || [];

      // Remove expired timestamps
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);

      // Check if limit is exceeded
      if (validTimestamps.length >= maxRequests) {
        const oldestTimestamp = Math.min(...validTimestamps);
        const resetIn = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

        reply.code(429).headers({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (oldestTimestamp + windowMs).toString(),
          'Retry-After': resetIn.toString(),
        }).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        });
        return;
      }

      // Add current timestamp
      validTimestamps.push(now);
      slidingStore[key] = validTimestamps;

      // Add rate limit headers
      reply.headers({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - validTimestamps.length).toString(),
        'X-RateLimit-Reset': (now + windowMs).toString(),
      });
    };
  }

  /**
   * IP-based rate limiter for anonymous requests
   */
  createIPLimiter(config: RateLimitConfig) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const ip = this.getClientIP(request);
      const key = `ip:${ip}`;
      const now = Date.now();

      const entry = this.store[key] || {
        count: 0,
        resetTime: now + config.windowMs,
        firstAttempt: now,
      };

      if (entry.resetTime <= now) {
        entry.count = 0;
        entry.resetTime = now + config.windowMs;
        entry.firstAttempt = now;
      }

      if (entry.count >= config.max) {
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        
        reply.code(429).send({
          error: 'Too Many Requests',
          message: `Too many requests from this IP. Try again in ${resetIn} seconds.`,
          retryAfter: resetIn,
        });
        return;
      }

      entry.count++;
      this.store[key] = entry;
    };
  }

  /**
   * Progressive rate limiter that increases restrictions based on violations
   */
  createProgressive(baseConfig: RateLimitConfig) {
    const violationStore: Record<string, number> = {};

    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const key = this.generateKey(request, 'progressive');
      const violations = violationStore[key] || 0;
      
      // Adjust limits based on violation history
      const config = {
        ...baseConfig,
        max: Math.max(1, baseConfig.max - violations),
        windowMs: baseConfig.windowMs * (1 + violations * 0.5),
      };

      const now = Date.now();
      const entry = this.store[key] || {
        count: 0,
        resetTime: now + config.windowMs,
        firstAttempt: now,
      };

      if (entry.resetTime <= now) {
        entry.count = 0;
        entry.resetTime = now + config.windowMs;
        entry.firstAttempt = now;
      }

      if (entry.count >= config.max) {
        // Increment violation count
        violationStore[key] = violations + 1;
        
        const resetIn = Math.ceil((entry.resetTime - now) / 1000);
        
        reply.code(429).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Restrictions have been increased due to repeated violations.`,
          retryAfter: resetIn,
        });
        return;
      }

      entry.count++;
      this.store[key] = entry;
    };
  }

  /**
   * Generate a unique key for rate limiting
   */
  private generateKey(request: FastifyRequest, endpoint: string): string {
    const auth = (request as any).auth;
    const ip = this.getClientIP(request);
    
    if (auth?.user) {
      return `user:${auth.user.id}:${endpoint}`;
    }
    
    return `ip:${ip}:${endpoint}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: FastifyRequest): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIP = request.headers['x-real-ip'];
    
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    
    if (typeof xRealIP === 'string') {
      return xRealIP;
    }
    
    return request.ip || 'unknown';
  }

  /**
   * Clean up expired entries from store
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.store)) {
      if (entry.resetTime <= now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      delete this.store[key];
    }
  }

  /**
   * Get rate limit status for a key
   */
  getStatus(request: FastifyRequest, endpoint: string): RateLimitInfo | null {
    const key = this.generateKey(request, endpoint);
    const entry = this.store[key];
    const config = RATE_LIMIT_CONFIGS[endpoint];

    if (!entry || !config) {
      return null;
    }

    return {
      limit: config.max,
      current: entry.count,
      remaining: Math.max(0, config.max - entry.count),
      resetTime: new Date(entry.resetTime),
    };
  }

  /**
   * Reset rate limit for a specific key (admin function)
   */
  reset(request: FastifyRequest, endpoint: string): void {
    const key = this.generateKey(request, endpoint);
    delete this.store[key];
  }

  /**
   * Clear all rate limit data (admin function)
   */
  clear(): void {
    this.store = {};
  }

  /**
   * Get statistics about current rate limiting
   */
  getStats(): {
    totalKeys: number;
    activeEntries: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const entry of Object.values(this.store)) {
      if (entry.resetTime > now) {
        activeEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalKeys: Object.keys(this.store).length,
      activeEntries,
      expiredEntries,
    };
  }

  /**
   * Fastify plugin for registering rate limit middleware
   */
  registerPlugin() {
    return async (fastify: any) => {
      // Register rate limiting decorators
      fastify.decorate('rateLimit', this.createLimiter.bind(this));
      fastify.decorate('rateLimitByRole', this.createRoleBased.bind(this));
      fastify.decorate('rateLimitByIP', this.createIPLimiter.bind(this));
      fastify.decorate('rateLimitProgressive', this.createProgressive.bind(this));
      fastify.decorate('rateLimitSlidingWindow', this.createSlidingWindow.bind(this));
      
      // Add utility methods
      fastify.decorate('getRateLimitStatus', this.getStatus.bind(this));
      fastify.decorate('resetRateLimit', this.reset.bind(this));
      fastify.decorate('clearRateLimits', this.clear.bind(this));
      fastify.decorate('getRateLimitStats', this.getStats.bind(this));
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Export singleton instance
export const rateLimitMiddleware = new RateLimitMiddleware();

// Export rate limit configurations for use in controllers
export { RATE_LIMIT_CONFIGS };

// Graceful shutdown
process.on('SIGTERM', () => {
  rateLimitMiddleware.destroy();
});

process.on('SIGINT', () => {
  rateLimitMiddleware.destroy();
});