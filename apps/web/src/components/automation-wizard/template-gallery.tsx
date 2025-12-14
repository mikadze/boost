'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Coins, Gift, TrendingUp, ShoppingBag, UserPlus, Sparkles, Truck, Star, Users, Calendar, Percent } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import type { GeneratedRule } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'loyalty' | 'welcome' | 'retention' | 'engagement' | 'commerce';
  color: string;
  rule: GeneratedRule;
}

const TEMPLATES: Template[] = [
  // Loyalty Templates
  {
    id: 'high-spender-points',
    name: 'High Spender Points',
    description: 'Award 500 points for orders over $100',
    icon: <Coins className="h-6 w-6" />,
    category: 'loyalty',
    color: 'amber',
    rule: {
      name: 'High Spender Points Bonus',
      description: 'Awards 500 loyalty points for orders over $100',
      eventTypes: ['purchase'],
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'properties.total', operator: 'greater_than', value: 10000 },
        ],
      },
      effects: [{ type: 'add_loyalty_points', params: { amount: 500 } }],
    },
  },
  {
    id: 'purchase-points',
    name: 'Points Per Dollar',
    description: 'Earn 1 point for every $1 spent',
    icon: <ShoppingBag className="h-6 w-6" />,
    category: 'loyalty',
    color: 'amber',
    rule: {
      name: 'Points Per Dollar Spent',
      description: 'Awards 1 loyalty point for every dollar spent on purchases',
      eventTypes: ['purchase'],
      conditions: {
        logic: 'and',
        conditions: [],
      },
      effects: [{ type: 'add_loyalty_points', params: { amount: 1 } }],
    },
  },
  {
    id: 'tier-upgrade',
    name: 'Tier Upgrade',
    description: 'Upgrade to Silver after 10 purchases',
    icon: <TrendingUp className="h-6 w-6" />,
    category: 'loyalty',
    color: 'blue',
    rule: {
      name: 'Silver Tier Upgrade',
      description: 'Automatically upgrades users to Silver tier after 10 purchases',
      eventTypes: ['purchase'],
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'user.purchaseCount', operator: 'greater_than_or_equal', value: 10 },
        ],
      },
      effects: [{ type: 'upgrade_tier', params: { tier: 'silver' } }],
    },
  },
  // Welcome Templates
  {
    id: 'welcome-points',
    name: 'Welcome Points',
    description: 'Give 100 points to new signups',
    icon: <UserPlus className="h-6 w-6" />,
    category: 'welcome',
    color: 'green',
    rule: {
      name: 'Welcome Points',
      description: 'Awards 100 welcome points to new users upon signup',
      eventTypes: ['signup'],
      conditions: {
        logic: 'and',
        conditions: [],
      },
      effects: [{ type: 'add_loyalty_points', params: { amount: 100 } }],
    },
  },
  {
    id: 'welcome-discount',
    name: 'Welcome Discount',
    description: '10% off first order for new users',
    icon: <Gift className="h-6 w-6" />,
    category: 'welcome',
    color: 'green',
    rule: {
      name: 'Welcome Discount',
      description: 'Gives new users 10% off their first order',
      eventTypes: ['signup'],
      conditions: {
        logic: 'and',
        conditions: [],
      },
      effects: [{ type: 'apply_discount', params: { type: 'percentage', value: 10 } }],
    },
  },
  {
    id: 'first-purchase-bonus',
    name: 'First Purchase Bonus',
    description: '200 bonus points on first purchase',
    icon: <Sparkles className="h-6 w-6" />,
    category: 'welcome',
    color: 'green',
    rule: {
      name: 'First Purchase Bonus',
      description: 'Awards 200 bonus points on the first purchase',
      eventTypes: ['purchase'],
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'user.purchaseCount', operator: 'equals', value: 1 },
        ],
      },
      effects: [{ type: 'add_loyalty_points', params: { amount: 200 } }],
    },
  },
  // Retention Templates
  {
    id: 'win-back-offer',
    name: 'Win-Back Offer',
    description: '20% off for inactive customers',
    icon: <Percent className="h-6 w-6" />,
    category: 'retention',
    color: 'orange',
    rule: {
      name: 'Win-Back Offer',
      description: 'Offers 20% discount to bring back inactive customers',
      eventTypes: ['login'],
      conditions: {
        logic: 'and',
        conditions: [],
      },
      effects: [{ type: 'apply_discount', params: { type: 'percentage', value: 20 } }],
    },
  },
  {
    id: 'birthday-reward',
    name: 'Birthday Reward',
    description: '500 bonus points on your birthday',
    icon: <Calendar className="h-6 w-6" />,
    category: 'retention',
    color: 'orange',
    rule: {
      name: 'Birthday Reward',
      description: 'Awards 500 bonus points on the customer birthday',
      eventTypes: ['$profile_update'],
      conditions: {
        logic: 'and',
        conditions: [],
      },
      effects: [{ type: 'add_loyalty_points', params: { amount: 500 } }],
    },
  },
  // Engagement Templates
  {
    id: 'review-reward',
    name: 'Review Reward',
    description: '50 points for leaving a review',
    icon: <Star className="h-6 w-6" />,
    category: 'engagement',
    color: 'violet',
    rule: {
      name: 'Review Reward',
      description: 'Awards 50 points when customer leaves a product review',
      eventTypes: ['form_submit'],
      conditions: {
        logic: 'and',
        conditions: [],
      },
      effects: [{ type: 'add_loyalty_points', params: { amount: 50 } }],
    },
  },
  {
    id: 'referral-bonus',
    name: 'Referral Bonus',
    description: '1000 points for successful referrals',
    icon: <Users className="h-6 w-6" />,
    category: 'engagement',
    color: 'violet',
    rule: {
      name: 'Referral Bonus',
      description: 'Awards 1000 points when a referred friend makes their first purchase',
      eventTypes: ['purchase'],
      conditions: {
        logic: 'and',
        conditions: [],
      },
      effects: [{ type: 'add_loyalty_points', params: { amount: 1000 } }],
    },
  },
  // Commerce Templates
  {
    id: 'free-shipping',
    name: 'Free Shipping',
    description: 'Free shipping on orders over $75',
    icon: <Truck className="h-6 w-6" />,
    category: 'commerce',
    color: 'cyan',
    rule: {
      name: 'Free Shipping Threshold',
      description: 'Offers free shipping on orders over $75',
      eventTypes: ['checkout_start'],
      conditions: {
        logic: 'and',
        conditions: [
          { field: 'properties.total', operator: 'greater_than_or_equal', value: 7500 },
        ],
      },
      effects: [{ type: 'free_shipping', params: {} }],
    },
  },
];

const CATEGORY_INFO: Record<string, { label: string; description: string }> = {
  loyalty: { label: 'Loyalty & Points', description: 'Reward returning customers' },
  welcome: { label: 'Welcome & Onboarding', description: 'Engage new users' },
  retention: { label: 'Retention', description: 'Bring back inactive customers' },
  engagement: { label: 'Engagement', description: 'Drive user actions' },
  commerce: { label: 'Commerce', description: 'Boost sales and conversions' },
};

interface TemplateGalleryProps {
  onSelect: (rule: GeneratedRule) => void;
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  // Group templates by category
  const groupedTemplates = TEMPLATES.reduce<Record<string, Template[]>>(
    (acc, template) => {
      const category = template.category;
      const group = acc[category] ?? (acc[category] = []);
      group.push(template);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedTemplates).map(([category, templates]) => {
        const categoryInfo = CATEGORY_INFO[category];

        return (
          <div key={category}>
            <div className="mb-3">
              <h3 className="text-sm font-semibold">{categoryInfo?.label || category}</h3>
              <p className="text-xs text-muted-foreground">
                {categoryInfo?.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => onSelect(template.rule)}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all',
                      'hover:scale-[1.02] hover:shadow-lg',
                      `border-${template.color}-500/20 hover:border-${template.color}-500/50`,
                      `bg-${template.color}-500/5 hover:bg-${template.color}-500/10`
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          `bg-${template.color}-500/20 text-${template.color}-500`
                        )}
                      >
                        {template.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm truncate">{template.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
