'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Pause,
  Settings,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MetricTicker } from '@/components/ui/metric-ticker';

// Mock campaign data
const campaign = {
  id: '1',
  name: 'Summer Sale 2024',
  description: 'Big discounts on summer items',
  status: 'active' as const,
  priority: 100,
  budget: 10000,
  budgetUsed: 6500,
  startDate: '2024-06-01',
  endDate: '2024-08-31',
  rules: [
    { id: '1', name: '10% off orders over $50', active: true, triggers: 1234 },
    { id: '2', name: 'Free shipping on $100+', active: true, triggers: 567 },
    { id: '3', name: 'Double points weekend', active: false, triggers: 890 },
  ],
  stats: {
    impressions: 45678,
    redemptions: 3847,
    revenue: 125430,
    conversionRate: 8.4,
  },
};

export default function CampaignDetailPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <StatusBadge variant="active" dot pulse>
                Active
              </StatusBadge>
            </div>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Impressions</p>
          <MetricTicker value={campaign.stats.impressions} className="mt-1" />
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Redemptions</p>
          <MetricTicker value={campaign.stats.redemptions} className="mt-1" />
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <MetricTicker value={campaign.stats.revenue} prefix="$" className="mt-1" />
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <MetricTicker
            value={campaign.stats.conversionRate}
            suffix="%"
            decimals={1}
            className="mt-1"
          />
        </GlassCard>
      </motion.div>

      {/* Budget progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Budget Usage</h3>
              <p className="text-sm text-muted-foreground">
                ${campaign.budgetUsed.toLocaleString()} of $
                {campaign.budget.toLocaleString()} used
              </p>
            </div>
            <span className="text-2xl font-bold">
              {Math.round((campaign.budgetUsed / campaign.budget) * 100)}%
            </span>
          </div>
          <Progress
            value={(campaign.budgetUsed / campaign.budget) * 100}
            className="h-3"
          />
        </GlassCard>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="rules">
          <TabsList>
            <TabsTrigger value="rules">
              <Settings className="mr-2 h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <GlassCardTitle>Campaign Rules</GlassCardTitle>
                <GlowButton size="sm" asChild>
                  <Link href="/dashboard/automations/new">
                    <Sparkles className="mr-2 h-4 w-4" />
                    New Automation
                  </Link>
                </GlowButton>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-3">
                  {campaign.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-surface-1"
                    >
                      <div className="flex items-center gap-3">
                        <StatusBadge
                          variant={rule.active ? 'active' : 'inactive'}
                          dot
                        >
                          {rule.active ? 'Active' : 'Inactive'}
                        </StatusBadge>
                        <span className="font-medium">{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {rule.triggers.toLocaleString()} triggers
                        </span>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="analytics">
            <GlassCard className="p-6">
              <p className="text-muted-foreground text-center py-12">
                Analytics charts coming soon...
              </p>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
