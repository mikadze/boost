# Boost Platform - Architecture & Best Practices Guide

## Overview

Boost is an event analytics platform built as a NestJS monorepo using Turborepo. It provides API key-authenticated event ingestion with Kafka-based async processing.

## Tech Stack

- **Framework:** NestJS (Node.js)
- **Build System:** Turborepo (monorepo)
- **Database:** PostgreSQL with Drizzle ORM
- **Message Queue:** Apache Kafka
- **Cache:** Redis
- **Validation:** Zod (config), class-validator (DTOs)
- **Language:** TypeScript (strict mode)

## Project Structure

```
boost/
├── apps/
│   ├── api/          # HTTP API service (event ingestion, API key management)
│   └── worker/       # Kafka consumer (event processing)
├── libs/
│   ├── common/       # Shared utilities, config, auth, types
│   └── database/     # Drizzle schema, repositories, migrations
├── packages/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── ui/
└── turbo.json
```

## Architecture Patterns

### Domain-Driven Design (DDD)

Services never access the database directly. All data access goes through repositories.

```
Controller → Service → Repository → Database
```

**Repository Layer** (`libs/database/src/repositories/`):
- `ApiKeyRepository` - API key CRUD operations
- `EventRepository` - Event storage and status management

**Example:**
```typescript
// ✅ Good - Use repository
constructor(private readonly eventRepository: EventRepository) {}

async createEvent(data: CreateEventDto) {
  return this.eventRepository.create(data);
}

// ❌ Bad - Direct DB access in service
async createEvent(data: CreateEventDto) {
  return this.db.insert(events).values(data);
}
```

### Strategy Pattern (Event Handlers)

Event processing uses the Strategy pattern for extensibility. Each event type has a dedicated handler.

**Structure** (`apps/worker/src/handlers/`):
```
handlers/
├── event-handler.interface.ts   # Strategy interface
├── event-handler.registry.ts    # Handler dispatch registry
├── tracking-event.handler.ts    # page_view, click, form_submit
├── user-event.handler.ts        # user_signup, user_login
└── default-event.handler.ts     # Fallback for unknown types
```

**Adding a new event handler:**
1. Create handler implementing `EventHandler` interface
2. Define supported types in `getSupportedTypes()`
3. Register in `app.module.ts` providers and `EVENT_HANDLERS` factory

```typescript
@Injectable()
export class PaymentEventHandler implements EventHandler {
  getSupportedTypes(): string[] {
    return ['payment_completed', 'payment_failed'];
  }

  async handle(event: RawEventMessage): Promise<void> {
    // Processing logic
  }
}
```

### Multi-Tenancy

All data is scoped by `projectId`. Every query must include project context.

```typescript
// ✅ Always filter by projectId
await this.db.select().from(events).where(eq(events.projectId, projectId));
```

## Configuration

### Environment Validation

Config is validated at startup using Zod schemas (`libs/common/src/config/config.schema.ts`).

**Production requirements:**
- No localhost URLs allowed
- All required env vars must be set

**Development defaults:**
- Localhost URLs auto-configured
- Sensible defaults for local development

```typescript
// Production - strict validation
DATABASE_URL: z.string().url().refine(val => !val.includes('localhost'))

// Development - allows defaults
DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/boost')
```

### Required Environment Variables

| Variable | Description | Required in Prod |
|----------|-------------|------------------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `KAFKA_BROKER` | Kafka broker address | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |

## Database

### Schema Conventions

- Use `jsonb` for JSON columns (better performance, indexing support)
- Always set `CASCADE` on foreign keys for cleanup
- Use `uuid` for primary keys
- Include `createdAt` timestamp on all tables

```typescript
// ✅ Good
payload: jsonb('payload').notNull(),
.references(() => projects.id, { onDelete: 'cascade' })

// ❌ Bad
payload: json('payload').notNull(),  // Use jsonb instead
.references(() => projects.id)        // Missing cascade
```

### Event Status Flow

```
pending → processed (success)
pending → failed (error with details)
```

The Sweeper job recovers events stuck in `pending` status.

## Security

### API Key Handling

- Store only hashed keys in database (SHA-256)
- Cache uses key hash, never raw key
- Always verify ownership before operations

```typescript
// ✅ Ownership check before revocation
const apiKey = await this.apiKeyRepository.findById(keyId);
if (apiKey?.projectId !== projectId) {
  throw new ForbiddenException();
}
```

### Input Validation

- Use class-validator decorators on DTOs
- Validate at controller level with `ValidationPipe`

```typescript
@IsString()
@IsNotEmpty()
eventType!: string;

@IsObject()
payload!: Record<string, unknown>;
```

## Worker Service

### Event Processing

Events flow: API → Kafka → Worker → Database

```
1. API receives event
2. Insert to DB with status='pending'
3. Emit to Kafka topic 'raw-events'
4. Worker consumes from Kafka
5. Dispatch to handler via Strategy pattern
6. Update status to 'processed' or 'failed'
```

### Sweeper Job

Handles edge case where DB insert succeeds but Kafka emit fails.

- Runs every 60 seconds
- Finds events in `pending` status > 5 minutes
- Re-emits to Kafka for processing

Configuration in `apps/worker/src/sweeper/sweeper.service.ts`:
```typescript
SWEEP_INTERVAL_MS = 60_000      // Run frequency
STUCK_THRESHOLD_MINUTES = 5     // Age threshold
BATCH_SIZE = 100                // Events per sweep
```

## Development

### Running Services

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start API (development)
npm run dev --filter=@boost/api

# Start Worker (development)
npm run dev --filter=@boost/worker

# Run both
npm run dev
```

### Adding a New Feature

1. **Types first** - Define interfaces in `libs/common/src/types/`
2. **Repository method** - Add data access in `libs/database/src/repositories/`
3. **Service logic** - Implement business logic using repository
4. **Controller endpoint** - Expose via HTTP/Kafka
5. **Validation** - Add DTOs with class-validator

### Code Style

- Use dependency injection via constructor
- Prefer composition over inheritance
- Keep services focused (single responsibility)
- Log with NestJS Logger, include context

```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log(`Processing event: ${eventId}`);
```

## Testing Checklist

- [ ] Repository methods handle edge cases (not found, duplicates)
- [ ] Services validate ownership/permissions
- [ ] Handlers process all supported event types
- [ ] Config validates correctly in production mode
- [ ] Foreign key cascades work as expected

## Common Pitfalls

1. **Missing projectId filter** - Always scope queries by project
2. **Raw API key exposure** - Use hash for cache keys and comparisons
3. **Direct DB access** - Go through repositories
4. **Swallowing errors** - Log and handle appropriately
5. **Missing ownership checks** - Verify before mutating data
