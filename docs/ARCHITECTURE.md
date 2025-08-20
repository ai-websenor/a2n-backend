# A2N System Architecture

## Overview

A2N follows a modern, enterprise-grade architecture built on NestJS for the backend and React for the frontend. The system is designed for simplicity, maintainability, and cloud-native deployment while maintaining powerful automation capabilities.

## High-Level Architecture

```
                    ┌─────────────────┐
                    │   Web Client    │
                    │   (React SPA)   │
                    │   Vite + TS     │
                    └─────────────────┘
                             │
                        HTTPS/REST
                             │
                    ┌─────────────────┐
                    │  NestJS Backend │
                    │   (TypeScript)  │
                    └─────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ Workflow Module │ │   Node Module   │ │   Auth Module   │
    │   (Service)     │ │   (Registry)    │ │   (Guard)       │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌─────────────────┐
                    │   NeonDB        │
                    │  (PostgreSQL)   │
                    │   Serverless    │
                    └─────────────────┘
```

## Technology Stack

### Backend Technologies
- **Runtime**: Node.js (v20+)
- **Framework**: NestJS for enterprise-grade API architecture
- **Language**: TypeScript with strict mode enabled
- **Database**: NeonDB (Serverless PostgreSQL)
- **ORM**: Prisma ORM for type-safe database operations
- **Authentication**: NestJS Passport + JWT with refresh tokens
- **Validation**: Class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI with NestJS
- **Testing**: Jest + Supertest for API testing
- **Caching**: Built-in NestJS cache manager
- **Logging**: NestJS Logger with structured logging

### Frontend Technologies
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and HMR
- **State Management**: Zustand for lightweight state management
- **UI Library**: Tailwind CSS + Shadcn/ui components
- **Charts**: Recharts for execution visualization
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: React Query + Axios for data fetching
- **Testing**: Vitest + React Testing Library
- **PWA**: Vite PWA plugin for offline capabilities

### Cloud & Infrastructure
- **Database**: NeonDB (Serverless PostgreSQL with auto-scaling)
- **Deployment**: Vercel/Netlify for frontend, Railway/Render for backend
- **CDN**: Vercel Edge Network for static assets
- **Monitoring**: Built-in NestJS metrics + external monitoring
- **File Storage**: Cloud storage (Cloudinary/AWS S3) for assets
- **Environment**: Environment-based configuration management

## NestJS Architecture

### Module Structure

A2N follows NestJS modular architecture with clear separation of concerns:

```typescript
// Core Modules
@Module({
  imports: [
    AuthModule,
    WorkflowModule,
    NodeModule,
    ExecutionModule,
    CredentialsModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### 1. Workflow Module

Handles workflow management and execution orchestration.

```typescript
@Injectable()
export class WorkflowService {
  async create(createWorkflowDto: CreateWorkflowDto): Promise<Workflow>
  async execute(id: string, triggerData?: any): Promise<ExecutionResult>
  async validate(workflow: Workflow): Promise<ValidationResult>
  async pause(executionId: string): Promise<void>
  async resume(executionId: string): Promise<void>
  async cancel(executionId: string): Promise<void>
}

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}
  
  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createWorkflowDto: CreateWorkflowDto) {
    return this.workflowService.create(createWorkflowDto);
  }
  
  @Post(':id/execute')
  execute(@Param('id') id: string, @Body() triggerData: any) {
    return this.workflowService.execute(id, triggerData);
  }
}
```

### 2. Node Module

Manages node registry, validation, and execution.

```typescript
@Injectable()
export class NodeService {
  async getAvailableNodes(): Promise<NodeDefinition[]>
  async validateNodeConfig(nodeType: string, config: any): Promise<ValidationResult>
  async executeNode(nodeType: string, input: NodeInput, context: ExecutionContext): Promise<NodeOutput>
}

// Base Node Interface
export abstract class BaseNode {
  abstract readonly type: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly inputs: NodeInput[];
  abstract readonly outputs: NodeOutput[];
  
  abstract execute(context: ExecutionContext): Promise<NodeExecutionResult>;
  abstract validate(config: NodeConfig): ValidationResult;
}
```

### 3. Execution Module

Handles workflow execution tracking and monitoring.

```typescript
@Injectable()
export class ExecutionService {
  async startExecution(workflowId: string, triggerData: any): Promise<Execution>
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus>
  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]>
  async stopExecution(executionId: string): Promise<void>
}

@WebSocketGateway()
export class ExecutionGateway {
  @WebSocketServer()
  server: Server;
  
  // Real-time execution updates
  broadcastExecutionUpdate(executionId: string, status: ExecutionStatus) {
    this.server.emit('execution:update', { executionId, status });
  }
}
```

## Database Schema (Prisma + NeonDB)

### Core Entities

```prisma
// User Management
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  workflows   Workflow[]
  credentials Credential[]
}

// Workflow Definition
model Workflow {
  id          String   @id @default(cuid())
  name        String
  description String?
  definition  Json     // Workflow graph as JSON
  isActive    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  userId     String
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  executions Execution[]
  
  @@map("workflows")
}

// Execution Tracking
model Execution {
  id        String          @id @default(cuid())
  status    ExecutionStatus @default(PENDING)
  startTime DateTime        @default(now())
  endTime   DateTime?
  data      Json?           // Execution context and results
  error     String?
  
  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  
  logs ExecutionLog[]
  
  @@map("executions")
}

// Execution Logging
model ExecutionLog {
  id          String   @id @default(cuid())
  nodeId      String
  level       LogLevel
  message     String
  timestamp   DateTime @default(now())
  
  executionId String
  execution   Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)
  
  @@map("execution_logs")
}

// Encrypted Credentials
model Credential {
  id           String   @id @default(cuid())
  name         String
  type         String
  encryptedData String  // AES-256 encrypted credential data
  createdAt    DateTime @default(now())
  
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("credentials")
}

enum ExecutionStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  CANCELLED
  PAUSED
}

enum LogLevel {
  DEBUG
  INFO
  WARN
  ERROR
}
```

## API Structure (NestJS Controllers)

### RESTful API with OpenAPI Documentation

```typescript
// Authentication Endpoints
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 201, type: LoginResponseDto })
  login(@Body() loginDto: LoginDto) { }
  
  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  register(@Body() registerDto: RegisterDto) { }
  
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() refreshDto: RefreshTokenDto) { }
}

// Workflow Management
@Controller('workflows')
@ApiTags('Workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  @Get()
  @ApiOperation({ summary: 'Get user workflows' })
  findAll(@Req() req: AuthenticatedRequest) { }
  
  @Post()
  @ApiOperation({ summary: 'Create new workflow' })
  @ApiBody({ type: CreateWorkflowDto })
  create(@Body() createWorkflowDto: CreateWorkflowDto, @Req() req: AuthenticatedRequest) { }
  
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) { }
  
  @Put(':id')
  @ApiOperation({ summary: 'Update workflow' })
  update(@Param('id') id: string, @Body() updateWorkflowDto: UpdateWorkflowDto) { }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflow' })
  remove(@Param('id') id: string) { }
  
  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute workflow' })
  execute(@Param('id') id: string, @Body() triggerData?: any) { }
}

// Execution Monitoring
@Controller('executions')
@ApiTags('Executions')
@UseGuards(JwtAuthGuard)
export class ExecutionController {
  @Get()
  @ApiOperation({ summary: 'Get execution history' })
  @ApiQuery({ name: 'workflowId', required: false })
  findAll(@Query() query: GetExecutionsDto, @Req() req: AuthenticatedRequest) { }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get execution details' })
  findOne(@Param('id') id: string) { }
  
  @Get(':id/logs')
  @ApiOperation({ summary: 'Get execution logs' })
  getLogs(@Param('id') id: string) { }
  
  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop execution' })
  stop(@Param('id') id: string) { }
}

// Node Registry
@Controller('nodes')
@ApiTags('Nodes')
export class NodeController {
  @Get()
  @ApiOperation({ summary: 'Get available node types' })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('category') category?: string) { }
  
  @Get(':type')
  @ApiOperation({ summary: 'Get node definition' })
  findOne(@Param('type') type: string) { }
  
  @Post(':type/validate')
  @ApiOperation({ summary: 'Validate node configuration' })
  validate(@Param('type') type: string, @Body() config: any) { }
}
```

## Security Architecture

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access (Admin, User - simplified for individual use)
- API key authentication for external integrations
- Rate limiting and request throttling

### Data Security
- Credential encryption using AES-256
- Environment variable management
- Input validation and sanitization
- SQL injection prevention through ORM

### Network Security
- HTTPS enforcement in production
- CORS configuration
- Request size limits
- IP whitelisting (optional)

## Cloud Deployment Architecture

### Frontend Deployment (Vercel/Netlify)

```typescript
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://api.a2n.app",
    "VITE_WS_URL": "wss://api.a2n.app"
  }
}

// Environment Configuration
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    wsUrl: 'ws://localhost:3001'
  },
  production: {
    apiUrl: process.env.VITE_API_URL,
    wsUrl: process.env.VITE_WS_URL
  }
}
```

### Backend Deployment (Railway/Render)

```typescript
// NestJS Configuration
@Injectable()
export class ConfigService {
  get databaseUrl(): string {
    return process.env.DATABASE_URL; // NeonDB connection string
  }
  
  get jwtSecret(): string {
    return process.env.JWT_SECRET;
  }
  
  get port(): number {
    return parseInt(process.env.PORT) || 3001;
  }
}

// Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@neon.tech/a2n
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
REDIS_URL=optional-redis-connection
```

### NeonDB Configuration

```typescript
// Prisma Configuration for NeonDB
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations on Neon
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

// NeonDB optimized connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
})
```

## Performance & Scalability

### NeonDB Optimization
- **Serverless Auto-scaling**: Automatic scaling based on demand
- **Connection Pooling**: Built-in connection pooling with Prisma
- **Read Replicas**: Separate read/write operations for better performance
- **Branch Databases**: Separate databases for development/staging

```typescript
// Prisma with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?pgbouncer=true&connection_limit=1"
    }
  }
});
```

### Frontend Performance
- **Code Splitting**: Lazy-loaded routes and components
- **Bundle Optimization**: Tree-shaking with Vite
- **Caching**: React Query for intelligent data caching
- **PWA**: Offline capabilities with service workers

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### Backend Optimization
- **NestJS Caching**: Built-in cache manager for frequent queries
- **Queue Processing**: Bull.js for background job processing
- **Rate Limiting**: Throttling to prevent abuse
- **WebSocket Optimization**: Efficient real-time updates

```typescript
@Injectable()
export class WorkflowService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  
  @Cacheable('workflows', 300) // 5 minutes cache
  async getWorkflow(id: string): Promise<Workflow> {
    return this.prisma.workflow.findUnique({ where: { id } });
  }
}
```

## Data Flow

### Workflow Execution Flow
1. **Trigger**: External event or manual trigger
2. **Validation**: Workflow and node parameter validation
3. **Initialization**: Execution context setup
4. **Processing**: Sequential/parallel node execution
5. **Logging**: Real-time execution logging
6. **Completion**: Result storage and cleanup

### Data Transformation Pipeline
```
Input Data → Validation → Transformation → Node Execution → Output Processing → Storage
```

## Extension Points

### Custom Node Development
- TypeScript-based node SDK
- Hot-reloading during development
- Node marketplace integration
- Version management for custom nodes

### Plugin Architecture
- Hook system for extending core functionality
- Event-driven plugin communication
- Plugin dependency management
- Sandboxed plugin execution

## Migration & Backup

### Data Migration
- Database schema versioning
- Automated migration scripts
- Rollback capabilities
- Data integrity checks

### Backup Strategy
- Automated database backups
- Workflow definition exports
- Credential backup (encrypted)
- Configuration backup

---

*This architecture document will evolve as the project grows and new requirements emerge.*