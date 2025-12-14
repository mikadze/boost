'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  ShoppingBag,
  UserPlus,
  LogIn,
  LogOut,
  Eye,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  CreditCard,
  CheckCircle,
  Search,
  MousePointer,
  Send,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { EVENT_TYPE_INFO } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

interface TriggerSelectorProps {
  selectedEvents: string[];
  onSave: (events: string[]) => void;
  onCancel: () => void;
}

// Icon mapping
const ICONS: Record<string, React.ReactNode> = {
  ShoppingBag: <ShoppingBag className="h-4 w-4" />,
  UserPlus: <UserPlus className="h-4 w-4" />,
  LogIn: <LogIn className="h-4 w-4" />,
  LogOut: <LogOut className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  ShoppingCart: <ShoppingCart className="h-4 w-4" />,
  Plus: <Plus className="h-4 w-4" />,
  Minus: <Minus className="h-4 w-4" />,
  CreditCard: <CreditCard className="h-4 w-4" />,
  CheckCircle: <CheckCircle className="h-4 w-4" />,
  Search: <Search className="h-4 w-4" />,
  MousePointer: <MousePointer className="h-4 w-4" />,
  Send: <Send className="h-4 w-4" />,
};

// Group events by category
type EventTypeItem = { type: string; label: string; icon: string; category: string };
const GROUPED_EVENTS = Object.entries(EVENT_TYPE_INFO).reduce<Record<string, EventTypeItem[]>>(
  (acc, [eventType, info]) => {
    const group = acc[info.category] ?? (acc[info.category] = []);
    group.push({ type: eventType, ...info });
    return acc;
  },
  {}
);

export function TriggerSelector({ selectedEvents, onSave, onCancel }: TriggerSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedEvents));

  const handleToggle = useCallback((eventType: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(eventType)) {
        next.delete(eventType);
      } else {
        next.add(eventType);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (selected.size > 0) {
      onSave(Array.from(selected));
    }
  }, [selected, onSave]);

  return (
    <div className="space-y-4">
      {Object.entries(GROUPED_EVENTS).map(([category, events]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            {category}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {events.map((event) => (
              <label
                key={event.type}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  selected.has(event.type)
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-2 border-border hover:border-primary/50'
                )}
              >
                <Checkbox
                  checked={selected.has(event.type)}
                  onCheckedChange={() => handleToggle(event.type)}
                />
                <div className="flex items-center gap-2">
                  {ICONS[event.icon] || <div className="h-4 w-4" />}
                  <span className="text-sm">{event.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={selected.size === 0}>
          <Check className="h-4 w-4 mr-1" />
          Apply
        </Button>
      </div>
    </div>
  );
}
