'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Gift, Loader2 } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAddLog } from './demo-provider';

interface LoyaltyTier {
  name: string;
  minPoints: number;
  color: string;
  benefits: string[];
}

const tiers: LoyaltyTier[] = [
  { name: 'Bronze', minPoints: 0, color: '#CD7F32', benefits: ['5% back on purchases'] },
  { name: 'Silver', minPoints: 1000, color: '#C0C0C0', benefits: ['10% back', 'Free shipping'] },
  { name: 'Gold', minPoints: 5000, color: '#FFD700', benefits: ['15% back', 'Free shipping', 'Early access'] },
  { name: 'Platinum', minPoints: 10000, color: '#E5E4E2', benefits: ['20% back', 'Free shipping', 'Early access', 'VIP support'] },
];

interface DemoLoyaltyProps {
  userId: string;
  userPoints: number;
  onRedeemPoints: (points: number) => void;
}

export function DemoLoyalty({ userId, userPoints, onRedeemPoints }: DemoLoyaltyProps) {
  const addLog = useAddLog();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRedeeming, setIsRedeeming] = React.useState<number | null>(null);

  // Determine current tier
  const currentTier = [...tiers].reverse().find((tier) => userPoints >= tier.minPoints) ?? tiers[0]!;
  const nextTier = tiers.find((tier) => tier.minPoints > userPoints);

  // Calculate progress to next tier
  const progressToNext = nextTier
    ? ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const pointsToNext = nextTier ? nextTier.minPoints - userPoints : 0;

  const handleRefreshProfile = async () => {
    setIsLoading(true);

    addLog({
      type: 'request',
      method: 'GET',
      endpoint: `/v1/customer/profile?userId=${userId}`,
      data: { userId },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    addLog({
      type: 'response',
      method: '200 OK',
      data: {
        userId,
        points: userPoints,
        tier: {
          id: currentTier.name.toLowerCase(),
          name: currentTier.name,
          minPoints: currentTier.minPoints,
          benefits: currentTier.benefits,
        },
        nextTier: nextTier ? {
          id: nextTier.name.toLowerCase(),
          name: nextTier.name,
          minPoints: nextTier.minPoints,
          pointsNeeded: pointsToNext,
        } : null,
      },
    });

    setIsLoading(false);
  };

  const handleRedeem = async (points: number) => {
    if (userPoints < points) return;

    setIsRedeeming(points);

    addLog({
      type: 'request',
      method: 'POST',
      endpoint: '/loyalty/redeem',
      data: { userId, points },
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    addLog({
      type: 'response',
      method: '200 OK',
      data: {
        success: true,
        pointsRedeemed: points,
        discount: points / 100,
        remainingPoints: userPoints - points,
      },
    });

    onRedeemPoints(points);
    setIsRedeeming(null);
  };

  return (
    <GlassCard>
      <GlassCardHeader className="flex-row items-center justify-between">
        <GlassCardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Loyalty Program
        </GlassCardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshProfile}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
        </Button>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Points Balance */}
        <div className="text-center py-4">
          <motion.div
            key={userPoints}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-bold font-mono"
            style={{ color: currentTier.color }}
          >
            {userPoints.toLocaleString()}
          </motion.div>
          <p className="text-sm text-muted-foreground">points</p>
        </div>

        {/* Current Tier */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${currentTier.color}20` }}
            >
              <Award className="h-5 w-5" style={{ color: currentTier.color }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: currentTier.color }}>
                {currentTier.name}
              </p>
              <p className="text-xs text-muted-foreground">Current tier</p>
            </div>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextTier.name}</span>
              <span className="font-mono text-muted-foreground">
                {pointsToNext.toLocaleString()} pts needed
              </span>
            </div>
            <Progress value={progressToNext} className="h-2" />
          </div>
        )}

        {/* Tier Benefits */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Your benefits:</p>
          <div className="flex flex-wrap gap-2">
            {currentTier.benefits.map((benefit) => (
              <span
                key={benefit}
                className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>

        {/* Redeem Points */}
        <div className="pt-3 border-t border-border">
          <p className="text-sm font-medium mb-2">Redeem Points</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRedeem(500)}
              disabled={userPoints < 500 || isRedeeming !== null}
            >
              {isRedeeming === 500 ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Gift className="mr-1 h-4 w-4" />
              )}
              500 = $5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRedeem(1000)}
              disabled={userPoints < 1000 || isRedeeming !== null}
            >
              {isRedeeming === 1000 ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Gift className="mr-1 h-4 w-4" />
              )}
              1000 = $10
            </Button>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
