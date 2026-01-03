# Gamify Integration Guide

This guide covers how to integrate Gamify's gamification features into your application using our official SDKs.

## Table of Contents

1. [Installation](#installation)
2. [Frontend Setup (React)](#frontend-setup-react)
3. [Backend Setup (Node.js)](#backend-setup-nodejs)
4. [Quests](#quests)
5. [Badges](#badges)
6. [Affiliate Program](#affiliate-program)
7. [Streaks](#streaks)
8. [Rewards Store](#rewards-store)
9. [Loyalty & Levels](#loyalty--levels)

---

## Installation

```bash
# Frontend (React)
npm install @gamifyio/react

# Backend (Node.js)
npm install @gamifyio/node
```

### API Keys

You'll need two types of API keys from the Gamify dashboard:

| Key Type | Prefix | Usage |
|----------|--------|-------|
| **Publishable** | `pk_live_` | Frontend SDK (safe to expose) |
| **Secret** | `sk_live_` | Backend SDK (keep private) |

---

## Frontend Setup (React)

### 1. Add the Provider

Wrap your app with `GamifyProvider` to initialize the SDK:

```tsx
import { GamifyProvider } from '@gamifyio/react';

function App() {
  return (
    <GamifyProvider config={{ apiKey: 'pk_live_your_key' }}>
      <YourApp />
    </GamifyProvider>
  );
}
```

### 2. Track Page Views

Add automatic page view tracking (works with Next.js, React Router, etc.):

```tsx
import { GamifyPageView } from '@gamifyio/react';
import { usePathname } from 'next/navigation'; // or your router

function Layout({ children }) {
  const pathname = usePathname();

  return (
    <>
      <GamifyPageView pathname={pathname} />
      {children}
    </>
  );
}
```

### 3. Identify Users

Call `identify` after login to associate events with the user:

```tsx
import { useIdentify } from '@gamifyio/react';

function LoginButton() {
  const identify = useIdentify();

  const handleLogin = async () => {
    const user = await loginUser();
    identify(user.id, {
      email: user.email,
      name: user.name,
    });
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

### 4. Track Custom Events

Track events that trigger quest progress and badge awards:

```tsx
import { useTrack } from '@gamifyio/react';

function ProfileForm() {
  const track = useTrack();

  const handleSubmit = async (data) => {
    await saveProfile(data);
    track('profile.updated', { fields: Object.keys(data) });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## Backend Setup (Node.js)

Use the Node SDK for **sensitive actions** that shouldn't be triggered from the client (purchases, referral completions, etc.).

### Initialize the Client

```typescript
import { GamifyClient } from '@gamifyio/node';

const gamify = new GamifyClient({
  secretKey: process.env.GAMIFY_SECRET_KEY, // sk_live_xxx
});
```

### Track Purchases (Server-Side Only)

```typescript
// In your checkout/payment webhook handler
app.post('/api/checkout/complete', async (req, res) => {
  const { userId, orderId, amount, items } = req.body;

  // Track purchase - triggers commission calculations
  await gamify.purchase({
    userId,
    orderId,
    amount: amount * 100, // Convert to cents
    currency: 'USD',
    items: items.map(item => ({
      productId: item.id,
      name: item.name,
      unitPrice: item.price * 100,
      quantity: item.quantity,
    })),
  });

  res.json({ success: true });
});
```

### Track Referral Success

```typescript
// When a referred user completes a qualifying action
app.post('/api/users/register', async (req, res) => {
  const { userId, email, referralCode } = req.body;

  // Create user...

  // Track referral if they used a code
  if (referralCode) {
    await gamify.referralSuccess({
      referredUserId: userId,
      referralCode,
    });
  }

  res.json({ success: true });
});
```

### Identify Users (Server-Side)

```typescript
await gamify.identify('user_123', {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'premium',
});
```

---

## Quests

Quests are multi-step missions users complete by triggering events.

### Using the Component

Drop in the pre-built quest progress component:

```tsx
import { QuestProgress } from '@gamifyio/react';

function QuestsPage() {
  return (
    <QuestProgress
      hideCompleted
      onComplete={(quest) => {
        toast.success(`Completed: ${quest.name}!`);
      }}
    />
  );
}
```

### Using the Hook (Custom UI)

Build your own UI with the `useQuests` hook:

```tsx
import { useQuests } from '@gamifyio/react';

function CustomQuestList() {
  const { quests, loading, error, refresh } = useQuests({ autoRefresh: true });

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {quests.map((quest) => (
        <div key={quest.id}>
          <h3>{quest.name}</h3>
          <p>{quest.description}</p>
          <ProgressBar value={quest.percentComplete} />
          <span>{quest.status}</span>

          <ul>
            {quest.steps.map((step) => (
              <li key={step.id}>
                {step.completed ? '✓' : '○'} {step.name}
                ({step.currentCount}/{step.requiredCount})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Triggering Quest Progress

Quest steps advance automatically when you track matching events:

```tsx
const track = useTrack();

// This advances any quest step with eventName: "profile.avatar_uploaded"
track('profile.avatar_uploaded', { avatarUrl: 'https://...' });
```

---

## Badges

Badges are achievements users earn automatically or via admin award.

### Using the Component

Display a badge collection with the pre-built grid:

```tsx
import { BadgeGrid } from '@gamifyio/react';

function BadgesPage() {
  return (
    <BadgeGrid
      showLocked        // Show unearned badges (grayscale)
      showStats         // Show "3/10 unlocked" header
      onBadgeClick={(badge) => {
        openBadgeModal(badge);
      }}
    />
  );
}
```

### Using the Hook (Custom UI)

```tsx
import { useBadges } from '@gamifyio/react';

function CustomBadgeDisplay() {
  const { badges, earned, locked, stats, loading } = useBadges({
    autoRefresh: true,
    category: 'Shopping', // Optional filter
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <p>Unlocked: {stats.unlocked} / {stats.total}</p>

      <div className="grid">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={badge.isUnlocked ? '' : 'opacity-50 grayscale'}
          >
            <img src={badge.iconUrl} alt={badge.name} />
            <span>{badge.name}</span>
            <span className={`rarity-${badge.rarity.toLowerCase()}`}>
              {badge.rarity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Badge Rarity

Badges have four rarity levels for visual distinction:

- `COMMON` - Easy to earn
- `RARE` - Moderate difficulty
- `EPIC` - Challenging
- `LEGENDARY` - Very difficult

---

## Affiliate Program

Let users earn commissions by referring new customers.

### Displaying Affiliate Stats

```tsx
import { AffiliateStats } from '@gamifyio/react';

function AffiliateDashboard() {
  return <AffiliateStats autoRefresh />;
}
```

### Referral Link Component

Display and copy the user's referral link:

```tsx
import { ReferralLink } from '@gamifyio/react';

function ShareSection() {
  return (
    <ReferralLink
      baseUrl="https://myapp.com/signup"
      shareTitle="Join MyApp!"
      shareText="Sign up using my link and we both earn rewards"
      onCopy={(link) => toast.success('Copied!')}
    />
  );
}
```

### Leaderboard

Show top affiliates:

```tsx
import { Leaderboard } from '@gamifyio/react';

function LeaderboardPage() {
  return (
    <Leaderboard
      limit={10}
      currentUserId={userId} // Highlights current user
    />
  );
}
```

### Using Hooks (Custom UI)

```tsx
import { useAffiliateStats, useReferral, useLeaderboard } from '@gamifyio/react';

function CustomAffiliateDashboard() {
  const { stats, loading } = useAffiliateStats({ autoRefresh: true });
  const { referrerCode, hasReferrer } = useReferral();
  const { leaderboard } = useLeaderboard(10);

  if (loading) return <Spinner />;

  return (
    <div>
      <p>Your referral code: {stats?.referralCode}</p>
      <p>Total referrals: {stats?.referralCount}</p>
      <p>Earnings: ${(stats?.earnings.totalEarned / 100).toFixed(2)}</p>
      <p>Pending: ${(stats?.earnings.totalPending / 100).toFixed(2)}</p>

      {hasReferrer && (
        <p>You were referred by: {referrerCode}</p>
      )}
    </div>
  );
}
```

### Detecting Referrals from URL

The SDK automatically detects `?ref=CODE` in the URL:

```tsx
import { useReferral } from '@gamifyio/react';

function SignupPage() {
  const { referrerCode, hasReferrer } = useReferral();

  // referrerCode is automatically captured from ?ref=CODE
  // Pass it to your backend when user signs up

  return (
    <form>
      {hasReferrer && (
        <p>Using referral code: {referrerCode}</p>
      )}
      {/* ... */}
    </form>
  );
}
```

### Backend: Recording Referrals & Purchases

```typescript
import { GamifyClient } from '@gamifyio/node';

const gamify = new GamifyClient({
  secretKey: process.env.GAMIFY_SECRET_KEY,
});

// When referred user signs up
app.post('/api/signup', async (req, res) => {
  const { email, referralCode } = req.body;
  const user = await createUser(email);

  if (referralCode) {
    await gamify.referralSuccess({
      referredUserId: user.id,
      referralCode,
    });
  }

  res.json({ userId: user.id });
});

// When referred user makes a purchase (triggers commission)
app.post('/api/checkout', async (req, res) => {
  const { userId, orderId, amount } = req.body;

  await gamify.purchase({
    userId,
    orderId,
    amount: amount * 100,
    currency: 'USD',
  });

  res.json({ success: true });
});
```

---

## Streaks

Track daily/weekly activity streaks with freeze mechanics.

### Using the Component

```tsx
import { StreakFlame } from '@gamifyio/react';

function StreakDisplay() {
  return (
    <StreakFlame
      showFreezeButton
      onFreeze={(ruleId, remaining) => {
        toast.success(`Freeze used! ${remaining} left`);
      }}
    />
  );
}
```

### Using the Hook

```tsx
import { useStreaks } from '@gamifyio/react';

function CustomStreakDisplay() {
  const { streaks, stats, loading, freeze } = useStreaks({ autoRefresh: true });

  return (
    <div>
      <p>Active streaks: {stats?.totalActive}</p>
      <p>Longest current: {stats?.longestCurrent}</p>

      {streaks.map((streak) => (
        <div key={streak.id}>
          <span>🔥 {streak.currentCount}</span>
          <span>{streak.name}</span>

          {streak.freezeInventory > 0 && (
            <button onClick={() => freeze(streak.id)}>
              Use Freeze ({streak.freezeInventory} left)
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Rewards Store

Let users redeem points for rewards.

### Using the Component

```tsx
import { RewardStore } from '@gamifyio/react';

function RewardsPage() {
  return (
    <RewardStore
      showPointsHeader
      onRedeem={(item, result) => {
        if (result.success) {
          toast.success(`Redeemed ${item.name}!`);
        }
      }}
    />
  );
}
```

### Using the Hook

```tsx
import { useRewards } from '@gamifyio/react';

function CustomRewardsStore() {
  const { items, userPoints, loading, redeem } = useRewards({ autoRefresh: true });

  const handleRedeem = async (itemId: string) => {
    const result = await redeem(itemId);
    if (result?.success) {
      toast.success('Reward redeemed!');
    }
  };

  return (
    <div>
      <p>Your points: {userPoints}</p>

      <div className="grid">
        {items.map((item) => (
          <div key={item.id}>
            <img src={item.imageUrl} alt={item.name} />
            <h3>{item.name}</h3>
            <p>{item.pointsCost} points</p>

            <button
              disabled={!item.isAvailable}
              onClick={() => handleRedeem(item.id)}
            >
              {item.canAfford ? 'Redeem' : `Need ${item.pointsCost - userPoints} more`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Loyalty & Levels

Display tier progression and points.

### Using the Component

```tsx
import { LevelProgress } from '@gamifyio/react';

function LoyaltySection() {
  return (
    <LevelProgress
      showNextTier
      showBenefits
    />
  );
}
```

### Using the Hook

```tsx
import { useLoyalty } from '@gamifyio/react';

function CustomLoyaltyDisplay() {
  const { profile, history, loading } = useLoyalty({ autoRefresh: true });

  if (loading) return <Spinner />;

  return (
    <div>
      <p>Points: {profile?.points}</p>
      <p>Tier: {profile?.tier?.name || 'None'}</p>

      {profile?.nextTier && (
        <div>
          <p>Next tier: {profile.nextTier.name}</p>
          <p>{profile.nextTier.pointsNeeded} points needed</p>
          <ProgressBar
            value={profile.points}
            max={profile.nextTier.minPoints}
          />
        </div>
      )}

      <h3>Recent Activity</h3>
      <ul>
        {history?.transactions.map((tx) => (
          <li key={tx.id}>
            {tx.type}: {tx.amount > 0 ? '+' : ''}{tx.amount} points
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Summary

| Feature | Frontend Component | Frontend Hook | Backend Method |
|---------|-------------------|---------------|----------------|
| **Quests** | `<QuestProgress />` | `useQuests()` | - |
| **Badges** | `<BadgeGrid />` | `useBadges()` | - |
| **Affiliate** | `<AffiliateStats />`, `<ReferralLink />`, `<Leaderboard />` | `useAffiliateStats()`, `useReferral()` | `referralSuccess()` |
| **Streaks** | `<StreakFlame />` | `useStreaks()` | - |
| **Rewards** | `<RewardStore />` | `useRewards()` | - |
| **Loyalty** | `<LevelProgress />` | `useLoyalty()` | - |
| **Purchases** | - | - | `purchase()` |
| **Identity** | `useIdentify()` | `useIdentify()` | `identify()` |
| **Events** | `useTrack()` | `useTrack()` | `track()` |

### Key Rules

1. **Use frontend SDK** for displaying data and tracking non-sensitive events
2. **Use backend SDK** for purchases, referral completions, and sensitive actions
3. **Never expose your secret key** (`sk_live_`) in client-side code
4. **Always identify users** after login to associate events with their profile
