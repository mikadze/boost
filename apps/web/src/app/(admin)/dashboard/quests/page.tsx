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
  Target,
  ListChecks,
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

interface Quest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  rewardXp: number;
  steps: number;
  completions: number;
  createdAt: string;
}

// Mock data
const quests: Quest[] = [
  {
    id: '1',
    name: 'Welcome Journey',
    description: 'Complete your profile and explore the platform',
    status: 'active',
    rewardXp: 500,
    steps: 5,
    completions: 1247,
    createdAt: '2024-06-01',
  },
  {
    id: '2',
    name: 'First Purchase',
    description: 'Make your first purchase to earn bonus rewards',
    status: 'active',
    rewardXp: 1000,
    steps: 3,
    completions: 892,
    createdAt: '2024-05-15',
  },
  {
    id: '3',
    name: 'Social Butterfly',
    description: 'Connect your social accounts and share with friends',
    status: 'draft',
    rewardXp: 750,
    steps: 4,
    completions: 0,
    createdAt: '2024-07-01',
  },
  {
    id: '4',
    name: 'Power User',
    description: 'Complete advanced features to become a power user',
    status: 'active',
    rewardXp: 2000,
    steps: 8,
    completions: 156,
    createdAt: '2024-04-01',
  },
  {
    id: '5',
    name: 'Referral Champion',
    description: 'Refer friends and earn bonus rewards',
    status: 'archived',
    rewardXp: 1500,
    steps: 3,
    completions: 423,
    createdAt: '2024-03-01',
  },
];

const columns: ColumnDef<Quest>[] = [
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = {
        active: 'active' as const,
        draft: 'warning' as const,
        archived: 'inactive' as const,
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
        href={`/dashboard/quests/${row.original.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        <div>
          <div>{row.getValue('name')}</div>
          <div className="text-xs text-muted-foreground font-normal">
            {row.original.description}
          </div>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: 'steps',
    header: 'Steps',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm">{row.getValue('steps')}</span>
      </div>
    ),
  },
  {
    accessorKey: 'rewardXp',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Reward XP
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm text-primary">
        +{(row.getValue('rewardXp') as number).toLocaleString()} XP
      </span>
    ),
  },
  {
    accessorKey: 'completions',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Completions
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {(row.getValue('completions') as number).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue('createdAt')).toLocaleDateString()}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const quest = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/quests/${quest.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {quest.status === 'active' ? (
              <DropdownMenuItem>
                <Pause className="mr-2 h-4 w-4" />
                Unpublish
              </DropdownMenuItem>
            ) : quest.status === 'draft' ? (
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" />
                Publish
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

export default function QuestsPage() {
  const [searchValue, setSearchValue] = React.useState('');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Quest Builder
          </h1>
          <p className="text-muted-foreground">
            Create and manage gamified quests for user onboarding
          </p>
        </div>
        <GlowButton variant="glow" asChild>
          <Link href="/dashboard/quests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Quest
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
                placeholder="Search quests..."
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
              data={quests}
              searchKey="name"
              searchValue={searchValue}
            />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
