'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Check,
  X,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from '@/components/ui/glass-card';
import { GlowButton } from '@/components/ui/glow-button';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Condition {
  id: string;
  attribute: string;
  operator: string;
  value: string;
}

interface Effect {
  id: string;
  type: string;
  value: string;
}

interface Rule {
  id: string;
  name: string;
  conditions: Condition[];
  effects: Effect[];
  valid: boolean;
}

const attributes = [
  { id: 'cart.total', label: 'Cart Total', type: 'number' },
  { id: 'cart.itemCount', label: 'Cart Item Count', type: 'number' },
  { id: 'user.tier', label: 'User Tier', type: 'string' },
  { id: 'user.purchaseCount', label: 'Purchase Count', type: 'number' },
  { id: 'user.loyaltyPoints', label: 'Loyalty Points', type: 'number' },
  { id: 'product.category', label: 'Product Category', type: 'string' },
  { id: 'event.type', label: 'Event Type', type: 'string' },
];

const operators = {
  number: [
    { id: 'eq', label: 'equals' },
    { id: 'gt', label: 'greater than' },
    { id: 'gte', label: 'greater than or equal' },
    { id: 'lt', label: 'less than' },
    { id: 'lte', label: 'less than or equal' },
  ],
  string: [
    { id: 'eq', label: 'equals' },
    { id: 'contains', label: 'contains' },
    { id: 'in', label: 'is one of' },
  ],
};

const effectTypes = [
  { id: 'discount_percentage', label: 'Percentage Discount' },
  { id: 'discount_fixed', label: 'Fixed Amount Discount' },
  { id: 'add_points', label: 'Add Loyalty Points' },
  { id: 'free_shipping', label: 'Free Shipping' },
  { id: 'bonus_item', label: 'Bonus Item' },
];

function SortableCondition({
  condition,
  index,
  onUpdate,
  onRemove,
}: {
  condition: Condition;
  index: number;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes: dragAttributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: condition.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const attr = attributes.find((a) => a.id === condition.attribute);
  const ops = attr ? operators[attr.type as keyof typeof operators] : operators.string;

  const isValid =
    condition.attribute && condition.operator && condition.value;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border transition-colors',
        isDragging && 'opacity-50',
        isValid
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-red-500/30 bg-red-500/5'
      )}
    >
      <button
        {...dragAttributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {index > 0 && (
        <span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded">
          AND
        </span>
      )}

      <Select
        value={condition.attribute}
        onValueChange={(v) => onUpdate(condition.id, 'attribute', v)}
      >
        <SelectTrigger className="w-40 bg-surface-1">
          <SelectValue placeholder="Attribute" />
        </SelectTrigger>
        <SelectContent>
          {attributes.map((attr) => (
            <SelectItem key={attr.id} value={attr.id}>
              {attr.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(v) => onUpdate(condition.id, 'operator', v)}
      >
        <SelectTrigger className="w-36 bg-surface-1">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {ops.map((op) => (
            <SelectItem key={op.id} value={op.id}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Value"
        value={condition.value}
        onChange={(e) => onUpdate(condition.id, 'value', e.target.value)}
        className="w-32 bg-surface-1"
      />

      <div className="flex items-center gap-1 ml-auto">
        {isValid ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-400" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onRemove(condition.id)}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
}

function EffectBlock({
  effect,
  onUpdate,
  onRemove,
}: {
  effect: Effect;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const effectType = effectTypes.find((e) => e.id === effect.type);
  const isValid = effect.type && effect.value;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border transition-colors',
        isValid
          ? 'border-purple-500/30 bg-purple-500/5'
          : 'border-red-500/30 bg-red-500/5'
      )}
    >
      <Select
        value={effect.type}
        onValueChange={(v) => onUpdate(effect.id, 'type', v)}
      >
        <SelectTrigger className="w-48 bg-surface-1">
          <SelectValue placeholder="Effect Type" />
        </SelectTrigger>
        <SelectContent>
          {effectTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder={
          effect.type?.includes('percentage') ? 'e.g., 10' : 'Value'
        }
        value={effect.value}
        onChange={(e) => onUpdate(effect.id, 'value', e.target.value)}
        className="w-32 bg-surface-1"
      />

      {effect.type?.includes('percentage') && (
        <span className="text-muted-foreground">%</span>
      )}
      {effect.type === 'discount_fixed' && (
        <span className="text-muted-foreground">$</span>
      )}

      <div className="flex items-center gap-1 ml-auto">
        {isValid ? (
          <Check className="h-4 w-4 text-purple-400" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-400" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onRemove(effect.id)}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function RuleBuilderPage() {
  const params = useParams();
  const router = useRouter();

  const [ruleName, setRuleName] = React.useState('');
  const [conditions, setConditions] = React.useState<Condition[]>([
    { id: '1', attribute: '', operator: '', value: '' },
  ]);
  const [effects, setEffects] = React.useState<Effect[]>([
    { id: '1', type: '', value: '' },
  ]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setConditions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now().toString(), attribute: '', operator: '', value: '' },
    ]);
  };

  const updateCondition = (id: string, field: string, value: string) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((c) => c.id !== id));
    }
  };

  const addEffect = () => {
    setEffects([
      ...effects,
      { id: Date.now().toString(), type: '', value: '' },
    ]);
  };

  const updateEffect = (id: string, field: string, value: string) => {
    setEffects(
      effects.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const removeEffect = (id: string) => {
    if (effects.length > 1) {
      setEffects(effects.filter((e) => e.id !== id));
    }
  };

  const isRuleValid =
    ruleName &&
    conditions.every((c) => c.attribute && c.operator && c.value) &&
    effects.every((e) => e.type && e.value);

  const handleSave = () => {
    console.log('Saving rule:', { ruleName, conditions, effects });
    router.push(`/dashboard/campaigns/${params.id}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Rule Builder</h1>
            <p className="text-muted-foreground">
              Create conditions and effects for your campaign
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <GlowButton
            variant="glow"
            onClick={handleSave}
            disabled={!isRuleValid}
          >
            <Check className="mr-2 h-4 w-4" />
            Save Rule
          </GlowButton>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Toolbox */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="sticky top-24">
            <GlassCardHeader>
              <GlassCardTitle>Toolbox</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Available Attributes
                  </Label>
                  <ScrollArea className="h-48 mt-2">
                    <div className="space-y-1">
                      {attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className="flex items-center justify-between p-2 rounded bg-surface-1 text-sm"
                        >
                          <span>{attr.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {attr.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Available Effects
                  </Label>
                  <ScrollArea className="h-40 mt-2">
                    <div className="space-y-1">
                      {effectTypes.map((effect) => (
                        <div
                          key={effect.id}
                          className="p-2 rounded bg-surface-1 text-sm"
                        >
                          {effect.label}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        {/* Rule Builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Rule Name */}
          <GlassCard>
            <GlassCardContent className="p-4">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                placeholder="e.g., 10% off orders over $50"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="mt-2 bg-surface-1"
              />
            </GlassCardContent>
          </GlassCard>

          {/* Conditions */}
          <GlassCard>
            <GlassCardHeader className="flex-row items-center justify-between">
              <GlassCardTitle>Conditions</GlassCardTitle>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </GlassCardHeader>
            <GlassCardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={conditions.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    <AnimatePresence>
                      {conditions.map((condition, index) => (
                        <SortableCondition
                          key={condition.id}
                          condition={condition}
                          index={index}
                          onUpdate={updateCondition}
                          onRemove={removeCondition}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </DndContext>
            </GlassCardContent>
          </GlassCard>

          {/* Effects */}
          <GlassCard>
            <GlassCardHeader className="flex-row items-center justify-between">
              <GlassCardTitle>Effects</GlassCardTitle>
              <Button variant="outline" size="sm" onClick={addEffect}>
                <Plus className="mr-2 h-4 w-4" />
                Add Effect
              </Button>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-2">
                <AnimatePresence>
                  {effects.map((effect) => (
                    <EffectBlock
                      key={effect.id}
                      effect={effect}
                      onUpdate={updateEffect}
                      onRemove={removeEffect}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Validation status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'p-4 rounded-lg border',
              isRuleValid
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
            )}
          >
            <div className="flex items-center gap-2">
              {isRuleValid ? (
                <>
                  <Check className="h-5 w-5" />
                  <span>Rule is valid and ready to save</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Complete all fields to save this rule</span>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
