'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Copy,
  Terminal,
  Code,
  Loader2,
  PartyPopper,
  ArrowRight,
  Zap,
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

interface SetupStep {
  number: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

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
  apiKey: string | undefined;
  onSuccess: () => void;
  disabled?: boolean;
}

function SendTestEventButton({ projectId, apiKey, onSuccess, disabled }: SendTestEventButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSendTestEvent = async () => {
    if (!apiKey) {
      setError('No API key available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
      const response = await fetch(`${API_URL}/events/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          event: 'test_event',
          userId: 'setup-guide-test',
          properties: {
            source: 'setup-guide',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        setError('Failed to send test event');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <GlowButton
        onClick={handleSendTestEvent}
        disabled={disabled || isLoading || !apiKey}
        variant="glow"
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
      </GlowButton>
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

  const steps: SetupStep[] = [
    {
      number: 1,
      title: 'Install the SDK',
      description: 'Add the Boost SDK to your project',
      isComplete: false,
      isActive: true,
    },
    {
      number: 2,
      title: 'Initialize the Provider',
      description: 'Configure the SDK with your API key',
      isComplete: false,
      isActive: false,
    },
    {
      number: 3,
      title: 'Verify Integration',
      description: 'Send your first event to confirm everything works',
      isComplete: hasReceivedEvent,
      isActive: isListening && !hasReceivedEvent,
    },
  ];

  const installCode = 'npm install @boost/sdk-react';

  const initializeCode = `import { BoostProvider } from '@boost/sdk-react';

export default function App({ children }) {
  return (
    <BoostProvider
      apiKey="${projectApiKey?.keyPrefix || 'your-api-key'}..."
      endpoint="${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}"
    >
      {children}
    </BoostProvider>
  );
}`;

  const trackEventCode = `import { useBoost } from '@boost/sdk-react';

function MyComponent() {
  const { track } = useBoost();

  const handleClick = () => {
    track('button_clicked', {
      buttonId: 'signup',
      page: 'home'
    });
  };

  return <button onClick={handleClick}>Sign Up</button>;
}`;

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

        {/* Step 1: Install */}
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
                  <GlassCardTitle>Step 1: Install the SDK</GlassCardTitle>
                  <GlassCardDescription>
                    Add the Boost SDK to your React project
                  </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <CodeBlock code={installCode} language="bash" />
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Step 2: Initialize */}
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
                  <GlassCardTitle>Step 2: Initialize the Provider</GlassCardTitle>
                  <GlassCardDescription>
                    Wrap your app with the BoostProvider component
                  </GlassCardDescription>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Add the provider to your root component:
                </p>
                <CodeBlock code={initializeCode} language="tsx" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Then track events anywhere in your app:
                </p>
                <CodeBlock code={trackEventCode} language="tsx" />
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Step 3: Verify */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
                    <GlassCardTitle>Step 3: Verify Integration</GlassCardTitle>
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
                      <Button onClick={handleStartListening} variant="outline">
                        Start Listening
                      </Button>
                    ) : (
                      <StatusBadge variant="warning" dot pulse>
                        Polling every 3 seconds
                      </StatusBadge>
                    )}
                    <SendTestEventButton
                      projectId={currentProject?.id ?? ''}
                      apiKey={projectApiKey?.keyPrefix}
                      onSuccess={handleTestEventSuccess}
                      disabled={!currentProject || !projectApiKey}
                    />
                  </div>
                  {!projectApiKey && (
                    <p className="text-sm text-yellow-400">
                      No API key found for this project. Please create one in the API Keys
                      settings.
                    </p>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
