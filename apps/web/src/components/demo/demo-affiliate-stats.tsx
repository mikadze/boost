'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, TrendingUp, RefreshCw, Copy, Check, Crown, Loader2 } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useAddLog } from './demo-provider';
import { DemoCodeToggle } from './sdk-code-snippet';
import { SDK_SNIPPETS } from './sdk-snippets';

interface AffiliateTier {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  color: string;
}

interface AffiliateStats {
  userId: string;
  referralCode: string;
  referralCount: number;
  earnings: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    transactionCount: number;
    currency: string;
  };
  tier: AffiliateTier | null;
}

// Mock affiliate stats per demo user
const mockAffiliateStats: Record<string, AffiliateStats> = {
  demo_bronze: {
    userId: 'demo_bronze',
    referralCode: 'ALEX2024',
    referralCount: 3,
    earnings: {
      totalEarned: 4500,
      totalPending: 1200,
      totalPaid: 3300,
      transactionCount: 5,
      currency: 'USD',
    },
    tier: { id: 'starter', name: 'Starter', type: 'PERCENTAGE', value: 5, color: '#CD7F32' },
  },
  demo_silver: {
    userId: 'demo_silver',
    referralCode: 'SAMREF',
    referralCount: 12,
    earnings: {
      totalEarned: 18500,
      totalPending: 3200,
      totalPaid: 15300,
      transactionCount: 18,
      currency: 'USD',
    },
    tier: { id: 'pro', name: 'Pro', type: 'PERCENTAGE', value: 10, color: '#C0C0C0' },
  },
  demo_gold: {
    userId: 'demo_gold',
    referralCode: 'JORDAN_VIP',
    referralCount: 47,
    earnings: {
      totalEarned: 89500,
      totalPending: 12000,
      totalPaid: 77500,
      transactionCount: 65,
      currency: 'USD',
    },
    tier: { id: 'elite', name: 'Elite', type: 'PERCENTAGE', value: 15, color: '#FFD700' },
  },
  demo_new: {
    userId: 'demo_new',
    referralCode: 'NEWBIE123',
    referralCount: 0,
    earnings: {
      totalEarned: 0,
      totalPending: 0,
      totalPaid: 0,
      transactionCount: 0,
      currency: 'USD',
    },
    tier: null,
  },
};

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

interface DemoAffiliateStatsProps {
  userId: string;
}

export function DemoAffiliateStats({ userId }: DemoAffiliateStatsProps) {
  const addLog = useAddLog();
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [stats, setStats] = React.useState<AffiliateStats | null>(null);

  // Load stats on mount or user change
  React.useEffect(() => {
    const userStats = mockAffiliateStats[userId] ?? mockAffiliateStats['demo_new']!;
    setStats(userStats);
  }, [userId]);

  const handleRefresh = async () => {
    setIsLoading(true);

    addLog({
      type: 'request',
      method: 'GET',
      endpoint: `/v1/affiliate/stats?userId=${userId}`,
      data: { userId },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const userStats = mockAffiliateStats[userId] ?? mockAffiliateStats['demo_new']!;

    addLog({
      type: 'response',
      method: '200 OK',
      data: { stats: userStats },
    });

    setStats(userStats);
    setIsLoading(false);
  };

  const handleCopyCode = async () => {
    if (!stats?.referralCode) return;

    addLog({
      type: 'event',
      method: 'copy',
      data: { referralCode: stats.referralCode },
    });

    await navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!stats) {
    return null;
  }

  return (
    <DemoCodeToggle {...SDK_SNIPPETS.affiliateStats}>
      <GlassCard>
        <GlassCardHeader className="flex-row items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Affiliate Dashboard
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
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Tier Badge */}
        {stats.tier ? (
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ backgroundColor: `${stats.tier.color}20` }}
          >
            <Crown className="h-5 w-5" style={{ color: stats.tier.color }} />
            <div>
              <p className="font-medium" style={{ color: stats.tier.color }}>
                {stats.tier.name} Affiliate
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.tier.value}% commission rate
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Crown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">No Tier</p>
              <p className="text-xs text-muted-foreground">
                Refer users to unlock affiliate status
              </p>
            </div>
          </div>
        )}

        {/* Referral Code */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-1">
          <div>
            <p className="text-xs text-muted-foreground">Your referral code</p>
            <p className="font-mono font-medium">{stats.referralCode}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyCode}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            key={`referrals-${stats.referralCount}`}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-3 rounded-lg bg-surface-1"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Referrals</span>
            </div>
            <p className="text-2xl font-bold font-mono">{stats.referralCount}</p>
          </motion.div>

          <motion.div
            key={`transactions-${stats.earnings.transactionCount}`}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-3 rounded-lg bg-surface-1"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Commissions</span>
            </div>
            <p className="text-2xl font-bold font-mono">{stats.earnings.transactionCount}</p>
          </motion.div>
        </div>

        {/* Earnings Breakdown */}
        <div className="pt-3 border-t border-border space-y-2">
          <p className="text-sm font-medium">Earnings</p>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Earned</span>
            <motion.span
              key={`earned-${stats.earnings.totalEarned}`}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="font-mono font-medium text-green-500"
            >
              {formatCurrency(stats.earnings.totalEarned)}
            </motion.span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pending</span>
            <span className="font-mono text-yellow-500">
              {formatCurrency(stats.earnings.totalPending)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Paid Out</span>
            <span className="font-mono text-muted-foreground">
              {formatCurrency(stats.earnings.totalPaid)}
            </span>
          </div>
        </div>
      </GlassCardContent>
      </GlassCard>
    </DemoCodeToggle>
  );
}
