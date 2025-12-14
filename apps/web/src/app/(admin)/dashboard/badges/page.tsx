'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Medal,
  Users,
  TrendingUp,
  Trophy,
  Plus,
  Pencil,
  Code,
  ExternalLink,
  ArrowUpDown,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  Zap,
  Hash,
  Hand,
  Activity,
  Copy,
  Check,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
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
type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
type BadgeVisibility = 'PUBLIC' | 'HIDDEN';
type BadgeRuleType = 'METRIC_THRESHOLD' | 'EVENT_COUNT' | 'MANUAL';
type BadgeAwardSource = 'AUTOMATIC' | 'MANUAL' | 'QUEST_REWARD';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  rarity: BadgeRarity;
  visibility: BadgeVisibility;
  category?: string;
  ruleType: BadgeRuleType;
  triggerMetric?: string;
  threshold?: number;
  active: boolean;
  unlockCount: number;
  createdAt: string;
}

interface BadgeUnlock {
  id: string;
  userName: string;
  userEmail: string;
  badgeName: string;
  badgeRarity: BadgeRarity;
  badgeIconUrl?: string;
  awardSource: BadgeAwardSource;
  unlockedAt: string;
}

interface BadgeStats {
  totalBadges: number;
  totalUnlocks: number;
  unlockRate: number;
  mostEarned: { name: string; count: number };
}

// Rarity colors
const RARITY_COLORS: Record<BadgeRarity, string> = {
  COMMON: '#9CA3AF',
  RARE: '#3B82F6',
  EPIC: '#8B5CF6',
  LEGENDARY: '#F59E0B',
};

const RARITY_ORDER: BadgeRarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

// Mock data
const mockBadges: BadgeDefinition[] = [
  {
    id: '1',
    name: 'Early Bird',
    description: 'Sign up within the first month of launch',
    iconUrl: '/badges/early-bird.svg',
    rarity: 'RARE',
    visibility: 'PUBLIC',
    category: 'Onboarding',
    ruleType: 'MANUAL',
    active: true,
    unlockCount: 247,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'First Purchase',
    description: 'Complete your first purchase',
    iconUrl: '/badges/first-purchase.svg',
    rarity: 'COMMON',
    visibility: 'PUBLIC',
    category: 'Purchases',
    ruleType: 'EVENT_COUNT',
    triggerMetric: 'purchase',
    threshold: 1,
    active: true,
    unlockCount: 1842,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Big Spender',
    description: 'Spend over $500 in total purchases',
    iconUrl: '/badges/big-spender.svg',
    rarity: 'EPIC',
    visibility: 'PUBLIC',
    category: 'Purchases',
    ruleType: 'METRIC_THRESHOLD',
    triggerMetric: 'total_spent',
    threshold: 50000,
    active: true,
    unlockCount: 156,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Social Butterfly',
    description: 'Refer 5 friends who make a purchase',
    iconUrl: '/badges/social-butterfly.svg',
    rarity: 'RARE',
    visibility: 'PUBLIC',
    category: 'Social',
    ruleType: 'METRIC_THRESHOLD',
    triggerMetric: 'referral_conversions',
    threshold: 5,
    active: true,
    unlockCount: 89,
    createdAt: '2024-02-15',
  },
  {
    id: '5',
    name: 'Loyalty Legend',
    description: 'Reach Platinum tier in the loyalty program',
    iconUrl: '/badges/loyalty-legend.svg',
    rarity: 'LEGENDARY',
    visibility: 'PUBLIC',
    category: 'Loyalty',
    ruleType: 'METRIC_THRESHOLD',
    triggerMetric: 'loyalty_points',
    threshold: 10000,
    active: true,
    unlockCount: 42,
    createdAt: '2024-03-01',
  },
  {
    id: '6',
    name: 'Profile Pro',
    description: 'Complete all profile fields',
    iconUrl: '/badges/profile-pro.svg',
    rarity: 'COMMON',
    visibility: 'PUBLIC',
    category: 'Onboarding',
    ruleType: 'MANUAL',
    active: false,
    unlockCount: 523,
    createdAt: '2024-01-01',
  },
];

const mockStats: BadgeStats = {
  totalBadges: 6,
  totalUnlocks: 2899,
  unlockRate: 68,
  mostEarned: { name: 'First Purchase', count: 1842 },
};

const mockUnlocks: BadgeUnlock[] = [
  {
    id: '1',
    userName: 'Jordan Smith',
    userEmail: 'jordan@example.com',
    badgeName: 'Big Spender',
    badgeRarity: 'EPIC',
    awardSource: 'AUTOMATIC',
    unlockedAt: '2024-07-14T10:30:00Z',
  },
  {
    id: '2',
    userName: 'Sam Wilson',
    userEmail: 'sam@example.com',
    badgeName: 'First Purchase',
    badgeRarity: 'COMMON',
    awardSource: 'AUTOMATIC',
    unlockedAt: '2024-07-14T09:15:00Z',
  },
  {
    id: '3',
    userName: 'Alex Johnson',
    userEmail: 'alex@example.com',
    badgeName: 'Social Butterfly',
    badgeRarity: 'RARE',
    awardSource: 'AUTOMATIC',
    unlockedAt: '2024-07-13T16:00:00Z',
  },
  {
    id: '4',
    userName: 'Taylor Brown',
    userEmail: 'taylor@example.com',
    badgeName: 'Early Bird',
    badgeRarity: 'RARE',
    awardSource: 'MANUAL',
    unlockedAt: '2024-07-13T14:22:00Z',
  },
  {
    id: '5',
    userName: 'Morgan Lee',
    userEmail: 'morgan@example.com',
    badgeName: 'Loyalty Legend',
    badgeRarity: 'LEGENDARY',
    awardSource: 'AUTOMATIC',
    unlockedAt: '2024-07-12T11:45:00Z',
  },
  {
    id: '6',
    userName: 'Casey White',
    userEmail: 'casey@example.com',
    badgeName: 'First Purchase',
    badgeRarity: 'COMMON',
    awardSource: 'AUTOMATIC',
    unlockedAt: '2024-07-12T09:30:00Z',
  },
  {
    id: '7',
    userName: 'Riley Green',
    userEmail: 'riley@example.com',
    badgeName: 'Profile Pro',
    badgeRarity: 'COMMON',
    awardSource: 'QUEST_REWARD',
    unlockedAt: '2024-07-11T15:20:00Z',
  },
  {
    id: '8',
    userName: 'Jordan Smith',
    userEmail: 'jordan@example.com',
    badgeName: 'Social Butterfly',
    badgeRarity: 'RARE',
    awardSource: 'AUTOMATIC',
    unlockedAt: '2024-07-11T10:00:00Z',
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
  color?: 'primary' | 'green' | 'yellow' | 'blue' | 'purple';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
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

// Rarity Badge Component
function RarityBadge({ rarity }: { rarity: BadgeRarity }) {
  return (
    <span
      className="px-2 py-0.5 text-xs font-medium rounded-full"
      style={{
        backgroundColor: `${RARITY_COLORS[rarity]}20`,
        color: RARITY_COLORS[rarity],
      }}
    >
      {rarity}
    </span>
  );
}

// Badge Card Component
function BadgeCard({ badge, onEdit, onToggleActive }: { badge: BadgeDefinition; onEdit: () => void; onToggleActive: () => void }) {
  const ruleTypeIcons = {
    METRIC_THRESHOLD: <Zap className="h-3 w-3" />,
    EVENT_COUNT: <Hash className="h-3 w-3" />,
    MANUAL: <Hand className="h-3 w-3" />,
  };

  const ruleTypeLabels = {
    METRIC_THRESHOLD: 'Threshold',
    EVENT_COUNT: 'Event Count',
    MANUAL: 'Manual',
  };

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border border-border bg-surface-1 hover:bg-surface-2 transition-colors',
        !badge.active && 'opacity-60'
      )}
      style={{ borderTopColor: RARITY_COLORS[badge.rarity], borderTopWidth: '4px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${RARITY_COLORS[badge.rarity]}20` }}
          >
            <Trophy className="h-6 w-6" style={{ color: RARITY_COLORS[badge.rarity] }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{badge.name}</span>
              {badge.visibility === 'HIDDEN' && (
                <EyeOff className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <RarityBadge rarity={badge.rarity} />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {badge.active ? (
                <>
                  <ToggleLeft className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <ToggleRight className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{badge.description}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          {ruleTypeIcons[badge.ruleType]}
          <span>{ruleTypeLabels[badge.ruleType]}</span>
        </div>
        {badge.category && (
          <span className="px-2 py-0.5 rounded bg-surface-2">{badge.category}</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{badge.unlockCount.toLocaleString()}</span>
          <span className="text-muted-foreground">earned</span>
        </div>
        <StatusBadge variant={badge.active ? 'active' : 'inactive'} dot>
          {badge.active ? 'Active' : 'Inactive'}
        </StatusBadge>
      </div>
    </div>
  );
}

// Edit Badge Dialog Component
function EditBadgeDialog({
  badge,
  open,
  onOpenChange,
  onSave,
}: {
  badge: BadgeDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (badge: BadgeDefinition) => void;
}) {
  const [editedBadge, setEditedBadge] = React.useState<BadgeDefinition | null>(badge);

  React.useEffect(() => {
    setEditedBadge(badge);
  }, [badge]);

  if (!editedBadge) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{badge?.id ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
          <DialogDescription>
            Configure the badge properties and unlock conditions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="badge-name">Name</Label>
              <Input
                id="badge-name"
                value={editedBadge.name}
                onChange={(e) => setEditedBadge({ ...editedBadge, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge-category">Category</Label>
              <Input
                id="badge-category"
                value={editedBadge.category || ''}
                onChange={(e) => setEditedBadge({ ...editedBadge, category: e.target.value })}
                placeholder="e.g., Onboarding, Purchases"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-description">Description</Label>
            <Input
              id="badge-description"
              value={editedBadge.description}
              onChange={(e) => setEditedBadge({ ...editedBadge, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge-icon">Icon URL</Label>
            <Input
              id="badge-icon"
              value={editedBadge.iconUrl || ''}
              onChange={(e) => setEditedBadge({ ...editedBadge, iconUrl: e.target.value })}
              placeholder="https://example.com/badge.svg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select
                value={editedBadge.rarity}
                onValueChange={(value) => setEditedBadge({ ...editedBadge, rarity: value as BadgeRarity })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RARITY_ORDER.map((rarity) => (
                    <SelectItem key={rarity} value={rarity}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: RARITY_COLORS[rarity] }}
                        />
                        {rarity}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={editedBadge.visibility}
                onValueChange={(value) => setEditedBadge({ ...editedBadge, visibility: value as BadgeVisibility })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="HIDDEN">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Hidden
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rule Type</Label>
            <Select
              value={editedBadge.ruleType}
              onValueChange={(value) => setEditedBadge({ ...editedBadge, ruleType: value as BadgeRuleType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="METRIC_THRESHOLD">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Metric Threshold
                  </div>
                </SelectItem>
                <SelectItem value="EVENT_COUNT">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Event Count
                  </div>
                </SelectItem>
                <SelectItem value="MANUAL">
                  <div className="flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    Manual Award
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editedBadge.ruleType !== 'MANUAL' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badge-metric">Trigger Metric</Label>
                <Input
                  id="badge-metric"
                  value={editedBadge.triggerMetric || ''}
                  onChange={(e) => setEditedBadge({ ...editedBadge, triggerMetric: e.target.value })}
                  placeholder="e.g., purchase, total_spent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge-threshold">Threshold</Label>
                <Input
                  id="badge-threshold"
                  type="number"
                  value={editedBadge.threshold || ''}
                  onChange={(e) => setEditedBadge({ ...editedBadge, threshold: Number(e.target.value) })}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(editedBadge);
              onOpenChange(false);
            }}
          >
            Save Badge
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

// Unlock Table Columns
const unlockColumns: ColumnDef<BadgeUnlock>[] = [
  {
    accessorKey: 'userName',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        User
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.userName}</div>
        <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: 'badgeName',
    header: 'Badge',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded flex items-center justify-center"
          style={{ backgroundColor: `${RARITY_COLORS[row.original.badgeRarity]}20` }}
        >
          <Trophy className="h-4 w-4" style={{ color: RARITY_COLORS[row.original.badgeRarity] }} />
        </div>
        <div>
          <div className="font-medium">{row.original.badgeName}</div>
          <RarityBadge rarity={row.original.badgeRarity} />
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'awardSource',
    header: 'Source',
    cell: ({ row }) => {
      const source = row.original.awardSource;
      const config = {
        AUTOMATIC: { icon: <Zap className="h-4 w-4 text-blue-400" />, label: 'Automatic' },
        MANUAL: { icon: <Hand className="h-4 w-4 text-yellow-400" />, label: 'Manual' },
        QUEST_REWARD: { icon: <Trophy className="h-4 w-4 text-purple-400" />, label: 'Quest' },
      };
      const { icon, label } = config[source];
      return (
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm">{label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'unlockedAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Unlocked
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.unlockedAt);
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
export default function BadgesPage() {
  const [badges, setBadges] = React.useState<BadgeDefinition[]>(mockBadges);
  const [stats] = React.useState<BadgeStats>(mockStats);
  const [unlocks] = React.useState<BadgeUnlock[]>(mockUnlocks);
  const [editingBadge, setEditingBadge] = React.useState<BadgeDefinition | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [unlockSearch, setUnlockSearch] = React.useState('');
  const [rarityFilter, setRarityFilter] = React.useState<string>('all');

  const filteredBadges = badges.filter((badge) => {
    if (rarityFilter === 'all') return true;
    return badge.rarity === rarityFilter;
  });

  const handleSaveBadge = (updatedBadge: BadgeDefinition) => {
    setBadges((prev) => {
      const exists = prev.find((b) => b.id === updatedBadge.id);
      if (exists) {
        return prev.map((b) => (b.id === updatedBadge.id ? updatedBadge : b));
      }
      return [...prev, updatedBadge];
    });
  };

  const handleToggleActive = (badgeId: string) => {
    setBadges((prev) =>
      prev.map((b) => (b.id === badgeId ? { ...b, active: !b.active } : b))
    );
  };

  const handleAddBadge = () => {
    const newBadge: BadgeDefinition = {
      id: String(Date.now()),
      name: 'New Badge',
      description: 'Describe how to earn this badge',
      rarity: 'COMMON',
      visibility: 'PUBLIC',
      ruleType: 'MANUAL',
      active: false,
      unlockCount: 0,
      createdAt: new Date().toISOString(),
    };
    setEditingBadge(newBadge);
    setIsEditDialogOpen(true);
  };

  // SDK code snippets
  const badgeGridCode = `import { BadgeGrid } from '@gamify/react';

// Display user's badge collection
<BadgeGrid
  columns={3}
  showLocked
  showStats
  onBadgeClick={(badge) => {
    console.log('Clicked badge:', badge.name);
  }}
  theme={{
    cardBackground: '#1a1a2e',
    lockedOpacity: 0.5,
  }}
/>`;

  const useBadgesCode = `import { useBadges } from '@gamify/react';

function BadgeWall() {
  const { badges, earned, locked, stats, loading } = useBadges();

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>Badges: {stats.unlocked}/{stats.total}</h2>
      <div className="grid grid-cols-3 gap-4">
        {badges.map((badge) => (
          <BadgeCard
            key={badge.id}
            name={badge.name}
            rarity={badge.rarity}
            isUnlocked={badge.isUnlocked}
          />
        ))}
      </div>
    </div>
  );
}`;

  // Rarity distribution for stats card
  const rarityDistribution = RARITY_ORDER.map((rarity) => ({
    rarity,
    count: badges.filter((b) => b.rarity === rarity).length,
    color: RARITY_COLORS[rarity],
  }));

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
            <Medal className="h-6 w-6" />
            Achievements
          </h1>
          <p className="text-muted-foreground">
            Create badges and track user unlocks
          </p>
        </div>
        <GlowButton variant="glow" onClick={handleAddBadge}>
          <Plus className="mr-2 h-4 w-4" />
          New Badge
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
          icon={Trophy}
          label="Total Badges"
          value={stats.totalBadges.toString()}
          subValue={`${badges.filter((b) => b.active).length} active`}
          color="primary"
        />
        <StatCard
          icon={Users}
          label="Badges Earned"
          value={stats.totalUnlocks.toLocaleString()}
          subValue="All time"
          trend={15}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Unlock Rate"
          value={`${stats.unlockRate}%`}
          subValue="Users with 1+ badge"
          color="blue"
        />
        <GlassCard className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">Rarity Distribution</p>
          <div className="space-y-2">
            {rarityDistribution.map((item) => (
              <div key={item.rarity} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs flex-1">{item.rarity}</span>
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
        <Tabs defaultValue="badges" className="space-y-4">
          <TabsList>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Badge Library
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

          {/* Badge Library Tab */}
          <TabsContent value="badges">
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Badge Library</GlassCardTitle>
                  <GlassCardDescription>
                    Define badges, rarities, and unlock conditions
                  </GlassCardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={rarityFilter} onValueChange={setRarityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter rarity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rarities</SelectItem>
                      {RARITY_ORDER.map((rarity) => (
                        <SelectItem key={rarity} value={rarity}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: RARITY_COLORS[rarity] }}
                            />
                            {rarity}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddBadge}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Badge
                  </Button>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredBadges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      onEdit={() => {
                        setEditingBadge(badge);
                        setIsEditDialogOpen(true);
                      }}
                      onToggleActive={() => handleToggleActive(badge.id)}
                    />
                  ))}
                </div>

                {filteredBadges.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No badges found for the selected filter.
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Recent Unlocks</GlassCardTitle>
                  <GlassCardDescription>
                    Latest badge unlocks across all users
                  </GlassCardDescription>
                </div>
              </GlassCardHeader>
              <div className="px-6 pb-2">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by user or badge..."
                      className="pl-9 bg-surface-1"
                      value={unlockSearch}
                      onChange={(e) => setUnlockSearch(e.target.value)}
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
                  columns={unlockColumns}
                  data={unlocks}
                  searchKey="userName"
                  searchValue={unlockSearch}
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
                  Add these React components to display achievements
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-8">
                <CodeSnippet
                  title="BadgeGrid Component"
                  description="Display the user's badge collection with unlock status"
                  code={badgeGridCode}
                />

                <CodeSnippet
                  title="useBadges Hook"
                  description="Access badge data in your custom components"
                  code={useBadgesCode}
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

      {/* Edit Badge Dialog */}
      <EditBadgeDialog
        badge={editingBadge}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveBadge}
      />
    </div>
  );
}
