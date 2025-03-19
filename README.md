# Document Management System API

[![Backend Tests](https://github.com/chocnut/v/actions/workflows/backend-test.yml/badge.svg)](https://github.com/chocnut/v/actions/workflows/backend-test.yml)

A RESTful API for managing documents and folders in a document management system.

## Setup and Development

### Prerequisites

- Node.js 20.x
- pnpm 8.15.4
- Docker and Docker Compose (for local development)

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server with Docker
pnpm docker:dev

# Run database migrations
pnpm docker:db:migrate

# Seed the database with initial data
pnpm docker:db:seed
```

### Code Quality

```bash
# Run eslint
pnpm lint

# Fix eslint issues
pnpm lint:fix

# Format code with prettier
pnpm format

# Type check the project
pnpm typecheck
```

### Testing

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Swagger Documentation

```bash
# Generate Swagger documentation
pnpm swagger:generate

# Type check and generate Swagger docs
pnpm swagger:check
```

The Swagger UI is available at `/api-docs` when the server is running.

## API Endpoints

- `GET /health` - Health check
- `GET /api/files` - List files and folders
- `GET /api/folders` - List folders
- `GET /api/documents` - List documents

## Docker

The project includes Docker configuration for development:

- `Dockerfile.dev` - Development Dockerfile
- `docker-compose.dev.yml` - Docker Compose configuration for development

### Docker Commands

```bash
# Start the containers
pnpm docker:dev

# Run database migrations in Docker
pnpm docker:db:migrate

# Seed the database in Docker
pnpm docker:db:seed
```
