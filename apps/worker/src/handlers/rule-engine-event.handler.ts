import { Injectable, Logger } from '@nestjs/common';
import { RawEventMessage } from '@boost/common';
import { EventHandler } from './event-handler.interface';
import { RuleEngineService } from '../engine/rule-engine.service';
import { EffectExecutorService } from '../engine/effect-executor.service';

/**
 * Event handler that evaluates rules and executes effects
 * This handler runs for ALL events to evaluate gamification rules
 */
@Injectable()
export class RuleEngineEventHandler implements EventHandler {
  private readonly logger = new Logger(RuleEngineEventHandler.name);

  constructor(
    private readonly ruleEngine: RuleEngineService,
    private readonly effectExecutor: EffectExecutorService,
  ) {}

  /**
   * This handler processes all event types
   * Return empty array to indicate it should be called for all events
   */
  getSupportedTypes(): string[] {
    return []; // Empty = matches all events
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Processing event through rule engine: ${event.event}`);

    try {
      // Evaluate rules
      const matchedRules = await this.ruleEngine.evaluate(event);

      if (matchedRules.length === 0) {
        this.logger.debug('No rules matched');
        return;
      }

      this.logger.log(
        `${matchedRules.length} rules matched for event ${event.event}`,
      );

      // Execute effects
      const results = await this.effectExecutor.executeEffects(event, matchedRules);

      // Log results
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      this.logger.log(
        `Effect execution complete: ${successful} successful, ${failed} failed`,
      );

      if (failed > 0) {
        const errors = results
          .filter((r) => !r.success)
          .map((r) => `${r.effectType}: ${r.error}`)
          .join(', ');
        this.logger.warn(`Failed effects: ${errors}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Rule engine error for event ${event.event}: ${errorMessage}`,
      );
      throw error;
    }
  }
}
