'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ArrowRight, Building2, FolderOpen, Key, AlertTriangle, Copy, Play, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrganization } from '@/hooks/use-organization';

const orgSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
});

const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
});

type OrgForm = z.infer<typeof orgSchema>;
type ProjectForm = z.infer<typeof projectSchema>;

type Step = 'organization' | 'project' | 'api-key' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const { createOrganization, createProject, createApiKey, currentOrg, projects, apiKeys } = useOrganization();

  const [step, setStep] = useState<Step>('organization');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeySecrets, setApiKeySecrets] = useState<{
    publishable: string | null;
    secret: string | null;
  }>({ publishable: null, secret: null });
  const [copiedKey, setCopiedKey] = useState<'publishable' | 'secret' | null>(null);

  // Skip completed steps on mount
  useEffect(() => {
    if (currentOrg && projects.length > 0 && apiKeys.length > 0) {
      // Already fully onboarded, redirect to dashboard
      router.push('/dashboard');
    } else if (currentOrg && projects.length > 0) {
      // Has org + project, just needs API key
      setStep('api-key');
    } else if (currentOrg) {
      // Has org, needs project
      setStep('project');
    }
  }, [currentOrg, projects, apiKeys, router]);

  const orgForm = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
  });

  const projectForm = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  const handleCreateOrg = async (data: OrgForm) => {
    setIsLoading(true);
    try {
      await createOrganization(data.name);
      setStep('project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (data: ProjectForm) => {
    setIsLoading(true);
    try {
      await createProject(data.name);
      setStep('api-key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!projects[0]) return;
    setIsLoading(true);
    try {
      const [publishableResult, secretResult] = await Promise.all([
        createApiKey(projects[0].id, 'Frontend Key', 'publishable'),
        createApiKey(projects[0].id, 'Backend Key', 'secret'),
      ]);
      setApiKeySecrets({
        publishable: publishableResult.secret,
        secret: secretResult.secret,
      });
      setStep('complete');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (keyType: 'publishable' | 'secret') => {
    const secret = apiKeySecrets[keyType];
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    setCopiedKey(keyType);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'project', label: 'Project', icon: FolderOpen },
    { id: 'api-key', label: 'API Key', icon: Key },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome to Boost</h1>
          <p className="text-muted-foreground">Let&apos;s get you set up in a few steps</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  i < currentStepIndex
                    ? 'bg-primary border-primary text-primary-foreground'
                    : i === currentStepIndex
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}
              >
                {i < currentStepIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <s.icon className="h-5 w-5" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`w-16 h-0.5 ${
                    i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 'organization' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Organization</CardTitle>
              <CardDescription>
                Organizations help you group related projects together
              </CardDescription>
            </CardHeader>
            <form onSubmit={orgForm.handleSubmit(handleCreateOrg)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="My Company"
                    {...orgForm.register('name')}
                  />
                  {orgForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {orgForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </form>
          </Card>
        )}

        {step === 'project' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your First Project</CardTitle>
              <CardDescription>
                Projects contain your API keys and event data
              </CardDescription>
            </CardHeader>
            <form onSubmit={projectForm.handleSubmit(handleCreateProject)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="My App"
                    {...projectForm.register('name')}
                  />
                  {projectForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {projectForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </form>
          </Card>
        )}

        {step === 'api-key' && (
          <Card>
            <CardHeader>
              <CardTitle>Generate API Key</CardTitle>
              <CardDescription>
                You&apos;ll need an API key to send events from your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCreateApiKey} className="w-full" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate API Key'}
                <Key className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-6 w-6 text-green-600" />
                You&apos;re All Set!
              </CardTitle>
              <CardDescription>
                Save your API keys and choose how you&apos;d like to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Save your API keys</AlertTitle>
                <AlertDescription>
                  This is the only time your API keys will be displayed. Store them securely.
                </AlertDescription>
              </Alert>

              {apiKeySecrets.publishable && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Frontend Key</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">publishable</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Use this in your React/browser SDK</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                      {apiKeySecrets.publishable}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => handleCopy('publishable')}>
                      {copiedKey === 'publishable' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {apiKeySecrets.secret && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Backend Key</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">secret</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Use this in your Node.js/server SDK</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                      {apiKeySecrets.secret}
                    </code>
                    <Button size="icon" variant="outline" onClick={() => handleCopy('secret')}>
                      {copiedKey === 'secret' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  How would you like to continue?
                </p>
                <Button
                  onClick={() => router.push('/dashboard/playground?autoConnect=true')}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Open Playground
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="w-full"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
