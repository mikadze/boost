import { Test, TestingModule } from '@nestjs/testing';
import { QuestProgressEventHandler } from './quest-progress-event.handler';
import { ClientKafka } from '@nestjs/microservices';
import {
  QuestDefinitionRepository,
  QuestStepRepository,
  UserQuestProgressRepository,
  UserStepProgressRepository,
  EndUserRepository,
  LoyaltyLedgerRepository,
} from '@boost/database';

describe('QuestProgressEventHandler', () => {
  let handler: QuestProgressEventHandler;
  let kafkaClient: jest.Mocked<ClientKafka>;
  let questDefinitionRepository: jest.Mocked<QuestDefinitionRepository>;
  let questStepRepository: jest.Mocked<QuestStepRepository>;
  let userQuestProgressRepository: jest.Mocked<UserQuestProgressRepository>;
  let userStepProgressRepository: jest.Mocked<UserStepProgressRepository>;
  let endUserRepository: jest.Mocked<EndUserRepository>;
  let loyaltyLedgerRepository: jest.Mocked<LoyaltyLedgerRepository>;

  const mockEndUser = {
    id: 'enduser-1',
    projectId: 'project-1',
    externalId: 'user-1',
    metadata: null,
    loyaltyPoints: 0,
    tierId: null,
    commissionPlanId: null,
    referralCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuest = {
    id: 'quest-1',
    projectId: 'project-1',
    name: 'Onboarding Quest',
    description: 'Complete your profile setup',
    rewardXp: 100,
    rewardBadgeId: 'badge-1',
    active: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStep = {
    id: 'step-1',
    questId: 'quest-1',
    projectId: 'project-1',
    eventName: 'profile.bio_updated',
    requiredCount: 1,
    orderIndex: 0,
    title: 'Update your bio',
    description: 'Tell us about yourself',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQuestProgress = {
    id: 'progress-1',
    projectId: 'project-1',
    endUserId: 'enduser-1',
    questId: 'quest-1',
    status: 'not_started' as const,
    percentComplete: 0,
    startedAt: null,
    completedAt: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStepProgress = {
    id: 'sp-1',
    projectId: 'project-1',
    endUserId: 'enduser-1',
    stepId: 'step-1',
    userQuestProgressId: 'progress-1',
    currentCount: 0,
    isComplete: false,
    completedAt: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestProgressEventHandler,
        {
          provide: 'KAFKA_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: QuestDefinitionRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: QuestStepRepository,
          useValue: {
            findByEventName: jest.fn(),
            findByQuestId: jest.fn(),
          },
        },
        {
          provide: UserQuestProgressRepository,
          useValue: {
            findById: jest.fn(),
            findByUserAndQuest: jest.fn(),
            findOrCreate: jest.fn(),
            markInProgress: jest.fn(),
            markCompleted: jest.fn(),
            updatePercentComplete: jest.fn(),
          },
        },
        {
          provide: UserStepProgressRepository,
          useValue: {
            findById: jest.fn(),
            findByUserAndStep: jest.fn(),
            findByQuestProgressId: jest.fn(),
            findOrCreate: jest.fn(),
            incrementCount: jest.fn(),
            markComplete: jest.fn(),
          },
        },
        {
          provide: EndUserRepository,
          useValue: {
            findByExternalId: jest.fn(),
          },
        },
        {
          provide: LoyaltyLedgerRepository,
          useValue: {
            addTransaction: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<QuestProgressEventHandler>(QuestProgressEventHandler);
    kafkaClient = module.get('KAFKA_SERVICE');
    questDefinitionRepository = module.get(QuestDefinitionRepository);
    questStepRepository = module.get(QuestStepRepository);
    userQuestProgressRepository = module.get(UserQuestProgressRepository);
    userStepProgressRepository = module.get(UserStepProgressRepository);
    endUserRepository = module.get(EndUserRepository);
    loyaltyLedgerRepository = module.get(LoyaltyLedgerRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('shouldHandle', () => {
    it('should return true when matching steps exist', async () => {
      questStepRepository.findByEventName.mockResolvedValue([mockStep]);

      const result = await handler.shouldHandle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(result).toBe(true);
    });

    it('should return false when no matching steps', async () => {
      questStepRepository.findByEventName.mockResolvedValue([]);

      const result = await handler.shouldHandle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'some_other_event',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(result).toBe(false);
    });

    it('should return false when no userId', async () => {
      const result = await handler.shouldHandle({
        projectId: 'project-1',
        userId: undefined as unknown as string,
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(result).toBe(false);
    });
  });

  describe('handle', () => {
    it('should increment step progress on matching event', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      questStepRepository.findByEventName.mockResolvedValue([mockStep]);
      userQuestProgressRepository.findOrCreate.mockResolvedValue(mockQuestProgress);
      userStepProgressRepository.findOrCreate.mockResolvedValue(mockStepProgress);
      userStepProgressRepository.incrementCount.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1,
      });
      questStepRepository.findByQuestId.mockResolvedValue([mockStep]);
      userStepProgressRepository.findByQuestProgressId.mockResolvedValue([{
        ...mockStepProgress,
        currentCount: 1,
      }]);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(userStepProgressRepository.incrementCount).toHaveBeenCalledWith('sp-1');
    });

    it('should mark step complete when count reaches required', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      questStepRepository.findByEventName.mockResolvedValue([mockStep]);
      userQuestProgressRepository.findOrCreate.mockResolvedValue({
        ...mockQuestProgress,
        status: 'in_progress',
      });
      userStepProgressRepository.findOrCreate.mockResolvedValue(mockStepProgress);
      userStepProgressRepository.incrementCount.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1, // Now equals requiredCount
      });
      userStepProgressRepository.findByUserAndStep.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1,
        isComplete: false,
      });
      userStepProgressRepository.markComplete.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1,
        isComplete: true,
      });
      questStepRepository.findByQuestId.mockResolvedValue([mockStep]);
      userStepProgressRepository.findByQuestProgressId.mockResolvedValue([{
        ...mockStepProgress,
        currentCount: 1,
        isComplete: true,
      }]);

      // Mock quest completion check - only one step, now complete
      userQuestProgressRepository.findById.mockResolvedValue(mockQuestProgress);
      questDefinitionRepository.findById.mockResolvedValue(mockQuest);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(userStepProgressRepository.markComplete).toHaveBeenCalledWith('sp-1');
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'step.completed',
        })
      );
    });

    it('should mark quest complete when all steps done', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      questStepRepository.findByEventName.mockResolvedValue([mockStep]);
      userQuestProgressRepository.findOrCreate.mockResolvedValue({
        ...mockQuestProgress,
        status: 'in_progress',
      });
      userStepProgressRepository.findOrCreate.mockResolvedValue(mockStepProgress);
      userStepProgressRepository.incrementCount.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1,
      });
      userStepProgressRepository.findByUserAndStep.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1,
        isComplete: false,
      });
      userStepProgressRepository.markComplete.mockResolvedValue({
        ...mockStepProgress,
        isComplete: true,
      });
      questStepRepository.findByQuestId.mockResolvedValue([mockStep]);

      // All steps complete
      userStepProgressRepository.findByQuestProgressId.mockResolvedValue([{
        ...mockStepProgress,
        isComplete: true,
      }]);

      userQuestProgressRepository.findById.mockResolvedValue(mockQuestProgress);
      userQuestProgressRepository.markCompleted.mockResolvedValue({
        ...mockQuestProgress,
        status: 'completed',
        percentComplete: 100,
      });
      questDefinitionRepository.findById.mockResolvedValue(mockQuest);
      loyaltyLedgerRepository.addTransaction.mockResolvedValue(undefined as any);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(userQuestProgressRepository.markCompleted).toHaveBeenCalledWith('progress-1');
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'quest.completed',
        })
      );
    });

    it('should skip if userId is missing', async () => {
      await handler.handle({
        projectId: 'project-1',
        userId: undefined as unknown as string,
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(endUserRepository.findByExternalId).not.toHaveBeenCalled();
    });

    it('should skip if end user not found', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(null);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(questStepRepository.findByEventName).not.toHaveBeenCalled();
    });

    it('should skip if quest already completed', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      questStepRepository.findByEventName.mockResolvedValue([mockStep]);
      userQuestProgressRepository.findOrCreate.mockResolvedValue({
        ...mockQuestProgress,
        status: 'completed',
      });

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(userStepProgressRepository.incrementCount).not.toHaveBeenCalled();
    });

    it('should skip step if already complete', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      questStepRepository.findByEventName.mockResolvedValue([mockStep]);
      userQuestProgressRepository.findOrCreate.mockResolvedValue({
        ...mockQuestProgress,
        status: 'in_progress',
      });
      userStepProgressRepository.findOrCreate.mockResolvedValue({
        ...mockStepProgress,
        isComplete: true,
      });

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(userStepProgressRepository.incrementCount).not.toHaveBeenCalled();
    });

    it('should award XP on quest completion', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      questStepRepository.findByEventName.mockResolvedValue([mockStep]);
      userQuestProgressRepository.findOrCreate.mockResolvedValue({
        ...mockQuestProgress,
        status: 'in_progress',
      });
      userStepProgressRepository.findOrCreate.mockResolvedValue(mockStepProgress);
      userStepProgressRepository.incrementCount.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1,
      });
      userStepProgressRepository.findByUserAndStep.mockResolvedValue({
        ...mockStepProgress,
        currentCount: 1,
        isComplete: false,
      });
      userStepProgressRepository.markComplete.mockResolvedValue({
        ...mockStepProgress,
        isComplete: true,
      });
      questStepRepository.findByQuestId.mockResolvedValue([mockStep]);
      userStepProgressRepository.findByQuestProgressId.mockResolvedValue([{
        ...mockStepProgress,
        isComplete: true,
      }]);
      userQuestProgressRepository.findById.mockResolvedValue(mockQuestProgress);
      userQuestProgressRepository.markCompleted.mockResolvedValue({
        ...mockQuestProgress,
        status: 'completed',
      });
      questDefinitionRepository.findById.mockResolvedValue(mockQuest);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'profile.bio_updated',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(loyaltyLedgerRepository.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100, // Quest rewardXp
          type: 'earn',
          referenceType: 'quest_completion',
        })
      );
    });
  });
});
