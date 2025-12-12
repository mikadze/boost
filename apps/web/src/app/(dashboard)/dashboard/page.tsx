'use client';

import { useState } from 'react';
import { Plus, FolderOpen, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useOrganization } from '@/hooks/use-organization';
import { ProjectCard } from '@/components/project-card';

export default function DashboardPage() {
  const {
    currentOrg,
    organizations,
    createOrganization,
    projects,
    createProject,
    isLoading,
  } = useOrganization();

  const [orgName, setOrgName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [orgDialogOpen, setOrgDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create Your Organization</CardTitle>
            <CardDescription>
              Get started by creating your first organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="My Company"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateOrg}
              disabled={isCreatingOrg || !orgName.trim()}
            >
              {isCreatingOrg ? 'Creating...' : 'Create Organization'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentOrg?.name}</h1>
          <p className="text-muted-foreground">Manage your projects and API keys</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Organization
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

          <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
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
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start tracking events
            </p>
            <Button onClick={() => setProjectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
