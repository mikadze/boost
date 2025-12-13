'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  Crown,
  ArrowUpDown,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  totalSpent: number;
  orders: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

// Mock data
const customers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    tier: 'gold',
    points: 15420,
    totalSpent: 4523.99,
    orders: 47,
    lastActive: '2024-07-10',
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah Miller',
    email: 'sarah@example.com',
    tier: 'platinum',
    points: 32150,
    totalSpent: 12543.50,
    orders: 128,
    lastActive: '2024-07-11',
    status: 'active',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@example.com',
    tier: 'silver',
    points: 5280,
    totalSpent: 1234.00,
    orders: 15,
    lastActive: '2024-07-05',
    status: 'active',
  },
  {
    id: '4',
    name: 'Emily Brown',
    email: 'emily@example.com',
    tier: 'gold',
    points: 18900,
    totalSpent: 6789.25,
    orders: 62,
    lastActive: '2024-07-09',
    status: 'active',
  },
  {
    id: '5',
    name: 'David Wilson',
    email: 'david@example.com',
    tier: 'bronze',
    points: 1200,
    totalSpent: 345.00,
    orders: 5,
    lastActive: '2024-06-15',
    status: 'inactive',
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    email: 'lisa@example.com',
    tier: 'silver',
    points: 7840,
    totalSpent: 2345.75,
    orders: 23,
    lastActive: '2024-07-08',
    status: 'active',
  },
];

const tierColors = {
  bronze: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  silver: 'text-gray-300 bg-gray-300/10 border-gray-300/20',
  gold: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  platinum: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Customer
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original.id}`}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <Avatar
          src={row.original.avatar}
          alt={row.original.name}
          fallback={row.original.name.charAt(0)}
          size="sm"
        />
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      </Link>
    ),
  },
  {
    accessorKey: 'tier',
    header: 'Tier',
    cell: ({ row }) => {
      const tier = row.getValue('tier') as string;
      return (
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            tierColors[tier as keyof typeof tierColors]
          }`}
        >
          <Crown className="h-3 w-3" />
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </div>
      );
    },
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
      <span className="font-mono">{row.getValue<number>('points').toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'totalSpent',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Total Spent
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono">
        ${row.getValue<number>('totalSpent').toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    accessorKey: 'orders',
    header: 'Orders',
    cell: ({ row }) => (
      <span className="font-mono">{row.getValue('orders')}</span>
    ),
  },
  {
    accessorKey: 'lastActive',
    header: 'Last Active',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Date(row.getValue('lastActive')).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <StatusBadge
          variant={status === 'active' ? 'active' : 'inactive'}
          dot
        >
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
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/customers/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Profile
              </Link>
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

export default function CustomersPage() {
  const [searchValue, setSearchValue] = React.useState('');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customers and view their activity
          </p>
        </div>
        <GlowButton variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Export
        </GlowButton>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold mt-1">12,847</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Active This Month</p>
          <p className="text-2xl font-bold mt-1">8,234</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Points Issued</p>
          <p className="text-2xl font-bold mt-1">2.4M</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Avg. Lifetime Value</p>
          <p className="text-2xl font-bold mt-1">$1,234</p>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
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
              data={customers}
              searchKey="name"
              searchValue={searchValue}
            />
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
