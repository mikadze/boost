'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Key,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganization } from '@/hooks/use-organization';

export default function ApiKeysPage() {
  const { apiKeys, projects, createApiKey, revokeApiKey } = useOrganization();
  const currentProject = projects[0];

  const [keyName, setKeyName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [newSecret, setNewSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleCreateKey = async () => {
    if (!keyName.trim() || !currentProject) return;
    setIsCreating(true);
    try {
      const result = await createApiKey(currentProject.id, keyName);
      setNewSecret(result.secret);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
    setIsCreating(false);
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeApiKey(keyId);
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const handleCopy = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewSecret(null);
    setKeyName('');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for accessing the Boost API
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <GlowButton variant="glow">
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </GlowButton>
          </DialogTrigger>
          <DialogContent>
            {newSecret ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy your API key now. You won&apos;t be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Alert className="border-yellow-500/30 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <AlertTitle className="text-yellow-400">Save this key</AlertTitle>
                    <AlertDescription className="text-yellow-400/80">
                      This is the only time your API key will be displayed.
                      Store it securely.
                    </AlertDescription>
                  </Alert>
                  <div className="mt-4 flex items-center gap-2">
                    <code className="flex-1 p-3 bg-surface-1 rounded-lg text-sm font-mono break-all">
                      {newSecret}
                    </code>
                    <Button size="icon" variant="outline" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseDialog}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for your project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="Production API Key"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="bg-surface-1"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateKey}
                    disabled={isCreating || !keyName.trim()}
                  >
                    {isCreating ? 'Creating...' : 'Create Key'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Usage stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Active API Keys</p>
          <p className="text-2xl font-bold mt-1">{apiKeys.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Project</p>
          <p className="text-2xl font-bold mt-1 truncate">{currentProject?.name ?? 'None'}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-2xl font-bold mt-1 text-green-400">Active</p>
        </GlassCard>
      </motion.div>

      {/* API Keys List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Your API Keys</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No API keys yet</p>
                <p className="text-sm">Create your first API key to get started</p>
              </div>
            ) : (
            <div className="space-y-4">
              {apiKeys.map((key, index) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-surface-1 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-500/10">
                      <Key className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{key.name}</p>
                        <StatusBadge variant="active" size="sm">
                          Active
                        </StatusBadge>
                      </div>
                      <code className="text-xs text-muted-foreground">
                        {key.keyPrefix}...
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(key.keyPrefix)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Prefix
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Revoke Key
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </div>
  );
}
