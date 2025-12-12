'use client';

import { useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useOrganization, type Project, type ApiKey } from '@/hooks/use-organization';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { apiKeys, createApiKey, revokeApiKey } = useOrganization();
  const [keyName, setKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const projectKeys = apiKeys.filter((k) => k.projectId === project.id);

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;
    setIsCreating(true);
    try {
      const result = await createApiKey(project.id, keyName.trim());
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{project.name}</CardTitle>
        <CardDescription>
          Created {new Date(project.createdAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {projectKeys.length} API key{projectKeys.length !== 1 ? 's' : ''}
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Key
              </Button>
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
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Save this key</AlertTitle>
                      <AlertDescription>
                        This is the only time your API key will be displayed.
                        Store it securely.
                      </AlertDescription>
                    </Alert>
                    <div className="mt-4 flex items-center gap-2">
                      <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                        {newSecret}
                      </code>
                      <Button size="icon" variant="outline" onClick={handleCopy}>
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
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

        {projectKeys.length > 0 && (
          <div className="space-y-2">
            {projectKeys.map((key) => (
              <ApiKeyRow key={key.id} apiKey={key} onRevoke={revokeApiKey} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ApiKeyRowProps {
  apiKey: ApiKey;
  onRevoke: (id: string) => Promise<void>;
}

function ApiKeyRow({ apiKey, onRevoke }: ApiKeyRowProps) {
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke(apiKey.id);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-2 bg-muted rounded-md">
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{apiKey.name}</p>
          <p className="text-xs text-muted-foreground">
            {apiKey.keyPrefix}...
          </p>
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={handleRevoke}
        disabled={isRevoking}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
