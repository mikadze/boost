# Boost Integration Guide

This guide covers how to integrate Boost's gamification features into your application.

## Table of Contents

1. [Authentication](#authentication)
2. [Quests](#quests)
3. [Badges](#badges)
4. [Affiliate Program](#affiliate-program)

---

## Authentication

All API requests require an API key passed in the `Authorization` header.

```bash
Authorization: Bearer your_api_key_here
```

Your API key is scoped to a specific project. All data you create and query will be isolated to that project.

### Getting Your API Key

1. Log into the Boost dashboard
2. Navigate to your project settings
3. Create or copy your API key

---

## Quests

Quests are multi-step missions that users complete by triggering events. When completed, quests can award XP and badges.

### How Quests Work

1. **Create a quest** with one or more steps
2. **Define steps** with event triggers (e.g., `profile.updated`, `purchase.completed`)
3. **Publish the quest** to make it available to users
4. **Send events** from your app - steps complete automatically when matching events are received
5. **Quest completes** when all steps are done, awarding XP and/or badges

### Admin Endpoints

#### Create a Quest

```bash
POST /quests
```

```json
{
  "name": "Complete Your Profile",
  "description": "Fill out your profile to earn rewards",
  "rewardXp": 100,
  "rewardBadgeId": "badge_123",
  "steps": [
    {
      "eventName": "profile.avatar_uploaded",
      "title": "Upload Avatar",
      "requiredCount": 1
    },
    {
      "eventName": "profile.bio_updated",
      "title": "Add Bio",
      "requiredCount": 1
    }
  ]
}
```

#### List Quests

```bash
GET /quests          # All quests (drafts + published)
GET /quests/active   # Published quests only
```

#### Get Quest Details

```bash
GET /quests/:id
```

#### Update Quest

```bash
PUT /quests/:id
```

```json
{
  "name": "Updated Quest Name",
  "rewardXp": 200
}
```

#### Delete Quest

```bash
DELETE /quests/:id
```

#### Publish / Unpublish

```bash
POST /quests/:id/publish
POST /quests/:id/unpublish
```

#### Manage Steps

```bash
GET /quests/:id/steps                    # List steps
POST /quests/:id/steps                   # Add step
PUT /quests/:questId/steps/:stepId       # Update step
DELETE /quests/:questId/steps/:stepId    # Delete step
```

### SDK Endpoints

Use these endpoints in your frontend to display quest progress.

#### Get User's Quests with Progress

```bash
GET /v1/customer/quests?userId=user_123
```

Response:

```json
{
  "quests": [
    {
      "id": "quest_abc",
      "name": "Complete Your Profile",
      "description": "Fill out your profile to earn rewards",
      "rewardXp": 100,
      "rewardBadgeId": "badge_123",
      "status": "in_progress",
      "percentComplete": 50,
      "steps": [
        {
          "id": "step_1",
          "title": "Upload Avatar",
          "eventName": "profile.avatar_uploaded",
          "requiredCount": 1,
          "currentCount": 1,
          "isComplete": true
        },
        {
          "id": "step_2",
          "title": "Add Bio",
          "eventName": "profile.bio_updated",
          "requiredCount": 1,
          "currentCount": 0,
          "isComplete": false
        }
      ]
    }
  ]
}
```

#### Get Single Quest Progress

```bash
GET /v1/customer/quests/:questId?userId=user_123
```

### Triggering Quest Progress

Send events to the `/events` endpoint. When the event type matches a quest step's `eventName`, progress is automatically tracked.

```bash
POST /events
```

```json
{
  "userId": "user_123",
  "eventType": "profile.bio_updated",
  "payload": {
    "bio": "Hello, I'm a developer!"
  }
}
```

### JavaScript Example

```typescript
// Fetch user's quests
async function getUserQuests(userId: string) {
  const response = await fetch(
    `https://api.boost.dev/v1/customer/quests?userId=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
}

// Track an event (triggers quest progress)
async function trackEvent(userId: string, eventType: string, payload: object) {
  await fetch('https://api.boost.dev/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, eventType, payload }),
  });
}

// Example: User updates their bio
await trackEvent('user_123', 'profile.bio_updated', { bio: 'New bio text' });

// Refresh quest progress
const quests = await getUserQuests('user_123');
console.log(quests);
```

---

## Badges

Badges are achievements that users can earn. They can be awarded automatically based on metrics or manually by admins.

### Badge Properties

| Property | Description |
|----------|-------------|
| `rarity` | `COMMON`, `RARE`, `EPIC`, or `LEGENDARY` |
| `visibility` | `PUBLIC` (always shown) or `HIDDEN` (revealed on unlock) |
| `ruleType` | How the badge is earned (see below) |

### Rule Types

- **METRIC_THRESHOLD**: Awards when a metric reaches a threshold (e.g., 100 purchases)
- **EVENT_COUNT**: Awards after N occurrences of an event
- **MANUAL**: Only awarded via admin API

### Admin Endpoints

#### Create a Badge

```bash
POST /badges
```

```json
{
  "name": "First Purchase",
  "description": "Complete your first purchase",
  "iconUrl": "https://example.com/badges/first-purchase.png",
  "rarity": "COMMON",
  "visibility": "PUBLIC",
  "category": "Shopping",
  "ruleType": "EVENT_COUNT",
  "triggerMetric": "purchase",
  "threshold": 1
}
```

#### List Badges

```bash
GET /badges          # All badges
GET /badges/active   # Active badges only
GET /badges/categories   # Get category list
```

#### Get Badge Details

```bash
GET /badges/:id
```

#### Update Badge

```bash
PUT /badges/:id
```

```json
{
  "name": "Updated Badge Name",
  "threshold": 5
}
```

#### Delete Badge

```bash
DELETE /badges/:id
```

#### Activate / Deactivate

```bash
POST /badges/:id/activate
POST /badges/:id/deactivate
```

#### Manually Award Badge

```bash
POST /badges/:id/award
```

```json
{
  "userId": "user_123",
  "awardedBy": "admin_456",
  "metadata": {
    "reason": "Special promotion winner"
  }
}
```

#### View Recent Awards

```bash
GET /badges/recent-awards?limit=10
```

### SDK Endpoints

Use these endpoints to display a user's badge collection (Trophy Case).

#### Get User's Badge Collection

```bash
GET /v1/customer/badges?userId=user_123
GET /v1/customer/badges?userId=user_123&category=Shopping
```

Response:

```json
{
  "badges": [
    {
      "id": "badge_abc",
      "name": "First Purchase",
      "description": "Complete your first purchase",
      "iconUrl": "https://example.com/badges/first-purchase.png",
      "imageUrl": null,
      "rarity": "COMMON",
      "visibility": "PUBLIC",
      "category": "Shopping",
      "isUnlocked": true,
      "unlockedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "badge_def",
      "name": "Power Shopper",
      "description": "Make 100 purchases",
      "iconUrl": "https://example.com/badges/power-shopper.png",
      "rarity": "LEGENDARY",
      "visibility": "PUBLIC",
      "category": "Shopping",
      "isUnlocked": false,
      "unlockedAt": null
    }
  ],
  "stats": {
    "total": 10,
    "unlocked": 3,
    "byRarity": {
      "COMMON": { "total": 4, "unlocked": 2 },
      "RARE": { "total": 3, "unlocked": 1 },
      "EPIC": { "total": 2, "unlocked": 0 },
      "LEGENDARY": { "total": 1, "unlocked": 0 }
    }
  }
}
```

#### Get Badge Categories

```bash
GET /v1/customer/badges/categories
```

### Automatic Badge Awards

Badges with `ruleType: METRIC_THRESHOLD` or `EVENT_COUNT` are automatically awarded when matching events are received.

**Example:** Badge with `triggerMetric: "purchase"` and `threshold: 1`:

```bash
POST /events
```

```json
{
  "userId": "user_123",
  "eventType": "purchase.completed",
  "payload": {
    "orderId": "order_456",
    "amount": 99.99
  }
}
```

The badge handler extracts `purchase` from the event type and checks if conditions are met.

### JavaScript Example

```typescript
// Fetch user's badge collection
async function getUserBadges(userId: string, category?: string) {
  const params = new URLSearchParams({ userId });
  if (category) params.append('category', category);

  const response = await fetch(
    `https://api.boost.dev/v1/customer/badges?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
}

// Display badge grid
async function renderBadgeGrid(userId: string) {
  const { badges, stats } = await getUserBadges(userId);

  console.log(`Unlocked: ${stats.unlocked}/${stats.total}`);

  badges.forEach(badge => {
    const status = badge.isUnlocked ? 'Unlocked!' : 'Locked';
    console.log(`${badge.name} (${badge.rarity}) - ${status}`);
  });
}

// Manually award a badge (admin)
async function awardBadge(badgeId: string, userId: string) {
  await fetch(`https://api.boost.dev/badges/${badgeId}/award`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ADMIN_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });
}
```

### React Component Example

```tsx
import { useEffect, useState } from 'react';

interface Badge {
  id: string;
  name: string;
  iconUrl: string;
  rarity: string;
  isUnlocked: boolean;
}

function BadgeGrid({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    fetch(`/api/badges?userId=${userId}`)
      .then(res => res.json())
      .then(data => setBadges(data.badges));
  }, [userId]);

  return (
    <div className="badge-grid">
      {badges.map(badge => (
        <div
          key={badge.id}
          className={`badge ${badge.isUnlocked ? 'unlocked' : 'locked'}`}
        >
          <img
            src={badge.iconUrl}
            alt={badge.name}
            style={{ filter: badge.isUnlocked ? 'none' : 'grayscale(100%)' }}
          />
          <span>{badge.name}</span>
          <span className="rarity">{badge.rarity}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Affiliate Program

The affiliate program lets you set up referral tracking and commission-based rewards for users who bring in new customers.

### Commission Plans

Commission plans define how affiliates earn. There are two types:

- **PERCENTAGE**: Commission as a percentage of the transaction (value in basis points, e.g., 1000 = 10%)
- **FIXED**: Fixed amount per transaction (value in cents)

### Admin Endpoints

#### Create a Commission Plan

```bash
POST /affiliates/plans
```

```json
{
  "name": "Standard Affiliate",
  "description": "10% commission on all referral purchases",
  "type": "PERCENTAGE",
  "value": 1000,
  "currency": "USD",
  "isDefault": true,
  "active": true
}
```

#### List Commission Plans

```bash
GET /affiliates/plans          # All plans
GET /affiliates/plans/active   # Active plans only
```

#### Get Plan Details

```bash
GET /affiliates/plans/:id
```

#### Update Plan

```bash
PUT /affiliates/plans/:id
```

```json
{
  "name": "Gold Affiliate",
  "value": 1500
}
```

#### Delete Plan

```bash
DELETE /affiliates/plans/:id
```

#### Set Default Plan

```bash
POST /affiliates/plans/:id/set-default
```

### Referral Tracking

#### Record a Referral

When a new user signs up via a referral link, record the referral:

```bash
POST /affiliates/referrals
```

```json
{
  "referrerId": "end_user_uuid",
  "referredExternalId": "new_user_123",
  "referralCode": "JOHN2024",
  "source": "url_param"
}
```

#### List Referrals

```bash
GET /affiliates/referrals
GET /affiliates/referrals?limit=50&offset=0
```

#### Get Referrals by Referrer

```bash
GET /affiliates/referrals/by-referrer/:userId
```

### Commission Management

#### Record a Commission

When a referred user makes a purchase, record the commission:

```bash
POST /affiliates/commissions
```

```json
{
  "userId": "affiliate_user_123",
  "commissionPlanId": "plan_abc",
  "amount": 500,
  "sourceAmount": 5000,
  "orderId": "order_789",
  "referredUserId": "referred_user_456",
  "currency": "USD",
  "notes": "Commission for order #789"
}
```

#### List Commissions

```bash
GET /affiliates/commissions
GET /affiliates/commissions?status=PENDING
GET /affiliates/commissions?status=PAID
```

#### Get Commissions by User

```bash
GET /affiliates/commissions/by-user/:userId
```

#### Mark Commission as Paid

```bash
POST /affiliates/commissions/:id/pay
```

```json
{
  "notes": "Paid via PayPal on 2024-01-15"
}
```

#### Reject Commission

```bash
POST /affiliates/commissions/:id/reject
```

```json
{
  "notes": "Order was refunded"
}
```

### SDK Endpoints

Use these endpoints in your frontend to display affiliate dashboards.

#### Get Affiliate Profile

```bash
GET /v1/customer/affiliate/profile?userId=user_123
```

Response:

```json
{
  "userId": "user_123",
  "referralCode": "JOHN2024",
  "commissionPlan": {
    "id": "plan_abc",
    "name": "Standard Affiliate",
    "type": "PERCENTAGE",
    "value": 1000
  },
  "stats": {
    "totalEarned": 15000,
    "totalPending": 2500,
    "totalPaid": 12500,
    "referralCount": 15
  }
}
```

#### Get User's Referrals

```bash
GET /v1/customer/affiliate/referrals?userId=user_123
```

Response:

```json
{
  "referrals": [
    {
      "id": "ref_abc",
      "referredExternalId": "new_user_456",
      "referralCode": "JOHN2024",
      "source": "url_param",
      "createdAt": "2024-01-10T12:00:00Z"
    }
  ],
  "total": 15
}
```

#### Get User's Commission History

```bash
GET /v1/customer/affiliate/commissions?userId=user_123
```

Response:

```json
{
  "commissions": [
    {
      "id": "comm_xyz",
      "amount": 500,
      "sourceAmount": 5000,
      "status": "PAID",
      "orderId": "order_789",
      "currency": "USD",
      "createdAt": "2024-01-12T14:30:00Z",
      "paidAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 25
}
```

### JavaScript Example

```typescript
// Fetch affiliate dashboard data
async function getAffiliateDashboard(userId: string) {
  const response = await fetch(
    `https://api.boost.dev/v1/customer/affiliate/profile?userId=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.json();
}

// Display affiliate stats
async function renderAffiliateDashboard(userId: string) {
  const profile = await getAffiliateDashboard(userId);

  console.log(`Referral Code: ${profile.referralCode}`);
  console.log(`Total Earned: $${(profile.stats.totalEarned / 100).toFixed(2)}`);
  console.log(`Pending: $${(profile.stats.totalPending / 100).toFixed(2)}`);
  console.log(`Referrals: ${profile.stats.referralCount}`);
}

// Track a referral when new user signs up
async function trackReferral(
  referrerId: string,
  newUserId: string,
  referralCode: string
) {
  await fetch('https://api.boost.dev/affiliates/referrals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      referrerId,
      referredExternalId: newUserId,
      referralCode,
      source: 'url_param',
    }),
  });
}

// Record commission when referred user makes a purchase
async function recordCommission(
  affiliateUserId: string,
  planId: string,
  orderAmount: number,
  orderId: string
) {
  // Calculate commission (e.g., 10% = 1000 basis points)
  const commissionAmount = Math.floor(orderAmount * 0.10);

  await fetch('https://api.boost.dev/affiliates/commissions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: affiliateUserId,
      commissionPlanId: planId,
      amount: commissionAmount,
      sourceAmount: orderAmount,
      orderId,
    }),
  });
}
```

### Typical Integration Flow

1. **User generates referral link**: Use their unique `referralCode` from their profile
2. **New user signs up**: Extract referral code from URL, call `/affiliates/referrals` to record
3. **Referred user makes purchase**: Calculate commission, call `/affiliates/commissions` to record
4. **Admin reviews**: View pending commissions in dashboard
5. **Admin pays**: Mark commissions as paid via `/affiliates/commissions/:id/pay`
6. **Affiliate views earnings**: Frontend fetches `/v1/customer/affiliate/profile`

---

## Event Tracking

All gamification features are powered by events. Send events to trigger quest progress, badge awards, and more.

```bash
POST /events
```

```json
{
  "userId": "user_123",
  "eventType": "purchase.completed",
  "payload": {
    "orderId": "order_456",
    "amount": 99.99,
    "items": ["item_a", "item_b"]
  }
}
```

### Event Naming Conventions

Use dot notation for event types:

- `profile.updated`
- `profile.avatar_uploaded`
- `purchase.completed`
- `referral.signup`

The text before the first dot is used as the metric name for badge triggers.

---

## Error Handling

All endpoints return standard HTTP status codes:

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid API key) |
| 403 | Forbidden (wrong project) |
| 404 | Not Found |
| 500 | Internal Server Error |

Error response format:

```json
{
  "statusCode": 400,
  "message": ["name must be a string"],
  "error": "Bad Request"
}
```
