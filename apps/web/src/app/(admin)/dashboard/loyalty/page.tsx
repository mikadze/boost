'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Users,
  TrendingUp,
  Award,
  Plus,
  Pencil,
  Code,
  ExternalLink,
  ArrowUpDown,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Mail,
  Gift,
  Activity,
  Copy,
  Check,
  Coins,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/ui/code-block';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Types
interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  level: number;
  color: string;
  iconUrl?: string;
  benefits: string[];
}

interface LoyaltyStats {
  totalMembers: number;
  pointsIssued: number;
  pointsRedeemed: number;
  tierDistribution: { tier: string; count: number; color: string }[];
}

interface LoyaltyMember {
  id: string;
  name: string;
  email: string;
  tier: string;
  tierColor: string;
  points: number;
  totalEarned: number;
  totalRedeemed: number;
  status: 'active' | 'inactive';
  joinedAt: string;
}

interface PointsTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
  userName: string;
  userEmail: string;
  amount: number;
  balance: number;
  description?: string;
  createdAt: string;
}

// Mock data
const mockTiers: LoyaltyTier[] = [
  { id: '1', name: 'Bronze', minPoints: 0, level: 1, color: '#CD7F32', benefits: ['5% back on purchases'] },
  { id: '2', name: 'Silver', minPoints: 1000, level: 2, color: '#C0C0C0', benefits: ['10% back on purchases', 'Free shipping'] },
  { id: '3', name: 'Gold', minPoints: 5000, level: 3, color: '#FFD700', benefits: ['15% back on purchases', 'Free shipping', 'Early access to sales'] },
  { id: '4', name: 'Platinum', minPoints: 10000, level: 4, color: '#E5E4E2', benefits: ['20% back on purchases', 'Free shipping', 'Early access to sales', 'VIP support'] },
];

const mockStats: LoyaltyStats = {
  totalMembers: 3842,
  pointsIssued: 4250000,
  pointsRedeemed: 1875000,
  tierDistribution: [
    { tier: 'Bronze', count: 2150, color: '#CD7F32' },
    { tier: 'Silver', count: 1200, color: '#C0C0C0' },
    { tier: 'Gold', count: 420, color: '#FFD700' },
    { tier: 'Platinum', count: 72, color: '#E5E4E2' },
  ],
};

const mockMembers: LoyaltyMember[] = [
  {
    id: '1',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    tier: 'Platinum',
    tierColor: '#E5E4E2',
    points: 12500,
    totalEarned: 18500,
    totalRedeemed: 6000,
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Sam Wilson',
    email: 'sam@example.com',
    tier: 'Gold',
    tierColor: '#FFD700',
    points: 7200,
    totalEarned: 9500,
    totalRedeemed: 2300,
    status: 'active',
    joinedAt: '2024-03-22',
  },
  {
    id: '3',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    tier: 'Silver',
    tierColor: '#C0C0C0',
    points: 2100,
    totalEarned: 3500,
    totalRedeemed: 1400,
    status: 'active',
    joinedAt: '2024-06-10',
  },
  {
    id: '4',
    name: 'Taylor Brown',
    email: 'taylor@example.com',
    tier: 'Bronze',
    tierColor: '#CD7F32',
    points: 450,
    totalEarned: 450,
    totalRedeemed: 0,
    status: 'active',
    joinedAt: '2024-07-01',
  },
  {
    id: '5',
    name: 'Morgan Lee',
    email: 'morgan@example.com',
    tier: 'Gold',
    tierColor: '#FFD700',
    points: 5800,
    totalEarned: 8200,
    totalRedeemed: 2400,
    status: 'inactive',
    joinedAt: '2023-11-05',
  },
];

const mockTransactions: PointsTransaction[] = [
  {
    id: '1',
    type: 'earn',
    userName: 'Jordan Smith',
    userEmail: 'jordan@example.com',
    amount: 500,
    balance: 12500,
    description: 'Purchase #ORD-1234',
    createdAt: '2024-07-14T10:30:00Z',
  },
  {
    id: '2',
    type: 'redeem',
    userName: 'Sam Wilson',
    userEmail: 'sam@example.com',
    amount: -1000,
    balance: 7200,
    description: '$10 store credit',
    createdAt: '2024-07-14T09:15:00Z',
  },
  {
    id: '3',
    type: 'bonus',
    userName: 'Alex Johnson',
    userEmail: 'alex@example.com',
    amount: 200,
    balance: 2100,
    description: 'Birthday bonus',
    createdAt: '2024-07-13T16:00:00Z',
  },
  {
    id: '4',
    type: 'earn',
    userName: 'Taylor Brown',
    userEmail: 'taylor@example.com',
    amount: 150,
    balance: 450,
    description: 'Purchase #ORD-1235',
    createdAt: '2024-07-13T14:22:00Z',
  },
  {
    id: '5',
    type: 'expire',
    userName: 'Morgan Lee',
    userEmail: 'morgan@example.com',
    amount: -500,
    balance: 5800,
    description: 'Points expired (inactive 90+ days)',
    createdAt: '2024-07-12T00:00:00Z',
  },
  {
    id: '6',
    type: 'adjust',
    userName: 'Jordan Smith',
    userEmail: 'jordan@example.com',
    amount: 100,
    balance: 12000,
    description: 'Manual adjustment - support ticket #4521',
    createdAt: '2024-07-11T11:30:00Z',
  },
];

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  color?: 'primary' | 'green' | 'yellow' | 'blue';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div className={cn('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className={cn('text-xs font-medium', trend >= 0 ? 'text-green-400' : 'text-red-400')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold font-mono">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
      </div>
    </GlassCard>
  );
}

// Tier Card Component
function TierCard({ tier, onEdit }: { tier: LoyaltyTier; onEdit: () => void }) {
  return (
    <div
      className="relative p-4 rounded-lg border border-border bg-surface-1 hover:bg-surface-2 transition-colors"
      style={{ borderTopColor: tier.color, borderTopWidth: '4px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${tier.color}20` }}
          >
            <Award className="h-5 w-5" style={{ color: tier.color }} />
          </div>
          <div>
            <span className="font-medium" style={{ color: tier.color }}>{tier.name}</span>
            <p className="text-xs text-muted-foreground">Level {tier.level}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
      <div className="mb-3">
        <span className="text-sm text-muted-foreground">Min Points: </span>
        <span className="font-mono font-medium">{tier.minPoints.toLocaleString()}</span>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Benefits:</p>
        <div className="flex flex-wrap gap-1">
          {tier.benefits.map((benefit) => (
            <span
              key={benefit}
              className="px-2 py-0.5 text-xs rounded-full"
              style={{ backgroundColor: `${tier.color}15`, color: tier.color }}
            >
              {benefit}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Edit Tier Dialog Component
function EditTierDialog({
  tier,
  open,
  onOpenChange,
  onSave,
}: {
  tier: LoyaltyTier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tier: LoyaltyTier) => void;
}) {
  const [editedTier, setEditedTier] = React.useState<LoyaltyTier | null>(tier);
  const [benefitInput, setBenefitInput] = React.useState('');

  React.useEffect(() => {
    setEditedTier(tier);
    setBenefitInput('');
  }, [tier]);

  if (!editedTier) return null;

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setEditedTier({
        ...editedTier,
        benefits: [...editedTier.benefits, benefitInput.trim()],
      });
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setEditedTier({
      ...editedTier,
      benefits: editedTier.benefits.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Loyalty Tier</DialogTitle>
          <DialogDescription>
            Configure the tier requirements and benefits.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tier-name">Tier Name</Label>
              <Input
                id="tier-name"
                value={editedTier.name}
                onChange={(e) => setEditedTier({ ...editedTier, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier-level">Level</Label>
              <Input
                id="tier-level"
                type="number"
                value={editedTier.level}
                onChange={(e) => setEditedTier({ ...editedTier, level: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier-min-points">Minimum Points</Label>
            <Input
              id="tier-min-points"
              type="number"
              value={editedTier.minPoints}
              onChange={(e) => setEditedTier({ ...editedTier, minPoints: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier-color">Tier Color</Label>
            <div className="flex gap-2">
              <Input
                id="tier-color"
                type="color"
                value={editedTier.color}
                onChange={(e) => setEditedTier({ ...editedTier, color: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input
                value={editedTier.color}
                onChange={(e) => setEditedTier({ ...editedTier, color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Benefits</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a benefit..."
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
              />
              <Button type="button" onClick={handleAddBenefit} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {editedTier.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary flex items-center gap-1"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(editedTier);
              onOpenChange(false);
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Code Snippet Component
function CodeSnippet({ title, code, description }: { title: string; code: string; description: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <CodeBlock code={code} language="tsx" />
    </div>
  );
}

// Member Table Columns
const memberColumns: ColumnDef<LoyaltyMember>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Member
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-xs text-muted-foreground">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'tier',
    header: 'Tier',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4" style={{ color: row.original.tierColor }} />
        <span style={{ color: row.original.tierColor }}>{row.original.tier}</span>
      </div>
    ),
  },
  {
    accessorKey: 'points',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Points
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.original.points.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'totalEarned',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Lifetime
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="text-green-400">+{row.original.totalEarned.toLocaleString()}</div>
        <div className="text-red-400 text-xs">-{row.original.totalRedeemed.toLocaleString()}</div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <StatusBadge variant={status === 'active' ? 'active' : 'inactive'} dot pulse={status === 'active'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusBadge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Coins className="mr-2 h-4 w-4" />
              Adjust Points
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Transaction Table Columns
const transactionColumns: ColumnDef<PointsTransaction>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      const config = {
        earn: { icon: <ArrowUp className="h-4 w-4 text-green-400" />, label: 'Earned', color: 'text-green-400' },
        redeem: { icon: <ArrowDown className="h-4 w-4 text-red-400" />, label: 'Redeemed', color: 'text-red-400' },
        expire: { icon: <Clock className="h-4 w-4 text-yellow-400" />, label: 'Expired', color: 'text-yellow-400' },
        adjust: { icon: <Pencil className="h-4 w-4 text-blue-400" />, label: 'Adjusted', color: 'text-blue-400' },
        bonus: { icon: <Sparkles className="h-4 w-4 text-purple-400" />, label: 'Bonus', color: 'text-purple-400' },
      };
      const { icon, label, color } = config[type];
      return (
        <div className="flex items-center gap-2">
          {icon}
          <span className={color}>{label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'userName',
    header: 'Member',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.userName}</div>
        <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = row.original.amount;
      const isPositive = amount >= 0;
      return (
        <span className={cn('font-mono font-medium', isPositive ? 'text-green-400' : 'text-red-400')}>
          {isPositive ? '+' : ''}{amount.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: 'balance',
    header: 'Balance',
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">{row.original.balance.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.description || '—'}</span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
          <br />
          <span className="text-xs">{date.toLocaleTimeString()}</span>
        </div>
      );
    },
  },
];

// Main Page Component
export default function LoyaltyPage() {
  const [tiers, setTiers] = React.useState<LoyaltyTier[]>(mockTiers);
  const [stats] = React.useState<LoyaltyStats>(mockStats);
  const [members] = React.useState<LoyaltyMember[]>(mockMembers);
  const [transactions] = React.useState<PointsTransaction[]>(mockTransactions);
  const [editingTier, setEditingTier] = React.useState<LoyaltyTier | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [memberSearch, setMemberSearch] = React.useState('');

  const handleSaveTier = (updatedTier: LoyaltyTier) => {
    setTiers((prev) => prev.map((t) => (t.id === updatedTier.id ? updatedTier : t)));
  };

  const handleAddTier = () => {
    const maxLevel = Math.max(...tiers.map((t) => t.level));
    const newTier: LoyaltyTier = {
      id: String(Date.now()),
      name: 'New Tier',
      minPoints: 20000,
      level: maxLevel + 1,
      color: '#9333ea',
      benefits: [],
    };
    setTiers((prev) => [...prev, newTier]);
    setEditingTier(newTier);
    setIsEditDialogOpen(true);
  };

  // SDK code snippets
  const levelProgressCode = `import { LevelProgress } from '@gamify/react';

// Display current tier with progress to next level
<LevelProgress
  showNextTier
  showBenefits
  theme={{
    cardBackground: '#1a1a2e',
    progressGradient: 'linear-gradient(90deg, #667eea, #764ba2)',
  }}
/>`;

  const useLoyaltyCode = `import { useLoyalty } from '@gamify/react';

function LoyaltyWidget() {
  const { profile, loading, refreshProfile } = useLoyalty();

  if (loading) return <Spinner />;

  return (
    <div>
      <p>Points: {profile?.points.toLocaleString()}</p>
      <p>Tier: {profile?.tier?.name}</p>
      {profile?.nextTier && (
        <p>{profile.nextTier.pointsNeeded} pts to {profile.nextTier.name}</p>
      )}
    </div>
  );
}`;

  const trackPurchaseCode = `import { GamifyClient } from '@gamify/node';

const gamify = new GamifyClient({ secretKey: 'sk_live_...' });

// Award points on purchase (server-side)
await gamify.purchase({
  userId: 'user_123',
  orderId: 'order_456',
  amount: 9999, // $99.99 in cents
  currency: 'USD',
});
// Points automatically awarded based on your rules`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6" />
            Tiers & Points
          </h1>
          <p className="text-muted-foreground">
            Configure loyalty tiers and track member points activity
          </p>
        </div>
        <GlowButton variant="glow" asChild>
          <Link href="/dashboard/playground">
            <Sparkles className="mr-2 h-4 w-4" />
            Preview
          </Link>
        </GlowButton>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          icon={Users}
          label="Total Members"
          value={stats.totalMembers.toLocaleString()}
          trend={8}
          color="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Points Issued"
          value={stats.pointsIssued.toLocaleString()}
          subValue="All time"
          trend={12}
          color="green"
        />
        <StatCard
          icon={Gift}
          label="Points Redeemed"
          value={stats.pointsRedeemed.toLocaleString()}
          subValue={`${Math.round((stats.pointsRedeemed / stats.pointsIssued) * 100)}% redemption rate`}
          color="yellow"
        />
        <GlassCard className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Tier Distribution</p>
          <div className="space-y-2">
            {stats.tierDistribution.map((item) => (
              <div key={item.tier} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs flex-1">{item.tier}</span>
                <span className="text-xs font-mono">{item.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="tiers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tiers" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Tiers
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Embed Components
            </TabsTrigger>
          </TabsList>

          {/* Tiers Tab */}
          <TabsContent value="tiers">
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Loyalty Tiers</GlassCardTitle>
                  <GlassCardDescription>
                    Define tier levels, point thresholds, and benefits
                  </GlassCardDescription>
                </div>
                <Button onClick={handleAddTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {tiers.map((tier) => (
                    <TierCard
                      key={tier.id}
                      tier={tier}
                      onEdit={() => {
                        setEditingTier(tier);
                        setIsEditDialogOpen(true);
                      }}
                    />
                  ))}
                </div>

                {/* Tier Progression Preview */}
                <div className="mt-6 p-4 rounded-lg bg-surface-1 border border-border">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Tier Progression Preview
                  </h4>
                  <div className="relative">
                    <div className="absolute top-4 left-0 right-0 h-2 bg-border rounded-full" />
                    <div className="relative flex justify-between">
                      {tiers.map((tier, index) => {
                        const position = (tier.minPoints / (mockTiers[mockTiers.length - 1]?.minPoints || 10000)) * 100;
                        return (
                          <div
                            key={tier.id}
                            className="flex flex-col items-center"
                            style={{ position: index === 0 ? 'relative' : 'absolute', left: index === 0 ? 0 : `${position}%`, transform: index === 0 ? 'none' : 'translateX(-50%)' }}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background z-10"
                              style={{ borderColor: tier.color }}
                            >
                              <Award className="h-4 w-4" style={{ color: tier.color }} />
                            </div>
                            <span className="text-xs mt-2 font-medium" style={{ color: tier.color }}>{tier.name}</span>
                            <span className="text-xs text-muted-foreground">{tier.minPoints.toLocaleString()} pts</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            {/* Members Table */}
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Members</GlassCardTitle>
                  <GlassCardDescription>
                    All loyalty program members
                  </GlassCardDescription>
                </div>
              </GlassCardHeader>
              <div className="px-6 pb-2">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      className="pl-9 bg-surface-1"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
              <GlassCardContent>
                <DataTable
                  columns={memberColumns}
                  data={members}
                  searchKey="name"
                  searchValue={memberSearch}
                />
              </GlassCardContent>
            </GlassCard>

            {/* Transactions Table */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Recent Transactions</GlassCardTitle>
                <GlassCardDescription>
                  Points earned, redeemed, and adjusted
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <DataTable
                  columns={transactionColumns}
                  data={transactions}
                />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Embed Components Tab */}
          <TabsContent value="embed">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Embed Components</GlassCardTitle>
                <GlassCardDescription>
                  Add these React components to display loyalty features
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-8">
                <CodeSnippet
                  title="Level Progress Component"
                  description="Display current tier with progress bar to next level"
                  code={levelProgressCode}
                />

                <CodeSnippet
                  title="useLoyalty Hook"
                  description="Access loyalty profile data in your components"
                  code={useLoyaltyCode}
                />

                <CodeSnippet
                  title="Track Purchases (Server-side)"
                  description="Award points automatically when purchases are made"
                  code={trackPurchaseCode}
                />

                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-1 border border-border">
                  <div>
                    <h4 className="font-medium">Need help integrating?</h4>
                    <p className="text-sm text-muted-foreground">
                      Check out our SDK documentation for detailed guides
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/developer/sdk-setup">
                      SDK Setup Guide
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Edit Tier Dialog */}
      <EditTierDialog
        tier={editingTier}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveTier}
      />
    </div>
  );
}
