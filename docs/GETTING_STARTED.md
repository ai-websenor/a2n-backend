# Getting Started with A2N

Welcome to A2N! This guide will help you get up and running with your own workflow automation platform in minutes.

## Quick Start

### Prerequisites

Before installing A2N, ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **npm** or **yarn**: Package manager
- **Git**: For cloning the repository
- **Docker** (optional): For containerized deployment

### Installation Methods

#### Option 1: Docker (Recommended)

The fastest way to get A2N running is using Docker:

```bash
# Pull the latest A2N image
docker pull a2n/a2n:latest

# Run A2N with default settings
docker run -d \
  --name a2n \
  -p 5678:5678 \
  -v a2n_data:/app/.a2n \
  a2n/a2n:latest

# Access A2N at http://localhost:5678
```

#### Option 2: Docker Compose (Production)

For production deployments with PostgreSQL:

```bash
# Download docker-compose.yml
curl -O https://raw.githubusercontent.com/a2n-io/a2n/main/docker-compose.yml

# Start A2N with all services
docker-compose up -d

# Access A2N at http://localhost:5678
```

#### Option 3: Manual Installation

For development or custom setups:

```bash
# Clone the repository
git clone https://github.com/a2n-io/a2n.git
cd a2n

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build the application
npm run build

# Start A2N
npm start

# Access A2N at http://localhost:5678
```

### First Setup

1. **Open A2N**: Navigate to `http://localhost:5678` in your browser
2. **Create Admin Account**: Set up your first user account
3. **Configure Settings**: Adjust basic settings like timezone and preferences
4. **Verify Installation**: Check that all services are running properly

## Your First Workflow

Let's create a simple workflow to get familiar with A2N:

### Example: Daily Weather Notification

This workflow will send you a daily weather update via email.

#### Step 1: Create New Workflow

1. Click **"New Workflow"** in the dashboard
2. Name it "Daily Weather Alert"
3. Add a description: "Get daily weather updates via email"

#### Step 2: Add Trigger Node

1. Search for **"Schedule Trigger"** in the node panel
2. Drag it to the canvas
3. Configure it to run daily at 8:00 AM:
   ```
   Cron Expression: 0 8 * * *
   Timezone: Your local timezone
   ```

#### Step 3: Add Weather API Node

1. Add an **"HTTP Request"** node
2. Connect it to the Schedule Trigger
3. Configure the weather API call:
   ```
   Method: GET
   URL: https://api.openweathermap.org/data/2.5/weather
   Parameters:
     - q: Your City Name
     - appid: YOUR_API_KEY
     - units: metric
   ```

#### Step 4: Transform Data

1. Add a **"Set"** node to format the weather data
2. Connect it to the HTTP Request node
3. Set variables:
   ```javascript
   {
     "temperature": "{{$json.main.temp}}°C",
     "description": "{{$json.weather[0].description}}",
     "city": "{{$json.name}}",
     "humidity": "{{$json.main.humidity}}%"
   }
   ```

#### Step 5: Send Email

1. Add an **"Send Email"** node
2. Configure your email settings:
   ```
   To: your-email@example.com
   Subject: Daily Weather Update for {{$node["Set"].json["city"]}}
   
   Body:
   Good morning!
   
   Today's weather in {{$node["Set"].json["city"]}}:
   - Temperature: {{$node["Set"].json["temperature"]}}
   - Conditions: {{$node["Set"].json["description"]}}
   - Humidity: {{$node["Set"].json["humidity"]}}
   
   Have a great day!
   ```

#### Step 6: Test and Activate

1. Click **"Execute Workflow"** to test
2. Check the execution results
3. If successful, click **"Activate"** to enable the schedule
4. Your workflow will now run automatically every day at 8 AM

## Core Concepts

### Workflows
A workflow is a series of connected nodes that automate a process. Each workflow has:
- **Trigger**: What starts the workflow (schedule, webhook, manual)
- **Nodes**: Steps that process data or perform actions
- **Connections**: Links between nodes that pass data

### Nodes
Nodes are the building blocks of workflows:
- **Trigger Nodes**: Start workflows (Schedule, Webhook, Manual)
- **Action Nodes**: Perform operations (HTTP Request, Email, Database)
- **Logic Nodes**: Control flow (If, Switch, Merge)
- **Transform Nodes**: Modify data (Set, Code, Function)

### Data Flow
Data flows between nodes as JSON objects:
```javascript
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "timestamp": "2025-08-12T10:30:00Z"
}
```

### Expressions
Use expressions to access and manipulate data:
- `{{$json.fieldName}}` - Access JSON field from previous node
- `{{$node["NodeName"].json.field}}` - Access specific node data
- `{{DateTime.now()}}` - Current timestamp
- `{{$workflow.id}}` - Current workflow ID

## Common Workflows

### 1. Social Media Automation
```
Schedule Trigger → Generate Content → Post to Twitter → Post to LinkedIn
```

### 2. Data Synchronization
```
Database Trigger → Transform Data → HTTP Request → Update Records
```

### 3. File Processing
```
File Monitor → Read File → Process Data → Save Results → Send Notification
```

### 4. Lead Management
```
Webhook → Validate Data → Add to CRM → Send Welcome Email → Notify Team
```

### 5. Monitoring & Alerts
```
Schedule → Check Service → Evaluate Status → Send Alert (if needed)
```

## Configuration

### Environment Variables

Key environment variables for A2N:

```bash
# Basic Configuration
A2N_HOST=localhost
A2N_PORT=5678
A2N_PROTOCOL=http

# Database
DATABASE_TYPE=sqlite
DATABASE_SQLITE_PATH=.a2n/database.sqlite

# For PostgreSQL
DATABASE_TYPE=postgresdb
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=a2n
DATABASE_USER=a2n
DATABASE_PASSWORD=password

# Security
A2N_JWT_SECRET=your-secret-key
A2N_ENCRYPTION_KEY=your-encryption-key

# File Storage
A2N_USER_FOLDER=.a2n
A2N_BINARY_DATA_MODE=filesystem
```

### Database Setup

#### SQLite (Default)
No additional setup required. Database file is created automatically.

#### PostgreSQL (Production)
```sql
-- Create database
CREATE DATABASE a2n;

-- Create user
CREATE USER a2n WITH PASSWORD 'your_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE a2n TO a2n;
```

### Reverse Proxy (Nginx)

For production deployments behind Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 5678
lsof -i :5678

# Kill the process
kill -9 <PID>
```

#### Permission Errors
```bash
# Fix file permissions
sudo chown -R $(whoami) ~/.a2n
chmod -R 755 ~/.a2n
```

#### Database Connection Issues
1. Verify database credentials in `.env`
2. Check database service is running
3. Test connection manually
4. Check firewall settings

#### Node Execution Errors
1. Check node configuration
2. Verify API credentials
3. Review execution logs
4. Test with minimal data

### Getting Help

- **Documentation**: Visit our comprehensive docs
- **Community Forum**: Ask questions and share solutions
- **GitHub Issues**: Report bugs and request features
- **Discord**: Join our community chat

### Logs and Debugging

#### Enable Debug Logging
```bash
# Set log level in environment
A2N_LOG_LEVEL=debug

# Or in docker-compose.yml
environment:
  - A2N_LOG_LEVEL=debug
```

#### View Logs
```bash
# Docker logs
docker logs a2n

# Manual installation logs
tail -f ~/.a2n/logs/a2n.log
```

## Next Steps

Now that you have A2N running:

1. **Explore Templates**: Browse workflow templates for inspiration
2. **Connect Services**: Set up credentials for your favorite tools
3. **Join Community**: Connect with other A2N users
4. **Read Documentation**: Dive deeper into advanced features
5. **Contribute**: Help improve A2N by contributing code or ideas

## Security Best Practices

- Use strong passwords and JWT secrets
- Enable HTTPS in production
- Regularly update A2N to the latest version
- Secure your credentials storage
- Monitor access logs
- Backup your workflows and data
- Use environment variables for sensitive data

---

**Need help?** Check our [troubleshooting guide](troubleshooting.md) or join our community forum for support!