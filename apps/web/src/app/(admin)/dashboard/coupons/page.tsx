'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  ShoppingBag,
  Coins,
  Clock,
  Plus,
  Pencil,
  Code,
  ExternalLink,
  ArrowUpDown,
  Search,
  Filter,
  MoreHorizontal,
  Tag,
  Zap,
  Hand,
  Package,
  Lock,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Infinity,
  Activity,
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
type FulfillmentType = 'WEBHOOK' | 'PROMO_CODE' | 'MANUAL';
type RedemptionStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface RewardItem {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  costPoints: number;
  stockQuantity: number | null;
  prerequisiteBadgeId?: string;
  prerequisiteBadgeName?: string;
  fulfillmentType: FulfillmentType;
  fulfillmentConfig: Record<string, unknown>;
  active: boolean;
  displayOrder: number;
  redemptionCount: number;
  createdAt: string;
}

interface RedemptionTransaction {
  id: string;
  userName: string;
  userEmail: string;
  rewardName: string;
  costAtTime: number;
  status: RedemptionStatus;
  errorMessage?: string;
  fulfillmentData?: Record<string, unknown>;
  createdAt: string;
}

interface RewardStats {
  totalRewards: number;
  totalRedemptions: number;
  pointsRedeemed: number;
  pendingFulfillments: number;
}

// Fulfillment type colors
const FULFILLMENT_COLORS: Record<FulfillmentType, string> = {
  WEBHOOK: '#3B82F6',
  PROMO_CODE: '#10B981',
  MANUAL: '#F59E0B',
};

// Mock data
const mockRewards: RewardItem[] = [
  {
    id: '1',
    name: '$10 Store Credit',
    description: 'Get $10 off your next purchase',
    imageUrl: '/rewards/store-credit.svg',
    sku: 'CREDIT-10',
    costPoints: 1000,
    stockQuantity: null,
    fulfillmentType: 'PROMO_CODE',
    fulfillmentConfig: { codePrefix: 'CREDIT10-' },
    active: true,
    displayOrder: 1,
    redemptionCount: 156,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Free Shipping',
    description: 'Free shipping on your next order',
    imageUrl: '/rewards/shipping.svg',
    sku: 'FREE-SHIP',
    costPoints: 500,
    stockQuantity: null,
    fulfillmentType: 'PROMO_CODE',
    fulfillmentConfig: { codePrefix: 'FREESHIP-' },
    active: true,
    displayOrder: 2,
    redemptionCount: 342,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'Exclusive Merchandise',
    description: 'Limited edition branded t-shirt',
    imageUrl: '/rewards/merch.svg',
    sku: 'MERCH-TSHIRT',
    costPoints: 5000,
    stockQuantity: 50,
    fulfillmentType: 'MANUAL',
    fulfillmentConfig: { shippingRequired: true },
    active: true,
    displayOrder: 3,
    redemptionCount: 23,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Premium Feature Access',
    description: '30 days of premium features',
    imageUrl: '/rewards/premium.svg',
    sku: 'PREMIUM-30',
    costPoints: 2500,
    stockQuantity: null,
    prerequisiteBadgeId: 'loyalty-legend',
    prerequisiteBadgeName: 'Loyalty Legend',
    fulfillmentType: 'WEBHOOK',
    fulfillmentConfig: { webhookUrl: 'https://api.example.com/grant-premium' },
    active: true,
    displayOrder: 4,
    redemptionCount: 67,
    createdAt: '2024-02-15',
  },
  {
    id: '5',
    name: 'VIP Event Access',
    description: 'Exclusive invite to VIP launch event',
    imageUrl: '/rewards/vip.svg',
    sku: 'VIP-EVENT',
    costPoints: 10000,
    stockQuantity: 20,
    prerequisiteBadgeId: 'big-spender',
    prerequisiteBadgeName: 'Big Spender',
    fulfillmentType: 'MANUAL',
    fulfillmentConfig: { requiresApproval: true },
    active: true,
    displayOrder: 5,
    redemptionCount: 8,
    createdAt: '2024-03-01',
  },
  {
    id: '6',
    name: '25% Off Coupon',
    description: 'Get 25% off any purchase (archived)',
    imageUrl: '/rewards/discount.svg',
    sku: 'DISCOUNT-25',
    costPoints: 3000,
    stockQuantity: null,
    fulfillmentType: 'PROMO_CODE',
    fulfillmentConfig: { codePrefix: 'SAVE25-' },
    active: false,
    displayOrder: 6,
    redemptionCount: 89,
    createdAt: '2024-01-01',
  },
];

const mockStats: RewardStats = {
  totalRewards: 6,
  totalRedemptions: 685,
  pointsRedeemed: 1425000,
  pendingFulfillments: 2,
};

const mockRedemptions: RedemptionTransaction[] = [
  {
    id: '1',
    userName: 'Jordan Smith',
    userEmail: 'jordan@example.com',
    rewardName: '$10 Store Credit',
    costAtTime: 1000,
    status: 'COMPLETED',
    fulfillmentData: { promoCode: 'CREDIT10-XYZ123' },
    createdAt: '2024-07-14T10:30:00Z',
  },
  {
    id: '2',
    userName: 'Sam Wilson',
    userEmail: 'sam@example.com',
    rewardName: 'Exclusive Merchandise',
    costAtTime: 5000,
    status: 'PROCESSING',
    createdAt: '2024-07-14T09:15:00Z',
  },
  {
    id: '3',
    userName: 'Alex Johnson',
    userEmail: 'alex@example.com',
    rewardName: 'Premium Feature Access',
    costAtTime: 2500,
    status: 'COMPLETED',
    fulfillmentData: { grantedUntil: '2024-08-13' },
    createdAt: '2024-07-13T16:00:00Z',
  },
  {
    id: '4',
    userName: 'Taylor Brown',
    userEmail: 'taylor@example.com',
    rewardName: 'Free Shipping',
    costAtTime: 500,
    status: 'COMPLETED',
    fulfillmentData: { promoCode: 'FREESHIP-ABC456' },
    createdAt: '2024-07-13T14:22:00Z',
  },
  {
    id: '5',
    userName: 'Morgan Lee',
    userEmail: 'morgan@example.com',
    rewardName: 'VIP Event Access',
    costAtTime: 10000,
    status: 'PROCESSING',
    createdAt: '2024-07-12T11:45:00Z',
  },
  {
    id: '6',
    userName: 'Casey White',
    userEmail: 'casey@example.com',
    rewardName: 'Premium Feature Access',
    costAtTime: 2500,
    status: 'FAILED',
    errorMessage: 'Webhook timeout - retrying',
    createdAt: '2024-07-12T09:30:00Z',
  },
  {
    id: '7',
    userName: 'Riley Green',
    userEmail: 'riley@example.com',
    rewardName: '$10 Store Credit',
    costAtTime: 1000,
    status: 'COMPLETED',
    fulfillmentData: { promoCode: 'CREDIT10-DEF789' },
    createdAt: '2024-07-11T15:20:00Z',
  },
  {
    id: '8',
    userName: 'Jordan Smith',
    userEmail: 'jordan@example.com',
    rewardName: 'Free Shipping',
    costAtTime: 500,
    status: 'COMPLETED',
    fulfillmentData: { promoCode: 'FREESHIP-GHI012' },
    createdAt: '2024-07-11T10:00:00Z',
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

// Fulfillment Badge Component
function FulfillmentBadge({ type }: { type: FulfillmentType }) {
  const icons = {
    WEBHOOK: <Zap className="h-3 w-3" />,
    PROMO_CODE: <Tag className="h-3 w-3" />,
    MANUAL: <Hand className="h-3 w-3" />,
  };

  const labels = {
    WEBHOOK: 'Webhook',
    PROMO_CODE: 'Promo Code',
    MANUAL: 'Manual',
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
      style={{
        backgroundColor: `${FULFILLMENT_COLORS[type]}20`,
        color: FULFILLMENT_COLORS[type],
      }}
    >
      {icons[type]}
      {labels[type]}
    </span>
  );
}

// Reward Card Component
function RewardCard({
  reward,
  onEdit,
  onToggleActive,
}: {
  reward: RewardItem;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border border-border bg-surface-1 hover:bg-surface-2 transition-colors',
        !reward.active && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10"
          >
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{reward.name}</span>
              {reward.prerequisiteBadgeName && (
                <span title={`Requires: ${reward.prerequisiteBadgeName}`}>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </span>
              )}
            </div>
            <FulfillmentBadge type={reward.fulfillmentType} />
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
              {reward.active ? (
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

      {reward.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{reward.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="font-mono font-medium">{reward.costPoints.toLocaleString()}</span>
          <span className="text-muted-foreground">pts</span>
        </div>
        <div className="flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          {reward.stockQuantity === null ? (
            <span className="text-muted-foreground flex items-center gap-1">
              <Infinity className="h-3 w-3" />
              Unlimited
            </span>
          ) : reward.stockQuantity <= 0 ? (
            <span className="text-red-400">Out of stock</span>
          ) : reward.stockQuantity <= 10 ? (
            <span className="text-yellow-400">{reward.stockQuantity} left</span>
          ) : (
            <span className="font-mono">{reward.stockQuantity} in stock</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{reward.redemptionCount}</span>
          <span className="text-muted-foreground">redeemed</span>
        </div>
        <StatusBadge variant={reward.active ? 'active' : 'inactive'} dot>
          {reward.active ? 'Active' : 'Inactive'}
        </StatusBadge>
      </div>
    </div>
  );
}

// Edit Reward Dialog Component
function EditRewardDialog({
  reward,
  open,
  onOpenChange,
  onSave,
}: {
  reward: RewardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reward: RewardItem) => void;
}) {
  const [editedReward, setEditedReward] = React.useState<RewardItem | null>(reward);
  const [unlimitedStock, setUnlimitedStock] = React.useState(reward?.stockQuantity === null);

  React.useEffect(() => {
    setEditedReward(reward);
    setUnlimitedStock(reward?.stockQuantity === null);
  }, [reward]);

  if (!editedReward) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{reward?.id ? 'Edit Reward' : 'Create Reward'}</DialogTitle>
          <DialogDescription>
            Configure the reward item and fulfillment settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward-name">Name</Label>
              <Input
                id="reward-name"
                value={editedReward.name}
                onChange={(e) => setEditedReward({ ...editedReward, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-sku">SKU</Label>
              <Input
                id="reward-sku"
                value={editedReward.sku || ''}
                onChange={(e) => setEditedReward({ ...editedReward, sku: e.target.value })}
                placeholder="e.g., REWARD-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward-description">Description</Label>
            <Textarea
              id="reward-description"
              value={editedReward.description || ''}
              onChange={(e) => setEditedReward({ ...editedReward, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward-image">Image URL</Label>
            <Input
              id="reward-image"
              value={editedReward.imageUrl || ''}
              onChange={(e) => setEditedReward({ ...editedReward, imageUrl: e.target.value })}
              placeholder="https://example.com/reward.png"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reward-cost">Cost (Points)</Label>
              <Input
                id="reward-cost"
                type="number"
                value={editedReward.costPoints}
                onChange={(e) => setEditedReward({ ...editedReward, costPoints: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-stock">Stock Quantity</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="reward-stock"
                  type="number"
                  value={unlimitedStock ? '' : (editedReward.stockQuantity || '')}
                  onChange={(e) => setEditedReward({ ...editedReward, stockQuantity: Number(e.target.value) })}
                  disabled={unlimitedStock}
                  placeholder="0"
                />
                <div className="flex items-center gap-1">
                  <Switch
                    checked={unlimitedStock}
                    onCheckedChange={(checked) => {
                      setUnlimitedStock(checked);
                      setEditedReward({ ...editedReward, stockQuantity: checked ? null : 100 });
                    }}
                  />
                  <span className="text-xs text-muted-foreground">Unlimited</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fulfillment Type</Label>
            <Select
              value={editedReward.fulfillmentType}
              onValueChange={(value) => setEditedReward({ ...editedReward, fulfillmentType: value as FulfillmentType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROMO_CODE">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" style={{ color: FULFILLMENT_COLORS.PROMO_CODE }} />
                    Promo Code
                  </div>
                </SelectItem>
                <SelectItem value="WEBHOOK">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" style={{ color: FULFILLMENT_COLORS.WEBHOOK }} />
                    Webhook
                  </div>
                </SelectItem>
                <SelectItem value="MANUAL">
                  <div className="flex items-center gap-2">
                    <Hand className="h-4 w-4" style={{ color: FULFILLMENT_COLORS.MANUAL }} />
                    Manual
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic fulfillment config fields */}
          {editedReward.fulfillmentType === 'PROMO_CODE' && (
            <div className="space-y-2">
              <Label htmlFor="code-prefix">Code Prefix</Label>
              <Input
                id="code-prefix"
                value={(editedReward.fulfillmentConfig?.codePrefix as string) || ''}
                onChange={(e) => setEditedReward({
                  ...editedReward,
                  fulfillmentConfig: { ...editedReward.fulfillmentConfig, codePrefix: e.target.value }
                })}
                placeholder="e.g., SAVE10-"
              />
            </div>
          )}

          {editedReward.fulfillmentType === 'WEBHOOK' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={(editedReward.fulfillmentConfig?.webhookUrl as string) || ''}
                  onChange={(e) => setEditedReward({
                    ...editedReward,
                    fulfillmentConfig: { ...editedReward.fulfillmentConfig, webhookUrl: e.target.value }
                  })}
                  placeholder="https://api.example.com/fulfill"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={(editedReward.fulfillmentConfig?.retryOnFailure as boolean) || false}
                  onCheckedChange={(checked) => setEditedReward({
                    ...editedReward,
                    fulfillmentConfig: { ...editedReward.fulfillmentConfig, retryOnFailure: checked }
                  })}
                />
                <Label className="text-sm font-normal">Retry on failure</Label>
              </div>
            </div>
          )}

          {editedReward.fulfillmentType === 'MANUAL' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={(editedReward.fulfillmentConfig?.shippingRequired as boolean) || false}
                  onCheckedChange={(checked) => setEditedReward({
                    ...editedReward,
                    fulfillmentConfig: { ...editedReward.fulfillmentConfig, shippingRequired: checked }
                  })}
                />
                <Label className="text-sm font-normal">Shipping required</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={(editedReward.fulfillmentConfig?.requiresApproval as boolean) || false}
                  onCheckedChange={(checked) => setEditedReward({
                    ...editedReward,
                    fulfillmentConfig: { ...editedReward.fulfillmentConfig, requiresApproval: checked }
                  })}
                />
                <Label className="text-sm font-normal">Requires admin approval</Label>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={editedReward.active}
              onCheckedChange={(checked) => setEditedReward({ ...editedReward, active: checked })}
            />
            <Label className="text-sm font-normal">Active (visible in store)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(editedReward);
              onOpenChange(false);
            }}
          >
            Save Reward
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

// Redemption Table Columns
const redemptionColumns: ColumnDef<RedemptionTransaction>[] = [
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
    accessorKey: 'rewardName',
    header: 'Reward',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-primary" />
        <span>{row.original.rewardName}</span>
      </div>
    ),
  },
  {
    accessorKey: 'costAtTime',
    header: 'Points',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Coins className="h-4 w-4 text-yellow-400" />
        <span className="font-mono">{row.original.costAtTime.toLocaleString()}</span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const config = {
        PROCESSING: { variant: 'warning' as const, icon: <Loader2 className="h-3 w-3 animate-spin" />, label: 'Processing' },
        COMPLETED: { variant: 'active' as const, icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completed' },
        FAILED: { variant: 'error' as const, icon: <AlertCircle className="h-3 w-3" />, label: 'Failed' },
      };
      const { variant, label } = config[status];
      return (
        <div>
          <StatusBadge variant={variant} dot>
            {label}
          </StatusBadge>
          {status === 'FAILED' && row.original.errorMessage && (
            <p className="text-xs text-red-400 mt-1">{row.original.errorMessage}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
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
  {
    id: 'actions',
    cell: ({ row }) => {
      const status = row.original.status;
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
              <Pencil className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {status === 'PROCESSING' && (
              <DropdownMenuItem>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark Complete
              </DropdownMenuItem>
            )}
            {status === 'FAILED' && (
              <DropdownMenuItem>
                <Zap className="mr-2 h-4 w-4" />
                Retry
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Main Page Component
export default function RewardsPage() {
  const [rewards, setRewards] = React.useState<RewardItem[]>(mockRewards);
  const [stats] = React.useState<RewardStats>(mockStats);
  const [redemptions] = React.useState<RedemptionTransaction[]>(mockRedemptions);
  const [editingReward, setEditingReward] = React.useState<RewardItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [redemptionSearch, setRedemptionSearch] = React.useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredRewards = rewards.filter((reward) => {
    if (fulfillmentFilter === 'all') return true;
    return reward.fulfillmentType === fulfillmentFilter;
  });

  const filteredRedemptions = redemptions.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const handleSaveReward = (updatedReward: RewardItem) => {
    setRewards((prev) => {
      const exists = prev.find((r) => r.id === updatedReward.id);
      if (exists) {
        return prev.map((r) => (r.id === updatedReward.id ? updatedReward : r));
      }
      return [...prev, updatedReward];
    });
  };

  const handleToggleActive = (rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, active: !r.active } : r))
    );
  };

  const handleAddReward = () => {
    const newReward: RewardItem = {
      id: String(Date.now()),
      name: 'New Reward',
      description: 'Describe this reward',
      costPoints: 1000,
      stockQuantity: null,
      fulfillmentType: 'PROMO_CODE',
      fulfillmentConfig: {},
      active: false,
      displayOrder: rewards.length + 1,
      redemptionCount: 0,
      createdAt: new Date().toISOString(),
    };
    setEditingReward(newReward);
    setIsEditDialogOpen(true);
  };

  // SDK code snippets
  const rewardStoreCode = `import { RewardStore } from '@gamifyio/react';

// Display reward catalog with redemption functionality
<RewardStore
  showPointsHeader
  showUnavailable={false}
  onRedeem={(item, result) => {
    if (result.success) {
      toast.success(\`Redeemed \${item.name}!\`);
    } else {
      toast.error(result.error || 'Redemption failed');
    }
  }}
  theme={{
    cardBackground: '#1a1a2e',
    buttonColor: '#6366f1',
  }}
/>`;

  const useRewardsCode = `import { useRewards } from '@gamifyio/react';

function CustomRewardsStore() {
  const {
    items,
    userPoints,
    loading,
    redeem
  } = useRewards();

  const handleRedeem = async (itemId: string) => {
    const result = await redeem(itemId);
    if (result?.success) {
      console.log('Fulfilled:', result.fulfillmentData);
    }
  };

  return (
    <div>
      <p>Your Points: {userPoints.toLocaleString()}</p>
      {items.map((item) => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.costPoints} points</p>
          <button
            onClick={() => handleRedeem(item.id)}
            disabled={!item.canAfford}
          >
            {item.canAfford ? 'Redeem' : 'Not enough points'}
          </button>
        </div>
      ))}
    </div>
  );
}`;

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
            <Gift className="h-6 w-6" />
            Rewards
          </h1>
          <p className="text-muted-foreground">
            Manage reward catalog and track redemptions
          </p>
        </div>
        <GlowButton variant="glow" onClick={handleAddReward}>
          <Plus className="mr-2 h-4 w-4" />
          New Reward
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
          icon={Gift}
          label="Total Rewards"
          value={stats.totalRewards.toString()}
          subValue={`${rewards.filter((r) => r.active).length} active`}
          color="primary"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Redemptions"
          value={stats.totalRedemptions.toLocaleString()}
          subValue="All time"
          trend={18}
          color="green"
        />
        <StatCard
          icon={Coins}
          label="Points Redeemed"
          value={stats.pointsRedeemed.toLocaleString()}
          subValue="All time"
          color="yellow"
        />
        <StatCard
          icon={Clock}
          label="Pending Fulfillments"
          value={stats.pendingFulfillments.toString()}
          subValue="Awaiting completion"
          color="blue"
        />
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="catalog" className="space-y-4">
          <TabsList>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Reward Catalog
            </TabsTrigger>
            <TabsTrigger value="redemptions" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Redemptions
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Embed Components
            </TabsTrigger>
          </TabsList>

          {/* Reward Catalog Tab */}
          <TabsContent value="catalog">
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Reward Catalog</GlassCardTitle>
                  <GlassCardDescription>
                    Items users can redeem with their loyalty points
                  </GlassCardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PROMO_CODE">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" style={{ color: FULFILLMENT_COLORS.PROMO_CODE }} />
                          Promo Code
                        </div>
                      </SelectItem>
                      <SelectItem value="WEBHOOK">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" style={{ color: FULFILLMENT_COLORS.WEBHOOK }} />
                          Webhook
                        </div>
                      </SelectItem>
                      <SelectItem value="MANUAL">
                        <div className="flex items-center gap-2">
                          <Hand className="h-4 w-4" style={{ color: FULFILLMENT_COLORS.MANUAL }} />
                          Manual
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddReward}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Reward
                  </Button>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      onEdit={() => {
                        setEditingReward(reward);
                        setIsEditDialogOpen(true);
                      }}
                      onToggleActive={() => handleToggleActive(reward.id)}
                    />
                  ))}
                </div>

                {filteredRewards.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No rewards found for the selected filter.
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Redemptions Tab */}
          <TabsContent value="redemptions">
            <GlassCard>
              <GlassCardHeader className="flex-row items-center justify-between">
                <div>
                  <GlassCardTitle>Redemptions</GlassCardTitle>
                  <GlassCardDescription>
                    Track reward redemption status and fulfillment
                  </GlassCardDescription>
                </div>
              </GlassCardHeader>
              <div className="px-6 pb-2">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by user..."
                      className="pl-9 bg-surface-1"
                      value={redemptionSearch}
                      onChange={(e) => setRedemptionSearch(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <GlassCardContent>
                <DataTable
                  columns={redemptionColumns}
                  data={filteredRedemptions}
                  searchKey="userName"
                  searchValue={redemptionSearch}
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
                  Add these React components to display the rewards store
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-8">
                <CodeSnippet
                  title="RewardStore Component"
                  description="Display the full rewards catalog with redemption functionality"
                  code={rewardStoreCode}
                />

                <CodeSnippet
                  title="useRewards Hook"
                  description="Build custom reward UI with full control"
                  code={useRewardsCode}
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

      {/* Edit Reward Dialog */}
      <EditRewardDialog
        reward={editingReward}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveReward}
      />
    </div>
  );
}
