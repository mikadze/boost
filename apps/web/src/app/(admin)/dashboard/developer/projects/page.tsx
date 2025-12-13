'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  FolderOpen,
  Building2,
  Key,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  MoreHorizontal,
  Loader2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganization, type Project, type ApiKey } from '@/hooks/use-organization';

export default function ProjectsPage() {
  const {
    currentOrg,
    organizations,
    setCurrentOrg,
    createOrganization,
    projects,
    createProject,
    apiKeys,
    createApiKey,
    revokeApiKey,
    isLoading,
  } = useOrganization();

  const [orgName, setOrgName] = React.useState('');
  const [projectName, setProjectName] = React.useState('');
  const [isCreatingOrg, setIsCreatingOrg] = React.useState(false);
  const [isCreatingProject, setIsCreatingProject] = React.useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = React.useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = React.useState(false);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) return;
    setIsCreatingOrg(true);
    try {
      await createOrganization(orgName.trim());
      setOrgName('');
      setOrgDialogOpen(false);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    setIsCreatingProject(true);
    try {
      await createProject(projectName.trim());
      setProjectName('');
      setProjectDialogOpen(false);
    } finally {
      setIsCreatingProject(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No organizations yet - show setup
  if (organizations.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your organizations and projects
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-md mx-auto"
        >
          <GlassCard>
            <GlassCardHeader className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-primary mb-2" />
              <GlassCardTitle>Create Your Organization</GlassCardTitle>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first organization
              </p>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="My Company"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-surface-1"
                />
              </div>
              <GlowButton
                variant="glow"
                className="w-full"
                onClick={handleCreateOrg}
                disabled={isCreatingOrg || !orgName.trim()}
              >
                {isCreatingOrg ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isCreatingOrg ? 'Creating...' : 'Create Organization'}
              </GlowButton>
            </GlassCardContent>
          </GlassCard>
        </motion.div>
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
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your organizations and projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Organization Selector */}
          <Select
            value={currentOrg?.id}
            onValueChange={(value) => {
              const org = organizations.find((o) => o.id === value);
              if (org) setCurrentOrg(org);
            }}
          >
            <SelectTrigger className="w-[200px] bg-surface-1">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* New Organization Dialog */}
          <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building2 className="mr-2 h-4 w-4" />
                New Org
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization to manage separate projects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-org-name">Organization Name</Label>
                  <Input
                    id="new-org-name"
                    placeholder="My Company"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-surface-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateOrg}
                  disabled={isCreatingOrg || !orgName.trim()}
                >
                  {isCreatingOrg ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* New Project Dialog */}
          <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
            <DialogTrigger asChild>
              <GlowButton variant="glow">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </GlowButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
                <DialogDescription>
                  Create a new project within {currentOrg?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="My Project"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-surface-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateProject}
                  disabled={isCreatingProject || !projectName.trim()}
                >
                  {isCreatingProject ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Current Organization Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Organization</p>
          <p className="text-xl font-bold mt-1">{currentOrg?.name}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Projects</p>
          <p className="text-xl font-bold mt-1">{projects.length}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">API Keys</p>
          <p className="text-xl font-bold mt-1">{apiKeys.length}</p>
        </GlassCard>
      </motion.div>

      {/* Projects List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Projects in {currentOrg?.name}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project to start tracking events
                </p>
                <Button onClick={() => setProjectDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    apiKeys={apiKeys.filter((k) => k.projectId === project.id)}
                    onCreateKey={createApiKey}
                    onRevokeKey={revokeApiKey}
                    index={index}
                  />
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </div>
  );
}

interface ProjectRowProps {
  project: Project;
  apiKeys: ApiKey[];
  onCreateKey: (projectId: string, name: string) => Promise<{ key: ApiKey; secret: string }>;
  onRevokeKey: (id: string) => Promise<void>;
  index: number;
}

function ProjectRow({ project, apiKeys, onCreateKey, onRevokeKey, index }: ProjectRowProps) {
  const [keyName, setKeyName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newSecret, setNewSecret] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    setIsCreating(true);
    try {
      const result = await onCreateKey(project.id, keyName.trim());
      setNewSecret(result.secret);
      setKeyName('');
    } finally {
      setIsCreating(false);
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
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1 }}
      className="rounded-lg bg-surface-1 border border-border overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{project.name}</p>
            <p className="text-xs text-muted-foreground">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge variant="active" size="sm">
            {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''}
          </StatusBadge>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Key
              </Button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
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
                      Create a new API key for {project.name}
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
        </div>
      </div>

      {/* Expanded API Keys */}
      {expanded && apiKeys.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-border pt-4 space-y-2">
            {apiKeys.map((key) => (
              <ApiKeyItem key={key.id} apiKey={key} onRevoke={onRevokeKey} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface ApiKeyItemProps {
  apiKey: ApiKey;
  onRevoke: (id: string) => Promise<void>;
}

function ApiKeyItem({ apiKey, onRevoke }: ApiKeyItemProps) {
  const [isRevoking, setIsRevoking] = React.useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke(apiKey.id);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
      <div className="flex items-center gap-3">
        <Key className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{apiKey.name}</p>
          <code className="text-xs text-muted-foreground">{apiKey.keyPrefix}...</code>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleRevoke}
            disabled={isRevoking}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isRevoking ? 'Revoking...' : 'Revoke Key'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
