import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeneratedRule {
  name: string;
  description?: string;
  eventTypes: string[];
  conditions: {
    logic: 'and' | 'or';
    conditions: Array<{
      field: string;
      operator: string;
      value: unknown;
    }>;
  };
  effects: Array<{
    type: string;
    params: Record<string, unknown>;
  }>;
}

interface GenerateRuleRequest {
  prompt: string;
  context?: {
    campaignName?: string;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.model = this.configService.get<string>('OPENROUTER_MODEL') || 'anthropic/claude-3-haiku';
    this.maxTokens = parseInt(this.configService.get<string>('OPENROUTER_MAX_TOKENS') || '1024', 10);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async generateRule(request: GenerateRuleRequest): Promise<{ rule: GeneratedRule } | { error: string }> {
    if (!this.apiKey) {
      this.logger.error('OPENROUTER_API_KEY is not set');
      return { error: 'AI service is temporarily unavailable. Please try again later.' };
    }

    const sanitizedPrompt = request.prompt.trim().slice(0, 1000);
    this.logger.log(`Generating rule with model: ${this.model}`);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://boost.dev',
          'X-Title': 'Boost Automation Wizard',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(),
            },
            {
              role: 'user',
              content: this.getUserPrompt(sanitizedPrompt, request.context),
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter API error: ${response.status} ${errorText}`);
        return { error: 'AI service encountered an error. Please try again.' };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return { error: 'No response from AI service.' };
      }

      const rule = this.parseResponse(content);
      if (!rule) {
        this.logger.error(`Failed to parse response: ${content.slice(0, 500)}`);
        return { error: 'Could not understand the AI response. Please try rephrasing your request.' };
      }

      // Sanitize to remove any extra fields the AI might have added
      const sanitizedRule = this.sanitizeRule(rule);
      return { rule: sanitizedRule };
    } catch (error) {
      this.logger.error('Request failed:', error);
      return { error: 'Unable to connect to AI service. Please check your connection and try again.' };
    }
  }

  private getSystemPrompt(): string {
    return `You are an automation rule generator for a loyalty and gamification platform. Generate rules in JSON format based on user descriptions.

Available event types:
- purchase: When a customer makes a purchase
- signup: When a new user signs up
- login: When a user logs in
- page_view: When a user views a page
- form_submit: When a user submits a form
- checkout_start: When checkout begins
- $profile_update: When user profile is updated

Available operators:
- equals, not_equals
- greater_than, greater_than_or_equal
- less_than, less_than_or_equal
- contains, not_contains
- starts_with, ends_with
- in, not_in
- exists, not_exists

Available effect types:
- add_loyalty_points: Award points (params: { amount: number })
- apply_discount: Apply discount (params: { type: "percentage" | "fixed", value: number })
- upgrade_tier: Upgrade user tier (params: { tier: string })
- send_notification: Send notification (params: { title: string, message: string })
- free_shipping: Enable free shipping (params: {})

Respond ONLY with valid JSON in this EXACT format (no extra fields):
{
  "name": "Rule name",
  "description": "Rule description",
  "eventTypes": ["event_type"],
  "conditions": {
    "logic": "and",
    "conditions": [
      { "field": "field.path", "operator": "operator", "value": value }
    ]
  },
  "effects": [
    { "type": "effect_type", "params": { ... } }
  ]
}

IMPORTANT:
- Each condition object must have EXACTLY three fields: "field", "operator", "value" (no other fields)
- Each effect object must have EXACTLY two fields: "type", "params"
- Monetary values should be in cents (e.g., $100 = 10000)
- Keep rules simple and focused
- Always include at least one event type and one effect`;
  }

  private getUserPrompt(prompt: string, context?: { campaignName?: string }): string {
    let userPrompt = `Create an automation rule for: "${prompt}"`;
    if (context?.campaignName) {
      userPrompt += `\n\nThis rule is for the campaign: "${context.campaignName}"`;
    }
    return userPrompt;
  }

  private parseResponse(text: string): GeneratedRule | null {
    // Try direct parse first
    try {
      const parsed = JSON.parse(text);
      if (this.validateRule(parsed)) return parsed;
    } catch {
      // Continue to fallback parsing
    }

    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (this.validateRule(parsed)) return parsed;
      } catch {
        // Continue
      }
    }

    // Try to find JSON object in text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]);
        if (this.validateRule(parsed)) return parsed;
      } catch {
        // Failed to parse
      }
    }

    return null;
  }

  private validateRule(rule: unknown): rule is GeneratedRule {
    if (!rule || typeof rule !== 'object') return false;

    const r = rule as Record<string, unknown>;

    if (typeof r.name !== 'string' || r.name.length === 0) return false;
    if (!Array.isArray(r.eventTypes) || r.eventTypes.length === 0) return false;
    if (!r.conditions || typeof r.conditions !== 'object') return false;
    if (!Array.isArray(r.effects) || r.effects.length === 0) return false;

    const conditions = r.conditions as Record<string, unknown>;
    if (!['and', 'or'].includes(conditions.logic as string)) return false;
    if (!Array.isArray(conditions.conditions)) return false;

    return true;
  }

  /**
   * Sanitize the rule to remove any extra fields that the AI might have added
   * This ensures the rule matches the exact schema expected by the backend DTO
   */
  private sanitizeRule(rule: GeneratedRule): GeneratedRule {
    return {
      name: rule.name,
      description: rule.description,
      eventTypes: rule.eventTypes,
      conditions: {
        logic: rule.conditions.logic,
        conditions: rule.conditions.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
        })),
      },
      effects: rule.effects.map((e) => ({
        type: e.type,
        params: e.params,
      })),
    };
  }
}
