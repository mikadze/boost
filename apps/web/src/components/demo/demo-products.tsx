'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, ShoppingBag, Headphones, Watch, Speaker, Monitor } from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useTrack } from '@gamifyio/react';
import { useAddLog } from './demo-provider';
import { DemoCodeToggle } from './sdk-code-snippet';
import { SDK_SNIPPETS } from './sdk-snippets';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

const products: Product[] = [
  { id: '1', sku: 'WH-001', name: 'Wireless Headphones', price: 129.99, category: 'Electronics', icon: Headphones },
  { id: '2', sku: 'SW-002', name: 'Smart Watch', price: 249.99, category: 'Electronics', icon: Watch },
  { id: '3', sku: 'BS-003', name: 'Bluetooth Speaker', price: 79.99, category: 'Audio', icon: Speaker },
  { id: '4', sku: 'LS-004', name: 'Laptop Stand', price: 49.99, category: 'Accessories', icon: Monitor },
];

interface DemoProductsProps {
  onAddToCart: (product: Product) => void;
}

export function DemoProducts({ onAddToCart }: DemoProductsProps) {
  const track = useTrack();
  const addLog = useAddLog();

  const handleAddToCart = (product: Product) => {
    // Log the track event
    addLog({
      type: 'event',
      method: 'track',
      data: {
        event: 'add_to_cart',
        properties: {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          category: product.category,
        },
      },
    });

    // Track with SDK
    track('add_to_cart', {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      category: product.category,
    });

    onAddToCart(product);
  };

  const handleProductView = (product: Product) => {
    addLog({
      type: 'event',
      method: 'track',
      data: {
        event: 'product_viewed',
        properties: {
          productId: product.id,
          name: product.name,
        },
      },
    });

    track('product_viewed', {
      productId: product.id,
      name: product.name,
    });
  };

  return (
    <DemoCodeToggle {...SDK_SNIPPETS.products}>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Products
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const IconComponent = product.icon;
            return (
              <motion.div
                key={product.id}
                whileHover={{ scale: 1.02 }}
                onMouseEnter={() => handleProductView(product)}
                className="p-4 rounded-lg bg-surface-1 border border-border cursor-pointer transition-colors hover:border-primary/50"
              >
                <div className="h-20 rounded bg-surface-2 mb-3 flex items-center justify-center">
                  <IconComponent className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-primary font-semibold">
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCardContent>
      </GlassCard>
    </DemoCodeToggle>
  );
}

export { products };
