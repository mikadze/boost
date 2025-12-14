# PR #37 Code Review: Rewards Store Implementation (Issue #34)

## Overview

This PR implements a rewards store system with atomic transactions, adding 2,257 lines across 11 files. The implementation introduces reward items management, customer store functionality, and redemption processing with multiple fulfillment methods (WEBHOOK, PROMO_CODE, MANUAL).

---

## ✅ What's Done Well

### 1. Architecture Compliance

**DDD/Repository Pattern** ✅
- Service layer (`RewardsService`) correctly uses repositories for all data access
- No direct database access from controllers or services
- Follows established `Controller → Service → Repository → Database` pattern
- Consistent with existing patterns (e.g., `LoyaltyService`)

**Strategy-like Pattern for Fulfillment** ✅
- Clean separation of fulfillment types (WEBHOOK, PROMO_CODE, MANUAL)
- Extensible design via `processFulfillment` method switch

### 2. Multi-Tenancy ✅

All queries properly scoped by `projectId`:
- `rewardItemRepository.findByProjectId(projectId, ...)`
- `redemptionRepository.findByProjectId(projectId, ...)`
- Ownership checks before mutations: `if (item.projectId !== projectId)`

### 3. Security Practices ✅

- **Ownership verification**: Every operation verifies `projectId` matches before access
- **HMAC signatures** for webhooks: `generateHmacSignature()` using SHA-256
- **API Key Guard**: Both controllers use `@UseGuards(ApiKeyGuard)`
- **Input validation**: Comprehensive class-validator decorators on all DTOs

### 4. Database Schema ✅

- Uses `jsonb` for JSON columns (correct per CLAUDE.md)
- Uses `uuid` for primary keys
- Includes `createdAt`/`updatedAt` timestamps
- Foreign keys with `CASCADE` on delete
- Proper indexes for performance

### 5. Atomic Transactions ✅

The `createAtomicRedemption` method is well-implemented:
- Uses Drizzle's `db.transaction()` for atomicity
- Race condition protection via SQL-level checks: `WHERE loyaltyPoints >= ${cost}`
- Atomic stock decrement with availability check
- Creates ledger entry within same transaction

### 6. Testing ✅

Comprehensive unit tests with 600+ lines covering:
- CRUD operations for reward items
- Customer store availability logic
- Redemption flow (success and error cases)
- Edge cases (insufficient points, out of stock, missing badges)

### 7. Code Style ✅

- Uses NestJS Logger with class context
- Follows existing commenting/section patterns
- Proper use of dependency injection
- TypeScript strict mode compliant

---

## ⚠️ Issues to Address

### 1. Missing Logger in Service (Minor)

**File**: `apps/api/src/rewards/rewards.service.ts`

The logger is defined but only used in error paths. Consider adding logging for successful operations for observability:

```typescript
// Current
this.logger.error(`Fulfillment failed for transaction ${result.transaction!.id}: ${err.message}`);

// Suggestion: Add success logging
this.logger.log(`Redemption successful: transaction=${result.transaction.id}, user=${dto.userId}, item=${item.id}`);
```

### 2. Potential Race Condition in Promo Code Fulfillment (Medium)

**File**: `apps/api/src/rewards/rewards.service.ts:304-315`

```typescript
private async processPromoCodeFulfillment(...): Promise<void> {
  const codes = config.codes as string[] | undefined;
  // ...
  const codeIndex = Math.floor(Math.random() * codes.length);
  const code = codes[codeIndex];
  // Issue: Same code could be issued to multiple users
```

**Problem**: Multiple concurrent redemptions could receive the same promo code. The random selection doesn't track used codes.

**Recommendation**: Either:
1. Pop codes from the array atomically and update `fulfillmentConfig`
2. Track used codes in a separate table
3. At minimum, document this limitation

### 3. Fire-and-Forget Fulfillment (Design Decision - Document)

**File**: `apps/api/src/rewards/rewards.service.ts:244-247`

```typescript
// Process fulfillment asynchronously (don't block the response)
this.processFulfillment(result.transaction!, item).catch((err) => {
  this.logger.error(`Fulfillment failed...`);
});
```

This is a valid pattern but has implications:
- Failures won't be communicated to the user immediately
- Relies on admin manually marking as completed/failed

**Recommendation**: Document this behavior in the PR description and add a background job (like Sweeper) to retry failed fulfillments.

### 4. Webhook Retry Logic Incomplete (Medium)

**File**: `apps/api/src/rewards/rewards.service.ts:348-357`

```typescript
if (retries < 3) {
  await this.redemptionRepository.incrementWebhookRetry(transaction.id);
  throw new Error(`Webhook failed with status ${response.status}`);
}
```

**Issue**: Throwing an error after incrementing doesn't trigger a retry - it just marks failure. The retry mechanism needs a background job to pick up transactions with `status='PROCESSING'` and `webhookRetries < 3`.

**Recommendation**: Add a Sweeper-like job for webhook retries or integrate with the existing Sweeper pattern.

### 5. Missing DTO for Complete/Fail Endpoints (Minor)

**File**: `apps/api/src/rewards/rewards.controller.ts:127-143`

```typescript
@Post('redemptions/:id/complete')
async completeRedemption(
  @Body() body: { fulfillmentData?: Record<string, unknown> },
) { ... }

@Post('redemptions/:id/fail')
async failRedemption(
  @Body() body: { errorMessage: string },
) { ... }
```

**Issue**: Inline type definitions bypass validation pipeline.

**Recommendation**: Create proper DTOs with class-validator decorators:

```typescript
// In rewards.dto.ts
export class CompleteRedemptionDto {
  @IsObject()
  @IsOptional()
  fulfillmentData?: Record<string, unknown>;
}

export class FailRedemptionDto {
  @IsString()
  @IsNotEmpty()
  errorMessage!: string;
}
```

### 6. Schema Missing Relations Export (Minor)

**File**: `libs/database/src/schema.ts`

The new tables are defined but I don't see relation definitions for:
- `rewardItemRelations`
- `redemptionTransactionRelations`

These are needed for Drizzle's `with` clause queries (used in `findByIdWithDetails`).

### 7. Module Missing Database Module Import (Potential Issue)

**File**: `apps/api/src/rewards/rewards.module.ts`

```typescript
@Module({
  imports: [AuthModule],
  // Missing: DatabaseModule or explicit repository providers
```

The repositories (`RewardItemRepository`, `RedemptionTransactionRepository`) are provided globally by `DatabaseModule` in `app.module.ts`, so this works. However, for clarity and testability, consider explicitly listing them.

---

## 📋 Schema Review

### New Tables

| Table | Purpose | Indexes | FK Cascades |
|-------|---------|---------|-------------|
| `rewardItems` | Store reward catalog | projectId, sku | ✅ CASCADE |
| `redemptionTransactions` | Track redemptions | projectId, endUserId, status | ✅ CASCADE |

### Schema Additions Look Correct ✅

- `rewardItems`: All required fields present, uses `jsonb` for config/metadata
- `redemptionTransactions`: Proper status enum, audit fields, webhook tracking

---

## 🔒 Security Checklist

| Check | Status |
|-------|--------|
| API Key authentication | ✅ Both controllers guarded |
| Project ownership verification | ✅ All mutations verify |
| Input validation (DTOs) | ✅ class-validator used |
| SQL injection prevention | ✅ Parameterized via Drizzle |
| HMAC webhook signatures | ✅ SHA-256 implementation |
| No secrets in responses | ✅ fulfillmentConfig not leaked |

---

## 📊 Test Coverage Assessment

Tests cover:
- ✅ CRUD operations (create, read, update, delete)
- ✅ Availability checks (points, badges, stock, active)
- ✅ Redemption success path
- ✅ Error cases (not found, forbidden, insufficient)
- ⚠️ Webhook fulfillment (not fully tested)
- ⚠️ Promo code fulfillment (not fully tested)

---

## 🎯 Summary

### Verdict: **APPROVE with Minor Fixes**

The PR demonstrates solid understanding of the codebase architecture and follows established patterns well. The atomic transaction implementation is particularly well done with proper race condition protection.

### Required Changes (Before Merge)
1. Add DTOs for complete/fail endpoints
2. Add schema relations for new tables

### Recommended Improvements (Post-Merge OK)
1. Add background job for webhook retries
2. Improve promo code distribution to prevent duplicates
3. Add success logging for observability
4. Consider explicit repository imports in module

### Nice-to-Have
1. Integration tests for the full redemption flow
2. OpenAPI/Swagger decorators for API documentation

---

*Review conducted against CLAUDE.md architecture guidelines and existing codebase patterns.*
