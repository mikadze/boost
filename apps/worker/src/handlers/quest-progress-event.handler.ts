import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RawEventMessage } from '@boost/common';
import {
  QuestDefinitionRepository,
  QuestStepRepository,
  UserQuestProgressRepository,
  UserStepProgressRepository,
  EndUserRepository,
  LoyaltyLedgerRepository,
  QuestStep,
} from '@boost/database';
import { EventHandler } from './event-handler.interface';

/**
 * Quest Progress Event Handler
 *
 * Implements the Progress Processor logic for quest gamification:
 * 1. Listens for ANY user event (e.g., 'profile.bio_updated', 'avatar_uploaded')
 * 2. Finds active quests with steps matching the event name
 * 3. Auto-increments step progress counters
 * 4. Detects step completion when current_count >= required_count
 * 5. Calculates quest progress percentage
 * 6. Awards XP on quest completion
 * 7. Emits 'step.completed' and 'quest.completed' events to Kafka
 *
 * Note: This handler processes all events to check for quest progress.
 * Use getSupportedTypes() to return '*' pattern or implement a catch-all approach.
 */
@Injectable()
export class QuestProgressEventHandler implements EventHandler {
  private readonly logger = new Logger(QuestProgressEventHandler.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly questDefinitionRepository: QuestDefinitionRepository,
    private readonly questStepRepository: QuestStepRepository,
    private readonly userQuestProgressRepository: UserQuestProgressRepository,
    private readonly userStepProgressRepository: UserStepProgressRepository,
    private readonly endUserRepository: EndUserRepository,
    private readonly loyaltyLedgerRepository: LoyaltyLedgerRepository,
  ) {}

  /**
   * This handler processes events dynamically based on quest step configurations.
   * We return common event types but the actual matching happens at runtime.
   */
  getSupportedTypes(): string[] {
    // Return empty array - this handler will be called for ALL events
    // via a special check in the worker service
    return ['__quest_progress__'];
  }

  /**
   * Check if this event should trigger quest progress evaluation
   */
  async shouldHandle(event: RawEventMessage): Promise<boolean> {
    if (!event.userId) {
      return false;
    }

    // Check if there are any active quest steps matching this event
    const matchingSteps = await this.questStepRepository.findByEventName(
      event.projectId,
      event.event,
    );

    return matchingSteps.length > 0;
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Evaluating quest progress for event: ${event.event}`);

    const userId = event.userId;
    if (!userId) {
      this.logger.debug('No userId in event, skipping quest progress evaluation');
      return;
    }

    // Find the end user record
    const endUser = await this.endUserRepository.findByExternalId(event.projectId, userId);
    if (!endUser) {
      this.logger.debug(`End user ${userId} not found, skipping quest progress evaluation`);
      return;
    }

    // Find all active quest steps matching this event name
    const matchingSteps = await this.questStepRepository.findByEventName(
      event.projectId,
      event.event,
    );

    if (matchingSteps.length === 0) {
      this.logger.debug(`No quest steps match event: ${event.event}`);
      return;
    }

    this.logger.debug(`Found ${matchingSteps.length} quest steps matching event: ${event.event}`);

    // Process each matching step
    for (const step of matchingSteps) {
      await this.processStep(event, endUser.id, step);
    }
  }

  /**
   * Process a single quest step for the user
   */
  private async processStep(
    event: RawEventMessage,
    endUserId: string,
    step: QuestStep,
  ): Promise<void> {
    // Get or create user quest progress
    const questProgress = await this.userQuestProgressRepository.findOrCreate(
      event.projectId,
      endUserId,
      step.questId,
    );

    // Check if quest is already completed
    if (questProgress.status === 'completed') {
      this.logger.debug(`Quest ${step.questId} already completed for user, skipping`);
      return;
    }

    // Mark quest as in_progress if not started
    if (questProgress.status === 'not_started') {
      await this.userQuestProgressRepository.markInProgress(questProgress.id);
    }

    // Get or create user step progress
    const stepProgress = await this.userStepProgressRepository.findOrCreate(
      event.projectId,
      endUserId,
      step.id,
      questProgress.id,
    );

    // Check if step is already complete
    if (stepProgress.isComplete) {
      this.logger.debug(`Step ${step.id} already completed, skipping`);
      return;
    }

    // Increment the step count
    const updatedStepProgress = await this.userStepProgressRepository.incrementCount(stepProgress.id);
    if (!updatedStepProgress) {
      this.logger.warn(`Failed to increment step progress for step ${step.id}`);
      return;
    }

    this.logger.debug(
      `Step ${step.id} progress: ${updatedStepProgress.currentCount}/${step.requiredCount}`,
    );

    // Check if step is now complete
    if (updatedStepProgress.currentCount >= step.requiredCount) {
      await this.completeStep(event, endUserId, step, questProgress.id);
    } else {
      // Just update quest progress percentage
      await this.updateQuestProgress(questProgress.id);
    }
  }

  /**
   * Complete a step and check if quest is complete
   */
  private async completeStep(
    event: RawEventMessage,
    endUserId: string,
    step: QuestStep,
    questProgressId: string,
  ): Promise<void> {
    // Mark step as complete
    const stepProgress = await this.userStepProgressRepository.findByUserAndStep(endUserId, step.id);
    if (stepProgress && !stepProgress.isComplete) {
      await this.userStepProgressRepository.markComplete(stepProgress.id);

      this.logger.log(`Step ${step.id} completed for user in quest ${step.questId}`);

      // Emit step.completed event
      this.emitStepCompletedEvent(event, step);
    }

    // Update quest progress percentage
    await this.updateQuestProgress(questProgressId);

    // Check if all steps are complete
    const allStepsComplete = await this.areAllStepsComplete(questProgressId);
    if (allStepsComplete) {
      await this.completeQuest(event, endUserId, step.questId, questProgressId);
    }
  }

  /**
   * Update quest progress percentage based on completed steps
   */
  private async updateQuestProgress(questProgressId: string): Promise<void> {
    const questProgress = await this.userQuestProgressRepository.findById(questProgressId);
    if (!questProgress) return;

    // Get all steps for this quest
    const steps = await this.questStepRepository.findByQuestId(questProgress.questId);
    if (steps.length === 0) return;

    // Get step progress for this user
    const stepProgressList = await this.userStepProgressRepository.findByQuestProgressId(questProgressId);

    // Calculate weighted progress
    let totalProgress = 0;
    for (const step of steps) {
      const sp = stepProgressList.find(p => p.stepId === step.id);
      if (sp) {
        const stepPercentage = Math.min(sp.currentCount / step.requiredCount, 1);
        totalProgress += stepPercentage;
      }
    }

    const percentComplete = Math.round((totalProgress / steps.length) * 100);
    await this.userQuestProgressRepository.updatePercentComplete(questProgressId, percentComplete);
  }

  /**
   * Check if all steps in a quest are complete
   */
  private async areAllStepsComplete(questProgressId: string): Promise<boolean> {
    const stepProgressList = await this.userStepProgressRepository.findByQuestProgressId(questProgressId);
    if (stepProgressList.length === 0) return false;

    return stepProgressList.every(sp => sp.isComplete);
  }

  /**
   * Complete a quest and award rewards
   */
  private async completeQuest(
    event: RawEventMessage,
    endUserId: string,
    questId: string,
    questProgressId: string,
  ): Promise<void> {
    // Mark quest as complete
    await this.userQuestProgressRepository.markCompleted(questProgressId);

    // Get quest definition for rewards
    const quest = await this.questDefinitionRepository.findById(questId);
    if (!quest) {
      this.logger.warn(`Quest ${questId} not found`);
      return;
    }

    this.logger.log(`Quest "${quest.name}" completed for user ${event.userId}!`);

    // Award XP if configured
    if (quest.rewardXp && quest.rewardXp > 0) {
      await this.awardXp(event, endUserId, quest.rewardXp, questId, quest.name);
    }

    // Emit quest.completed event (Issue #29)
    this.emitQuestCompletedEvent(event, quest);
  }

  /**
   * Award XP to the user via loyalty ledger
   */
  private async awardXp(
    event: RawEventMessage,
    endUserId: string,
    xpAmount: number,
    questId: string,
    questName: string,
  ): Promise<void> {
    try {
      // addTransaction handles balance calculation internally
      await this.loyaltyLedgerRepository.addTransaction({
        projectId: event.projectId,
        endUserId,
        amount: xpAmount,
        type: 'earn',
        referenceId: questId,
        referenceType: 'quest_completion',
        description: `Completed quest: ${questName}`,
      });

      this.logger.log(`Awarded ${xpAmount} XP for quest completion: ${questName}`);
    } catch (error) {
      this.logger.error(`Failed to award XP: ${error}`);
    }
  }

  /**
   * Emit step.completed event to Kafka
   */
  private emitStepCompletedEvent(event: RawEventMessage, step: QuestStep): void {
    const stepCompletedEvent = {
      projectId: event.projectId,
      userId: event.userId,
      event: 'step.completed',
      properties: {
        questId: step.questId,
        stepId: step.id,
        eventName: step.eventName,
        stepTitle: step.title,
      },
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.kafkaClient.emit('raw-events', stepCompletedEvent);
    this.logger.debug('Emitted step.completed event to Kafka');
  }

  /**
   * Emit quest.completed event to Kafka (Issue #29)
   */
  private emitQuestCompletedEvent(
    event: RawEventMessage,
    quest: { id: string; name: string; rewardXp: number; rewardBadgeId: string | null },
  ): void {
    const questCompletedEvent = {
      projectId: event.projectId,
      userId: event.userId,
      event: 'quest.completed',
      properties: {
        questId: quest.id,
        questName: quest.name,
        rewardXp: quest.rewardXp,
        rewardBadgeId: quest.rewardBadgeId,
      },
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.kafkaClient.emit('raw-events', questCompletedEvent);
    this.logger.debug('Emitted quest.completed event to Kafka');
  }
}
