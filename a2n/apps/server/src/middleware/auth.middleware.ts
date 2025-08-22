import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthContext, User, Session } from '../types/auth.types';
import type { UserRole } from '../db/schema/types';
import { UnauthorizedError, ForbiddenError } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { extractTokenFromHeader } from '../utils/jwt.util';

// Extend FastifyRequest to include auth context
declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Middleware to authenticate requests using Bearer tokens
   */
  async authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const authHeader = request.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        throw new UnauthorizedError('Authorization token required');
      }

      // Verify token and get user
      const authData = await this.authService.verifyAccessTokenAndGetUser(token);
      if (!authData) {
        throw new UnauthorizedError('Invalid or expired token');
      }

      // Add auth context to request
      request.auth = {
        user: authData.user,
        session: authData.session,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: error.message,
        });
        return;
      }
      
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Authentication failed',
      });
      return;
    }
  }

  /**
   * Middleware to authenticate requests using session tokens (optional for some routes)
   */
  async authenticateOptional(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const authHeader = request.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      if (token) {
        const authData = await this.authService.verifyAccessTokenAndGetUser(token);
        if (authData) {
          request.auth = {
            user: authData.user,
            session: authData.session,
          };
        }
      }
    } catch (error) {
      // For optional authentication, we don't throw errors
      // Just proceed without auth context
    }
  }

  /**
   * Role-based authorization middleware
   */
  requireRole(requiredRoles: UserRole | UserRole[]) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      if (!request.auth) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const userRole = request.auth.user.role;
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      if (!roles.includes(userRole)) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions',
        });
        return;
      }
    };
  }

  /**
   * Admin-only authorization middleware
   */
  async requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.auth) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (request.auth.user.role !== 'ADMIN' && request.auth.user.role !== 'OWNER') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Admin access required',
      });
      return;
    }
  }

  /**
   * Owner-only authorization middleware
   */
  async requireOwner(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.auth) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (request.auth.user.role !== 'OWNER') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Owner access required',
      });
      return;
    }
  }

  /**
   * Email verification required middleware
   */
  async requireEmailVerified(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.auth) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!request.auth.user.emailVerified) {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Email verification required',
      });
      return;
    }
  }

  /**
   * Resource ownership middleware (for user-specific resources)
   */
  requireOwnership(userIdParam: string = 'userId') {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      if (!request.auth) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const params = request.params as Record<string, string>;
      const resourceUserId = params[userIdParam];
      const currentUserId = request.auth.user.id;

      // Allow admins and owners to access any resource
      if (request.auth.user.role === 'ADMIN' || request.auth.user.role === 'OWNER') {
        return;
      }

      // Check if user owns the resource
      if (resourceUserId !== currentUserId) {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Access to this resource is not allowed',
        });
        return;
      }
    };
  }

  /**
   * Account status validation middleware
   */
  async requireActiveAccount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.auth) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const user = request.auth.user;

    if (!user.isActive) {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Account is deactivated',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Account is suspended',
      });
      return;
    }

    if (user.status === 'INACTIVE') {
      reply.code(403).send({
        error: 'Forbidden',
        message: 'Account is inactive',
      });
      return;
    }
  }

  /**
   * Session validation middleware
   */
  async validateSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.auth || !request.auth.session) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Valid session required',
      });
      return;
    }

    const session = request.auth.session;

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Session expired',
      });
      return;
    }

    // Check if session is active
    if (!session.isActive) {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Session is no longer active',
      });
      return;
    }
  }

  /**
   * Security headers middleware
   */
  async addSecurityHeaders(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Add CSP header for additional security
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    
    reply.header('Content-Security-Policy', csp);
  }

  /**
   * CORS configuration for authentication endpoints
   */
  getCorsOptions() {
    return {
      origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    };
  }

  /**
   * Extract client IP address
   */
  getClientIP(request: FastifyRequest): string {
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
   * Extract user agent
   */
  getUserAgent(request: FastifyRequest): string {
    return request.headers['user-agent'] || 'unknown';
  }

  /**
   * Get session metadata from request
   */
  getSessionMetadata(request: FastifyRequest) {
    return {
      ipAddress: this.getClientIP(request),
      userAgent: this.getUserAgent(request),
    };
  }

  /**
   * Fastify plugin for registering auth middleware
   */
  registerPlugin() {
    return async (fastify: any) => {
      // Register authentication decorator
      fastify.decorate('authenticate', this.authenticate.bind(this));
      fastify.decorate('authenticateOptional', this.authenticateOptional.bind(this));
      fastify.decorate('requireAdmin', this.requireAdmin.bind(this));
      fastify.decorate('requireOwner', this.requireOwner.bind(this));
      fastify.decorate('requireEmailVerified', this.requireEmailVerified.bind(this));
      fastify.decorate('requireActiveAccount', this.requireActiveAccount.bind(this));
      fastify.decorate('validateSession', this.validateSession.bind(this));
      fastify.decorate('addSecurityHeaders', this.addSecurityHeaders.bind(this));
      
      // Add helper methods
      fastify.decorate('requireRole', this.requireRole.bind(this));
      fastify.decorate('requireOwnership', this.requireOwnership.bind(this));
      fastify.decorate('getSessionMetadata', this.getSessionMetadata.bind(this));
      
      // Register global security headers
      fastify.addHook('onRequest', this.addSecurityHeaders.bind(this));
    };
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();