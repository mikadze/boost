'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Play,
  Pause,
  ArrowUpDown,
  Search,
  Filter,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'scheduled' | 'ended';
  priority: number;
  budget: number;
  budgetUsed: number;
  startDate: string;
  endDate: string;
  rules: number;
}

// Mock data
const campaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale 2024',
    status: 'active',
    priority: 100,
    budget: 10000,
    budgetUsed: 6500,
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    rules: 5,
  },
  {
    id: '2',
    name: 'Welcome Bonus',
    status: 'active',
    priority: 90,
    budget: 5000,
    budgetUsed: 2100,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rules: 2,
  },
  {
    id: '3',
    name: 'Flash Friday',
    status: 'scheduled',
    priority: 85,
    budget: 2000,
    budgetUsed: 0,
    startDate: '2024-07-12',
    endDate: '2024-07-12',
    rules: 3,
  },
  {
    id: '4',
    name: 'Loyalty Rewards',
    status: 'active',
    priority: 80,
    budget: 15000,
    budgetUsed: 8900,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rules: 8,
  },
  {
    id: '5',
    name: 'Easter Special',
    status: 'ended',
    priority: 75,
    budget: 3000,
    budgetUsed: 3000,
    startDate: '2024-03-28',
    endDate: '2024-04-01',
    rules: 4,
  },
  {
    id: '6',
    name: 'Birthday Rewards',
    status: 'paused',
    priority: 70,
    budget: 8000,
    budgetUsed: 4200,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    rules: 2,
  },
];

const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = {
        active: 'active' as const,
        paused: 'warning' as const,
        scheduled: 'info' as const,
        ended: 'inactive' as const,
      };
      return (
        <StatusBadge variant={variant[status as keyof typeof variant]} dot pulse={status === 'active'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusBadge>
      );
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/campaigns/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {row.getValue('name')}
      </Link>
    ),
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Priority
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue('priority')}</span>
    ),
  },
  {
    accessorKey: 'budget',
    header: 'Budget',
    cell: ({ row }) => {
      const budget = row.getValue('budget') as number;
      const budgetUsed = row.original.budgetUsed;
      const percentage = Math.round((budgetUsed / budget) * 100);
      return (
        <div className="w-32">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              ${budgetUsed.toLocaleString()}
            </span>
            <span className="text-muted-foreground">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-1.5" />
        </div>
      );
    },
  },
  {
    accessorKey: 'startDate',
    header: 'Schedule',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.original.startDate).toLocaleDateString()} -{' '}
        {new Date(row.original.endDate).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: 'rules',
    header: 'Rules',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/campaigns/${row.original.id}/rules`}
        className="text-sm text-primary hover:underline"
      >
        {row.getValue('rules')} rules
      </Link>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const campaign = row.original;
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {campaign.status === 'active' ? (
              <DropdownMenuItem>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            ) : campaign.status === 'paused' ? (
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function CampaignsPage() {
  const [searchValue, setSearchValue] = React.useState('');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your promotional campaigns and rules
          </p>
        </div>
        <GlowButton variant="glow" asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Link>
        </GlowButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard>
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                className="pl-9 bg-surface-1"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={campaigns}
              searchKey="name"
              searchValue={searchValue}
            />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
