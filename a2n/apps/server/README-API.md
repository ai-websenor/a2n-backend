# A2N Backend API Documentation

## Overview

This directory contains the OpenAPI 3.0 specification for the A2N Backend API. The API is built using ORPC (Object RPC) framework with Fastify server, providing comprehensive authentication, user management, and session management capabilities.

## Files

- `openapi.yaml` - Complete OpenAPI 3.0 specification
- `README-API.md` - This documentation file

## Using with Postman

### Import the OpenAPI Specification

1. **Open Postman**
2. **Click Import** (top left)
3. **Select "Link" tab**
4. **Enter file path or URL**: `file:///Users/deepaktiwari/websenor-workspace/A2N/a2n/apps/server/openapi.yaml`
5. **Click Continue** and then **Import**

Alternatively, you can:
1. **Drag and drop** the `openapi.yaml` file into Postman
2. **Copy the file contents** and paste into Postman's import dialog

### Environment Setup

Create a Postman environment with these variables:

```
base_url: http://localhost:3000 (or your server URL)
access_token: (will be set after authentication)
refresh_token: (will be set after authentication)
user_id: (will be set after authentication)
```

### Authentication Flow

1. **Sign Up** (`POST /auth/signup`)
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com", 
     "password": "SecurePass123",
     "confirmPassword": "SecurePass123"
   }
   ```

2. **Sign In** (`POST /auth/signin`)
   ```json
   {
     "email": "john@example.com",
     "password": "SecurePass123",
     "rememberMe": false
   }
   ```
   
   **Save the response tokens**:
   - Copy `accessToken` to `{{access_token}}` environment variable
   - Copy `refreshToken` to `{{refresh_token}}` environment variable
   - Copy `user.id` to `{{user_id}}` environment variable

3. **Set Authorization Header**
   - Go to the **Authorization** tab in Postman
   - Select **Bearer Token** type
   - Enter: `{{access_token}}`

### API Endpoints Overview

#### Authentication Endpoints
- `POST /auth/signin` - Sign in user
- `POST /auth/signup` - Register new user  
- `POST /auth/signout` - Sign out user
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/reset-password-request` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)
- `POST /auth/verify-email` - Verify email address
- `POST /auth/setup-two-factor` - Setup 2FA

#### User Management Endpoints
- `GET /user/profile` - Get current user profile
- `PUT /user/profile` - Update current user profile
- `GET /user/profile/{userId}` - Get user by ID (admin)
- `GET /user/stats` - Get user statistics
- `PUT /user/role` - Update user role (admin)
- `GET /user/search` - Search users (admin)
- `POST /user/{userId}/deactivate` - Deactivate user (admin)
- `GET /user/email-exists` - Check if email exists

#### Session Management Endpoints
- `GET /session/current` - Get current session
- `GET /session/list` - Get all user sessions
- `DELETE /session/{sessionId}` - Revoke specific session
- `POST /session/revoke-others` - Revoke other sessions
- `GET /session/stats` - Get session statistics
- `GET /session/refresh-tokens` - Get refresh tokens
- `DELETE /session/refresh-tokens/{tokenId}` - Revoke refresh token

### Sample API Testing Workflow

1. **Health Check**
   ```
   GET {{base_url}}/health
   ```

2. **Create Account**
   ```
   POST {{base_url}}/auth/signup
   ```

3. **Sign In**
   ```
   POST {{base_url}}/auth/signin
   ```

4. **Get Profile** (with Bearer token)
   ```
   GET {{base_url}}/user/profile
   Authorization: Bearer {{access_token}}
   ```

5. **Update Profile**
   ```
   PUT {{base_url}}/user/profile
   Authorization: Bearer {{access_token}}
   ```

6. **Get Sessions**
   ```
   GET {{base_url}}/session/list
   Authorization: Bearer {{access_token}}
   ```

### Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common error codes:
- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict (e.g., email exists)

### Security

The API supports two authentication methods:

1. **Bearer Token (JWT)**
   - Add `Authorization: Bearer <token>` header
   - Recommended for API clients

2. **Session Cookies**
   - Automatically handled by browsers
   - Used for web application

### Rate Limiting

API endpoints have rate limiting protection. If you receive a `429` error, wait before making additional requests.

### Development Server

To start the development server:

```bash
cd /Users/deepaktiwari/websenor-workspace/A2N/a2n/apps/server
npm run dev
```

The API will be available at `http://localhost:3000`

### Additional Tools

You can also use this OpenAPI specification with:

- **Swagger UI** - Load the YAML file for interactive documentation
- **Insomnia** - Import the OpenAPI specification
- **Thunder Client** (VS Code) - Import as collection
- **curl** - Generate commands from the specification

### Support

For questions about the API:
1. Check the OpenAPI specification for detailed schema information
2. Review the ORPC router configuration in `src/routers/index.ts`
3. Examine controller implementations in `src/controllers/`

## ORPC to REST Mapping

This OpenAPI specification maps ORPC procedures to RESTful endpoints:

| ORPC Procedure | REST Endpoint |
|----------------|---------------|
| `appRouter.auth.signIn` | `POST /auth/signin` |
| `appRouter.auth.signUp` | `POST /auth/signup` |
| `appRouter.user.getProfile` | `GET /user/profile` |
| `appRouter.session.getCurrentSession` | `GET /session/current` |

The specification maintains full compatibility with the existing ORPC type-safe architecture while providing standard REST endpoints for testing tools.