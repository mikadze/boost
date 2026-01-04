'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Percent, CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';

interface TierRule {
  id: string;
  name: string;
  commission: number;
  minReferrals: number;
  color: string;
  benefits: string[];
}

// Tier definitions with requirements
const TIER_RULES: TierRule[] = [
  {
    id: 'starter',
    name: 'Starter',
    commission: 5,
    minReferrals: 0,
    color: '#CD7F32',
    benefits: ['5% commission on referral purchases', 'Unique referral link', 'Basic analytics'],
  },
  {
    id: 'pro',
    name: 'Pro',
    commission: 10,
    minReferrals: 10,
    color: '#C0C0C0',
    benefits: ['10% commission on referral purchases', 'Priority support', 'Advanced analytics', 'Early access to promotions'],
  },
  {
    id: 'elite',
    name: 'Elite',
    commission: 15,
    minReferrals: 25,
    color: '#FFD700',
    benefits: ['15% commission on referral purchases', 'Dedicated account manager', 'Custom referral codes', 'Exclusive bonuses', 'VIP perks'],
  },
];

// Mock referral counts per demo user
const mockReferralCounts: Record<string, number> = {
  demo_bronze: 3,
  demo_silver: 12,
  demo_gold: 47,
  demo_new: 0,
};

interface DemoReferralRulesProps {
  userId: string;
}

export function DemoReferralRules({ userId }: DemoReferralRulesProps) {
  const referralCount = mockReferralCounts[userId] ?? 0;

  // Determine current tier based on referral count
  const currentTier = [...TIER_RULES].reverse().find(tier => referralCount >= tier.minReferrals) ?? TIER_RULES[0]!;
  const currentTierIndex = TIER_RULES.findIndex(t => t.id === currentTier.id);
  const nextTier = TIER_RULES[currentTierIndex + 1];

  // Calculate progress to next tier
  const progressToNext = nextTier
    ? ((referralCount - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100
    : 100;

  const referralsToNext = nextTier ? nextTier.minReferrals - referralCount : 0;

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Affiliate Program
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        {/* Current Status */}
        <div className="p-3 rounded-lg bg-surface-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Your Status</span>
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${currentTier.color}20`, color: currentTier.color }}
            >
              <Award className="h-3 w-3" />
              {currentTier.name}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-medium">{referralCount}</span>
            <span className="text-muted-foreground">referrals</span>
          </div>

          {/* Progress to Next Tier */}
          {nextTier && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Progress to {nextTier.name}</span>
                <span>{referralsToNext} referrals needed</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}
        </div>

        {/* Tier Cards */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Tier Levels</p>
          {TIER_RULES.map((tier, index) => {
            const isCurrentTier = tier.id === currentTier.id;
            const isUnlocked = referralCount >= tier.minReferrals;
            const isPreviousTier = index < currentTierIndex;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-lg border transition-all ${
                  isCurrentTier
                    ? 'border-2'
                    : isUnlocked || isPreviousTier
                    ? 'border-border bg-surface-1'
                    : 'border-border bg-muted/30 opacity-75'
                }`}
                style={isCurrentTier ? { borderColor: tier.color, backgroundColor: `${tier.color}10` } : undefined}
              >
                {/* Current Tier Badge */}
                {isCurrentTier && (
                  <div
                    className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ backgroundColor: tier.color, color: '#fff' }}
                  >
                    Current
                  </div>
                )}

                {/* Tier Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isUnlocked || isPreviousTier ? (
                      <CheckCircle2 className="h-4 w-4" style={{ color: tier.color }} />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold" style={{ color: isUnlocked || isPreviousTier ? tier.color : undefined }}>
                      {tier.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-mono font-bold" style={{ color: tier.color }}>
                    <Percent className="h-3.5 w-3.5" />
                    {tier.commission}
                  </div>
                </div>

                {/* Unlock Requirement */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Users className="h-3.5 w-3.5" />
                  {tier.minReferrals === 0 ? (
                    <span>Default tier for all affiliates</span>
                  ) : (
                    <span>Unlock at {tier.minReferrals} referrals</span>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-1.5">
                  {tier.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 text-xs ${
                        isUnlocked || isPreviousTier ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <ChevronRight className="h-3 w-3 shrink-0" style={{ color: tier.color }} />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
