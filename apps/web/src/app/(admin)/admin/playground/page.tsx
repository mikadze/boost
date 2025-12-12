'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  Gift,
  Play,
  Terminal,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'event';
  method?: string;
  data: unknown;
}

const products: Product[] = [
  { id: '1', name: 'Wireless Headphones', price: 129.99, image: '' },
  { id: '2', name: 'Smart Watch', price: 249.99, image: '' },
  { id: '3', name: 'Bluetooth Speaker', price: 79.99, image: '' },
  { id: '4', name: 'Laptop Stand', price: 49.99, image: '' },
];

export default function PlaygroundPage() {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [userPoints, setUserPoints] = React.useState(5000);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }

    // Log the SDK call
    addLog('request', 'POST', {
      method: 'gamify.track',
      params: {
        event: 'add_to_cart',
        userId: 'demo_user',
        properties: {
          productId: product.id,
          productName: product.name,
          price: product.price,
        },
      },
    });

    setTimeout(() => {
      addLog('response', undefined, { status: 'accepted', eventId: `evt_${Date.now()}` });
    }, 100);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const applyCoupon = () => {
    if (!couponCode) return;

    addLog('request', 'POST', {
      method: 'session.applyCoupon',
      params: { code: couponCode },
    });

    if (couponCode.toUpperCase() === 'SAVE20') {
      setAppliedCoupon(couponCode);
      setTimeout(() => {
        addLog('response', undefined, {
          success: true,
          discount: { type: 'percentage', value: 20 },
        });
      }, 200);
    } else {
      setTimeout(() => {
        addLog('response', undefined, {
          success: false,
          error: 'Invalid coupon code',
        });
      }, 200);
    }
    setCouponCode('');
  };

  const redeemPoints = (points: number) => {
    if (userPoints < points) return;

    addLog('request', 'POST', {
      method: 'loyalty.redeem',
      params: { points, userId: 'demo_user' },
    });

    setUserPoints((prev) => prev - points);

    setTimeout(() => {
      addLog('response', undefined, {
        success: true,
        pointsRedeemed: points,
        discount: points / 100, // $1 per 100 points
        remainingPoints: userPoints - points,
      });
    }, 200);
  };

  const addLog = (type: LogEntry['type'], method?: string, data?: unknown) => {
    setLogs((prev) => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        method,
        data,
      },
      ...prev,
    ]);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = appliedCoupon === 'SAVE20' ? subtotal * 0.2 : 0;
  const total = subtotal - discount;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">SDK Playground</h1>
          <p className="text-muted-foreground">
            Interactive demo of the Boost SDK in action
          </p>
        </div>
        <StatusBadge variant="active" dot pulse>
          Live Demo
        </StatusBadge>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mock E-commerce Interface */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Products */}
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Products</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-lg bg-surface-1 border border-border"
                  >
                    <div className="h-24 rounded bg-surface-2 mb-3" />
                    <p className="font-medium text-sm">{product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Cart */}
          <GlassCard>
            <GlassCardHeader className="flex-row items-center justify-between">
              <GlassCardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </GlassCardTitle>
              <span className="text-sm text-muted-foreground">
                {cart.length} items
              </span>
            </GlassCardHeader>
            <GlassCardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Your cart is empty
                </p>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface-1"
                      >
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-mono">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Coupon */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code (try SAVE20)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="bg-surface-1"
                      />
                      <Button variant="outline" onClick={applyCoupon}>
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-green-400 mt-1">
                        Coupon {appliedCoupon} applied!
                      </p>
                    )}
                  </div>

                  {/* Points redemption */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Your Points</span>
                      <span className="font-mono text-primary">{userPoints}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => redeemPoints(500)}
                        disabled={userPoints < 500}
                      >
                        <Gift className="mr-1 h-4 w-4" />
                        500 pts = $5
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => redeemPoints(1000)}
                        disabled={userPoints < 1000}
                      >
                        <Gift className="mr-1 h-4 w-4" />
                        1000 pts = $10
                      </Button>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="pt-3 border-t border-border space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Discount</span>
                        <span className="font-mono">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="font-mono">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <GlowButton variant="glow" className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    Checkout
                  </GlowButton>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Live Console */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard className="h-[calc(100vh-200px)]">
            <GlassCardHeader className="flex-row items-center justify-between">
              <GlassCardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Live Console
              </GlassCardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([])}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </GlassCardHeader>
            <GlassCardContent className="h-[calc(100%-80px)]">
              <ScrollArea className="h-full">
                <div className="space-y-2 font-mono text-xs">
                  <AnimatePresence>
                    {logs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-3 rounded-lg ${
                          log.type === 'request'
                            ? 'bg-blue-500/10 border border-blue-500/20'
                            : log.type === 'response'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-purple-500/10 border border-purple-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              log.type === 'request'
                                ? 'bg-blue-500/20 text-blue-400'
                                : log.type === 'response'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {log.type.toUpperCase()}
                          </span>
                          {log.method && (
                            <span className="text-muted-foreground">
                              {log.method}
                            </span>
                          )}
                          <span className="text-muted-foreground ml-auto">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {logs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Interact with the demo to see SDK calls here
                    </p>
                  )}
                </div>
              </ScrollArea>
            </GlassCardContent>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
