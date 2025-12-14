'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CONDITION_FIELDS, OPERATOR_INFO, type RuleCondition, type ComparisonOperator } from '@/lib/ai/rule-types';
import { cn } from '@/lib/utils';

interface ConditionBuilderProps {
  conditions: RuleCondition[];
  logic: 'and' | 'or';
  onSave: (conditions: RuleCondition[], logic: 'and' | 'or') => void;
  onCancel: () => void;
}

export function ConditionBuilder({
  conditions: initialConditions,
  logic: initialLogic,
  onSave,
  onCancel,
}: ConditionBuilderProps) {
  const [conditions, setConditions] = useState<RuleCondition[]>(
    initialConditions.length > 0 ? initialConditions : [{ field: '', operator: 'equals', value: '' }]
  );
  const [logic, setLogic] = useState<'and' | 'or'>(initialLogic);

  const handleAddCondition = useCallback(() => {
    setConditions((prev) => [...prev, { field: '', operator: 'equals', value: '' }]);
  }, []);

  const handleRemoveCondition = useCallback((index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConditionChange = useCallback(
    (index: number, field: keyof RuleCondition, value: string | number) => {
      setConditions((prev) =>
        prev.map((cond, i) => {
          if (i !== index) return cond;

          // When field changes, reset operator to a valid one for that field type
          if (field === 'field') {
            const fieldInfo = CONDITION_FIELDS.find((f) => f.field === value);
            const isNumeric = fieldInfo?.type === 'number';
            return {
              ...cond,
              field: value as string,
              operator: isNumeric ? 'greater_than' : 'equals',
              value: '',
            };
          }

          return { ...cond, [field]: value };
        })
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    // Filter out empty conditions
    const validConditions = conditions.filter(
      (c) => c.field && c.operator && c.value !== ''
    );
    onSave(validConditions, logic);
  }, [conditions, logic, onSave]);

  const getFieldType = (fieldName: string): 'string' | 'number' => {
    const field = CONDITION_FIELDS.find((f) => f.field === fieldName);
    return field?.type || 'string';
  };

  const getOperatorsForField = (fieldName: string) => {
    const fieldType = getFieldType(fieldName);
    return Object.entries(OPERATOR_INFO).filter(([_, info]) =>
      info.types.includes(fieldType)
    );
  };

  return (
    <div className="space-y-4">
      {/* Logic Toggle */}
      {conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Match</span>
          <Select value={logic} onValueChange={(v) => setLogic(v as 'and' | 'or')}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">ALL</SelectItem>
              <SelectItem value="or">ANY</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">conditions</span>
        </div>
      )}

      {/* Condition Rows */}
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* Field Selector */}
            <Select
              value={condition.field}
              onValueChange={(v) => handleConditionChange(index, 'field', v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_FIELDS.map((field) => (
                  <SelectItem key={field.field} value={field.field}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator Selector */}
            <Select
              value={condition.operator}
              onValueChange={(v) => handleConditionChange(index, 'operator', v)}
              disabled={!condition.field}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent>
                {getOperatorsForField(condition.field).map(([op, info]) => (
                  <SelectItem key={op} value={op}>
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Value Input */}
            <Input
              type={getFieldType(condition.field) === 'number' ? 'number' : 'text'}
              value={condition.value as string}
              onChange={(e) =>
                handleConditionChange(
                  index,
                  'value',
                  getFieldType(condition.field) === 'number'
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              placeholder="Value"
              className="w-[120px]"
              disabled={!condition.field}
            />

            {/* Hint for monetary fields */}
            {condition.field.includes('total') && (
              <span className="text-xs text-muted-foreground">(cents)</span>
            )}

            {/* Remove Button */}
            {conditions.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCondition(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Condition */}
      <Button variant="outline" size="sm" onClick={handleAddCondition} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Check className="h-4 w-4 mr-1" />
          Apply
        </Button>
      </div>
    </div>
  );
}
