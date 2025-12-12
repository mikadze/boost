'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Crown,
  Calendar,
  Gift,
  ShoppingBag,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { MetricTicker } from '@/components/ui/metric-ticker';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock customer data
const customer = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: undefined,
  tier: 'gold',
  points: 15420,
  pointsToNextTier: 4580,
  nextTier: 'platinum',
  totalSpent: 4523.99,
  orders: 47,
  lastActive: '2024-07-10T14:32:00',
  createdAt: '2023-01-15',
  status: 'active',
  attributes: {
    phone: '+1 555-123-4567',
    address: '123 Main St, City, ST 12345',
    birthdate: '1990-05-15',
    preferredCategories: ['Electronics', 'Fashion'],
  },
};

const tierColors = {
  bronze: 'text-orange-400',
  silver: 'text-gray-300',
  gold: 'text-yellow-400',
  platinum: 'text-purple-400',
};

const timeline = [
  {
    id: '1',
    type: 'purchase',
    title: 'Completed Order #12847',
    description: 'Total: $89.99 • Earned 90 points',
    time: '2 hours ago',
    icon: ShoppingBag,
  },
  {
    id: '2',
    type: 'redemption',
    title: 'Redeemed 500 Points',
    description: '$5.00 discount applied',
    time: '1 day ago',
    icon: Gift,
  },
  {
    id: '3',
    type: 'achievement',
    title: 'Reached Gold Tier',
    description: 'Unlocked Gold member benefits',
    time: '3 days ago',
    icon: Crown,
  },
  {
    id: '4',
    type: 'purchase',
    title: 'Completed Order #12801',
    description: 'Total: $234.50 • Earned 235 points',
    time: '5 days ago',
    icon: ShoppingBag,
  },
  {
    id: '5',
    type: 'bonus',
    title: 'Birthday Bonus',
    description: 'Received 500 bonus points',
    time: '1 week ago',
    icon: Gift,
  },
];

const ledger = [
  { id: '1', type: 'earn', amount: 90, balance: 15420, description: 'Order #12847', date: '2024-07-10' },
  { id: '2', type: 'redeem', amount: -500, balance: 15330, description: 'Discount redemption', date: '2024-07-09' },
  { id: '3', type: 'earn', amount: 235, balance: 15830, description: 'Order #12801', date: '2024-07-05' },
  { id: '4', type: 'bonus', amount: 500, balance: 15595, description: 'Birthday bonus', date: '2024-07-03' },
  { id: '5', type: 'earn', amount: 150, balance: 15095, description: 'Order #12756', date: '2024-06-28' },
];

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();

  const progressToNextTier =
    ((customer.points - 10000) / (20000 - 10000)) * 100;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Customer Profile</h1>
          <p className="text-muted-foreground">View and manage customer details</p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="sticky top-24">
            <GlassCardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar
                  src={customer.avatar}
                  alt={customer.name}
                  fallback={customer.name.charAt(0)}
                  size="xl"
                />
                <h2 className="text-xl font-bold mt-4">{customer.name}</h2>
                <p className="text-muted-foreground text-sm">{customer.email}</p>

                <div
                  className={`flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-surface-2 ${
                    tierColors[customer.tier as keyof typeof tierColors]
                  }`}
                >
                  <Crown className="h-4 w-4" />
                  <span className="font-medium">
                    {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)} Member
                  </span>
                </div>

                <StatusBadge variant="active" dot className="mt-3">
                  Active
                </StatusBadge>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {customer.points.toLocaleString()} points
                    </span>
                    <span className="text-muted-foreground">
                      {customer.pointsToNextTier.toLocaleString()} to {customer.nextTier}
                    </span>
                  </div>
                  <Progress value={progressToNextTier} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{customer.orders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      ${customer.totalSpent.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button className="flex-1" variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button className="flex-1" variant="outline">
                  <Gift className="mr-2 h-4 w-4" />
                  Add Points
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since</span>
                  <span className="ml-auto">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last active</span>
                  <span className="ml-auto">
                    {new Date(customer.lastActive).toLocaleString()}
                  </span>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Tabs defaultValue="timeline">
            <TabsList>
              <TabsTrigger value="timeline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="ledger">
                <Gift className="mr-2 h-4 w-4" />
                Ledger
              </TabsTrigger>
              <TabsTrigger value="profile">
                <Calendar className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Activity Timeline</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="flex gap-4"
                        >
                          <div className="relative">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                event.type === 'purchase'
                                  ? 'bg-green-400/10 text-green-400'
                                  : event.type === 'redemption'
                                  ? 'bg-purple-400/10 text-purple-400'
                                  : event.type === 'achievement'
                                  ? 'bg-yellow-400/10 text-yellow-400'
                                  : 'bg-blue-400/10 text-blue-400'
                              }`}
                            >
                              <event.icon className="h-5 w-5" />
                            </div>
                            {index < timeline.length - 1 && (
                              <div className="absolute top-10 left-1/2 w-px h-full -translate-x-1/2 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.time}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>

            <TabsContent value="ledger">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Points Ledger</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-2">
                    {ledger.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-1"
                      >
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-mono font-medium ${
                              entry.amount > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {entry.amount > 0 ? '+' : ''}
                            {entry.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {entry.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>

            <TabsContent value="profile">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Profile Attributes</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <pre className="p-4 rounded-lg bg-surface-1 text-sm overflow-x-auto">
                    {JSON.stringify(customer.attributes, null, 2)}
                  </pre>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
