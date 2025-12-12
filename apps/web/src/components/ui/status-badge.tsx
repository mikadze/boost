'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        active: 'bg-green-500/10 text-green-400 border border-green-500/20',
        inactive: 'bg-muted text-muted-foreground border border-border',
        warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        error: 'bg-red-500/10 text-red-400 border border-red-500/20',
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        primary: 'bg-primary/10 text-primary border border-primary/20',
      },
      size: {
        default: 'text-xs px-2.5 py-0.5',
        sm: 'text-[10px] px-2 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, dot = false, pulse = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              variant === 'active' && 'bg-green-400',
              variant === 'inactive' && 'bg-muted-foreground',
              variant === 'warning' && 'bg-yellow-400',
              variant === 'error' && 'bg-red-400',
              variant === 'info' && 'bg-blue-400',
              variant === 'primary' && 'bg-primary',
              variant === 'default' && 'bg-muted-foreground',
              pulse && 'animate-pulse'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusBadgeVariants };
