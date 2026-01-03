'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Terminal,
  Code,
  Loader2,
  PartyPopper,
  ArrowRight,
  Zap,
  Server,
  Monitor,
  Key,
} from 'lucide-react';
import { useOrganization } from '@/hooks/use-organization';
import { useRecentEvents, type RecentEvent } from '@/hooks/use-project-stats';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { GlowButton } from '@/components/ui/glow-button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CodeBlock } from '@/components/ui/code-block';
import { cn } from '@/lib/utils';

type SdkType = 'frontend' | 'backend';

interface SetupStep {
  number: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

interface StepIndicatorProps {
  step: SetupStep;
}

function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
          step.isComplete
            ? 'bg-green-500 border-green-500 text-white'
            : step.isActive
              ? 'border-primary text-primary'
              : 'border-muted text-muted-foreground'
        }`}
      >
        {step.isComplete ? (
          <Check className="h-5 w-5" />
        ) : (
          <span className="text-sm font-medium">{step.number}</span>
        )}
      </div>
      <div>
        <h3 className="font-semibold">{step.title}</h3>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </div>
    </div>
  );
}

interface ListeningIndicatorProps {
  isListening: boolean;
  hasReceivedEvent: boolean;
}

function ListeningIndicator({ isListening, hasReceivedEvent }: ListeningIndicatorProps) {
  if (hasReceivedEvent) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20"
      >
        <Check className="h-4 w-4 text-green-400" />
        <span className="text-sm font-medium text-green-400">Event Received!</span>
      </motion.div>
    );
  }

  if (isListening) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20">
        <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
        <span className="text-sm font-medium text-yellow-400">Listening for events...</span>
      </div>
    );
  }

  return null;
}

interface ConfettiProps {
  show: boolean;
}

function Confetti({ show }: ConfettiProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 0.5, repeat: 2 }}
        >
          <PartyPopper className="h-16 w-16 text-yellow-400" />
        </motion.div>
      </motion.div>
    </div>
  );
}

interface SendTestEventButtonProps {
  projectId: string;
  onSuccess: () => void;
  disabled?: boolean;
}

function SendTestEventButton({ projectId, onSuccess, disabled }: SendTestEventButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSendTestEvent = async () => {
    if (!projectId) {
      setError('No project selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      // Use session-authenticated endpoint instead of API key
      const response = await fetch(`${API_URL}/projects/${projectId}/events/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || 'Failed to send test event');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSendTestEvent}
        disabled={disabled || isLoading || !projectId}
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Send Test Event
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export interface SetupGuideProps {
  onComplete?: () => void;
}

export function SetupGuide({ onComplete }: SetupGuideProps) {
  const { projects, apiKeys } = useOrganization();
  const currentProject = projects[0];
  const projectApiKey = apiKeys.find((key) => key.projectId === currentProject?.id);

  const [isListening, setIsListening] = React.useState(false);
  const [hasReceivedEvent, setHasReceivedEvent] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [initialEventCount, setInitialEventCount] = React.useState<number | null>(null);
  const [sdkType, setSdkType] = React.useState<SdkType>('frontend');

  const { data: recentEvents, refetch } = useRecentEvents(currentProject?.id, {
    enabled: isListening && !hasReceivedEvent,
    refetchInterval: isListening && !hasReceivedEvent ? 3000 : undefined,
  });

  // Track initial event count when starting to listen
  React.useEffect(() => {
    if (isListening && initialEventCount === null && recentEvents) {
      setInitialEventCount(recentEvents.length);
    }
  }, [isListening, initialEventCount, recentEvents]);

  // Detect new events
  React.useEffect(() => {
    if (
      isListening &&
      initialEventCount !== null &&
      recentEvents &&
      recentEvents.length > initialEventCount
    ) {
      setHasReceivedEvent(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      onComplete?.();
    }
  }, [isListening, initialEventCount, recentEvents, onComplete]);

  const handleStartListening = () => {
    setIsListening(true);
    setInitialEventCount(null);
    refetch();
  };

  const handleTestEventSuccess = () => {
    // Refetch events to detect the new test event
    setTimeout(() => refetch(), 500);
  };

  const hasApiKey = !!projectApiKey;

  const steps: SetupStep[] = [
    {
      number: 1,
      title: 'Generate API Key',
      description: 'Create an API key for your project',
      isComplete: hasApiKey,
      isActive: !hasApiKey,
    },
    {
      number: 2,
      title: 'Install the SDK',
      description: 'Add the Boost SDK to your project',
      isComplete: false,
      isActive: hasApiKey,
    },
    {
      number: 3,
      title: 'Initialize',
      description: 'Configure the SDK with your API key',
      isComplete: false,
      isActive: false,
    },
    {
      number: 4,
      title: 'Verify',
      description: 'Send your first event',
      isComplete: hasReceivedEvent,
      isActive: hasApiKey && isListening && !hasReceivedEvent,
    },
  ];

  // Frontend SDK code examples
  const frontendInstallCode = 'npm install @gamifyio/react';

  const frontendInitializeCode = `import { GamifyProvider } from '@gamifyio/react';

export default function App({ children }) {
  return (
    <GamifyProvider
      apiKey="${projectApiKey?.keyPrefix || 'pk_live_'}..."
      endpoint="${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}"
    >
      {children}
    </GamifyProvider>
  );
}`;

  const frontendTrackEventCode = `import { useGamify } from '@gamifyio/react';

function MyComponent() {
  const { track } = useGamify();

  const handleClick = () => {
    track('button_clicked', {
      buttonId: 'signup',
      page: 'home'
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}`;

  // Backend SDK code examples
  const backendInstallCode = 'npm install @gamifyio/node';

  const backendInitializeCode = `import { GamifyClient } from '@gamifyio/node';

const gamify = new GamifyClient({
  secretKey: process.env.GAMIFY_SECRET_KEY!, // sk_live_...
});`;

  const backendTrackEventCode = `// Track a purchase (server-side only)
await gamify.purchase({
  userId: 'user_123',
  orderId: 'order_456',
  amount: 9999, // Amount in cents ($99.99)
  currency: 'USD',
  items: [
    { productId: 'prod_1', name: 'Widget', unitPrice: 9999, quantity: 1 }
  ],
});

// Track custom events
await gamify.track({
  userId: 'user_123',
  event: 'subscription_renewed',
  properties: { plan: 'premium' },
});`;

  // Dynamic code based on SDK type
  const installCode = sdkType === 'frontend' ? frontendInstallCode : backendInstallCode;
  const initializeCode = sdkType === 'frontend' ? frontendInitializeCode : backendInitializeCode;
  const trackEventCode = sdkType === 'frontend' ? frontendTrackEventCode : backendTrackEventCode;

  return (
    <>
      <AnimatePresence>
        <Confetti show={showConfetti} />
      </AnimatePresence>

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome to Boost!</h1>
          <p className="text-muted-foreground text-lg">
            Let&apos;s get your first event tracked in just a few minutes.
          </p>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            <GlassCardContent className="p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <React.Fragment key={step.number}>
                    <StepIndicator step={step} />
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-px bg-border mx-4" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Step 1: Generate API Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard glow={!hasApiKey}>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${hasApiKey ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                  {hasApiKey ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <Key className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <GlassCardTitle>Step 1: Generate API Key</GlassCardTitle>
                  <GlassCardDescription>
                    Create an API key to authenticate your SDK
                  </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              {hasApiKey ? (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="font-medium text-green-400">API Key Created</p>
                      <code className="text-sm text-green-400/80">{projectApiKey?.keyPrefix}...</code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You need an API key to connect your app to Boost. Create one to get started.
                  </p>
                  <GlowButton variant="glow" asChild>
                    <a href="/dashboard/developer/api-keys">
                      <Key className="mr-2 h-4 w-4" />
                      Create API Key
                    </a>
                  </GlowButton>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Step 2: Install */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className={cn(!hasApiKey && 'opacity-50 pointer-events-none')}>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Terminal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <GlassCardTitle>Step 2: Install the SDK</GlassCardTitle>
                  <GlassCardDescription>
                    Choose your SDK based on where you want to track events
                  </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {/* SDK Type Tabs */}
              <Tabs value={sdkType} onValueChange={(v) => setSdkType(v as SdkType)}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="frontend" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Frontend
                  </TabsTrigger>
                  <TabsTrigger value="backend" className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Backend
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="frontend" className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-blue-400">
                      <strong>React SDK</strong> - For client-side tracking in browsers. Uses publishable keys (pk_*) for behavioral events like page views, clicks, and cart updates.
                    </p>
                  </div>
                  <CodeBlock code={installCode} language="bash" />
                </TabsContent>

                <TabsContent value="backend" className="space-y-4">
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm text-purple-400">
                      <strong>Node.js SDK</strong> - For server-side tracking. Uses secret keys (sk_*) for trusted events like purchases and commissions.
                    </p>
                  </div>

                  {/* Language options */}
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1.5 rounded-md bg-primary/20 text-primary text-sm font-medium border border-primary/30">
                      Node.js
                    </button>
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-md bg-muted/30 text-muted-foreground/50 text-sm font-medium border border-border cursor-not-allowed flex items-center gap-1.5"
                    >
                      Python
                      <span className="text-xs opacity-60">Soon</span>
                    </button>
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-md bg-muted/30 text-muted-foreground/50 text-sm font-medium border border-border cursor-not-allowed flex items-center gap-1.5"
                    >
                      Go
                      <span className="text-xs opacity-60">Soon</span>
                    </button>
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-md bg-muted/30 text-muted-foreground/50 text-sm font-medium border border-border cursor-not-allowed flex items-center gap-1.5"
                    >
                      Ruby
                      <span className="text-xs opacity-60">Soon</span>
                    </button>
                  </div>

                  <CodeBlock code={installCode} language="bash" />
                </TabsContent>
              </Tabs>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Step 3: Initialize */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className={cn(!hasApiKey && 'opacity-50 pointer-events-none')}>
            <GlassCardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Code className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <GlassCardTitle>
                    Step 3: {sdkType === 'frontend' ? 'Initialize Provider' : 'Initialize Client'}
                  </GlassCardTitle>
                  <GlassCardDescription>
                    {sdkType === 'frontend'
                      ? 'Wrap your app with the GamifyProvider component'
                      : 'Create a GamifyClient instance in your server code'}
                  </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {sdkType === 'frontend'
                    ? 'Add the provider to your root component:'
                    : 'Initialize the client with your secret key:'}
                </p>
                <CodeBlock code={initializeCode} language="tsx" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {sdkType === 'frontend'
                    ? 'Then track events anywhere in your app:'
                    : 'Track events from your API routes or server actions:'}
                </p>
                <CodeBlock code={trackEventCode} language="tsx" />
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Step 4: Verify */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard glow={hasReceivedEvent} className={cn(!hasApiKey && 'opacity-50 pointer-events-none')}>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasReceivedEvent ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                    {hasReceivedEvent ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <Zap className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <GlassCardTitle>Step 4: Verify Integration</GlassCardTitle>
                    <GlassCardDescription>
                      {hasReceivedEvent
                        ? 'Your integration is working perfectly!'
                        : 'Send an event to verify your setup'}
                    </GlassCardDescription>
                  </div>
                </div>
                <ListeningIndicator
                  isListening={isListening}
                  hasReceivedEvent={hasReceivedEvent}
                />
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              {hasReceivedEvent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <PartyPopper className="h-6 w-6 text-green-400" />
                      <div>
                        <h4 className="font-semibold text-green-400">
                          Congratulations!
                        </h4>
                        <p className="text-sm text-green-400/80">
                          Your first event has been received. You&apos;re all set to start
                          tracking user behavior.
                        </p>
                      </div>
                    </div>
                  </div>
                  <GlowButton onClick={onComplete} variant="glow">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </GlowButton>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You can either trigger an event from your app, or use the button
                    below to send a test event from here.
                  </p>
                  <div className="flex items-center gap-4">
                    {!isListening ? (
                      <GlowButton onClick={handleStartListening} variant="glow">
                        Start Listening
                      </GlowButton>
                    ) : (
                      <StatusBadge variant="warning" dot pulse>
                        Polling every 3 seconds
                      </StatusBadge>
                    )}
                    <SendTestEventButton
                      projectId={currentProject?.id ?? ''}
                      onSuccess={handleTestEventSuccess}
                      disabled={!currentProject || !hasApiKey}
                    />
                  </div>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-4"
        >
          <Button variant="ghost" asChild>
            <a href="/dashboard/playground">Try the Playground</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="/dashboard/developer/api-keys">Manage API Keys</a>
          </Button>
        </motion.div>
      </div>
    </>
  );
}
