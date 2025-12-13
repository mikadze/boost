import { Test, TestingModule } from '@nestjs/testing';
import { ClientKafka } from '@nestjs/microservices';
import { BadgeEventHandler } from './badge-event.handler';
import {
  BadgeDefinitionRepository,
  UserBadgeRepository,
  EndUserRepository,
} from '@boost/database';

describe('BadgeEventHandler', () => {
  let handler: BadgeEventHandler;
  let badgeDefinitionRepository: jest.Mocked<BadgeDefinitionRepository>;
  let userBadgeRepository: jest.Mocked<UserBadgeRepository>;
  let endUserRepository: jest.Mocked<EndUserRepository>;
  let kafkaClient: jest.Mocked<ClientKafka>;

  const mockBadge = {
    id: 'badge-1',
    projectId: 'project-1',
    name: 'First Purchase',
    description: 'Made your first purchase',
    iconUrl: 'https://example.com/icon.png',
    imageUrl: 'https://example.com/image.png',
    rarity: 'COMMON',
    visibility: 'PUBLIC',
    category: 'shopping',
    ruleType: 'METRIC_THRESHOLD',
    triggerMetric: 'purchase',
    threshold: 1,
    active: true,
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

  const mockUserBadge = {
    id: 'user-badge-1',
    projectId: 'project-1',
    endUserId: 'enduser-1',
    badgeId: 'badge-1',
    unlockedAt: new Date(),
    metadata: null,
    awardSource: 'AUTOMATIC',
    awardedBy: null,
    createdAt: new Date(),
  };

  const mockEvent = {
    projectId: 'project-1',
    userId: 'user-1',
    event: 'purchase.completed',
    properties: { amount: 100 },
    timestamp: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgeEventHandler,
        {
          provide: BadgeDefinitionRepository,
          useValue: {
            findByTriggerMetric: jest.fn(),
          },
        },
        {
          provide: UserBadgeRepository,
          useValue: {
            hasBadge: jest.fn(),
            awardBadge: jest.fn(),
          },
        },
        {
          provide: EndUserRepository,
          useValue: {
            findByExternalId: jest.fn(),
          },
        },
        {
          provide: 'KAFKA_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<BadgeEventHandler>(BadgeEventHandler);
    badgeDefinitionRepository = module.get(BadgeDefinitionRepository);
    userBadgeRepository = module.get(UserBadgeRepository);
    endUserRepository = module.get(EndUserRepository);
    kafkaClient = module.get('KAFKA_SERVICE');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('getSupportedTypes', () => {
    it('should return badge evaluation marker', () => {
      const types = handler.getSupportedTypes();
      expect(types).toContain('__badge_evaluation__');
    });
  });

  describe('shouldHandle', () => {
    it('should return true if there are matching badges', async () => {
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([mockBadge]);

      const result = await handler.shouldHandle(mockEvent);

      expect(result).toBe(true);
      expect(badgeDefinitionRepository.findByTriggerMetric).toHaveBeenCalledWith(
        'project-1',
        'purchase',
      );
    });

    it('should return false if no matching badges', async () => {
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([]);

      const result = await handler.shouldHandle(mockEvent);

      expect(result).toBe(false);
    });

    it('should return false if event has no userId', async () => {
      const eventWithoutUser = { ...mockEvent, userId: '' };

      const result = await handler.shouldHandle(eventWithoutUser);

      expect(result).toBe(false);
    });
  });

  describe('handle', () => {
    it('should award badge when threshold is met', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([mockBadge]);
      userBadgeRepository.hasBadge.mockResolvedValue(false);
      userBadgeRepository.awardBadge.mockResolvedValue(mockUserBadge);

      await handler.handle({
        ...mockEvent,
        properties: { count: 1 },
      });

      expect(userBadgeRepository.awardBadge).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          endUserId: 'enduser-1',
          badgeId: 'badge-1',
          awardSource: 'AUTOMATIC',
        }),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'badge.unlocked',
        }),
      );
    });

    it('should not award badge if user already has it', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([mockBadge]);
      userBadgeRepository.hasBadge.mockResolvedValue(true);

      await handler.handle(mockEvent);

      expect(userBadgeRepository.awardBadge).not.toHaveBeenCalled();
    });

    it('should not award badge if threshold not met', async () => {
      const highThresholdBadge = { ...mockBadge, threshold: 100 };
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([highThresholdBadge]);
      userBadgeRepository.hasBadge.mockResolvedValue(false);

      await handler.handle({
        ...mockEvent,
        properties: { count: 10 },
      });

      expect(userBadgeRepository.awardBadge).not.toHaveBeenCalled();
    });

    it('should skip if user not found', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(null);
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([mockBadge]);

      await handler.handle(mockEvent);

      expect(userBadgeRepository.awardBadge).not.toHaveBeenCalled();
    });

    it('should skip manual badges', async () => {
      const manualBadge = { ...mockBadge, ruleType: 'MANUAL' };
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([manualBadge]);
      userBadgeRepository.hasBadge.mockResolvedValue(false);

      await handler.handle(mockEvent);

      expect(userBadgeRepository.awardBadge).not.toHaveBeenCalled();
    });

    it('should process multiple matching badges', async () => {
      const secondBadge = { ...mockBadge, id: 'badge-2', name: 'Big Spender' };
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([
        mockBadge,
        secondBadge,
      ]);
      userBadgeRepository.hasBadge.mockResolvedValue(false);
      userBadgeRepository.awardBadge.mockResolvedValue(mockUserBadge);

      await handler.handle({
        ...mockEvent,
        properties: { count: 1 },
      });

      expect(userBadgeRepository.awardBadge).toHaveBeenCalledTimes(2);
    });

    it('should use default count of 1 when no count property', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      badgeDefinitionRepository.findByTriggerMetric.mockResolvedValue([mockBadge]);
      userBadgeRepository.hasBadge.mockResolvedValue(false);
      userBadgeRepository.awardBadge.mockResolvedValue(mockUserBadge);

      await handler.handle({
        ...mockEvent,
        properties: {},
      });

      // Should award because threshold is 1 and default count is 1
      expect(userBadgeRepository.awardBadge).toHaveBeenCalled();
    });
  });
});
