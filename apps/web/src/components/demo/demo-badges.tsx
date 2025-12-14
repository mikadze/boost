'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Medal, Lock, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAddLog } from './demo-provider';

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  triggerMetric: string;
  threshold: number;
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

// Rarity colors and labels
const rarityConfig = {
  common: { color: '#9CA3AF', label: 'Common', bg: 'bg-gray-500/10' },
  rare: { color: '#3B82F6', label: 'Rare', bg: 'bg-blue-500/10' },
  epic: { color: '#8B5CF6', label: 'Epic', bg: 'bg-purple-500/10' },
  legendary: { color: '#F59E0B', label: 'Legendary', bg: 'bg-amber-500/10' },
};

// Mock badge data per demo user
const mockBadges: Record<string, Badge[]> = {
  demo_bronze: [
    {
      id: 'b1',
      name: 'Early Bird',
      description: 'Create your first account',
      iconUrl: '/badges/early-bird.svg',
      rarity: 'common',
      category: 'Onboarding',
      triggerMetric: 'account_created',
      threshold: 1,
      currentProgress: 1,
      isUnlocked: true,
      unlockedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'b2',
      name: 'Window Shopper',
      description: 'View 10 products',
      iconUrl: '/badges/window-shopper.svg',
      rarity: 'common',
      category: 'Engagement',
      triggerMetric: 'products_viewed',
      threshold: 10,
      currentProgress: 7,
      isUnlocked: false,
    },
    {
      id: 'b3',
      name: 'First Purchase',
      description: 'Complete your first purchase',
      iconUrl: '/badges/first-purchase.svg',
      rarity: 'rare',
      category: 'Purchase',
      triggerMetric: 'purchases_made',
      threshold: 1,
      currentProgress: 0,
      isUnlocked: false,
    },
    {
      id: 'b4',
      name: 'Social Star',
      description: 'Refer 5 friends',
      iconUrl: '/badges/social-star.svg',
      rarity: 'epic',
      category: 'Social',
      triggerMetric: 'referrals_made',
      threshold: 5,
      currentProgress: 0,
      isUnlocked: false,
    },
  ],
  demo_silver: [
    {
      id: 'b1',
      name: 'Early Bird',
      description: 'Create your first account',
      iconUrl: '/badges/early-bird.svg',
      rarity: 'common',
      category: 'Onboarding',
      triggerMetric: 'account_created',
      threshold: 1,
      currentProgress: 1,
      isUnlocked: true,
      unlockedAt: '2024-01-10T09:15:00Z',
    },
    {
      id: 'b2',
      name: 'Window Shopper',
      description: 'View 10 products',
      iconUrl: '/badges/window-shopper.svg',
      rarity: 'common',
      category: 'Engagement',
      triggerMetric: 'products_viewed',
      threshold: 10,
      currentProgress: 10,
      isUnlocked: true,
      unlockedAt: '2024-01-12T14:22:00Z',
    },
    {
      id: 'b3',
      name: 'First Purchase',
      description: 'Complete your first purchase',
      iconUrl: '/badges/first-purchase.svg',
      rarity: 'rare',
      category: 'Purchase',
      triggerMetric: 'purchases_made',
      threshold: 1,
      currentProgress: 1,
      isUnlocked: true,
      unlockedAt: '2024-01-14T16:45:00Z',
    },
    {
      id: 'b4',
      name: 'Loyal Customer',
      description: 'Make 10 purchases',
      iconUrl: '/badges/loyal-customer.svg',
      rarity: 'epic',
      category: 'Purchase',
      triggerMetric: 'purchases_made',
      threshold: 10,
      currentProgress: 3,
      isUnlocked: false,
    },
    {
      id: 'b5',
      name: 'Social Star',
      description: 'Refer 5 friends',
      iconUrl: '/badges/social-star.svg',
      rarity: 'epic',
      category: 'Social',
      triggerMetric: 'referrals_made',
      threshold: 5,
      currentProgress: 2,
      isUnlocked: false,
    },
  ],
  demo_gold: [
    {
      id: 'b1',
      name: 'Early Bird',
      description: 'Create your first account',
      iconUrl: '/badges/early-bird.svg',
      rarity: 'common',
      category: 'Onboarding',
      triggerMetric: 'account_created',
      threshold: 1,
      currentProgress: 1,
      isUnlocked: true,
      unlockedAt: '2023-06-01T08:00:00Z',
    },
    {
      id: 'b2',
      name: 'Window Shopper',
      description: 'View 10 products',
      iconUrl: '/badges/window-shopper.svg',
      rarity: 'common',
      category: 'Engagement',
      triggerMetric: 'products_viewed',
      threshold: 10,
      currentProgress: 10,
      isUnlocked: true,
      unlockedAt: '2023-06-05T11:30:00Z',
    },
    {
      id: 'b3',
      name: 'First Purchase',
      description: 'Complete your first purchase',
      iconUrl: '/badges/first-purchase.svg',
      rarity: 'rare',
      category: 'Purchase',
      triggerMetric: 'purchases_made',
      threshold: 1,
      currentProgress: 1,
      isUnlocked: true,
      unlockedAt: '2023-06-10T15:20:00Z',
    },
    {
      id: 'b4',
      name: 'Loyal Customer',
      description: 'Make 10 purchases',
      iconUrl: '/badges/loyal-customer.svg',
      rarity: 'epic',
      category: 'Purchase',
      triggerMetric: 'purchases_made',
      threshold: 10,
      currentProgress: 10,
      isUnlocked: true,
      unlockedAt: '2023-09-20T12:00:00Z',
    },
    {
      id: 'b5',
      name: 'Social Star',
      description: 'Refer 5 friends',
      iconUrl: '/badges/social-star.svg',
      rarity: 'epic',
      category: 'Social',
      triggerMetric: 'referrals_made',
      threshold: 5,
      currentProgress: 5,
      isUnlocked: true,
      unlockedAt: '2023-08-15T09:45:00Z',
    },
    {
      id: 'b6',
      name: 'VIP Legend',
      description: 'Reach Gold tier status',
      iconUrl: '/badges/vip-legend.svg',
      rarity: 'legendary',
      category: 'Status',
      triggerMetric: 'tier_reached',
      threshold: 3,
      currentProgress: 3,
      isUnlocked: true,
      unlockedAt: '2023-11-01T10:00:00Z',
    },
  ],
  demo_new: [
    {
      id: 'b1',
      name: 'Early Bird',
      description: 'Create your first account',
      iconUrl: '/badges/early-bird.svg',
      rarity: 'common',
      category: 'Onboarding',
      triggerMetric: 'account_created',
      threshold: 1,
      currentProgress: 0,
      isUnlocked: false,
    },
    {
      id: 'b2',
      name: 'Window Shopper',
      description: 'View 10 products',
      iconUrl: '/badges/window-shopper.svg',
      rarity: 'common',
      category: 'Engagement',
      triggerMetric: 'products_viewed',
      threshold: 10,
      currentProgress: 0,
      isUnlocked: false,
    },
    {
      id: 'b3',
      name: 'First Purchase',
      description: 'Complete your first purchase',
      iconUrl: '/badges/first-purchase.svg',
      rarity: 'rare',
      category: 'Purchase',
      triggerMetric: 'purchases_made',
      threshold: 1,
      currentProgress: 0,
      isUnlocked: false,
    },
  ],
};

interface DemoBadgesProps {
  userId: string;
}

export function DemoBadges({ userId }: DemoBadgesProps) {
  const addLog = useAddLog();
  const [isLoading, setIsLoading] = React.useState(false);
  const [badges, setBadges] = React.useState<Badge[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'unlocked' | 'locked'>('all');

  // Load badges on mount or user change
  React.useEffect(() => {
    const userBadges = mockBadges[userId] ?? mockBadges['demo_new']!;
    setBadges(userBadges);
  }, [userId]);

  const handleRefresh = async () => {
    setIsLoading(true);

    addLog({
      type: 'request',
      method: 'GET',
      endpoint: `/v1/customer/badges`,
      data: { userId },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const userBadges = mockBadges[userId] ?? mockBadges['demo_new']!;

    addLog({
      type: 'response',
      method: '200 OK',
      data: { badges: userBadges },
    });

    setBadges(userBadges);
    setIsLoading(false);
  };

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'unlocked') return badge.isUnlocked;
    if (filter === 'locked') return !badge.isUnlocked;
    return true;
  });

  const unlockedCount = badges.filter((b) => b.isUnlocked).length;
  const totalCount = badges.length;

  return (
    <GlassCard>
      <GlassCardHeader className="flex-row items-center justify-between">
        <GlassCardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Achievements
        </GlassCardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Refresh'
          )}
        </Button>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{unlockedCount} / {totalCount}</p>
              <p className="text-xs text-muted-foreground">Badges Earned</p>
            </div>
          </div>
          <div className="w-24">
            <Progress value={(unlockedCount / totalCount) * 100} className="h-2" />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-1 text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unlocked' ? 'Earned' : 'Locked'}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredBadges.map((badge) => {
              const rarity = rarityConfig[badge.rarity];
              const progress = (badge.currentProgress / badge.threshold) * 100;

              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`relative p-3 rounded-lg border transition-all ${
                    badge.isUnlocked
                      ? `${rarity.bg} border-current/20`
                      : 'bg-muted/30 border-border opacity-60'
                  }`}
                  style={badge.isUnlocked ? { borderColor: `${rarity.color}40` } : undefined}
                >
                  {/* Badge Icon */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        badge.isUnlocked ? '' : 'bg-muted'
                      }`}
                      style={badge.isUnlocked ? { backgroundColor: `${rarity.color}20` } : undefined}
                    >
                      {badge.isUnlocked ? (
                        <Medal className="h-4 w-4" style={{ color: rarity.color }} />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    {badge.isUnlocked && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 absolute top-2 right-2" />
                    )}
                  </div>

                  {/* Badge Info */}
                  <h4 className="font-medium text-sm truncate">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {badge.description}
                  </p>

                  {/* Rarity Badge */}
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${rarity.color}20`,
                      color: rarity.color,
                    }}
                  >
                    {rarity.label}
                  </span>

                  {/* Progress (for locked badges) */}
                  {!badge.isUnlocked && (
                    <div className="mt-2">
                      <Progress value={progress} className="h-1" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {badge.currentProgress} / {badge.threshold}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Medal className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No badges found</p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
