'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MetricTickerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function MetricTicker({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1,
  className,
  trend,
  trendValue,
}: MetricTickerProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    formatNumber(latest, decimals)
  );

  React.useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: 'easeOut',
    });

    return controls.stop;
  }, [count, value, duration]);

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <div className="flex items-baseline">
        {prefix && (
          <span className="text-muted-foreground mr-0.5">{prefix}</span>
        )}
        <motion.span className="ticker text-3xl font-bold tabular-nums">
          {rounded}
        </motion.span>
        {suffix && (
          <span className="text-muted-foreground ml-1 text-sm">{suffix}</span>
        )}
      </div>
      {trend && trendValue && (
        <span
          className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded',
            trend === 'up' && 'text-green-400 bg-green-400/10',
            trend === 'down' && 'text-red-400 bg-red-400/10',
            trend === 'neutral' && 'text-muted-foreground bg-muted'
          )}
        >
          {trend === 'up' && '+'}
          {trendValue}
        </span>
      )}
    </div>
  );
}

function formatNumber(num: number, decimals: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toFixed(decimals);
}
