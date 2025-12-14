'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Workflow, Zap, Clock, CheckCircle2, Loader2, Play, Pause, ChevronRight } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useAddLog } from './demo-provider';

interface CampaignRule {
  id: string;
  eventType: string;
  condition: string;
  effect: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'scheduled' | 'ended';
  priority: number;
  rules: CampaignRule[];
  triggerCount: number;
  lastTriggered?: string;
  schedule?: {
    startDate: string;
    endDate?: string;
    daysOfWeek?: string[];
  };
}

interface RecentTrigger {
  id: string;
  campaignId: string;
  campaignName: string;
  ruleName: string;
  effect: string;
  triggeredAt: string;
}

// Mock campaign data
const mockCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Welcome Bonus',
    description: 'Award points to new users on first login',
    status: 'active',
    priority: 1,
    rules: [
      {
        id: 'r1',
        eventType: 'user_login',
        condition: 'isFirstLogin == true',
        effect: 'award_points(500)',
      },
    ],
    triggerCount: 1247,
    lastTriggered: '2024-01-15T14:30:00Z',
  },
  {
    id: 'c2',
    name: 'Double Points Weekend',
    description: '2x points on all purchases during weekends',
    status: 'active',
    priority: 2,
    rules: [
      {
        id: 'r2',
        eventType: 'purchase',
        condition: 'dayOfWeek in ["Saturday", "Sunday"]',
        effect: 'multiply_points(2)',
      },
    ],
    triggerCount: 523,
    lastTriggered: '2024-01-14T11:22:00Z',
    schedule: {
      startDate: '2024-01-01',
      daysOfWeek: ['Saturday', 'Sunday'],
    },
  },
  {
    id: 'c3',
    name: 'Big Spender Reward',
    description: 'Bonus points for orders over $100',
    status: 'active',
    priority: 3,
    rules: [
      {
        id: 'r3',
        eventType: 'purchase',
        condition: 'order.total >= 100',
        effect: 'award_points(100)',
      },
    ],
    triggerCount: 89,
    lastTriggered: '2024-01-15T09:45:00Z',
  },
  {
    id: 'c4',
    name: 'Referral Bonus',
    description: 'Reward successful referrals',
    status: 'paused',
    priority: 4,
    rules: [
      {
        id: 'r4',
        eventType: 'referral_success',
        condition: 'referredUser.firstPurchase == true',
        effect: 'award_points(1000)',
      },
    ],
    triggerCount: 156,
    lastTriggered: '2024-01-10T16:00:00Z',
  },
];

// Mock recent triggers for the current user
const mockRecentTriggers: Record<string, RecentTrigger[]> = {
  demo_bronze: [
    {
      id: 't1',
      campaignId: 'c1',
      campaignName: 'Welcome Bonus',
      ruleName: 'First Login Reward',
      effect: '+500 points',
      triggeredAt: '2024-01-15T10:30:00Z',
    },
  ],
  demo_silver: [
    {
      id: 't1',
      campaignId: 'c1',
      campaignName: 'Welcome Bonus',
      ruleName: 'First Login Reward',
      effect: '+500 points',
      triggeredAt: '2024-01-10T09:15:00Z',
    },
    {
      id: 't2',
      campaignId: 'c3',
      campaignName: 'Big Spender Reward',
      ruleName: 'Order > $100',
      effect: '+100 points',
      triggeredAt: '2024-01-14T15:20:00Z',
    },
    {
      id: 't3',
      campaignId: 'c2',
      campaignName: 'Double Points Weekend',
      ruleName: 'Weekend Purchase',
      effect: '2x points multiplier',
      triggeredAt: '2024-01-14T11:00:00Z',
    },
  ],
  demo_gold: [
    {
      id: 't1',
      campaignId: 'c1',
      campaignName: 'Welcome Bonus',
      ruleName: 'First Login Reward',
      effect: '+500 points',
      triggeredAt: '2023-06-01T08:00:00Z',
    },
    {
      id: 't2',
      campaignId: 'c3',
      campaignName: 'Big Spender Reward',
      ruleName: 'Order > $100',
      effect: '+100 points',
      triggeredAt: '2024-01-14T16:45:00Z',
    },
    {
      id: 't3',
      campaignId: 'c2',
      campaignName: 'Double Points Weekend',
      ruleName: 'Weekend Purchase',
      effect: '2x points multiplier',
      triggeredAt: '2024-01-14T12:30:00Z',
    },
    {
      id: 't4',
      campaignId: 'c4',
      campaignName: 'Referral Bonus',
      ruleName: 'Successful Referral',
      effect: '+1000 points',
      triggeredAt: '2023-08-15T09:45:00Z',
    },
  ],
  demo_new: [],
};

interface DemoCampaignsProps {
  userId: string;
}

export function DemoCampaigns({ userId }: DemoCampaignsProps) {
  const addLog = useAddLog();
  const [isLoading, setIsLoading] = React.useState(false);
  const [campaigns] = React.useState<Campaign[]>(mockCampaigns);
  const [recentTriggers, setRecentTriggers] = React.useState<RecentTrigger[]>([]);
  const [expandedCampaign, setExpandedCampaign] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'campaigns' | 'history'>('campaigns');

  // Load recent triggers on mount or user change
  React.useEffect(() => {
    const userTriggers = mockRecentTriggers[userId] ?? mockRecentTriggers['demo_new']!;
    setRecentTriggers(userTriggers);
  }, [userId]);

  const handleRefresh = async () => {
    setIsLoading(true);

    addLog({
      type: 'request',
      method: 'GET',
      endpoint: `/v1/customer/campaigns/history`,
      data: { userId },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const userTriggers = mockRecentTriggers[userId] ?? mockRecentTriggers['demo_new']!;

    addLog({
      type: 'response',
      method: '200 OK',
      data: { triggers: userTriggers, activeCampaigns: campaigns.filter(c => c.status === 'active').length },
    });

    setRecentTriggers(userTriggers);
    setIsLoading(false);
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-500/10';
      case 'paused':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'scheduled':
        return 'text-blue-500 bg-blue-500/10';
      case 'ended':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      case 'scheduled':
        return <Clock className="h-3 w-3" />;
      default:
        return <CheckCircle2 className="h-3 w-3" />;
    }
  };

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <GlassCard>
      <GlassCardHeader className="flex-row items-center justify-between">
        <GlassCardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5" />
          Automations
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
        {/* Stats Summary */}
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-lg font-bold text-green-500">{activeCampaigns.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Active Rules</p>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-lg font-bold text-primary">{recentTriggers.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Your Triggers</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('campaigns')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              view === 'campaigns'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-1 text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Campaigns
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              view === 'history'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-1 text-muted-foreground hover:text-foreground'
            }`}
          >
            My History
          </button>
        </div>

        {/* Campaign List */}
        {view === 'campaigns' && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {activeCampaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="rounded-lg border border-border bg-surface-1 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCampaign(expandedCampaign === campaign.id ? null : campaign.id)}
                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{campaign.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{campaign.description}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedCampaign === campaign.id ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {/* Expanded Rules */}
                  <AnimatePresence>
                    {expandedCampaign === campaign.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          {campaign.rules.map((rule, idx) => (
                            <div
                              key={rule.id}
                              className="p-2 rounded bg-background/50 text-xs font-mono"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted-foreground">Rule {idx + 1}:</span>
                                <span className="text-primary">{rule.eventType}</span>
                              </div>
                              <div className="text-muted-foreground">
                                <span className="text-yellow-500">if</span> {rule.condition}
                              </div>
                              <div className="text-muted-foreground">
                                <span className="text-green-500">then</span> {rule.effect}
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                            <span>Triggered {campaign.triggerCount.toLocaleString()} times</span>
                            {campaign.lastTriggered && (
                              <span>Last: {formatDate(campaign.lastTriggered)}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {recentTriggers.length > 0 ? (
                recentTriggers.map((trigger) => (
                  <motion.div
                    key={trigger.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="p-3 rounded-lg bg-surface-1 border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{trigger.campaignName}</p>
                          <p className="text-xs text-muted-foreground">{trigger.ruleName}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-green-500">{trigger.effect}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground">
                      {formatDate(trigger.triggeredAt)}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Workflow className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No triggers yet</p>
                  <p className="text-xs mt-1">Complete actions to trigger automations</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
