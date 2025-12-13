import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  QuestDefinitionRepository,
  QuestStepRepository,
  UserQuestProgressRepository,
  EndUserRepository,
  QuestDefinition,
  QuestStep,
  QuestDefinitionWithSteps,
  UserQuestProgressWithDetails,
} from '@boost/database';
import {
  CreateQuestDto,
  UpdateQuestDto,
  CreateQuestStepDto,
  UpdateQuestStepDto,
} from './dto/quest.dto';

@Injectable()
export class QuestsService {
  private readonly logger = new Logger(QuestsService.name);

  constructor(
    private readonly questDefinitionRepository: QuestDefinitionRepository,
    private readonly questStepRepository: QuestStepRepository,
    private readonly userQuestProgressRepository: UserQuestProgressRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  // ============================================
  // Quest CRUD Operations
  // ============================================

  async createQuest(projectId: string, dto: CreateQuestDto): Promise<QuestDefinitionWithSteps> {
    this.logger.log(`Creating quest: ${dto.name} for project: ${projectId}`);

    // Create the quest definition
    const quest = await this.questDefinitionRepository.create({
      projectId,
      name: dto.name,
      description: dto.description,
      rewardXp: dto.rewardXp ?? 0,
      rewardBadgeId: dto.rewardBadgeId,
      active: dto.active ?? false,
      metadata: dto.metadata,
    });

    // Create steps if provided
    let steps: QuestStep[] = [];
    if (dto.steps && dto.steps.length > 0) {
      steps = await this.questStepRepository.createMany(
        dto.steps.map((step, index) => ({
          questId: quest.id,
          projectId,
          eventName: step.eventName,
          requiredCount: step.requiredCount ?? 1,
          orderIndex: step.orderIndex ?? index,
          title: step.title,
          description: step.description,
          metadata: step.metadata,
        })),
      );
    }

    return { ...quest, steps };
  }

  async listQuests(projectId: string): Promise<QuestDefinitionWithSteps[]> {
    return this.questDefinitionRepository.findByProjectIdWithSteps(projectId);
  }

  async listActiveQuests(projectId: string): Promise<QuestDefinition[]> {
    return this.questDefinitionRepository.findActiveByProjectId(projectId);
  }

  async getQuest(projectId: string, questId: string): Promise<QuestDefinitionWithSteps> {
    const quest = await this.questDefinitionRepository.findByIdWithSteps(questId);

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    if (quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    return quest;
  }

  async updateQuest(
    projectId: string,
    questId: string,
    dto: UpdateQuestDto,
  ): Promise<QuestDefinition> {
    const quest = await this.questDefinitionRepository.findById(questId);

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    if (quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    const updated = await this.questDefinitionRepository.update(questId, dto);
    if (!updated) {
      throw new Error('Failed to update quest');
    }

    return updated;
  }

  async deleteQuest(projectId: string, questId: string): Promise<void> {
    const quest = await this.questDefinitionRepository.findById(questId);

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    if (quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    await this.questDefinitionRepository.delete(questId);
    this.logger.log(`Deleted quest: ${questId}`);
  }

  async publishQuest(projectId: string, questId: string): Promise<QuestDefinition> {
    const quest = await this.questDefinitionRepository.findByIdWithSteps(questId);

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    if (quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    // Require at least one step to publish
    if (!quest.steps || quest.steps.length === 0) {
      throw new BadRequestException('Cannot publish a quest without steps');
    }

    const published = await this.questDefinitionRepository.publish(questId);
    if (!published) {
      throw new Error('Failed to publish quest');
    }

    this.logger.log(`Published quest: ${questId}`);
    return published;
  }

  async unpublishQuest(projectId: string, questId: string): Promise<QuestDefinition> {
    const quest = await this.questDefinitionRepository.findById(questId);

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    if (quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    const unpublished = await this.questDefinitionRepository.unpublish(questId);
    if (!unpublished) {
      throw new Error('Failed to unpublish quest');
    }

    this.logger.log(`Unpublished quest: ${questId}`);
    return unpublished;
  }

  // ============================================
  // Quest Step CRUD Operations
  // ============================================

  async addStep(
    projectId: string,
    questId: string,
    dto: CreateQuestStepDto,
  ): Promise<QuestStep> {
    const quest = await this.questDefinitionRepository.findById(questId);

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    if (quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    // Get existing steps to determine order index
    const existingSteps = await this.questStepRepository.findByQuestId(questId);
    const maxOrderIndex = existingSteps.reduce((max, step) => Math.max(max, step.orderIndex), -1);

    const step = await this.questStepRepository.create({
      questId,
      projectId,
      eventName: dto.eventName,
      requiredCount: dto.requiredCount ?? 1,
      orderIndex: dto.orderIndex ?? maxOrderIndex + 1,
      title: dto.title,
      description: dto.description,
      metadata: dto.metadata,
    });

    this.logger.log(`Added step to quest ${questId}: ${step.id}`);
    return step;
  }

  async updateStep(
    projectId: string,
    questId: string,
    stepId: string,
    dto: UpdateQuestStepDto,
  ): Promise<QuestStep> {
    const step = await this.questStepRepository.findById(stepId);

    if (!step) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }

    if (step.projectId !== projectId || step.questId !== questId) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }

    const updated = await this.questStepRepository.update(stepId, dto);
    if (!updated) {
      throw new Error('Failed to update step');
    }

    return updated;
  }

  async deleteStep(projectId: string, questId: string, stepId: string): Promise<void> {
    const step = await this.questStepRepository.findById(stepId);

    if (!step) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }

    if (step.projectId !== projectId || step.questId !== questId) {
      throw new NotFoundException(`Step ${stepId} not found`);
    }

    await this.questStepRepository.delete(stepId);
    this.logger.log(`Deleted step ${stepId} from quest ${questId}`);
  }

  async getSteps(projectId: string, questId: string): Promise<QuestStep[]> {
    const quest = await this.questDefinitionRepository.findById(questId);

    if (!quest) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    if (quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    return this.questStepRepository.findByQuestId(questId);
  }

  // ============================================
  // Utility Methods
  // ============================================

  async getDistinctEventNames(projectId: string): Promise<string[]> {
    // This would typically query the events table for distinct event types
    // For now, return an empty array - can be enhanced later
    return [];
  }

  // ============================================
  // SDK/Customer Methods (Issue #28)
  // ============================================

  /**
   * Get all active quests with user progress for SDK QuestWidget
   */
  async getUserQuests(projectId: string, userId: string): Promise<{
    quests: Array<{
      id: string;
      name: string;
      description: string | null;
      rewardXp: number;
      rewardBadgeId: string | null;
      status: string;
      percentComplete: number;
      steps: Array<{
        id: string;
        title: string | null;
        description: string | null;
        eventName: string;
        requiredCount: number;
        currentCount: number;
        isComplete: boolean;
      }>;
    }>;
  }> {
    // Find the end user
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);
    if (!endUser) {
      // Return empty quests list if user doesn't exist yet
      const activeQuests = await this.questDefinitionRepository.findActiveByProjectId(projectId);
      return {
        quests: await Promise.all(activeQuests.map(async (quest) => {
          const steps = await this.questStepRepository.findByQuestId(quest.id);
          return {
            id: quest.id,
            name: quest.name,
            description: quest.description,
            rewardXp: quest.rewardXp,
            rewardBadgeId: quest.rewardBadgeId,
            status: 'not_started',
            percentComplete: 0,
            steps: steps.map(step => ({
              id: step.id,
              title: step.title,
              description: step.description,
              eventName: step.eventName,
              requiredCount: step.requiredCount,
              currentCount: 0,
              isComplete: false,
            })),
          };
        })),
      };
    }

    // Get user progress with details
    const progressList = await this.userQuestProgressRepository.findByEndUserIdWithDetails(endUser.id);

    // Get all active quests
    const activeQuests = await this.questDefinitionRepository.findActiveByProjectId(projectId);

    // Combine quests with progress
    const quests = await Promise.all(activeQuests.map(async (quest) => {
      const progress = progressList.find(p => p.questId === quest.id);
      const steps = await this.questStepRepository.findByQuestId(quest.id);

      if (progress) {
        return {
          id: quest.id,
          name: quest.name,
          description: quest.description,
          rewardXp: quest.rewardXp,
          rewardBadgeId: quest.rewardBadgeId,
          status: progress.status,
          percentComplete: progress.percentComplete,
          steps: steps.map(step => {
            const stepProgress = progress.stepProgress.find(sp => sp.stepId === step.id);
            return {
              id: step.id,
              title: step.title,
              description: step.description,
              eventName: step.eventName,
              requiredCount: step.requiredCount,
              currentCount: stepProgress?.currentCount ?? 0,
              isComplete: stepProgress?.isComplete ?? false,
            };
          }),
        };
      }

      // No progress yet
      return {
        id: quest.id,
        name: quest.name,
        description: quest.description,
        rewardXp: quest.rewardXp,
        rewardBadgeId: quest.rewardBadgeId,
        status: 'not_started',
        percentComplete: 0,
        steps: steps.map(step => ({
          id: step.id,
          title: step.title,
          description: step.description,
          eventName: step.eventName,
          requiredCount: step.requiredCount,
          currentCount: 0,
          isComplete: false,
        })),
      };
    }));

    return { quests };
  }

  /**
   * Get progress for a specific quest
   */
  async getUserQuestProgress(projectId: string, userId: string, questId: string): Promise<{
    id: string;
    name: string;
    description: string | null;
    rewardXp: number;
    rewardBadgeId: string | null;
    status: string;
    percentComplete: number;
    steps: Array<{
      id: string;
      title: string | null;
      description: string | null;
      eventName: string;
      requiredCount: number;
      currentCount: number;
      isComplete: boolean;
    }>;
  }> {
    // Verify quest exists and is active
    const quest = await this.questDefinitionRepository.findById(questId);
    if (!quest || quest.projectId !== projectId) {
      throw new NotFoundException(`Quest ${questId} not found`);
    }

    const steps = await this.questStepRepository.findByQuestId(questId);

    // Find end user
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);
    if (!endUser) {
      return {
        id: quest.id,
        name: quest.name,
        description: quest.description,
        rewardXp: quest.rewardXp,
        rewardBadgeId: quest.rewardBadgeId,
        status: 'not_started',
        percentComplete: 0,
        steps: steps.map(step => ({
          id: step.id,
          title: step.title,
          description: step.description,
          eventName: step.eventName,
          requiredCount: step.requiredCount,
          currentCount: 0,
          isComplete: false,
        })),
      };
    }

    // Get progress
    const progress = await this.userQuestProgressRepository.findByUserAndQuest(endUser.id, questId);

    if (!progress) {
      return {
        id: quest.id,
        name: quest.name,
        description: quest.description,
        rewardXp: quest.rewardXp,
        rewardBadgeId: quest.rewardBadgeId,
        status: 'not_started',
        percentComplete: 0,
        steps: steps.map(step => ({
          id: step.id,
          title: step.title,
          description: step.description,
          eventName: step.eventName,
          requiredCount: step.requiredCount,
          currentCount: 0,
          isComplete: false,
        })),
      };
    }

    // Get detailed progress with step info
    const progressList = await this.userQuestProgressRepository.findByEndUserIdWithDetails(endUser.id);
    const detailedProgress = progressList.find(p => p.questId === questId);

    return {
      id: quest.id,
      name: quest.name,
      description: quest.description,
      rewardXp: quest.rewardXp,
      rewardBadgeId: quest.rewardBadgeId,
      status: progress.status,
      percentComplete: progress.percentComplete,
      steps: steps.map(step => {
        const stepProgress = detailedProgress?.stepProgress.find(sp => sp.stepId === step.id);
        return {
          id: step.id,
          title: step.title,
          description: step.description,
          eventName: step.eventName,
          requiredCount: step.requiredCount,
          currentCount: stepProgress?.currentCount ?? 0,
          isComplete: stepProgress?.isComplete ?? false,
        };
      }),
    };
  }
}
