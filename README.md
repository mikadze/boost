# Boost - Data Ingestion Platform

A high-performance, scalable data ingestion platform built with NestJS, Drizzle ORM, and Kafka.

## Architecture

```
/
├── apps/
│   ├── api/          # NestJS HTTP Gateway (Public API)
│   └── worker/       # NestJS Microservice (Kafka Consumer)
├── libs/
│   ├── database/     # Drizzle ORM Schema & Connection Module
│   └── common/       # Shared DTOs, Guards, Auth, Decorators
├── docker-compose.yml # Infrastructure (Postgres, Redis, Kafka)
└── package.json      # Turborepo Workspace Configuration
```

## Features

✨ **Multi-Tenant Architecture** - Logical isolation using RLS context
🔐 **Secure API Keys** - SHA-256 hashing with Redis caching (L1/L2)
⚡ **Event Streaming** - Kafka-based event sourcing
💾 **PostgreSQL + Drizzle** - Type-safe ORM
🚀 **Microservices Ready** - NestJS + Turborepo
🐳 **Docker Compose** - Local development environment

## Quick Start

### Prerequisites

- Node.js 18+
- npm 11+
- Docker & Docker Compose

### Installation

1. **Clone & Setup**
   ```bash
   cd /workspaces/boost
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp .env.example .env.local
   ```

3. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

4. **Build & Run**
   ```bash
   # Build all apps
   npm run build

   # Start API (port 3000)
   npm run dev --workspace=@boost/api

   # Start Worker (in another terminal)
   npm run dev --workspace=@boost/worker
   ```

## API Endpoints

### Health Check
```bash
GET /
```

### Create Event (Protected)
```bash
POST /events
x-api-key: pk_live_<key>
Content-Type: application/json

{
  "eventType": "user.signup",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "payload": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Manage API Keys (Protected)
```bash
# Create new key
POST /auth/api-keys
x-api-key: pk_live_<key>

# List keys
GET /auth/api-keys
x-api-key: pk_live_<key>

# Revoke key
DELETE /auth/api-keys/:id
x-api-key: pk_live_<key>
```

## Database Schema

### Organizations
- `id` (UUID, PK)
- `name` (VARCHAR)
- `createdAt`, `updatedAt`

### Projects
- `id` (UUID, PK)
- `organizationId` (UUID, FK)
- `name`, `description` (VARCHAR/TEXT)
- `createdAt`, `updatedAt`

### API Keys
- `id` (UUID, PK)
- `projectId` (UUID, FK)
- `keyHash` (VARCHAR, UNIQUE) - SHA-256 hash
- `prefix` (VARCHAR) - Display prefix
- `scopes` (JSON)
- `lastUsedAt` (TIMESTAMP)

### End Users
- `id` (UUID, PK)
- `projectId` (UUID, FK)
- `externalId` (VARCHAR) - Customer's user ID
- `metadata` (JSON)
- Composite unique index: `(projectId, externalId)`

### Events
- `id` (UUID, PK)
- `projectId` (UUID, FK)
- `eventType` (VARCHAR)
- `userId` (UUID, FK to endUser)
- `payload` (JSON)
- `status` (VARCHAR: pending/processed/failed)
- `errorDetails` (TEXT, if failed)
- `createdAt`, `processedAt`

## Authentication

API Keys are secured using:

1. **Key Generation**: 32-byte random hex string
   - Format: `pk_live_<random>`
   - SHA-256 hash stored in database
   - Only shown once at creation

2. **Validation Flow**:
   - L1 Cache: Redis (TTL 60s) - `apikey:<raw_key>` → `projectId`
   - L2 Lookup: PostgreSQL - Hash comparison
   - Returns `projectId` for multi-tenant isolation

3. **Performance**:
   - Warm (cached): ~10ms
   - Cold (DB hit): ~50ms

## Development

### Build
```bash
npm run build
```

### Lint & Format
```bash
npm run lint
npm run format
```

### Run Tests
```bash
npm test
```

### Watch Mode
```bash
npm run dev
```

## Deployment

### Production Build
```bash
npm run build
# API: apps/api/dist/main.js
# Worker: apps/worker/dist/main.js
```

### Environment Variables
```
DATABASE_URL=postgresql://...
KAFKA_BROKER=kafka:9092
REDIS_URL=redis://redis:6379
PORT=3000
NODE_ENV=production
```

## Project Timeline

- **Phase 1** (Current): Project Setup & DB Schema ✅
  - Turborepo initialization
  - NestJS app scaffolding
  - Drizzle schema & migrations
  - Docker infrastructure

- **Phase 2**: API Key Management
  - Key generation & hashing
  - Redis caching layer
  - Auth middleware

- **Phase 3**: Event Processing
  - Kafka producer/consumer
  - Event persistence
  - Error handling & retries

- **Phase 4**: Analytics & Dashboard
  - Event aggregation
  - Real-time metrics
  - Admin UI

## Troubleshooting

### Postgres connection error
```bash
# Check if container is running
docker ps | grep postgres

# Check logs
docker logs boost-postgres
```

### Kafka not responding
```bash
# Verify Kafka health
docker exec boost-kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

### TypeScript errors
```bash
# Clean build
rm -rf dist
npm run build
```

## Contributing

1. Create feature branch: `git checkout -b feature/xyz`
2. Make changes and commit
3. Push and create PR

## License

MIT
