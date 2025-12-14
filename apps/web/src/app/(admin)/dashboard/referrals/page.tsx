'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Settings,
  Crown,
  Gift,
  Code,
  Link2,
  ChevronRight,
  Percent,
  Clock,
  Zap,
  ExternalLink,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Activity,
  ArrowUpDown,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  Mail,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
interface CommissionTier {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minReferrals: number;
  color: string;
}

interface ProgramSettings {
  enabled: boolean;
  referralLinkBase: string;
  cookieDuration: number;
  commissionTrigger: 'purchase' | 'signup' | 'subscription';
  minPayout: number;
  autoApprove: boolean;
}

interface ReferralIncentive {
  type: 'percentage' | 'fixed' | 'points';
  value: number;
  description: string;
}

interface AffiliateStats {
  activeAffiliates: number;
  totalReferrals: number;
  commissionPaid: number;
  pendingCommission: number;
  conversionRate: number;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  tier: string;
  tierColor: string;
  referralCount: number;
  totalEarnings: number;
  pendingEarnings: number;
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
}

interface ReferralActivity {
  id: string;
  type: 'referral' | 'commission' | 'payout';
  affiliateName: string;
  affiliateEmail: string;
  referredUser?: string;
  amount?: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
}

// Mock data
const mockTiers: CommissionTier[] = [
  { id: '1', name: 'Starter', type: 'PERCENTAGE', value: 5, minReferrals: 0, color: '#CD7F32' },
  { id: '2', name: 'Pro', type: 'PERCENTAGE', value: 10, minReferrals: 10, color: '#C0C0C0' },
  { id: '3', name: 'Elite', type: 'PERCENTAGE', value: 15, minReferrals: 50, color: '#FFD700' },
];

const mockSettings: ProgramSettings = {
  enabled: true,
  referralLinkBase: 'https://yourstore.com',
  cookieDuration: 30,
  commissionTrigger: 'purchase',
  minPayout: 50,
  autoApprove: true,
};

const mockIncentive: ReferralIncentive = {
  type: 'percentage',
  value: 10,
  description: '10% off first purchase',
};

const mockStats: AffiliateStats = {
  activeAffiliates: 247,
  totalReferrals: 1842,
  commissionPaid: 1245000, // cents
  pendingCommission: 328500, // cents
  conversionRate: 12.4,
};

const mockAffiliates: Affiliate[] = [
  {
    id: '1',
    name: 'Jordan Smith',
    email: 'jordan@example.com',
    referralCode: 'JORDAN_VIP',
    tier: 'Elite',
    tierColor: '#FFD700',
    referralCount: 47,
    totalEarnings: 89500,
    pendingEarnings: 12000,
    status: 'active',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Sam Wilson',
    email: 'sam@example.com',
    referralCode: 'SAMREF',
    tier: 'Pro',
    tierColor: '#C0C0C0',
    referralCount: 12,
    totalEarnings: 18500,
    pendingEarnings: 3200,
    status: 'active',
    joinedAt: '2024-03-22',
  },
  {
    id: '3',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    referralCode: 'ALEX2024',
    tier: 'Starter',
    tierColor: '#CD7F32',
    referralCount: 3,
    totalEarnings: 4500,
    pendingEarnings: 1200,
    status: 'active',
    joinedAt: '2024-06-10',
  },
  {
    id: '4',
    name: 'Taylor Brown',
    email: 'taylor@example.com',
    referralCode: 'TAYLOR_REF',
    tier: 'Pro',
    tierColor: '#C0C0C0',
    referralCount: 15,
    totalEarnings: 22000,
    pendingEarnings: 0,
    status: 'inactive',
    joinedAt: '2024-02-28',
  },
  {
    id: '5',
    name: 'Morgan Lee',
    email: 'morgan@example.com',
    referralCode: 'MORGANVIP',
    tier: 'Elite',
    tierColor: '#FFD700',
    referralCount: 52,
    totalEarnings: 95000,
    pendingEarnings: 8500,
    status: 'active',
    joinedAt: '2023-11-05',
  },
];

const mockActivity: ReferralActivity[] = [
  {
    id: '1',
    type: 'commission',
    affiliateName: 'Jordan Smith',
    affiliateEmail: 'jordan@example.com',
    amount: 4999,
    status: 'pending',
    createdAt: '2024-07-14T10:30:00Z',
  },
  {
    id: '2',
    type: 'referral',
    affiliateName: 'Sam Wilson',
    affiliateEmail: 'sam@example.com',
    referredUser: 'newuser@example.com',
    status: 'approved',
    createdAt: '2024-07-14T09:15:00Z',
  },
  {
    id: '3',
    type: 'payout',
    affiliateName: 'Morgan Lee',
    affiliateEmail: 'morgan@example.com',
    amount: 50000,
    status: 'paid',
    createdAt: '2024-07-13T16:00:00Z',
  },
  {
    id: '4',
    type: 'commission',
    affiliateName: 'Alex Johnson',
    affiliateEmail: 'alex@example.com',
    amount: 1500,
    status: 'approved',
    createdAt: '2024-07-13T14:22:00Z',
  },
  {
    id: '5',
    type: 'referral',
    affiliateName: 'Jordan Smith',
    affiliateEmail: 'jordan@example.com',
    referredUser: 'customer123@example.com',
    status: 'approved',
    createdAt: '2024-07-13T11:45:00Z',
  },
  {
    id: '6',
    type: 'commission',
    affiliateName: 'Taylor Brown',
    affiliateEmail: 'taylor@example.com',
    amount: 2250,
    status: 'rejected',
    createdAt: '2024-07-12T09:30:00Z',
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

// Commission Tier Card Component
function TierCard({ tier, onEdit }: { tier: CommissionTier; onEdit: () => void }) {
  return (
    <div
      className="relative p-4 rounded-lg border border-border bg-surface-1 hover:bg-surface-2 transition-colors"
      style={{ borderLeftColor: tier.color, borderLeftWidth: '4px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" style={{ color: tier.color }} />
          <span className="font-medium">{tier.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: tier.color }}>
        {tier.type === 'PERCENTAGE' ? `${tier.value}%` : `$${tier.value / 100}`}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {tier.minReferrals === 0 ? 'Default tier' : `${tier.minReferrals}+ referrals`}
      </p>
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
  tier: CommissionTier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tier: CommissionTier) => void;
}) {
  const [editedTier, setEditedTier] = React.useState<CommissionTier | null>(tier);

  React.useEffect(() => {
    setEditedTier(tier);
  }, [tier]);

  if (!editedTier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Commission Tier</DialogTitle>
          <DialogDescription>
            Configure the commission rate and requirements for this tier.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tier-name">Tier Name</Label>
            <Input
              id="tier-name"
              value={editedTier.name}
              onChange={(e) => setEditedTier({ ...editedTier, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tier-type">Commission Type</Label>
              <Select
                value={editedTier.type}
                onValueChange={(value) =>
                  setEditedTier({ ...editedTier, type: value as 'PERCENTAGE' | 'FIXED' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier-value">
                {editedTier.type === 'PERCENTAGE' ? 'Rate (%)' : 'Amount ($)'}
              </Label>
              <Input
                id="tier-value"
                type="number"
                value={editedTier.type === 'PERCENTAGE' ? editedTier.value : editedTier.value / 100}
                onChange={(e) =>
                  setEditedTier({
                    ...editedTier,
                    value:
                      editedTier.type === 'PERCENTAGE'
                        ? Number(e.target.value)
                        : Number(e.target.value) * 100,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier-min">Minimum Referrals to Unlock</Label>
            <Input
              id="tier-min"
              type="number"
              value={editedTier.minReferrals}
              onChange={(e) =>
                setEditedTier({ ...editedTier, minReferrals: Number(e.target.value) })
              }
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

// Affiliate Table Columns
const affiliateColumns: ColumnDef<Affiliate>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Affiliate
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
        <Crown className="h-4 w-4" style={{ color: row.original.tierColor }} />
        <span style={{ color: row.original.tierColor }}>{row.original.tier}</span>
      </div>
    ),
  },
  {
    accessorKey: 'referralCode',
    header: 'Referral Code',
    cell: ({ row }) => (
      <code className="px-2 py-1 rounded bg-surface-1 text-xs font-mono">
        {row.original.referralCode}
      </code>
    ),
  },
  {
    accessorKey: 'referralCount',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Referrals
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono">{row.original.referralCount}</span>
    ),
  },
  {
    accessorKey: 'totalEarnings',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Earnings
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-mono text-green-400">
          ${(row.original.totalEarnings / 100).toFixed(2)}
        </div>
        {row.original.pendingEarnings > 0 && (
          <div className="text-xs text-yellow-400">
            ${(row.original.pendingEarnings / 100).toFixed(2)} pending
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = {
        active: 'active' as const,
        inactive: 'inactive' as const,
        suspended: 'warning' as const,
      };
      return (
        <StatusBadge variant={variant[status]} dot pulse={status === 'active'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusBadge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const affiliate = row.original;
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
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Ban className="mr-2 h-4 w-4" />
              Suspend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Activity Table Columns
const activityColumns: ColumnDef<ReferralActivity>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      const icons = {
        referral: <Users className="h-4 w-4 text-blue-400" />,
        commission: <DollarSign className="h-4 w-4 text-green-400" />,
        payout: <TrendingUp className="h-4 w-4 text-yellow-400" />,
      };
      const labels = {
        referral: 'New Referral',
        commission: 'Commission',
        payout: 'Payout',
      };
      return (
        <div className="flex items-center gap-2">
          {icons[type]}
          <span>{labels[type]}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'affiliateName',
    header: 'Affiliate',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.affiliateName}</div>
        <div className="text-xs text-muted-foreground">{row.original.affiliateEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: 'referredUser',
    header: 'Details',
    cell: ({ row }) => {
      const activity = row.original;
      if (activity.type === 'referral' && activity.referredUser) {
        return <span className="text-sm">{activity.referredUser}</span>;
      }
      if (activity.amount) {
        return (
          <span className="font-mono text-green-400">
            ${(activity.amount / 100).toFixed(2)}
          </span>
        );
      }
      return <span className="text-muted-foreground">—</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = {
        pending: 'warning' as const,
        approved: 'active' as const,
        paid: 'active' as const,
        rejected: 'inactive' as const,
      };
      return (
        <StatusBadge variant={variant[status]} dot={status === 'pending'} pulse={status === 'pending'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusBadge>
      );
    },
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
export default function ReferralsPage() {
  const [tiers, setTiers] = React.useState<CommissionTier[]>(mockTiers);
  const [settings, setSettings] = React.useState<ProgramSettings>(mockSettings);
  const [incentive, setIncentive] = React.useState<ReferralIncentive>(mockIncentive);
  const [stats] = React.useState<AffiliateStats>(mockStats);
  const [affiliates] = React.useState<Affiliate[]>(mockAffiliates);
  const [activity] = React.useState<ReferralActivity[]>(mockActivity);
  const [editingTier, setEditingTier] = React.useState<CommissionTier | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [affiliateSearch, setAffiliateSearch] = React.useState('');

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const handleSaveTier = (updatedTier: CommissionTier) => {
    setTiers((prev) => prev.map((t) => (t.id === updatedTier.id ? updatedTier : t)));
  };

  const handleAddTier = () => {
    const newTier: CommissionTier = {
      id: String(Date.now()),
      name: 'New Tier',
      type: 'PERCENTAGE',
      value: 20,
      minReferrals: 100,
      color: '#9333ea',
    };
    setTiers((prev) => [...prev, newTier]);
    setEditingTier(newTier);
    setIsEditDialogOpen(true);
  };

  // SDK code snippets
  const affiliateStatsCode = `import { AffiliateStats } from '@gamify/react';

// Display affiliate dashboard with stats
<AffiliateStats
  autoRefresh
  theme={{
    cardBackground: '#1a1a2e',
    valueColor: '#fff',
  }}
/>`;

  const referralLinkCode = `import { ReferralLink } from '@gamify/react';

// Shareable referral link component
<ReferralLink
  baseUrl="${settings.referralLinkBase}"
  shareTitle="Join and get ${incentive.value}% off!"
  shareText="Sign up using my referral link"
  onCopy={(link) => console.log('Copied:', link)}
/>`;

  const leaderboardCode = `import { Leaderboard } from '@gamify/react';

// Top affiliates leaderboard
<Leaderboard
  limit={10}
  currentUserId={userId}
  emptyMessage="Be the first to join!"
/>`;

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
            <Users className="h-6 w-6" />
            Referral Program
          </h1>
          <p className="text-muted-foreground">
            Configure your affiliate program and commission structure
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
          >
            {settings.enabled ? (
              <>
                <ToggleRight className="h-4 w-4 mr-2 text-green-400" />
                Program Active
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" />
                Program Disabled
              </>
            )}
          </Button>
          <GlowButton variant="glow" asChild>
            <Link href="/dashboard/playground">
              <Zap className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </GlowButton>
        </div>
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
          label="Active Affiliates"
          value={stats.activeAffiliates.toLocaleString()}
          trend={12}
          color="primary"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Referrals"
          value={stats.totalReferrals.toLocaleString()}
          subValue={`${stats.conversionRate}% conversion`}
          trend={8}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Commission Paid"
          value={formatCurrency(stats.commissionPaid)}
          trend={15}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Pending Payout"
          value={formatCurrency(stats.pendingCommission)}
          color="yellow"
        />
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
              Commission Tiers
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Program Settings
            </TabsTrigger>
            <TabsTrigger value="incentives" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Referral Incentives
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Embed Components
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Commission Tiers Tab */}
          <TabsContent value="tiers">
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Commission Tiers</GlassCardTitle>
                  <GlassCardDescription>
                    Define commission rates for different affiliate levels
                  </GlassCardDescription>
                </div>
                <Button onClick={handleAddTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid gap-4 md:grid-cols-3">
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
                <div className="mt-6 p-4 rounded-lg bg-surface-1 border border-border">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    How Tier Progression Works
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Affiliates automatically advance to higher tiers as they accumulate successful
                    referrals. Commission rates apply to all future purchases made by their
                    referred users.
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Program Settings Tab */}
          <TabsContent value="settings">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Program Settings</GlassCardTitle>
                <GlassCardDescription>
                  Configure how your referral program operates
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="referral-base">Referral Link Base URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="referral-base"
                        value={settings.referralLinkBase}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, referralLinkBase: e.target.value }))
                        }
                        placeholder="https://yourstore.com"
                      />
                      <Button variant="outline" size="icon">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Referral links will be: {settings.referralLinkBase}?ref=CODE
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cookie-duration">Cookie Duration</Label>
                    <Select
                      value={String(settings.cookieDuration)}
                      onValueChange={(value) =>
                        setSettings((s) => ({ ...s, cookieDuration: Number(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How long referral attribution persists
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commission-trigger">Commission Trigger</Label>
                    <Select
                      value={settings.commissionTrigger}
                      onValueChange={(value) =>
                        setSettings((s) => ({
                          ...s,
                          commissionTrigger: value as 'purchase' | 'signup' | 'subscription',
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">On Purchase</SelectItem>
                        <SelectItem value="signup">On Signup</SelectItem>
                        <SelectItem value="subscription">On Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      When affiliates earn their commission
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-payout">Minimum Payout ($)</Label>
                    <Select
                      value={String(settings.minPayout)}
                      onValueChange={(value) =>
                        setSettings((s) => ({ ...s, minPayout: Number(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">$25</SelectItem>
                        <SelectItem value="50">$50</SelectItem>
                        <SelectItem value="100">$100</SelectItem>
                        <SelectItem value="200">$200</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Threshold before payout is available
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-1 border border-border">
                  <div>
                    <h4 className="font-medium">Auto-approve Commissions</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve commissions without manual review
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSettings((s) => ({ ...s, autoApprove: !s.autoApprove }))}
                  >
                    {settings.autoApprove ? (
                      <>
                        <ToggleRight className="h-4 w-4 mr-2 text-green-400" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 mr-2" />
                        Disabled
                      </>
                    )}
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Referral Incentives Tab */}
          <TabsContent value="incentives">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Referral Incentives</GlassCardTitle>
                <GlassCardDescription>
                  What referred users receive when they sign up
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      incentive.type === 'percentage'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setIncentive((i) => ({ ...i, type: 'percentage' }))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="h-5 w-5 text-primary" />
                      <span className="font-medium">Percentage Discount</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Give referred users a percentage off their first purchase
                    </p>
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      incentive.type === 'fixed'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setIncentive((i) => ({ ...i, type: 'fixed' }))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      <span className="font-medium">Fixed Discount</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Give referred users a fixed dollar amount off
                    </p>
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      incentive.type === 'points'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setIncentive((i) => ({ ...i, type: 'points' }))}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-5 w-5 text-yellow-400" />
                      <span className="font-medium">Bonus Points</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Give referred users bonus loyalty points
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incentive-value">
                    {incentive.type === 'percentage'
                      ? 'Discount Percentage'
                      : incentive.type === 'fixed'
                        ? 'Discount Amount ($)'
                        : 'Bonus Points'}
                  </Label>
                  <Input
                    id="incentive-value"
                    type="number"
                    value={incentive.value}
                    onChange={(e) => setIncentive((i) => ({ ...i, value: Number(e.target.value) }))}
                    className="max-w-xs"
                  />
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-medium text-green-400 mb-1">Preview</h4>
                  <p className="text-sm text-green-400/80">
                    Referred users will receive:{' '}
                    <strong>
                      {incentive.type === 'percentage'
                        ? `${incentive.value}% off their first purchase`
                        : incentive.type === 'fixed'
                          ? `$${incentive.value} off their first purchase`
                          : `${incentive.value} bonus loyalty points`}
                    </strong>
                  </p>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Embed Components Tab */}
          <TabsContent value="embed">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Embed Components</GlassCardTitle>
                <GlassCardDescription>
                  Add these React components to your site for affiliate dashboards
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-8">
                <CodeSnippet
                  title="Affiliate Stats Dashboard"
                  description="Display referral count, commissions, and earnings"
                  code={affiliateStatsCode}
                />

                <CodeSnippet
                  title="Referral Link Share"
                  description="Shareable referral link with copy and native share buttons"
                  code={referralLinkCode}
                />

                <CodeSnippet
                  title="Affiliate Leaderboard"
                  description="Show top affiliates ranked by referrals"
                  code={leaderboardCode}
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

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            {/* Affiliates Table */}
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Affiliates</GlassCardTitle>
                  <GlassCardDescription>
                    All registered affiliates in your program
                  </GlassCardDescription>
                </div>
              </GlassCardHeader>
              <div className="px-6 pb-2">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search affiliates..."
                      className="pl-9 bg-surface-1"
                      value={affiliateSearch}
                      onChange={(e) => setAffiliateSearch(e.target.value)}
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
                  columns={affiliateColumns}
                  data={affiliates}
                  searchKey="name"
                  searchValue={affiliateSearch}
                />
              </GlassCardContent>
            </GlassCard>

            {/* Recent Activity Table */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Recent Activity</GlassCardTitle>
                <GlassCardDescription>
                  Latest referrals, commissions, and payouts
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <DataTable
                  columns={activityColumns}
                  data={activity}
                />
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
