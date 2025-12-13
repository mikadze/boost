'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Webhook,
  MoreHorizontal,
  Trash2,
  Pencil,
  RotateCw,
  Check,
  X,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered: string;
  successRate: number;
}

const webhooks: WebhookConfig[] = [
  {
    id: '1',
    name: 'Order Processing',
    url: 'https://api.example.com/webhooks/orders',
    events: ['order.created', 'order.completed'],
    active: true,
    lastTriggered: '2024-07-11T14:32:00',
    successRate: 99.2,
  },
  {
    id: '2',
    name: 'Points Notifications',
    url: 'https://api.example.com/webhooks/points',
    events: ['points.earned', 'points.redeemed', 'tier.upgraded'],
    active: true,
    lastTriggered: '2024-07-11T12:15:00',
    successRate: 98.5,
  },
  {
    id: '3',
    name: 'Legacy Integration',
    url: 'https://old.api.example.com/hook',
    events: ['campaign.activated'],
    active: false,
    lastTriggered: '2024-06-15T09:00:00',
    successRate: 85.0,
  },
];

const availableEvents = [
  { id: 'order.created', label: 'Order Created' },
  { id: 'order.completed', label: 'Order Completed' },
  { id: 'order.cancelled', label: 'Order Cancelled' },
  { id: 'points.earned', label: 'Points Earned' },
  { id: 'points.redeemed', label: 'Points Redeemed' },
  { id: 'tier.upgraded', label: 'Tier Upgraded' },
  { id: 'tier.downgraded', label: 'Tier Downgraded' },
  { id: 'campaign.activated', label: 'Campaign Activated' },
  { id: 'campaign.deactivated', label: 'Campaign Deactivated' },
];

export default function WebhooksPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [webhookName, setWebhookName] = React.useState('');
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([]);

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const handleCreate = () => {
    console.log('Creating webhook:', { webhookName, webhookUrl, selectedEvents });
    setDialogOpen(false);
    setWebhookName('');
    setWebhookUrl('');
    setSelectedEvents([]);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhook endpoints to receive real-time event notifications
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <GlowButton variant="glow">
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </GlowButton>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a new webhook endpoint to receive event notifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-name">Name</Label>
                <Input
                  id="webhook-name"
                  placeholder="My Webhook"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  className="bg-surface-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://api.example.com/webhooks"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="bg-surface-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Events to Subscribe</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-surface-1">
                  {availableEvents.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-surface-2 p-2 rounded"
                    >
                      <Checkbox
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={() => handleEventToggle(event.id)}
                      />
                      <span className="text-sm">{event.label}</span>
                      <code className="text-xs text-muted-foreground ml-auto">
                        {event.id}
                      </code>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!webhookName || !webhookUrl || selectedEvents.length === 0}
              >
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Webhooks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Configured Webhooks</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {webhooks.map((webhook, index) => (
                <motion.div
                  key={webhook.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="p-4 rounded-lg bg-surface-1 border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
                        <Webhook className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{webhook.name}</p>
                          <StatusBadge
                            variant={webhook.active ? 'active' : 'inactive'}
                            dot
                          >
                            {webhook.active ? 'Active' : 'Inactive'}
                          </StatusBadge>
                        </div>
                        <code className="text-xs text-muted-foreground">
                          {webhook.url}
                        </code>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className="text-xs px-2 py-0.5 rounded bg-surface-2 text-muted-foreground"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {webhook.successRate >= 98 ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : webhook.successRate >= 90 ? (
                            <RotateCw className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                          <span
                            className={`font-mono ${
                              webhook.successRate >= 98
                                ? 'text-green-400'
                                : webhook.successRate >= 90
                                ? 'text-yellow-400'
                                : 'text-red-400'
                            }`}
                          >
                            {webhook.successRate}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last: {new Date(webhook.lastTriggered).toLocaleString()}
                        </p>
                      </div>

                      <Switch checked={webhook.active} />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RotateCw className="mr-2 h-4 w-4" />
                            Test Webhook
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </div>
  );
}
