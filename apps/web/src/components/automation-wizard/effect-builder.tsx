'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Plus, Trash2, Check, X, Coins, Percent, TrendingUp, Bell, Truck, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EFFECT_TYPE_INFO, type RuleEffect } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

interface EffectBuilderProps {
  effects: RuleEffect[];
  onSave: (effects: RuleEffect[]) => void;
  onCancel: () => void;
}

// Icon mapping
const ICONS: Record<string, React.ReactNode> = {
  Coins: <Coins className="h-4 w-4" />,
  Percent: <Percent className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Bell: <Bell className="h-4 w-4" />,
  Truck: <Truck className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
};

const DEFAULT_PARAMS: Record<string, Record<string, unknown>> = {
  add_loyalty_points: { amount: 100 },
  apply_discount: { type: 'percentage', value: 10 },
  upgrade_tier: { tier: 'silver' },
  send_notification: { title: '', message: '' },
  free_shipping: {},
  add_item: { sku: '', quantity: 1 },
};

export function EffectBuilder({ effects: initialEffects, onSave, onCancel }: EffectBuilderProps) {
  const [effects, setEffects] = useState<RuleEffect[]>(
    initialEffects.length > 0
      ? initialEffects
      : [{ type: 'add_loyalty_points', params: { amount: 100 } }]
  );

  const handleAddEffect = useCallback(() => {
    setEffects((prev) => [
      ...prev,
      { type: 'add_loyalty_points', params: { amount: 100 } },
    ]);
  }, []);

  const handleRemoveEffect = useCallback((index: number) => {
    setEffects((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleTypeChange = useCallback((index: number, type: string) => {
    setEffects((prev) =>
      prev.map((effect, i): RuleEffect => {
        if (i !== index) return effect;
        return { type: type as RuleEffect['type'], params: DEFAULT_PARAMS[type] || {} };
      })
    );
  }, []);

  const handleParamChange = useCallback(
    (index: number, paramName: string, value: string | number) => {
      setEffects((prev) =>
        prev.map((effect, i) => {
          if (i !== index) return effect;
          return {
            ...effect,
            params: { ...effect.params, [paramName]: value },
          };
        })
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    // Filter out invalid effects
    const validEffects = effects.filter((e) => e.type);
    if (validEffects.length > 0) {
      onSave(validEffects);
    }
  }, [effects, onSave]);

  const renderParamInputs = (effect: RuleEffect, index: number) => {
    const info = EFFECT_TYPE_INFO[effect.type];
    if (!info || info.params.length === 0) {
      return <span className="text-sm text-muted-foreground">No configuration needed</span>;
    }

    return (
      <div className="flex flex-wrap gap-3">
        {info.params.map((param) => {
          const value = effect.params[param.name] ?? '';

          // Handle select types
          if (param.type.startsWith('select:')) {
            const options = param.type.replace('select:', '').split(',');
            return (
              <div key={param.name} className="flex flex-col gap-1">
                <Label className="text-xs capitalize">{param.name}</Label>
                <Select
                  value={value as string}
                  onValueChange={(v) => handleParamChange(index, param.name, v)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={`Select ${param.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // Handle number inputs
          if (param.type === 'number') {
            return (
              <div key={param.name} className="flex flex-col gap-1">
                <Label className="text-xs capitalize">{param.name}</Label>
                <Input
                  type="number"
                  value={value as number}
                  onChange={(e) => handleParamChange(index, param.name, Number(e.target.value))}
                  className="w-[100px]"
                />
              </div>
            );
          }

          // Handle string inputs
          return (
            <div key={param.name} className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <Label className="text-xs capitalize">{param.name}</Label>
              <Input
                type="text"
                value={value as string}
                onChange={(e) => handleParamChange(index, param.name, e.target.value)}
                placeholder={param.name}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {effects.map((effect, index) => {
        const info = EFFECT_TYPE_INFO[effect.type];
        const Icon = info ? ICONS[info.icon] : null;

        return (
          <div
            key={index}
            className="p-4 rounded-lg border bg-surface-2 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Effect Type Selector */}
                <Select
                  value={effect.type}
                  onValueChange={(v) => handleTypeChange(index, v)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select effect">
                      <div className="flex items-center gap-2">
                        {Icon}
                        <span>{info?.label || effect.type}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EFFECT_TYPE_INFO).map(([type, typeInfo]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {ICONS[typeInfo.icon]}
                          <span>{typeInfo.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remove Button */}
              {effects.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEffect(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>

            {/* Parameter Inputs */}
            {renderParamInputs(effect, index)}
          </div>
        );
      })}

      {/* Add Effect */}
      <Button variant="outline" size="sm" onClick={handleAddEffect} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Effect
      </Button>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={effects.length === 0}>
          <Check className="h-4 w-4 mr-1" />
          Apply
        </Button>
      </div>
    </div>
  );
}
