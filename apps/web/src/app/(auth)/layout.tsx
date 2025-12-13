'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const features = [
  'Real-time event tracking',
  'Powerful campaign management',
  'Advanced analytics dashboard',
  'Flexible reward system',
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding with parallax */}
      <div className="hidden lg:flex relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-purple-500/10">
        {/* Animated background elements */}
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute inset-0 aurora" />

        {/* Branding content with animations */}
        <div className="relative z-10 flex flex-col justify-center px-12 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="magnetic-subtle"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-3xl font-bold gradient-text">Boost</span>
            </div>
            <h1 className="text-5xl font-bold mb-4">
              Welcome to Boost
            </h1>
            <p className="text-xl text-muted-foreground">
              The loyalty engine for modern applications
            </p>
          </motion.div>

          {/* Animated features list */}
          <div className="mt-12 space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.3 + i * 0.1,
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Check className="h-5 w-5 text-primary" />
                </div>
                <span className="text-foreground font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </main>
  );
}
