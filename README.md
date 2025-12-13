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
🔐 **Dual API Keys** - Publishable (client) & Secret (server) keys with event restrictions
⚡ **Event Streaming** - Kafka-based event sourcing
💾 **PostgreSQL + Drizzle** - Type-safe ORM
🚀 **Microservices Ready** - NestJS + Turborepo
🐳 **Docker Compose** - Local development environment

## SDKs

| Package | Description | Use Case |
|---------|-------------|----------|
| `@gamify/core` | Browser/client-side SDK | Page views, clicks, cart updates |
| `@gamify/react` | React hooks & components | React applications |
| `@gamify/node` | Server-side SDK | Purchases, commissions, webhooks |

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
   npm run start:dev --workspace=@boost/api

   # Start Worker (in another terminal)
   npm run start:dev --workspace=@boost/worker

   # Start web (in another terminal)
   npm run dev --workspace=@boost/web
   ```

## SDK Usage

### Client-Side (Browser)

```typescript
import { Gamify } from '@gamify/core';

const gamify = new Gamify({
  apiKey: 'pk_live_...', // Publishable key only
});

// Track behavioral events
gamify.track('page_view', { page: '/products' });
gamify.track('cart_add', { productId: 'prod_123', quantity: 2 });

// Identify users
gamify.identify('user_123', { email: 'user@example.com' });
```

### Server-Side (Node.js)

```typescript
import { GamifyClient } from '@gamify/node';

const gamify = new GamifyClient({
  secretKey: process.env.GAMIFY_SECRET_KEY!, // sk_live_*
});

// Track purchases (server-only)
await gamify.purchase({
  userId: 'user_123',
  orderId: 'order_456',
  amount: 9999, // cents
  currency: 'USD',
});

// Track referral completions
await gamify.referralSuccess({
  referredUserId: 'new_user_789',
  referralCode: 'FRIEND20',
});
```

## API Endpoints

### Health Check
```bash
GET /
```

### Track Event (Publishable Key)
```bash
POST /v1/events/track
x-api-key: pk_live_<key>
Content-Type: application/json

{
  "event": "page_view",
  "userId": "user_123",
  "properties": {
    "page": "/products",
    "referrer": "google.com"
  }
}
```

### Track Purchase (Secret Key Required)
```bash
POST /v1/events/track
x-api-key: sk_live_<key>
Content-Type: application/json

{
  "event": "purchase",
  "userId": "user_123",
  "properties": {
    "orderId": "order_456",
    "amount": 9999,
    "currency": "USD"
  }
}
```

### Manage API Keys
```bash
# Create publishable key
POST /v1/projects/:projectId/api-keys
{ "name": "Website", "type": "publishable" }

# Create secret key
POST /v1/projects/:projectId/api-keys
{ "name": "Backend", "type": "secret" }

# List keys
GET /v1/projects/:projectId/api-keys

# Revoke key
DELETE /v1/projects/:projectId/api-keys/:id
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
- `prefix` (VARCHAR) - Display prefix (e.g., `pk_live_abc...`)
- `type` (VARCHAR) - `publishable` or `secret`
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

## API Keys & Security

### Key Types

| Type | Prefix | Use Case | Allowed Events |
|------|--------|----------|----------------|
| **Publishable** | `pk_live_*` | Browser, mobile apps | Behavioral events only |
| **Secret** | `sk_live_*` | Server-side only | All events |

### Event Classification

**Publishable Key Events** (client-safe):
- `page_view`, `product_view`, `click`, `form_submit`, `search`
- `cart_update`, `cart_add`, `cart_remove`, `checkout_start`
- `signup`, `login`, `logout`, `$profile_update`

**Secret Key Events** (server-only):
- `purchase`, `checkout_complete`, `checkout_success`
- `commission.created`, `referral_success`
- `user.leveled_up`, `step.completed`, `quest.completed`

### Security Layers

1. **API Controller**: Blocks trusted events from publishable keys
2. **Worker Handler**: Defense-in-depth validation of event source
3. **Client SDK**: Rejects secret keys, warns on trusted events
4. **Server SDK**: Requires secret keys only

### Key Generation

- 32-byte random hex string
- SHA-256 hash stored in database
- Only shown once at creation

### Validation Flow

- L1 Cache: Redis (TTL 60s) - `apikey:<hash>` → `{projectId, type}`
- L2 Lookup: PostgreSQL - Hash comparison
- Returns `projectId` + `keyType` for multi-tenant isolation

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
