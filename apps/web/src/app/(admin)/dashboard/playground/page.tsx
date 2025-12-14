'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Key, Check, Link2 } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DemoProvider, useDemoContext } from '@/components/demo/demo-provider';
import { DemoConsole } from '@/components/demo/demo-console';
import { DemoProducts, type Product } from '@/components/demo/demo-products';
import { DemoCart, type CartItem } from '@/components/demo/demo-cart';
import { DemoLoyalty } from '@/components/demo/demo-loyalty';
import { DemoUserPanel, type DemoUser } from '@/components/demo/demo-user-panel';
import { DemoReferral } from '@/components/demo/demo-referral';
import { DemoAffiliateStats } from '@/components/demo/demo-affiliate-stats';
import { DemoLeaderboard } from '@/components/demo/demo-leaderboard';
import { DemoQuests } from '@/components/demo/demo-quests';
import { DemoBadges } from '@/components/demo/demo-badges';
import { DemoCampaigns } from '@/components/demo/demo-campaigns';
import { useOrganization } from '@/hooks/use-organization';

function PlaygroundHeader() {
  const { apiKey, setApiKey, projectName, isConnectedToProject } = useDemoContext();
  const [showSettings, setShowSettings] = React.useState(false);
  const [tempKey, setTempKey] = React.useState(apiKey);

  // Update tempKey when apiKey changes (e.g., from auto-connect)
  React.useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h1 className="text-2xl font-bold">SDK Playground</h1>
        <p className="text-muted-foreground">
          Interactive demo of the Boost SDK in action
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isConnectedToProject ? (
          <StatusBadge variant="active" dot>
            <Link2 className="h-3 w-3 mr-1" />
            Connected to {projectName}
          </StatusBadge>
        ) : (
          <StatusBadge variant="warning" dot pulse>
            Demo Mode
          </StatusBadge>
        )}

        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="absolute right-6 top-32 z-50">
            <div className="p-4 rounded-lg glass border border-border w-96">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      placeholder="pk_live_..."
                      className="font-mono text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        setApiKey(tempKey);
                        setShowSettings(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                  {isConnectedToProject ? (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Using {projectName}&apos;s API key
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Pre-configured with demo key
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}

function PlaygroundContent() {
  const [currentUser, setCurrentUser] = React.useState<DemoUser | null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [userPoints, setUserPoints] = React.useState(0);

  const handleSelectUser = (user: DemoUser) => {
    setCurrentUser(user);
    setUserPoints(user.points);
    setCart([]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserPoints(0);
    setCart([]);
  };

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRedeemPoints = (points: number) => {
    setUserPoints((prev) => Math.max(0, prev - points));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Demo Interface */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {/* User Panel */}
        <DemoUserPanel
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
          onLogout={handleLogout}
        />

        {/* Products */}
        <DemoProducts onAddToCart={handleAddToCart} />

        {/* Cart */}
        <DemoCart
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          userId={currentUser?.id || 'anonymous'}
        />

        {/* Loyalty - Only show when user selected */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DemoLoyalty
              userId={currentUser.id}
              userPoints={userPoints}
              onRedeemPoints={handleRedeemPoints}
            />
          </motion.div>
        )}

        {/* Quests - Only show when user selected */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <DemoQuests userId={currentUser.id} />
          </motion.div>
        )}

        {/* Badges/Achievements - Only show when user selected */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <DemoBadges userId={currentUser.id} />
          </motion.div>
        )}

        {/* Campaigns/Automations - Only show when user selected */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DemoCampaigns userId={currentUser.id} />
          </motion.div>
        )}

        {/* Affiliate Section - Only show when user selected */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <DemoReferral userId={currentUser.id} />
          </motion.div>
        )}

        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <DemoAffiliateStats userId={currentUser.id} />
          </motion.div>
        )}

        {/* Leaderboard - Always visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <DemoLeaderboard currentUserId={currentUser?.id || null} />
        </motion.div>
      </motion.div>

      {/* Right Column - Console */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:sticky lg:top-20 lg:h-[calc(100vh-180px)]"
      >
        <DemoConsole />
      </motion.div>
    </div>
  );
}

function PlaygroundWithProvider() {
  const searchParams = useSearchParams();
  const { projects, apiKeys } = useOrganization();
  const autoConnect = searchParams.get('autoConnect') === 'true';

  // Get the first project and its API key
  const currentProject = projects[0];
  const projectApiKey = apiKeys.find((key) => key.projectId === currentProject?.id);

  // Use project's API key if autoConnect is true or if we have a valid key
  const shouldUseProjectKey = autoConnect || !!projectApiKey;
  const initialApiKey = shouldUseProjectKey && projectApiKey ? projectApiKey.keyPrefix : undefined;

  return (
    <DemoProvider
      initialApiKey={initialApiKey}
      projectName={shouldUseProjectKey ? currentProject?.name : undefined}
    >
      <PlaygroundHeader />
      <PlaygroundContent />
    </DemoProvider>
  );
}

export default function PlaygroundPage() {
  return (
    <React.Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <PlaygroundWithProvider />
    </React.Suspense>
  );
}
