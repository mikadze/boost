'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Play,
  Pause,
  ArrowUpDown,
  Search,
  Filter,
  Sparkles,
  Loader2,
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
import { useOrganization } from '@/hooks/use-organization';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  priority: number;
  rulesCount?: number;
  createdAt: string;
}

const columns: ColumnDef<Campaign>[] = [
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.getValue('active') as boolean;
      return (
        <StatusBadge variant={active ? 'active' : 'inactive'} dot pulse={active}>
          {active ? 'Active' : 'Inactive'}
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
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
        {row.getValue('description') || '-'}
      </span>
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
      <span className="font-mono text-sm">{row.getValue('priority') ?? 0}</span>
    ),
  },
  {
    accessorKey: 'rulesCount',
    header: 'Rules',
    cell: ({ row }) => (
      <Link
        href={`/dashboard/campaigns/${row.original.id}/rules`}
        className="text-sm text-primary hover:underline"
      >
        {row.original.rulesCount ?? 0} rules
      </Link>
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
            {campaign.active ? (
              <DropdownMenuItem>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <Play className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
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
  const { projects, isLoading: orgLoading } = useOrganization();
  const projectId = projects[0]?.id;

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(
        `${API_URL}/dashboard/projects/${projectId}/campaigns`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json() as Promise<Campaign[]>;
    },
    enabled: !!projectId,
  });

  if (orgLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <Link href="/dashboard/automations/new">
            <Sparkles className="mr-2 h-4 w-4" />
            New Automation
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
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No campaigns yet</p>
                <GlowButton variant="glow" asChild>
                  <Link href="/dashboard/automations/new">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create your first automation
                  </Link>
                </GlowButton>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={campaigns}
                searchKey="name"
                searchValue={searchValue}
              />
            )}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
