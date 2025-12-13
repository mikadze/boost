import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuestsService } from './quests.service';
import {
  QuestDefinitionRepository,
  QuestStepRepository,
  UserQuestProgressRepository,
  EndUserRepository,
} from '@boost/database';

describe('QuestsService', () => {
  let service: QuestsService;
  let questDefinitionRepository: jest.Mocked<QuestDefinitionRepository>;
  let questStepRepository: jest.Mocked<QuestStepRepository>;
  let userQuestProgressRepository: jest.Mocked<UserQuestProgressRepository>;
  let endUserRepository: jest.Mocked<EndUserRepository>;

  const mockQuest = {
    id: 'quest-1',
    projectId: 'project-1',
    name: 'Onboarding Quest',
    description: 'Complete your profile setup',
    rewardXp: 100,
    rewardBadgeId: 'badge-1',
    active: false,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestsService,
        {
          provide: QuestDefinitionRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByIdWithSteps: jest.fn(),
            findByProjectId: jest.fn(),
            findByProjectIdWithSteps: jest.fn(),
            findActiveByProjectId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            publish: jest.fn(),
            unpublish: jest.fn(),
          },
        },
        {
          provide: QuestStepRepository,
          useValue: {
            create: jest.fn(),
            createMany: jest.fn(),
            findById: jest.fn(),
            findByQuestId: jest.fn(),
            findByEventName: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: UserQuestProgressRepository,
          useValue: {
            findByUserAndQuest: jest.fn(),
            findByEndUserIdWithDetails: jest.fn(),
          },
        },
        {
          provide: EndUserRepository,
          useValue: {
            findByExternalId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuestsService>(QuestsService);
    questDefinitionRepository = module.get(QuestDefinitionRepository);
    questStepRepository = module.get(QuestStepRepository);
    userQuestProgressRepository = module.get(UserQuestProgressRepository);
    endUserRepository = module.get(EndUserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQuest', () => {
    it('should create a quest with steps', async () => {
      questDefinitionRepository.create.mockResolvedValue(mockQuest);
      questStepRepository.createMany.mockResolvedValue([mockStep]);

      const result = await service.createQuest('project-1', {
        name: 'Onboarding Quest',
        description: 'Complete your profile setup',
        rewardXp: 100,
        rewardBadgeId: 'badge-1',
        steps: [
          {
            eventName: 'profile.bio_updated',
            requiredCount: 1,
            title: 'Update your bio',
          },
        ],
      });

      expect(result.id).toBe('quest-1');
      expect(result.name).toBe('Onboarding Quest');
      expect(result.steps).toHaveLength(1);
      expect(questDefinitionRepository.create).toHaveBeenCalled();
      expect(questStepRepository.createMany).toHaveBeenCalled();
    });

    it('should create a quest without steps', async () => {
      questDefinitionRepository.create.mockResolvedValue(mockQuest);

      const result = await service.createQuest('project-1', {
        name: 'Onboarding Quest',
        description: 'Complete your profile setup',
      });

      expect(result.id).toBe('quest-1');
      expect(result.steps).toEqual([]);
      expect(questStepRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getQuest', () => {
    it('should return a quest with steps', async () => {
      questDefinitionRepository.findByIdWithSteps.mockResolvedValue({
        ...mockQuest,
        steps: [mockStep],
      });

      const result = await service.getQuest('project-1', 'quest-1');

      expect(result.id).toBe('quest-1');
      expect(result.steps).toHaveLength(1);
    });

    it('should throw NotFoundException if quest not found', async () => {
      questDefinitionRepository.findByIdWithSteps.mockResolvedValue(null);

      await expect(service.getQuest('project-1', 'quest-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if quest belongs to different project', async () => {
      questDefinitionRepository.findByIdWithSteps.mockResolvedValue({
        ...mockQuest,
        projectId: 'other-project',
        steps: [],
      });

      await expect(service.getQuest('project-1', 'quest-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('publishQuest', () => {
    it('should publish a quest with steps', async () => {
      questDefinitionRepository.findByIdWithSteps.mockResolvedValue({
        ...mockQuest,
        steps: [mockStep],
      });
      questDefinitionRepository.publish.mockResolvedValue({
        ...mockQuest,
        active: true,
      });

      const result = await service.publishQuest('project-1', 'quest-1');

      expect(result.active).toBe(true);
      expect(questDefinitionRepository.publish).toHaveBeenCalledWith('quest-1');
    });

    it('should throw BadRequestException if quest has no steps', async () => {
      questDefinitionRepository.findByIdWithSteps.mockResolvedValue({
        ...mockQuest,
        steps: [],
      });

      await expect(service.publishQuest('project-1', 'quest-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if quest not found', async () => {
      questDefinitionRepository.findByIdWithSteps.mockResolvedValue(null);

      await expect(service.publishQuest('project-1', 'quest-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteQuest', () => {
    it('should delete a quest', async () => {
      questDefinitionRepository.findById.mockResolvedValue(mockQuest);
      questDefinitionRepository.delete.mockResolvedValue(true);

      await service.deleteQuest('project-1', 'quest-1');

      expect(questDefinitionRepository.delete).toHaveBeenCalledWith('quest-1');
    });

    it('should throw NotFoundException if quest not found', async () => {
      questDefinitionRepository.findById.mockResolvedValue(null);

      await expect(service.deleteQuest('project-1', 'quest-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('addStep', () => {
    it('should add a step to a quest', async () => {
      questDefinitionRepository.findById.mockResolvedValue(mockQuest);
      questStepRepository.findByQuestId.mockResolvedValue([]);
      questStepRepository.create.mockResolvedValue(mockStep);

      const result = await service.addStep('project-1', 'quest-1', {
        eventName: 'profile.bio_updated',
        requiredCount: 1,
        title: 'Update your bio',
      });

      expect(result.id).toBe('step-1');
      expect(result.eventName).toBe('profile.bio_updated');
    });

    it('should throw NotFoundException if quest not found', async () => {
      questDefinitionRepository.findById.mockResolvedValue(null);

      await expect(service.addStep('project-1', 'quest-1', {
        eventName: 'profile.bio_updated',
      })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserQuests (SDK)', () => {
    it('should return quests with progress for existing user', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      userQuestProgressRepository.findByEndUserIdWithDetails.mockResolvedValue([
        {
          id: 'progress-1',
          projectId: 'project-1',
          endUserId: 'enduser-1',
          questId: 'quest-1',
          status: 'in_progress',
          percentComplete: 50,
          startedAt: new Date(),
          completedAt: null,
          metadata: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          quest: mockQuest,
          stepProgress: [
            {
              id: 'sp-1',
              projectId: 'project-1',
              endUserId: 'enduser-1',
              stepId: 'step-1',
              userQuestProgressId: 'progress-1',
              currentCount: 1,
              isComplete: true,
              completedAt: new Date(),
              metadata: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              step: mockStep,
            },
          ],
        },
      ]);
      questDefinitionRepository.findActiveByProjectId.mockResolvedValue([mockQuest]);
      questStepRepository.findByQuestId.mockResolvedValue([mockStep]);

      const result = await service.getUserQuests('project-1', 'user-1');

      expect(result.quests).toHaveLength(1);
      expect(result.quests[0].status).toBe('in_progress');
      expect(result.quests[0].percentComplete).toBe(50);
    });

    it('should return quests with no progress for new user', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(null);
      questDefinitionRepository.findActiveByProjectId.mockResolvedValue([mockQuest]);
      questStepRepository.findByQuestId.mockResolvedValue([mockStep]);

      const result = await service.getUserQuests('project-1', 'new-user');

      expect(result.quests).toHaveLength(1);
      expect(result.quests[0].status).toBe('not_started');
      expect(result.quests[0].percentComplete).toBe(0);
    });
  });
});
