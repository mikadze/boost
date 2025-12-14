'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Filter,
  Gift,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TriggerSelector } from './trigger-selector';
import { ConditionBuilder } from './condition-builder';
import { EffectBuilder } from './effect-builder';
import type { GeneratedRule, RuleCondition, RuleEffect } from '@/lib/ai/rule-types';
import { EVENT_TYPE_INFO, OPERATOR_INFO, EFFECT_TYPE_INFO } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

interface RulePreviewProps {
  rule: GeneratedRule;
  onUpdate?: (rule: GeneratedRule) => void;
  editable?: boolean;
}

interface CardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
  onEdit?: () => void;
  editing?: boolean;
}

function PreviewCard({ title, icon, color, children, onEdit, editing }: CardProps) {
  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border-2 overflow-hidden transition-colors',
        `border-${color}-500/30`,
        editing && `border-${color}-500`
      )}
    >
      <div className={cn('px-4 py-2 flex items-center justify-between', `bg-${color}-500/10`)}>
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', `bg-${color}-500/20 text-${color}-500`)}>
            {icon}
          </div>
          <span className={cn('text-sm font-semibold', `text-${color}-500`)}>{title}</span>
        </div>
        {onEdit && !editing && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0">
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

function formatConditionValue(condition: RuleCondition): string {
  const operator = OPERATOR_INFO[condition.operator as keyof typeof OPERATOR_INFO];
  const operatorLabel = operator?.label || condition.operator;

  // Format monetary values
  let value = condition.value;
  if (
    condition.field.includes('total') ||
    condition.field.includes('subtotal') ||
    condition.field.includes('price')
  ) {
    if (typeof value === 'number') {
      value = `$${(value / 100).toFixed(2)}`;
    }
  }

  return `${condition.field} ${operatorLabel} ${value}`;
}

function formatEffect(effect: RuleEffect): string {
  const info = EFFECT_TYPE_INFO[effect.type];
  const label = info?.label || effect.type;

  switch (effect.type) {
    case 'add_loyalty_points':
      return `Add ${effect.params.amount} points`;
    case 'apply_discount':
      if (effect.params.type === 'percentage') {
        return `Apply ${effect.params.value}% discount`;
      }
      return `Apply $${((effect.params.value as number) / 100).toFixed(2)} discount`;
    case 'upgrade_tier':
      return `Upgrade to ${effect.params.tier} tier`;
    case 'send_notification':
      return `Send notification: "${effect.params.title}"`;
    case 'free_shipping':
      return 'Enable free shipping';
    case 'add_item':
      return `Add bonus item (${effect.params.sku})`;
    default:
      return label;
  }
}

export function RulePreview({ rule, onUpdate, editable = true }: RulePreviewProps) {
  const [editingSection, setEditingSection] = useState<'trigger' | 'conditions' | 'effects' | null>(null);
  const [editedName, setEditedName] = useState(rule.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleNameSave = useCallback(() => {
    if (onUpdate && editedName.trim()) {
      onUpdate({ ...rule, name: editedName.trim() });
    }
    setIsEditingName(false);
  }, [rule, editedName, onUpdate]);

  const handleTriggerChange = useCallback((eventTypes: string[]) => {
    if (onUpdate) {
      onUpdate({ ...rule, eventTypes });
    }
    setEditingSection(null);
  }, [rule, onUpdate]);

  const handleConditionsChange = useCallback((conditions: RuleCondition[], logic: 'and' | 'or') => {
    if (onUpdate) {
      onUpdate({
        ...rule,
        conditions: { logic, conditions },
      });
    }
    setEditingSection(null);
  }, [rule, onUpdate]);

  const handleEffectsChange = useCallback((effects: RuleEffect[]) => {
    if (onUpdate) {
      onUpdate({ ...rule, effects });
    }
    setEditingSection(null);
  }, [rule, onUpdate]);

  return (
    <div className="space-y-4">
      {/* Rule Name */}
      <div className="flex items-center gap-2">
        {isEditingName && editable ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-lg font-semibold"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleNameSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditedName(rule.name);
                setIsEditingName(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <h3
            className={cn(
              'text-lg font-semibold cursor-pointer hover:text-primary transition-colors',
              !editable && 'cursor-default hover:text-foreground'
            )}
            onClick={() => editable && setIsEditingName(true)}
          >
            {rule.name}
          </h3>
        )}
      </div>

      {/* WHEN Card */}
      <PreviewCard
        title="WHEN"
        icon={<Zap className="h-4 w-4" />}
        color="amber"
        onEdit={editable ? () => setEditingSection('trigger') : undefined}
        editing={editingSection === 'trigger'}
      >
        {editingSection === 'trigger' ? (
          <TriggerSelector
            selectedEvents={rule.eventTypes}
            onSave={handleTriggerChange}
            onCancel={() => setEditingSection(null)}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {rule.eventTypes.map((eventType) => {
              const info = EVENT_TYPE_INFO[eventType];
              return (
                <span
                  key={eventType}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-sm font-medium"
                >
                  {info?.label || eventType}
                </span>
              );
            })}
          </div>
        )}
      </PreviewCard>

      {/* IF Card */}
      <PreviewCard
        title="IF"
        icon={<Filter className="h-4 w-4" />}
        color="blue"
        onEdit={editable ? () => setEditingSection('conditions') : undefined}
        editing={editingSection === 'conditions'}
      >
        {editingSection === 'conditions' ? (
          <ConditionBuilder
            conditions={rule.conditions.conditions}
            logic={rule.conditions.logic}
            onSave={handleConditionsChange}
            onCancel={() => setEditingSection(null)}
          />
        ) : rule.conditions.conditions.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">Always (no conditions)</span>
        ) : (
          <div className="space-y-2">
            {rule.conditions.conditions.map((condition, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-500 uppercase">
                    {rule.conditions.logic}
                  </span>
                )}
                <div className="px-3 py-2 rounded-lg bg-blue-500/10 text-sm font-mono">
                  {formatConditionValue(condition)}
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </PreviewCard>

      {/* THEN Card */}
      <PreviewCard
        title="THEN"
        icon={<Gift className="h-4 w-4" />}
        color="green"
        onEdit={editable ? () => setEditingSection('effects') : undefined}
        editing={editingSection === 'effects'}
      >
        {editingSection === 'effects' ? (
          <EffectBuilder
            effects={rule.effects}
            onSave={handleEffectsChange}
            onCancel={() => setEditingSection(null)}
          />
        ) : (
          <div className="space-y-2">
            {rule.effects.map((effect, index) => (
              <div
                key={index}
                className="px-3 py-2 rounded-lg bg-green-500/10 text-sm flex items-center gap-2"
              >
                <span className="font-medium text-green-600">{formatEffect(effect)}</span>
              </div>
            ))}
          </div>
        )}
      </PreviewCard>
    </div>
  );
}
