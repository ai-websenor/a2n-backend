import type { FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from '../types/auth.types';
import { ValidationService } from '../services/validation.service';

// Extend FastifyRequest to include multipart methods
declare module 'fastify' {
  interface FastifyRequest {
    file(): Promise<any>;
  }
}

// File upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Request size limits
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const MAX_QUERY_LENGTH = 1000;
const MAX_PARAM_LENGTH = 100;

export class ValidationMiddleware {
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ValidationService();
  }

  /**
   * General request validation middleware
   */
  async validateRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Validate request size
      this.validateRequestSize(request);

      // Validate headers
      this.validateHeaders(request);

      // Validate query parameters
      this.validateQueryParameters(request);

      // Validate URL parameters
      this.validateUrlParameters(request);

      // Validate request body if present
      if (request.body) {
        this.validateRequestBody(request);
      }

    } catch (error) {
      if (error instanceof ValidationError) {
        reply.code(400).send({
          error: 'Validation Error',
          message: error.message,
        });
        return;
      }
      
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Request validation failed',
      });
      return;
    }
  }

  /**
   * Validate and sanitize JSON input
   */
  validateJsonInput(schema?: any) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const contentType = request.headers['content-type'];
        
        if (contentType && !contentType.includes('application/json')) {
          throw new ValidationError('Content-Type must be application/json');
        }

        const body = request.body;
        if (!body || typeof body !== 'object') {
          throw new ValidationError('Request body must be a valid JSON object');
        }

        // Validate against schema if provided
        if (schema) {
          const result = schema.safeParse(body);
          if (!result.success) {
            throw new ValidationError(`Validation failed: ${result.error.errors.map((e: any) => e.message).join(', ')}`);
          }
          request.body = result.data;
        }

        // Sanitize all string values in the object
        request.body = this.sanitizeObject(body);

      } catch (error) {
        if (error instanceof ValidationError) {
          reply.code(400).send({
            error: 'Validation Error',
            message: error.message,
          });
          return;
        }
        
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'JSON validation failed',
        });
        return;
      }
    };
  }

  /**
   * File upload validation middleware
   */
  async validateFileUpload(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const contentType = request.headers['content-type'];
      
      if (!contentType || !contentType.includes('multipart/form-data')) {
        throw new ValidationError('Content-Type must be multipart/form-data for file uploads');
      }

      // Handle multipart data
      const data = await request.file();
      if (!data) {
        throw new ValidationError('No file provided');
      }

      // Validate file
      const fileValidation = this.validationService.validateFileUpload({
        name: data.filename,
        size: 0, // Size will be checked during streaming
        mimetype: data.mimetype,
      });

      if (!fileValidation.isValid) {
        throw new ValidationError(fileValidation.errors.join(', '));
      }

      // Stream and validate file size
      const chunks: Buffer[] = [];
      let totalSize = 0;

      for await (const chunk of data.file) {
        totalSize += chunk.length;
        
        if (totalSize > MAX_FILE_SIZE) {
          throw new ValidationError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }
        
        chunks.push(chunk);
      }

      // Reconstruct file buffer
      const fileBuffer = Buffer.concat(chunks);
      
      // Add validated file to request
      (request as any).validatedFile = {
        filename: data.filename,
        mimetype: data.mimetype,
        buffer: fileBuffer,
        size: totalSize,
      };

    } catch (error) {
      if (error instanceof ValidationError) {
        reply.code(400).send({
          error: 'Validation Error',
          message: error.message,
        });
        return;
      }
      
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'File validation failed',
      });
      return;
    }
  }

  /**
   * Pagination validation middleware
   */
  validatePagination() {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const query = request.query as any;
        const paginationData = this.validationService.validatePagination(query);
        
        // Add validated pagination to request
        (request as any).pagination = paginationData;

      } catch (error) {
        if (error instanceof ValidationError) {
          reply.code(400).send({
            error: 'Validation Error',
            message: error.message,
          });
          return;
        }
        
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Pagination validation failed',
        });
        return;
      }
    };
  }

  /**
   * Search query validation middleware
   */
  validateSearchQuery() {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const query = (request.query as any)?.q || '';
        const validatedQuery = this.validationService.validateSearchQuery(query);
        
        // Add validated query to request
        (request as any).searchQuery = validatedQuery;

      } catch (error) {
        if (error instanceof ValidationError) {
          reply.code(400).send({
            error: 'Validation Error',
            message: error.message,
          });
          return;
        }
        
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Search query validation failed',
        });
        return;
      }
    };
  }

  /**
   * Validate request size limits
   */
  private validateRequestSize(request: FastifyRequest): void {
    const contentLength = request.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      throw new ValidationError(`Request body size exceeds maximum allowed size of ${MAX_BODY_SIZE / 1024}KB`);
    }
  }

  /**
   * Validate request headers
   */
  private validateHeaders(request: FastifyRequest): void {
    const headers = request.headers;
    
    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-original-url',
      'x-rewrite-url',
    ];

    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        // Log suspicious activity but don't block
        console.warn(`Suspicious header detected: ${header} = ${headers[header]}`);
      }
    }

    // Validate User-Agent
    const userAgent = headers['user-agent'];
    if (userAgent && typeof userAgent === 'string') {
      if (this.validationService.detectSuspiciousInput(userAgent)) {
        throw new ValidationError('Invalid User-Agent header');
      }
    }

    // Validate custom headers
    for (const [key, value] of Object.entries(headers)) {
      if (key.startsWith('x-') && typeof value === 'string') {
        if (this.validationService.detectSuspiciousInput(value)) {
          throw new ValidationError(`Invalid header value for ${key}`);
        }
      }
    }
  }

  /**
   * Validate query parameters
   */
  private validateQueryParameters(request: FastifyRequest): void {
    const query = request.query as Record<string, any>;
    
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        if (value.length > MAX_QUERY_LENGTH) {
          throw new ValidationError(`Query parameter '${key}' exceeds maximum length`);
        }
        
        if (this.validationService.detectSuspiciousInput(value)) {
          throw new ValidationError(`Suspicious content in query parameter '${key}'`);
        }
      }
    }
  }

  /**
   * Validate URL parameters
   */
  private validateUrlParameters(request: FastifyRequest): void {
    const params = request.params as Record<string, string>;
    
    for (const [key, value] of Object.entries(params)) {
      if (value.length > MAX_PARAM_LENGTH) {
        throw new ValidationError(`URL parameter '${key}' exceeds maximum length`);
      }
      
      if (this.validationService.detectSuspiciousInput(value)) {
        throw new ValidationError(`Suspicious content in URL parameter '${key}'`);
      }
    }
  }

  /**
   * Validate request body
   */
  private validateRequestBody(request: FastifyRequest): void {
    const body = request.body;
    
    if (typeof body === 'string') {
      if (body.length > MAX_BODY_SIZE) {
        throw new ValidationError('Request body exceeds maximum size');
      }
      
      if (this.validationService.detectSuspiciousInput(body)) {
        throw new ValidationError('Suspicious content in request body');
      }
    } else if (typeof body === 'object' && body !== null) {
      this.validateObjectSecurity(body);
    }
  }

  /**
   * Validate object for security issues
   */
  private validateObjectSecurity(obj: any, depth: number = 0): void {
    if (depth > 10) {
      throw new ValidationError('Object nesting too deep');
    }

    const keys = Object.keys(obj);
    if (keys.length > 100) {
      throw new ValidationError('Too many properties in object');
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof key === 'string' && this.validationService.detectSuspiciousInput(key)) {
        throw new ValidationError(`Suspicious property name: ${key}`);
      }

      if (typeof value === 'string') {
        if (this.validationService.detectSuspiciousInput(value)) {
          throw new ValidationError(`Suspicious content in property '${key}'`);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.validateObjectSecurity(value, depth + 1);
      }
    }
  }

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: any, depth: number = 0): any {
    if (depth > 10) {
      return obj; // Prevent infinite recursion
    }

    if (typeof obj === 'string') {
      return this.validationService.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, depth + 1));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.validationService.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value, depth + 1);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate API version
   */
  validateApiVersion(supportedVersions: string[] = ['v1']) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const apiVersionHeader = request.headers['api-version'];
      const apiVersion = Array.isArray(apiVersionHeader) ? apiVersionHeader[0] : (apiVersionHeader || 'v1');
      
      if (!supportedVersions.includes(apiVersion)) {
        reply.code(400).send({
          error: 'Unsupported API Version',
          message: `API version '${apiVersion}' is not supported. Supported versions: ${supportedVersions.join(', ')}`,
        });
        return;
      }

      // Add API version to request
      (request as any).apiVersion = apiVersion;
    };
  }

  /**
   * Validate request origin (CORS)
   */
  validateOrigin(allowedOrigins: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const origin = request.headers.origin;
      
      if (origin && !allowedOrigins.includes(origin)) {
        reply.code(403).send({
          error: 'Forbidden Origin',
          message: 'Request from this origin is not allowed',
        });
        return;
      }
    };
  }

  /**
   * Honeypot validation (detect bots)
   */
  validateHoneypot() {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const body = request.body as any;
      
      // Check for honeypot field (should be empty)
      if (body && body.honeypot && body.honeypot.trim() !== '') {
        // Likely a bot, but don't reveal the detection
        reply.code(200).send({ success: true });
        return;
      }

      // Remove honeypot field from body
      if (body && body.honeypot !== undefined) {
        delete body.honeypot;
      }
    };
  }

  /**
   * Validate request timing (detect automated requests)
   */
  validateRequestTiming() {
    const requestTimes = new Map<string, number>();

    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const clientIP = this.getClientIP(request);
      const now = Date.now();
      const lastRequest = requestTimes.get(clientIP);

      if (lastRequest && (now - lastRequest) < 100) {
        // Requests too fast, likely automated
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Requests are being sent too quickly',
        });
        return;
      }

      requestTimes.set(clientIP, now);

      // Clean up old entries
      setTimeout(() => {
        requestTimes.delete(clientIP);
      }, 60000); // Clean up after 1 minute
    };
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
   * Fastify plugin for registering validation middleware
   */
  registerPlugin() {
    return async (fastify: any) => {
      // Register validation decorators
      fastify.decorate('validateRequest', this.validateRequest.bind(this));
      fastify.decorate('validateJsonInput', this.validateJsonInput.bind(this));
      fastify.decorate('validateFileUpload', this.validateFileUpload.bind(this));
      fastify.decorate('validatePagination', this.validatePagination.bind(this));
      fastify.decorate('validateSearchQuery', this.validateSearchQuery.bind(this));
      fastify.decorate('validateApiVersion', this.validateApiVersion.bind(this));
      fastify.decorate('validateOrigin', this.validateOrigin.bind(this));
      fastify.decorate('validateHoneypot', this.validateHoneypot.bind(this));
      fastify.decorate('validateRequestTiming', this.validateRequestTiming.bind(this));

      // Global request validation
      fastify.addHook('preHandler', this.validateRequest.bind(this));
    };
  }
}

// Export singleton instance
export const validationMiddleware = new ValidationMiddleware();