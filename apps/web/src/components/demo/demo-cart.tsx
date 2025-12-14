'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Tag, Play, Loader2 } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GlowButton } from '@/components/ui/glow-button';
import { Input } from '@/components/ui/input';
import { useAddLog } from './demo-provider';
import { DemoCodeToggle } from './sdk-code-snippet';
import { SDK_SNIPPETS } from './sdk-snippets';
import type { Product } from './demo-products';

export interface CartItem extends Product {
  quantity: number;
}

interface DemoCartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  userId: string;
}

export function DemoCart({ items, onUpdateQuantity, userId }: DemoCartProps) {
  const addLog = useAddLog();
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<string | null>(null);
  const [isApplying, setIsApplying] = React.useState(false);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [discount, setDiscount] = React.useState(0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;

    setIsApplying(true);

    addLog({
      type: 'request',
      method: 'POST',
      endpoint: '/v1/sessions/:token/coupons',
      data: { code: couponCode },
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (couponCode.toUpperCase() === 'SAVE20') {
      const discountAmount = subtotal * 0.2;
      setDiscount(discountAmount);
      setAppliedCoupon(couponCode);
      addLog({
        type: 'response',
        method: '200 OK',
        data: {
          success: true,
          coupon: couponCode,
          discount: {
            type: 'percentage',
            value: 20,
            amount: discountAmount,
          },
        },
      });
    } else if (couponCode.toUpperCase() === 'WELCOME10') {
      const discountAmount = 10;
      setDiscount(discountAmount);
      setAppliedCoupon(couponCode);
      addLog({
        type: 'response',
        method: '200 OK',
        data: {
          success: true,
          coupon: couponCode,
          discount: {
            type: 'fixed',
            value: 10,
            amount: discountAmount,
          },
        },
      });
    } else {
      addLog({
        type: 'error',
        method: '400 Bad Request',
        data: {
          success: false,
          error: 'Invalid coupon code',
          code: 'INVALID_COUPON',
        },
      });
    }

    setCouponCode('');
    setIsApplying(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    addLog({
      type: 'event',
      method: 'coupon_removed',
      data: { coupon: appliedCoupon },
    });
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);

    addLog({
      type: 'request',
      method: 'POST',
      endpoint: '/v1/sessions/:token/complete',
      data: {
        userId,
        items: items.map((item) => ({
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        coupons: appliedCoupon ? [appliedCoupon] : [],
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    addLog({
      type: 'response',
      method: '200 OK',
      data: {
        success: true,
        sessionToken: `sess_${Date.now()}`,
        status: 'completed',
        subtotal,
        discount,
        total,
        pointsEarned: Math.floor(total),
      },
    });

    setIsCheckingOut(false);
  };

  return (
    <DemoCodeToggle {...SDK_SNIPPETS.cart}>
      <GlassCard>
        <GlassCardHeader className="flex-row items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Cart
          </GlassCardTitle>
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </GlassCardHeader>
      <GlassCardContent>
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Your cart is empty. Add some products!
          </p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item) => (
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
                      onClick={() => onUpdateQuantity(item.id, -1)}
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
                      onClick={() => onUpdateQuantity(item.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Coupon */}
            <div className="pt-3 border-t border-border">
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">
                      {appliedCoupon}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    className="text-green-400 hover:text-green-300"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code (try SAVE20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    className="bg-surface-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponCode}
                  >
                    {isApplying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
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
              <div className="flex justify-between text-lg font-bold pt-1">
                <span>Total</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>

            <GlowButton
              variant="glow"
              className="w-full"
              onClick={handleCheckout}
              disabled={isCheckingOut}
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Checkout
                </>
              )}
            </GlowButton>
          </div>
        )}
      </GlassCardContent>
      </GlassCard>
    </DemoCodeToggle>
  );
}
