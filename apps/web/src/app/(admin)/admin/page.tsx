'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Megaphone,
  Gift,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Trophy,
  Ticket,
  ShoppingCart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { MetricTicker } from '@/components/ui/metric-ticker';
import { StatusBadge } from '@/components/ui/status-badge';
import { GlowButton } from '@/components/ui/glow-button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data for charts
const eventVolumeData = [
  { name: 'Mon', events: 4000, budget: 2400 },
  { name: 'Tue', events: 3000, budget: 1398 },
  { name: 'Wed', events: 2000, budget: 9800 },
  { name: 'Thu', events: 2780, budget: 3908 },
  { name: 'Fri', events: 1890, budget: 4800 },
  { name: 'Sat', events: 2390, budget: 3800 },
  { name: 'Sun', events: 3490, budget: 4300 },
];

const campaignPerformanceData = [
  { name: 'Summer Sale', redemptions: 4000 },
  { name: 'Welcome Bonus', redemptions: 3000 },
  { name: 'Loyalty Tier', redemptions: 2000 },
  { name: 'Birthday', redemptions: 2780 },
  { name: 'Flash Sale', redemptions: 1890 },
];

// Mock activity data
const recentActivity = [
  {
    id: 1,
    type: 'achievement',
    user: 'John D.',
    action: 'earned Gold status',
    time: '2 min ago',
    icon: Trophy,
  },
  {
    id: 2,
    type: 'redemption',
    user: 'Sarah M.',
    action: 'redeemed 20% off coupon',
    time: '5 min ago',
    icon: Ticket,
  },
  {
    id: 3,
    type: 'purchase',
    user: 'Mike R.',
    action: 'completed $150 purchase',
    time: '8 min ago',
    icon: ShoppingCart,
  },
  {
    id: 4,
    type: 'achievement',
    user: 'Lisa K.',
    action: 'reached 1000 points',
    time: '12 min ago',
    icon: Trophy,
  },
  {
    id: 5,
    type: 'redemption',
    user: 'Tom H.',
    action: 'used free shipping',
    time: '15 min ago',
    icon: Ticket,
  },
];

const metrics = [
  {
    title: 'Total Revenue',
    value: 125430,
    prefix: '$',
    trend: 'up' as const,
    trendValue: '12.5%',
    icon: DollarSign,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    title: 'Active Campaigns',
    value: 12,
    trend: 'up' as const,
    trendValue: '2',
    icon: Megaphone,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    title: 'Redemptions',
    value: 3847,
    trend: 'up' as const,
    trendValue: '8.2%',
    icon: Gift,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    title: 'Events Processed',
    value: 284592,
    trend: 'down' as const,
    trendValue: '3.1%',
    icon: Activity,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening with your campaigns.
          </p>
        </div>
        <GlowButton variant="glow">
          Create Campaign
          <ArrowRight className="ml-2 h-4 w-4" />
        </GlowButton>
      </div>

      {/* Metrics grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard>
              <GlassCardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <StatusBadge
                    variant={metric.trend === 'up' ? 'active' : 'error'}
                    dot
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {metric.trendValue}
                  </StatusBadge>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <MetricTicker
                    value={metric.value}
                    prefix={metric.prefix}
                    className="mt-1"
                  />
                </div>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Event volume chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="h-[400px]">
            <GlassCardHeader>
              <GlassCardTitle>Event Volume vs Budget Usage</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eventVolumeData}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--muted-foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#6366F1"
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="budget"
                    stroke="#8B5CF6"
                    fillOpacity={1}
                    fill="url(#colorBudget)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Activity ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard className="h-[400px]">
            <GlassCardHeader>
              <GlassCardTitle>Live Activity</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50 hover:bg-surface-2 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === 'achievement'
                            ? 'bg-yellow-400/10 text-yellow-400'
                            : activity.type === 'redemption'
                            ? 'bg-purple-400/10 text-purple-400'
                            : 'bg-green-400/10 text-green-400'
                        }`}
                      >
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-muted-foreground">
                            {activity.action}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </GlassCardContent>
          </GlassCard>
        </motion.div>
      </div>

      {/* Campaign performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Campaign Performance</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)',
                  }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--muted-foreground)' }}
                />
                <Bar
                  dataKey="redemptions"
                  fill="#6366F1"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </div>
  );
}
