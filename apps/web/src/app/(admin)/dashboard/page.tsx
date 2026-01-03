'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
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
import { useOrganization } from '@/hooks/use-organization';
import { useProjectStats, useRecentEvents, type RecentEvent } from '@/hooks/use-project-stats';
import { SetupGuide } from '@/components/dashboard/setup-guide';

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Map event types to icons and colors
function getEventIcon(eventType: string) {
  if (eventType.includes('purchase') || eventType.includes('order')) {
    return { icon: ShoppingCart, color: 'bg-green-400/10 text-green-400' };
  }
  if (eventType.includes('redeem') || eventType.includes('coupon')) {
    return { icon: Ticket, color: 'bg-purple-400/10 text-purple-400' };
  }
  if (eventType.includes('achievement') || eventType.includes('badge') || eventType.includes('tier')) {
    return { icon: Trophy, color: 'bg-yellow-400/10 text-yellow-400' };
  }
  return { icon: Activity, color: 'bg-blue-400/10 text-blue-400' };
}

interface DashboardMetric {
  title: string;
  value: number;
  prefix?: string;
  trend: 'up' | 'down';
  trendValue: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface AnalyticsDashboardProps {
  stats: {
    totalEvents: number;
    activeCampaigns: number;
    firstEventAt: string | null;
  };
  recentEvents: RecentEvent[];
}

function AnalyticsDashboard({ stats, recentEvents }: AnalyticsDashboardProps) {
  // Generate metrics based on real stats
  const metrics: DashboardMetric[] = [
    {
      title: 'Total Revenue',
      value: 0, // Placeholder - would need a real revenue tracking endpoint
      prefix: '$',
      trend: 'up' as const,
      trendValue: '-',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns,
      trend: 'up' as const,
      trendValue: String(stats.activeCampaigns),
      icon: Megaphone,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Redemptions',
      value: 0, // Placeholder - would need a real redemption tracking endpoint
      trend: 'up' as const,
      trendValue: '-',
      icon: Gift,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      title: 'Events Processed',
      value: stats.totalEvents,
      trend: 'up' as const,
      trendValue: String(stats.totalEvents),
      icon: Activity,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
  ];

  // Generate event volume data from recent events (simplified)
  const eventVolumeData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      const dayEvents = recentEvents.filter((event) => {
        const eventDate = new Date(event.createdAt);
        const diffDays = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === i;
      }).length;

      weekData.push({
        name: days[dayIndex],
        events: dayEvents * 100 || Math.floor(Math.random() * 100) + 50, // Simulated for demo
        budget: Math.floor(Math.random() * 5000) + 1000, // Placeholder
      });
    }

    return weekData;
  }, [recentEvents]);

  // Placeholder campaign performance data
  const campaignPerformanceData = [
    { name: 'Welcome Bonus', redemptions: Math.floor(stats.totalEvents * 0.3) },
    { name: 'Loyalty Tier', redemptions: Math.floor(stats.totalEvents * 0.25) },
    { name: 'Referral', redemptions: Math.floor(stats.totalEvents * 0.2) },
    { name: 'Birthday', redemptions: Math.floor(stats.totalEvents * 0.15) },
    { name: 'Flash Sale', redemptions: Math.floor(stats.totalEvents * 0.1) },
  ];

  // Map recent events to activity items
  const recentActivity = recentEvents.slice(0, 5).map((event) => {
    const { icon, color } = getEventIcon(event.eventType);
    return {
      id: event.id,
      type: event.eventType,
      user: event.userId || 'Anonymous',
      action: event.eventType.replace(/_/g, ' '),
      time: formatRelativeTime(new Date(event.createdAt)),
      icon,
      color,
    };
  });

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
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/50 hover:bg-surface-2 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${activity.color}`}>
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
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No recent activity</p>
                    </div>
                  )}
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

function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { projects, organizations, isLoading: isOrgLoading } = useOrganization();
  const currentProject = projects[0];
  const [showSetupGuide, setShowSetupGuide] = React.useState<boolean | null>(null);

  const { data: stats, isLoading: isStatsLoading } = useProjectStats(currentProject?.id);
  const { data: recentEvents } = useRecentEvents(currentProject?.id);

  // Determine whether to show setup guide based on total events
  React.useEffect(() => {
    if (stats) {
      setShowSetupGuide(stats.totalEvents === 0);
    }
  }, [stats]);

  // Redirect to onboarding if user has no organization
  React.useEffect(() => {
    if (!isOrgLoading && organizations.length === 0) {
      router.push('/onboarding');
    }
  }, [isOrgLoading, organizations, router]);

  const handleSetupComplete = () => {
    setShowSetupGuide(false);
  };

  // Loading state - wait for organizations to load
  if (isOrgLoading) {
    return <DashboardLoading />;
  }

  // Redirecting to onboarding
  if (organizations.length === 0) {
    return <DashboardLoading />;
  }

  // No project yet - show setup guide immediately (don't wait for stats)
  if (!currentProject) {
    return <SetupGuide onComplete={handleSetupComplete} />;
  }

  // Wait for stats to load when we have a project
  if (isStatsLoading || showSetupGuide === null) {
    return <DashboardLoading />;
  }

  // Show setup guide for new users with no events
  if (showSetupGuide) {
    return <SetupGuide onComplete={handleSetupComplete} />;
  }

  // Show analytics dashboard
  return (
    <AnalyticsDashboard
      stats={stats || { totalEvents: 0, activeCampaigns: 0, firstEventAt: null }}
      recentEvents={recentEvents || []}
    />
  );
}
