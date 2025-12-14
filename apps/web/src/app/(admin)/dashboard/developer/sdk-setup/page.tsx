'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Terminal,
  Code,
  Loader2,
  Zap,
  Server,
  Monitor,
  Key,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/hooks/use-organization';
import { useRecentEvents } from '@/hooks/use-project-stats';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type SdkType = 'frontend' | 'backend';

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="p-4 rounded-lg bg-black/50 border border-border overflow-x-auto text-sm">
        <code className={`language-${language} text-muted-foreground`}>
          {code}
        </code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
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
      const response = await fetch(`${API_URL}/projects/${projectId}/events/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

export default function SdkSetupPage() {
  const { projects, apiKeys } = useOrganization();
  const currentProject = projects[0];
  const projectApiKey = apiKeys.find((key) => key.projectId === currentProject?.id);

  const [sdkType, setSdkType] = React.useState<SdkType>('frontend');
  const [isListening, setIsListening] = React.useState(false);
  const [hasReceivedEvent, setHasReceivedEvent] = React.useState(false);
  const [initialEventCount, setInitialEventCount] = React.useState<number | null>(null);

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
    }
  }, [isListening, initialEventCount, recentEvents]);

  const handleStartListening = () => {
    setIsListening(true);
    setHasReceivedEvent(false);
    setInitialEventCount(null);
    refetch();
  };

  const handleTestEventSuccess = () => {
    setTimeout(() => refetch(), 500);
  };

  // Frontend SDK code examples
  const frontendInstallCode = 'npm install @gamify/react';

  const frontendInitializeCode = `import { GamifyProvider } from '@gamify/react';

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

  const frontendTrackEventCode = `import { useGamify } from '@gamify/react';

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
  const backendInstallCode = 'npm install @gamify/node';

  const backendInitializeCode = `import { GamifyClient } from '@gamify/node';

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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">SDK Integration</h1>
          <p className="text-muted-foreground">
            Install and verify your SDK integration
          </p>
        </div>
      </motion.div>

      {/* API Key Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {projectApiKey ? (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Key className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium">API Key Active</p>
                  <code className="text-xs text-muted-foreground">
                    {projectApiKey.keyPrefix}...
                  </code>
                </div>
              </div>
              <Link href="/dashboard/developer/api-keys">
                <Button variant="ghost" size="sm">
                  Manage Keys
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        ) : (
          <Alert className="border-yellow-500/30 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="text-yellow-400">No API Key Found</AlertTitle>
            <AlertDescription className="text-yellow-400/80">
              You need to create an API key before you can send events.{' '}
              <Link href="/dashboard/developer/api-keys" className="underline hover:no-underline">
                Create one now
              </Link>
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* SDK Type Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <GlassCardTitle>Install the SDK</GlassCardTitle>
                <GlassCardDescription>
                  Choose your SDK based on where you want to track events
                </GlassCardDescription>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
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

      {/* Initialize */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard>
          <GlassCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <GlassCardTitle>
                  {sdkType === 'frontend' ? 'Initialize the Provider' : 'Initialize the Client'}
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

      {/* Event Types Reference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Event Types by SDK</GlassCardTitle>
            <GlassCardDescription>
              Understanding which events can be sent from each SDK
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="h-4 w-4 text-blue-400" />
                  <h4 className="font-medium text-blue-400">Frontend SDK (pk_*)</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Behavioral events for analytics:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['page_view', 'click', 'form_submit', 'cart_add', 'cart_remove', 'checkout_start', 'signup', 'login'].map((event) => (
                    <span key={event} className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="h-4 w-4 text-purple-400" />
                  <h4 className="font-medium text-purple-400">Backend SDK (sk_*)</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  All events including trusted/financial:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['purchase', 'checkout_complete', 'commission.created', 'referral_success', 'user.leveled_up', 'quest.completed'].map((event) => (
                    <span key={event} className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Verify Integration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard glow={hasReceivedEvent}>
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
                  <GlassCardTitle>Verify Integration</GlassCardTitle>
                  <GlassCardDescription>
                    {hasReceivedEvent
                      ? 'Your integration is working perfectly!'
                      : 'Test your SDK integration by sending an event'}
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
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Check className="h-6 w-6 text-green-400" />
                  <div>
                    <h4 className="font-semibold text-green-400">
                      Integration Verified
                    </h4>
                    <p className="text-sm text-green-400/80">
                      Your SDK is correctly configured and sending events.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send an event from your app or use the test button below to verify your integration.
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
                    disabled={!currentProject}
                  />
                </div>
                {!projectApiKey && (
                  <p className="text-sm text-yellow-400">
                    No API key found for this project. Please create one in the API Keys settings.
                  </p>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </div>
  );
}
