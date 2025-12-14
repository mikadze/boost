# PR #36 Review: Badge/Achievement System Implementation

## Summary
This PR implements a badge/achievement system for Issue #33. The implementation follows most architectural patterns correctly but has **critical issues** that need to be addressed before merging.

---

## Critical Issues

### 1. BadgeEventHandler Never Invoked (Blocking)
**File:** `apps/worker/src/worker.service.ts`

The `BadgeEventHandler` follows the same pattern as `QuestProgressEventHandler` and `StreakEventHandler`:
- Returns a special marker `__badge_evaluation__` from `getSupportedTypes()`
- Implements `shouldHandle()` for dynamic event matching

However, **the `WorkerService` is not updated** to call the badge handler. Looking at `worker.service.ts:50-70`, there are explicit calls for quest and streak handlers, but no equivalent for badges:

```typescript
// Current code in worker.service.ts
// Issue #25-29: Check for quest progress on ALL events
try {
  if (await this.questProgressHandler.shouldHandle(rawEvent)) {
    await this.questProgressHandler.handle(rawEvent);
  }
} catch (questError) { ... }

// Issue #32: Check for streak progress on ALL events
try {
  if (await this.streakEventHandler.shouldHandle(rawEvent)) {
    await this.streakEventHandler.handle(rawEvent);
  }
} catch (streakError) { ... }

// MISSING: Badge handler call!
```

**Fix Required:**
```typescript
// Add to worker.service.ts after streak handler
// Issue #33: Check for badge awards on ALL events
try {
  if (await this.badgeEventHandler.shouldHandle(rawEvent)) {
    await this.badgeEventHandler.handle(rawEvent);
  }
} catch (badgeError) {
  this.logger.warn(`Badge evaluation failed: ${badgeError}`);
}
```

Also need to inject `BadgeEventHandler` in the constructor.

---

### 2. Merge Conflicts with Streak Engine (Blocking)
**Files:**
- `apps/worker/src/handlers/index.ts`
- `libs/database/src/repositories/index.ts`

The PR branch is based on a commit before the streak engine was merged. Missing exports:

**handlers/index.ts** - Missing:
```typescript
// Issue #32: Streak Engine handlers
export * from './streak-event.handler';
```

**repositories/index.ts** - Missing:
```typescript
// Issue #32: Streak Engine Repositories
export * from './streak-rule.repository';
export * from './user-streak.repository';
export * from './streak-history.repository';
```

**Fix:** Rebase onto main or manually add the missing exports.

---

## Architecture Compliance (CLAUDE.md)

### Repository Layer Pattern
**Status:** Follows guidelines correctly

The service never accesses the database directly. All operations go through repositories:
- `BadgeDefinitionRepository` - Badge CRUD operations
- `UserBadgeRepository` - User badge awards tracking

```typescript
// badges.service.ts correctly uses repositories
constructor(
  private readonly badgeDefinitionRepository: BadgeDefinitionRepository,
  private readonly userBadgeRepository: UserBadgeRepository,
  ...
)
```

### Multi-Tenancy (projectId Scoping)
**Status:** Correct

All queries are properly scoped by `projectId`:
- `findByProjectId(projectId)`
- `findActiveByProjectId(projectId)`
- `findByTriggerMetric(projectId, metricName)`

Ownership checks are performed before mutations:
```typescript
// badges.service.ts:77-82
if (badge.projectId !== projectId) {
  throw new NotFoundException(`Badge ${badgeId} not found`);
}
```

### Strategy Pattern (Event Handlers)
**Status:** Correct pattern, but integration missing

The handler correctly implements the `EventHandler` interface:
```typescript
@Injectable()
export class BadgeEventHandler implements EventHandler {
  getSupportedTypes(): string[] {
    return ['__badge_evaluation__'];
  }

  async shouldHandle(event: RawEventMessage): Promise<boolean> { ... }
  async handle(event: RawEventMessage): Promise<void> { ... }
}
```

### DTO Validation
**Status:** Correct

Uses class-validator decorators properly:
```typescript
export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsIn(RARITY_VALUES)
  rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  ...
}
```

### Database Schema
**Status:** Correct

Uses `jsonb` for JSON columns, proper indexes, cascade deletes:
```typescript
metadata: jsonb('metadata'),
.references(() => projects.id, { onDelete: 'cascade' })
```

---

## Test Coverage

### badges.service.spec.ts
- CRUD operations for badge definitions
- Award badge functionality
- Trophy case retrieval with visibility rules
- Category filtering

### badge-event.handler.spec.ts
- `shouldHandle()` returns true/false based on matching badges
- Event metric extraction
- Threshold evaluation logic
- Idempotent badge awards

---

## Minor Suggestions

### 1. Consider extracting count queries to use SQL COUNT
**File:** `libs/database/src/repositories/user-badge.repository.ts:107-112`

```typescript
async countByBadge(badgeId: string): Promise<number> {
  const result = await this.db
    .select()
    .from(userBadges)
    .where(eq(userBadges.badgeId, badgeId));
  return result.length;  // Fetches all rows just to count
}
```

Consider using SQL COUNT for better performance on large datasets.

### 2. Add timeout/retry for Kafka emit in handler
**File:** `apps/worker/src/handlers/badge-event.handler.ts:256`

The service has proper timeout/retry on Kafka emit, but the handler uses a simple emit:
```typescript
this.kafkaClient.emit('raw-events', badgeUnlockedEvent);
```

Consider adding timeout handling like in the service.

---

## Files Changed Summary

| File | Status |
|------|--------|
| `apps/api/src/badges/badges.controller.ts` | New file, well-structured |
| `apps/api/src/badges/badges.service.ts` | New file, follows patterns |
| `apps/api/src/badges/badges.module.ts` | New file, correct setup |
| `apps/api/src/badges/dto/badge.dto.ts` | New file, proper validation |
| `apps/worker/src/handlers/badge-event.handler.ts` | New file, correct pattern |
| `libs/database/src/repositories/badge-definition.repository.ts` | New file, correct pattern |
| `libs/database/src/repositories/user-badge.repository.ts` | New file, correct pattern |
| `libs/database/src/schema.ts` | Extended correctly |
| `apps/worker/src/app.module.ts` | Handler registered |
| `apps/worker/src/worker.service.ts` | **MISSING: Handler invocation** |

---

## Verdict

**Request Changes** - Cannot merge until:

1. `WorkerService` is updated to invoke `BadgeEventHandler`
2. Merge conflicts with streak engine are resolved (missing exports)

The core implementation is solid and follows architectural guidelines. Once the critical issues are fixed, this is ready to merge.
