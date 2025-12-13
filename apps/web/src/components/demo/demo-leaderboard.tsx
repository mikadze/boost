'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, RefreshCw, Loader2 } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useAddLog } from './demo-provider';

interface AffiliateTier {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  referralCount: number;
  totalEarnings: number;
  tier: AffiliateTier | null;
}

// Mock leaderboard data including demo users
const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'top_affiliate_1', displayName: 'Sarah M.', referralCount: 156, totalEarnings: 234500, tier: { id: 'elite', name: 'Elite', type: 'PERCENTAGE', value: 15 } },
  { rank: 2, userId: 'top_affiliate_2', displayName: 'Mike T.', referralCount: 124, totalEarnings: 186000, tier: { id: 'elite', name: 'Elite', type: 'PERCENTAGE', value: 15 } },
  { rank: 3, userId: 'demo_gold', displayName: 'Jordan Gold', referralCount: 47, totalEarnings: 89500, tier: { id: 'elite', name: 'Elite', type: 'PERCENTAGE', value: 15 } },
  { rank: 4, userId: 'top_affiliate_3', displayName: 'Emily R.', referralCount: 38, totalEarnings: 57000, tier: { id: 'pro', name: 'Pro', type: 'PERCENTAGE', value: 10 } },
  { rank: 5, userId: 'demo_silver', displayName: 'Sam Silver', referralCount: 12, totalEarnings: 18500, tier: { id: 'pro', name: 'Pro', type: 'PERCENTAGE', value: 10 } },
  { rank: 6, userId: 'top_affiliate_4', displayName: 'Chris B.', referralCount: 8, totalEarnings: 12000, tier: { id: 'starter', name: 'Starter', type: 'PERCENTAGE', value: 5 } },
  { rank: 7, userId: 'demo_bronze', displayName: 'Alex Bronze', referralCount: 3, totalEarnings: 4500, tier: { id: 'starter', name: 'Starter', type: 'PERCENTAGE', value: 5 } },
];

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

const getMedalColor = (rank: number): string | null => {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return null;
  }
};

interface DemoLeaderboardProps {
  currentUserId: string | null;
}

export function DemoLeaderboard({ currentUserId }: DemoLeaderboardProps) {
  const addLog = useAddLog();
  const [isLoading, setIsLoading] = React.useState(false);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>(mockLeaderboard);

  const handleRefresh = async () => {
    setIsLoading(true);

    addLog({
      type: 'request',
      method: 'GET',
      endpoint: '/v1/affiliate/leaderboard?limit=10',
      data: { limit: 10 },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    addLog({
      type: 'response',
      method: '200 OK',
      data: {
        entries: mockLeaderboard,
        total: mockLeaderboard.length,
        currentUserRank: currentUserId
          ? mockLeaderboard.find((e) => e.userId === currentUserId)?.rank
          : undefined,
      },
    });

    setLeaderboard(mockLeaderboard);
    setIsLoading(false);
  };

  const currentUserRank = currentUserId
    ? leaderboard.find((e) => e.userId === currentUserId)?.rank
    : null;

  return (
    <GlassCard>
      <GlassCardHeader className="flex-row items-center justify-between">
        <GlassCardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Affiliate Leaderboard
        </GlassCardTitle>
        <div className="flex items-center gap-2">
          {currentUserRank && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              Your rank: #{currentUserRank}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {leaderboard.map((entry, index) => {
              const medalColor = getMedalColor(entry.rank);
              const isCurrentUser = entry.userId === currentUserId;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCurrentUser
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-surface-1'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      {medalColor ? (
                        <Medal
                          className="h-6 w-6"
                          style={{ color: medalColor }}
                        />
                      ) : (
                        <span className="text-sm font-mono text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Name & Tier */}
                    <div>
                      <p className={`font-medium text-sm ${isCurrentUser ? 'text-primary' : ''}`}>
                        {entry.displayName}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(You)</span>
                        )}
                      </p>
                      {entry.tier && (
                        <p className="text-xs text-muted-foreground">
                          {entry.tier.name} ({entry.tier.value}%)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium">
                      {entry.referralCount} referrals
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatCurrency(entry.totalEarnings)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Rankings based on total referrals
        </p>
      </GlassCardContent>
    </GlassCard>
  );
}
