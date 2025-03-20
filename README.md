# Document Management System API

![Tests](https://github.com/chocnut/v/actions/workflows/backend-test.yml/badge.svg)

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

The API documentation is available through Swagger UI at `/api-docs` when the server is running. This provides an interactive interface to explore and test all API endpoints.

```bash
# Generate Swagger documentation
pnpm swagger:generate

# Type check and generate Swagger docs
pnpm swagger:check
```

## API Endpoints

### System
- `GET /health` - Health check endpoint
- `GET /api-docs` - Interactive API documentation (Swagger UI)

### Files
- `GET /api/files` - List all files and folders
  - Query Parameters:
    - `folder_id` (optional): Filter by folder ID
    - `page` (default: 1): Page number
    - `limit` (default: 10, max: 100): Items per page
    - `sort` (name|type|size|created_at): Sort field
    - `order` (asc|desc): Sort order
    - `search`: Search term for file names

### Folders
- `GET /api/folders` - List all folders
  - Query Parameters:
    - `parent_id` (optional): Filter by parent folder ID
- `GET /api/folders/:id` - Get folder by ID
- `GET /api/folders/:id/path` - Get folder path from root
- `POST /api/folders` - Create a new folder
  - Body:
    ```json
    {
      "name": "string",
      "parent_id": "number|null",
      "created_by": "string"
    }
    ```
- `PUT /api/folders/:id` - Update a folder
  - Body:
    ```json
    {
      "name": "string",
      "parent_id": "number|null"
    }
    ```
- `DELETE /api/folders/:id` - Delete a folder and its contents

### Documents
- `GET /api/documents` - List all documents
  - Query Parameters:
    - `folder_id` (optional): Filter by folder ID
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Create a new document
  - Body:
    ```json
    {
      "name": "string",
      "type": "string",
      "size": "number",
      "folder_id": "number|null",
      "created_by": "string"
    }
    ```
- `PUT /api/documents/:id` - Update a document
  - Body:
    ```json
    {
      "name": "string",
      "folder_id": "number|null"
    }
    ```
- `DELETE /api/documents/:id` - Delete a document

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
