# Contributing to A2N

Thank you for your interest in contributing to A2N! This document provides guidelines and information for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Node Development](#node-development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different opinions and approaches
- Report unacceptable behavior to maintainers

## Getting Started

### Ways to Contribute

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new functionality
- 🔧 **Code Contributions**: Fix bugs or implement features
- 📚 **Documentation**: Improve guides and API docs
- 🧪 **Testing**: Write tests or test new features
- 🎨 **Design**: Improve UI/UX and user experience
- 🌐 **Translations**: Help make A2N accessible globally
- 🔌 **Node Development**: Create new integration nodes

### Before You Start

1. Check existing [issues](https://github.com/a2n-io/a2n/issues) and [pull requests](https://github.com/a2n-io/a2n/pulls)
2. Join our [Discord](https://discord.gg/a2n) or [Forum](https://community.a2n.io) for discussions
3. Read through this contributing guide
4. Set up your development environment

## Development Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git
- Code editor (VS Code recommended)

### Local Development

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/a2n.git
   cd a2n
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install package dependencies
   npm run bootstrap
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp packages/cli/.env.example packages/cli/.env
   
   # Edit configuration as needed
   nano packages/cli/.env
   ```

4. **Start Development Servers**
   ```bash
   # Start backend API server
   npm run dev:backend
   
   # In another terminal, start frontend dev server
   npm run dev:frontend
   
   # Or start both with one command
   npm run dev
   ```

5. **Access A2N**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5678
   - Swagger docs: http://localhost:5678/docs

### Project Structure

```
a2n/
├── packages/
│   ├── cli/                 # Main A2N application
│   │   ├── src/
│   │   │   ├── api/         # Express.js API routes
│   │   │   ├── database/    # Database models and migrations
│   │   │   ├── nodes/       # Built-in node definitions
│   │   │   └── workflows/   # Workflow execution engine
│   │   └── frontend/
│   │       ├── src/
│   │       │   ├── components/  # React components
│   │       │   ├── stores/      # Zustand stores
│   │       │   ├── pages/       # Route components
│   │       │   └── utils/       # Utility functions
│   ├── core/               # Core utilities and types
│   ├── nodes-base/         # Standard node library
│   └── workflow/           # Workflow execution logic
├── docs/                   # Documentation
├── docker/                 # Docker configurations
└── scripts/                # Build and utility scripts
```

### Development Commands

```bash
# Development
npm run dev              # Start full development environment
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
npm run dev:watch        # Watch mode with auto-restart

# Building
npm run build            # Build all packages
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:watch       # Watch mode

# Linting and Formatting
npm run lint             # ESLint check
npm run lint:fix         # Fix ESLint issues
npm run format           # Prettier formatting
npm run typecheck        # TypeScript type checking

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed test data
npm run db:reset         # Reset database
```

## Contributing Guidelines

### Issue Guidelines

#### Bug Reports
Use the bug report template and include:
- A2N version
- Operating system and Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or logs if applicable
- Minimal reproduction example

#### Feature Requests
Use the feature request template and include:
- Clear problem statement
- Proposed solution
- Alternative solutions considered
- Impact on existing functionality
- Mockups or examples if applicable

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Check code style
npm run lint

# Fix formatting issues
npm run lint:fix
npm run format
```

**Key Guidelines:**
- Use TypeScript for all new code
- Follow existing naming conventions
- Write descriptive commit messages
- Add JSDoc comments for public APIs
- Prefer functional programming patterns
- Use async/await over promises
- Handle errors explicitly

### Commit Convention

We use conventional commits for clear history:

```bash
# Format: <type>(<scope>): <description>
feat(nodes): add Slack integration node
fix(editor): resolve connection rendering issue
docs(api): update webhook documentation
test(workflow): add execution engine tests
refactor(ui): simplify workflow canvas component
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions or modifications
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

## Pull Request Process

### Before Submitting

1. **Branch Strategy**
   ```bash
   # Create feature branch from main
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Development Process**
   - Write code following our style guidelines
   - Add or update tests for your changes
   - Update documentation if needed
   - Test your changes thoroughly

3. **Pre-submission Checklist**
   - [ ] Code compiles without errors
   - [ ] All tests pass (`npm test`)
   - [ ] Linting passes (`npm run lint`)
   - [ ] Types check correctly (`npm run typecheck`)
   - [ ] Documentation is updated
   - [ ] CHANGELOG.md is updated for notable changes

### Submitting Pull Request

1. **Push Changes**
   ```bash
   git add .
   git commit -m "feat(scope): descriptive message"
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Use the PR template
   - Include clear title and description
   - Link related issues with "Closes #123"
   - Add screenshots for UI changes
   - Request review from maintainers

3. **Review Process**
   - Maintainers will review your PR
   - Address feedback and requested changes
   - Keep discussion respectful and constructive
   - Be patient during the review process

### After Approval

- Squash commits if requested
- Ensure CI passes
- Maintainer will merge your PR
- Delete your feature branch after merge

## Node Development

### Creating Custom Nodes

A2N supports custom integration nodes. Here's how to create one:

1. **Node Structure**
   ```typescript
   // packages/nodes-base/nodes/MyService/MyService.node.ts
   import { INodeType, INodeTypeDescription, IExecuteFunctions } from 'a2n-workflow';
   
   export class MyServiceNode implements INodeType {
     description: INodeTypeDescription = {
       displayName: 'My Service',
       name: 'myService',
       group: ['transform'],
       version: 1,
       description: 'Interact with My Service API',
       defaults: {
         name: 'My Service',
       },
       inputs: ['main'],
       outputs: ['main'],
       credentials: [
         {
           name: 'myServiceApi',
           required: true,
         },
       ],
       properties: [
         {
           displayName: 'Operation',
           name: 'operation',
           type: 'options',
           options: [
             {
               name: 'Get User',
               value: 'getUser',
               action: 'Get user data',
             },
           ],
           default: 'getUser',
         },
       ],
     };
   
     async execute(this: IExecuteFunctions) {
       // Node implementation
       const operation = this.getNodeParameter('operation', 0) as string;
       const credentials = await this.getCredentials('myServiceApi');
       
       // Your logic here
       return [this.helpers.returnJsonArray([{ success: true }])];
     }
   }
   ```

2. **Credential Definition**
   ```typescript
   // packages/nodes-base/credentials/MyServiceApi.credentials.ts
   export class MyServiceApi implements ICredentialType {
     name = 'myServiceApi';
     displayName = 'My Service API';
     properties = [
       {
         displayName: 'API Key',
         name: 'apiKey',
         type: 'string',
         typeOptions: { password: true },
         default: '',
       },
     ];
   }
   ```

3. **Testing Your Node**
   ```typescript
   // packages/nodes-base/test/nodes/MyService.test.ts
   import { testWorkflows } from '../utils';
   
   describe('MyService Node', () => {
     const workflows = ['MyService_workflow.json'];
     testWorkflows(workflows);
   });
   ```

### Node Guidelines

- **Naming**: Use PascalCase for node names
- **Icons**: Provide SVG icons (preferably brand icons)
- **Documentation**: Include comprehensive parameter descriptions
- **Error Handling**: Implement proper error messages
- **Testing**: Write unit and integration tests
- **Performance**: Handle large datasets efficiently

## Testing

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/            # End-to-end tests
├── fixtures/       # Test data and fixtures
└── utils/          # Test utilities
```

### Writing Tests

**Unit Tests (Jest)**
```typescript
import { WorkflowEngine } from '../src/WorkflowEngine';

describe('WorkflowEngine', () => {
  it('should execute simple workflow', async () => {
    const engine = new WorkflowEngine();
    const result = await engine.execute(simpleWorkflow);
    
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(expectedOutput);
  });
});
```

**Integration Tests**
```typescript
import request from 'supertest';
import { app } from '../src/app';

describe('/api/workflows', () => {
  it('should create new workflow', async () => {
    const response = await request(app)
      .post('/api/v1/workflows')
      .send(workflowData)
      .expect(201);
      
    expect(response.body.id).toBeDefined();
  });
});
```

**E2E Tests (Playwright)**
```typescript
import { test, expect } from '@playwright/test';

test('create and execute workflow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('[data-test="new-workflow"]');
  
  // Add nodes and connections
  // ...
  
  await page.click('[data-test="execute-workflow"]');
  await expect(page.locator('[data-test="success-message"]')).toBeVisible();
});
```

## Documentation

### Types of Documentation

- **API Documentation**: OpenAPI/Swagger specs
- **User Guides**: Step-by-step tutorials
- **Developer Docs**: Technical implementation details
- **Node Documentation**: Node-specific usage guides

### Documentation Guidelines

- Write in clear, concise English
- Use examples and code snippets
- Include screenshots for UI features
- Keep documentation up-to-date with code changes
- Follow the existing documentation structure

### Building Documentation

```bash
# Generate API documentation
npm run docs:api

# Build user documentation
npm run docs:build

# Serve documentation locally
npm run docs:dev
```

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Real-time chat with the community
- **Forum**: Structured discussions and support
- **Stack Overflow**: Tag questions with `a2n`

### Communication Guidelines

- Search existing discussions before posting
- Use clear, descriptive titles
- Provide context and examples
- Be patient and respectful
- Help others when you can

### Recognition

Contributors are recognized through:
- GitHub contributor list
- Release notes mentions
- Community spotlight features
- Maintainer program for active contributors

## Release Process

### Versioning

We follow semantic versioning (semver):
- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### Release Schedule

- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed for critical fixes
- **Pre-releases**: Beta versions before major releases

### Changelog

All notable changes are documented in [CHANGELOG.md](CHANGELOG.md):
- Follow Keep a Changelog format
- Include migration guides for breaking changes
- Credit contributors for their work

---

Thank you for contributing to A2N! Your efforts help make workflow automation accessible to everyone. 🚀

For questions about contributing, reach out to the maintainers or join our community discussions.