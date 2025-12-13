'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, ExternalLink, Settings, Key } from 'lucide-react';
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
import { DemoUserPanel, demoUsers, type DemoUser } from '@/components/demo/demo-user-panel';
import { DemoReferral } from '@/components/demo/demo-referral';
import { DemoAffiliateStats } from '@/components/demo/demo-affiliate-stats';
import { DemoLeaderboard } from '@/components/demo/demo-leaderboard';

function DemoHeader() {
  const { apiKey, setApiKey } = useDemoContext();
  const [showSettings, setShowSettings] = React.useState(false);
  const [tempKey, setTempKey] = React.useState(apiKey);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Boost</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">SDK Demo</span>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge variant="active" dot pulse>
              Live Demo
            </StatusBadge>

            <Collapsible open={showSettings} onOpenChange={setShowSettings}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="absolute right-4 top-16 z-50">
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Pre-configured with demo key
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                Docs
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function DemoContent() {
  const [currentUser, setCurrentUser] = React.useState<DemoUser | null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [userPoints, setUserPoints] = React.useState(0);

  const handleSelectUser = (user: DemoUser) => {
    setCurrentUser(user);
    setUserPoints(user.points);
    setCart([]); // Reset cart on user change
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
    <div className="container mx-auto px-4 py-6">
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

          {/* Affiliate Section - Only show when user selected */}
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
            transition={{ delay: 0.2 }}
          >
            <DemoLeaderboard currentUserId={currentUser?.id || null} />
          </motion.div>
        </motion.div>

        {/* Right Column - Console */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:sticky lg:top-20 lg:h-[calc(100vh-120px)]"
        >
          <DemoConsole />
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground"
      >
        <p>
          This is an interactive demo of the Boost SDK.
          Try adding products to cart, applying coupons (SAVE20, WELCOME10), exploring loyalty features, and managing affiliate referrals.
        </p>
      </motion.footer>
    </div>
  );
}

export default function DemoPage() {
  return (
    <DemoProvider>
      <DemoHeader />
      <DemoContent />
    </DemoProvider>
  );
}
