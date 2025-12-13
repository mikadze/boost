'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, Loader2, ChevronRight, Award } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAddLog } from './demo-provider';

interface QuestStep {
  id: string;
  title: string;
  description: string;
  eventName: string;
  requiredCount: number;
  currentCount: number;
  isComplete: boolean;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  rewardXp: number;
  status: 'not_started' | 'in_progress' | 'completed';
  percentComplete: number;
  steps: QuestStep[];
}

// Mock quest data per demo user
const mockQuests: Record<string, Quest[]> = {
  demo_bronze: [
    {
      id: 'q1',
      name: 'Welcome Journey',
      description: 'Complete your profile and explore the platform',
      rewardXp: 500,
      status: 'in_progress',
      percentComplete: 60,
      steps: [
        { id: 's1', title: 'Create Account', description: 'Sign up for a new account', eventName: 'user_signup', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's2', title: 'Complete Profile', description: 'Fill in your profile details', eventName: 'profile_completed', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's3', title: 'Browse Products', description: 'View at least 5 products', eventName: 'product_viewed', requiredCount: 5, currentCount: 3, isComplete: false },
        { id: 's4', title: 'Add to Cart', description: 'Add an item to your cart', eventName: 'add_to_cart', requiredCount: 1, currentCount: 0, isComplete: false },
        { id: 's5', title: 'Make a Purchase', description: 'Complete your first purchase', eventName: 'purchase', requiredCount: 1, currentCount: 0, isComplete: false },
      ],
    },
    {
      id: 'q2',
      name: 'Social Butterfly',
      description: 'Connect and share with friends',
      rewardXp: 300,
      status: 'not_started',
      percentComplete: 0,
      steps: [
        { id: 's1', title: 'Share a Product', description: 'Share a product with friends', eventName: 'product_shared', requiredCount: 1, currentCount: 0, isComplete: false },
        { id: 's2', title: 'Refer a Friend', description: 'Invite a friend to join', eventName: 'referral_sent', requiredCount: 1, currentCount: 0, isComplete: false },
      ],
    },
  ],
  demo_silver: [
    {
      id: 'q1',
      name: 'Welcome Journey',
      description: 'Complete your profile and explore the platform',
      rewardXp: 500,
      status: 'completed',
      percentComplete: 100,
      steps: [
        { id: 's1', title: 'Create Account', description: 'Sign up', eventName: 'user_signup', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's2', title: 'Complete Profile', description: 'Fill profile', eventName: 'profile_completed', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's3', title: 'Browse Products', description: 'View 5 products', eventName: 'product_viewed', requiredCount: 5, currentCount: 5, isComplete: true },
        { id: 's4', title: 'Add to Cart', description: 'Add to cart', eventName: 'add_to_cart', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's5', title: 'Make a Purchase', description: 'First purchase', eventName: 'purchase', requiredCount: 1, currentCount: 1, isComplete: true },
      ],
    },
    {
      id: 'q2',
      name: 'Power Shopper',
      description: 'Make multiple purchases',
      rewardXp: 1000,
      status: 'in_progress',
      percentComplete: 40,
      steps: [
        { id: 's1', title: 'Make 5 Purchases', description: 'Complete 5 orders', eventName: 'purchase', requiredCount: 5, currentCount: 2, isComplete: false },
        { id: 's2', title: 'Spend $500', description: 'Total spend of $500', eventName: 'purchase', requiredCount: 50000, currentCount: 25000, isComplete: false },
      ],
    },
  ],
  demo_gold: [
    {
      id: 'q1',
      name: 'Welcome Journey',
      description: 'Complete your profile and explore the platform',
      rewardXp: 500,
      status: 'completed',
      percentComplete: 100,
      steps: [
        { id: 's1', title: 'Create Account', description: 'Sign up', eventName: 'user_signup', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's2', title: 'Complete Profile', description: 'Fill profile', eventName: 'profile_completed', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's3', title: 'Browse Products', description: 'View 5 products', eventName: 'product_viewed', requiredCount: 5, currentCount: 5, isComplete: true },
        { id: 's4', title: 'Add to Cart', description: 'Add to cart', eventName: 'add_to_cart', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's5', title: 'Make a Purchase', description: 'First purchase', eventName: 'purchase', requiredCount: 1, currentCount: 1, isComplete: true },
      ],
    },
    {
      id: 'q2',
      name: 'Power Shopper',
      description: 'Make multiple purchases',
      rewardXp: 1000,
      status: 'completed',
      percentComplete: 100,
      steps: [
        { id: 's1', title: 'Make 5 Purchases', description: 'Complete 5 orders', eventName: 'purchase', requiredCount: 5, currentCount: 5, isComplete: true },
        { id: 's2', title: 'Spend $500', description: 'Total spend', eventName: 'purchase', requiredCount: 50000, currentCount: 50000, isComplete: true },
      ],
    },
    {
      id: 'q3',
      name: 'VIP Status',
      description: 'Unlock exclusive VIP benefits',
      rewardXp: 2000,
      status: 'in_progress',
      percentComplete: 66,
      steps: [
        { id: 's1', title: 'Reach Gold Tier', description: 'Earn 5000 points', eventName: 'tier_upgraded', requiredCount: 1, currentCount: 1, isComplete: true },
        { id: 's2', title: 'Refer 3 Friends', description: 'Successful referrals', eventName: 'referral_success', requiredCount: 3, currentCount: 2, isComplete: false },
        { id: 's3', title: 'Write 5 Reviews', description: 'Product reviews', eventName: 'review_submitted', requiredCount: 5, currentCount: 5, isComplete: true },
      ],
    },
  ],
  demo_new: [
    {
      id: 'q1',
      name: 'Welcome Journey',
      description: 'Complete your profile and explore the platform',
      rewardXp: 500,
      status: 'not_started',
      percentComplete: 0,
      steps: [
        { id: 's1', title: 'Create Account', description: 'Sign up for a new account', eventName: 'user_signup', requiredCount: 1, currentCount: 0, isComplete: false },
        { id: 's2', title: 'Complete Profile', description: 'Fill in your profile details', eventName: 'profile_completed', requiredCount: 1, currentCount: 0, isComplete: false },
        { id: 's3', title: 'Browse Products', description: 'View at least 5 products', eventName: 'product_viewed', requiredCount: 5, currentCount: 0, isComplete: false },
        { id: 's4', title: 'Add to Cart', description: 'Add an item to your cart', eventName: 'add_to_cart', requiredCount: 1, currentCount: 0, isComplete: false },
        { id: 's5', title: 'Make a Purchase', description: 'Complete your first purchase', eventName: 'purchase', requiredCount: 1, currentCount: 0, isComplete: false },
      ],
    },
  ],
};

interface DemoQuestsProps {
  userId: string;
}

export function DemoQuests({ userId }: DemoQuestsProps) {
  const addLog = useAddLog();
  const [isLoading, setIsLoading] = React.useState(false);
  const [quests, setQuests] = React.useState<Quest[]>([]);
  const [expandedQuest, setExpandedQuest] = React.useState<string | null>(null);

  // Load quests on mount or user change
  React.useEffect(() => {
    const userQuests = mockQuests[userId] ?? mockQuests['demo_new']!;
    setQuests(userQuests);
    // Auto-expand first in-progress quest
    const inProgressQuest = userQuests.find(q => q.status === 'in_progress');
    setExpandedQuest(inProgressQuest?.id ?? null);
  }, [userId]);

  const handleRefresh = async () => {
    setIsLoading(true);

    addLog({
      type: 'request',
      method: 'GET',
      endpoint: `/v1/customer/quests`,
      data: { userId },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const userQuests = mockQuests[userId] ?? mockQuests['demo_new']!;

    addLog({
      type: 'response',
      method: '200 OK',
      data: { quests: userQuests },
    });

    setQuests(userQuests);
    setIsLoading(false);
  };

  const getStatusColor = (status: Quest['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: Quest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/20';
      case 'in_progress':
        return 'bg-primary/10 border-primary/20';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader className="flex-row items-center justify-between">
        <GlassCardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Quests
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
      <GlassCardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {quests.map((quest) => (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`rounded-lg border ${getStatusBg(quest.status)} overflow-hidden`}
            >
              {/* Quest Header */}
              <button
                onClick={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  quest.status === 'completed' ? 'bg-green-500/20' : 'bg-primary/20'
                }`}>
                  {quest.status === 'completed' ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Target className={`h-5 w-5 ${getStatusColor(quest.status)}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{quest.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      quest.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      quest.status === 'in_progress' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {quest.status === 'completed' ? 'Complete' :
                       quest.status === 'in_progress' ? `${quest.percentComplete}%` :
                       'Not Started'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <Award className="h-3 w-3" />
                    <span>+{quest.rewardXp} XP</span>
                    <span className="text-border">|</span>
                    <span>{quest.steps.length} steps</span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                  expandedQuest === quest.id ? 'rotate-90' : ''
                }`} />
              </button>

              {/* Quest Steps */}
              <AnimatePresence>
                {expandedQuest === quest.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 space-y-2">
                      {quest.status !== 'completed' && (
                        <Progress value={quest.percentComplete} className="h-1.5 mb-3" />
                      )}
                      {quest.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className={`flex items-start gap-2 p-2 rounded ${
                            step.isComplete ? 'opacity-60' : ''
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            step.isComplete
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.isComplete ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${step.isComplete ? 'line-through' : ''}`}>
                              {step.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {step.currentCount}/{step.requiredCount}
                              {step.requiredCount > 1 && !step.isComplete && (
                                <span className="ml-2">
                                  ({Math.round((step.currentCount / step.requiredCount) * 100)}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {quests.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No quests available</p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
