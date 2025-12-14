import { Test, TestingModule } from '@nestjs/testing';
import { StreakEventHandler } from './streak-event.handler';
import { ClientKafka } from '@nestjs/microservices';
import {
  StreakRuleRepository,
  UserStreakRepository,
  StreakHistoryRepository,
  EndUserRepository,
  LoyaltyLedgerRepository,
} from '@boost/database';

describe('StreakEventHandler', () => {
  let handler: StreakEventHandler;
  let kafkaClient: jest.Mocked<ClientKafka>;
  let streakRuleRepository: jest.Mocked<StreakRuleRepository>;
  let userStreakRepository: jest.Mocked<UserStreakRepository>;
  let streakHistoryRepository: jest.Mocked<StreakHistoryRepository>;
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

  const mockStreakRule = {
    id: 'rule-1',
    projectId: 'project-1',
    name: 'Daily Login Streak',
    description: 'Log in every day',
    eventType: 'daily_login',
    frequency: 'daily' as const,
    milestones: [
      { day: 7, rewardXp: 50 },
      { day: 30, rewardXp: 200 },
    ],
    defaultFreezeCount: 2,
    active: true,
    timezoneOffsetMinutes: 0,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserStreak = {
    id: 'streak-1',
    projectId: 'project-1',
    endUserId: 'enduser-1',
    streakRuleId: 'rule-1',
    currentCount: 5,
    maxStreak: 5,
    lastActivityDate: new Date(),
    freezeInventory: 2,
    freezeUsedToday: false,
    status: 'active' as const,
    lastMilestoneDay: 0,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakEventHandler,
        {
          provide: 'KAFKA_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: StreakRuleRepository,
          useValue: {
            findByEventType: jest.fn(),
            findById: jest.fn(),
            getMilestones: jest.fn(),
            getNextMilestone: jest.fn(),
            getReachedMilestone: jest.fn(),
          },
        },
        {
          provide: UserStreakRepository,
          useValue: {
            findById: jest.fn(),
            findByUserAndRule: jest.fn(),
            findOrCreate: jest.fn(),
            processActivity: jest.fn(),
            updateLastMilestoneDay: jest.fn(),
          },
        },
        {
          provide: StreakHistoryRepository,
          useValue: {
            create: jest.fn(),
            recordStarted: jest.fn(),
            recordExtension: jest.fn(),
            recordFrozen: jest.fn(),
            recordBroken: jest.fn(),
            recordMilestone: jest.fn(),
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

    handler = module.get<StreakEventHandler>(StreakEventHandler);
    kafkaClient = module.get('KAFKA_SERVICE');
    streakRuleRepository = module.get(StreakRuleRepository);
    userStreakRepository = module.get(UserStreakRepository);
    streakHistoryRepository = module.get(StreakHistoryRepository);
    endUserRepository = module.get(EndUserRepository);
    loyaltyLedgerRepository = module.get(LoyaltyLedgerRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('shouldHandle', () => {
    it('should return true when matching streak rules exist', async () => {
      streakRuleRepository.findByEventType.mockResolvedValue([mockStreakRule]);

      const result = await handler.shouldHandle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(result).toBe(true);
    });

    it('should return false when no matching streak rules', async () => {
      streakRuleRepository.findByEventType.mockResolvedValue([]);

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
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(result).toBe(false);
    });
  });

  describe('handle', () => {
    it('should extend streak on matching event', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      streakRuleRepository.findByEventType.mockResolvedValue([mockStreakRule]);
      userStreakRepository.findOrCreate.mockResolvedValue(mockUserStreak);
      userStreakRepository.processActivity.mockResolvedValue({
        previousCount: 5,
        newCount: 6,
        action: 'extended',
        freezeUsed: false,
        maxStreakUpdated: true,
      });
      streakRuleRepository.getReachedMilestone.mockReturnValue(null);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(userStreakRepository.processActivity).toHaveBeenCalledWith(
        'streak-1',
        expect.any(Date),
        0,
      );
      expect(streakHistoryRepository.recordExtension).toHaveBeenCalled();
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'streak.extended',
        }),
      );
    });

    it('should start new streak when no previous activity', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      streakRuleRepository.findByEventType.mockResolvedValue([mockStreakRule]);
      userStreakRepository.findOrCreate.mockResolvedValue({
        ...mockUserStreak,
        currentCount: 0,
        lastActivityDate: null,
      });
      userStreakRepository.processActivity.mockResolvedValue({
        previousCount: 0,
        newCount: 1,
        action: 'started',
        freezeUsed: false,
        maxStreakUpdated: true,
      });
      streakRuleRepository.getReachedMilestone.mockReturnValue(null);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(streakHistoryRepository.recordStarted).toHaveBeenCalled();
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'streak.started',
        }),
      );
    });

    it('should use freeze when gap in streak', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      streakRuleRepository.findByEventType.mockResolvedValue([mockStreakRule]);
      userStreakRepository.findOrCreate.mockResolvedValue(mockUserStreak);
      userStreakRepository.processActivity.mockResolvedValue({
        previousCount: 5,
        newCount: 5,
        action: 'frozen',
        freezeUsed: true,
        maxStreakUpdated: false,
      });
      streakRuleRepository.getReachedMilestone.mockReturnValue(null);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(streakHistoryRepository.recordFrozen).toHaveBeenCalled();
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'streak.frozen',
          properties: expect.objectContaining({
            freezeUsed: true,
          }),
        }),
      );
    });

    it('should break streak when gap and no freeze available', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      streakRuleRepository.findByEventType.mockResolvedValue([mockStreakRule]);
      userStreakRepository.findOrCreate.mockResolvedValue({
        ...mockUserStreak,
        freezeInventory: 0,
      });
      userStreakRepository.processActivity.mockResolvedValue({
        previousCount: 5,
        newCount: 1,
        action: 'broken',
        freezeUsed: false,
        maxStreakUpdated: false,
      });
      streakRuleRepository.getReachedMilestone.mockReturnValue(null);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(streakHistoryRepository.recordBroken).toHaveBeenCalled();
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'streak.broken',
        }),
      );
    });

    it('should award milestone XP when milestone reached', async () => {
      const milestone = { day: 7, rewardXp: 50 };
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      streakRuleRepository.findByEventType.mockResolvedValue([mockStreakRule]);
      userStreakRepository.findOrCreate.mockResolvedValue({
        ...mockUserStreak,
        currentCount: 6,
        lastMilestoneDay: 0,
      });
      userStreakRepository.processActivity.mockResolvedValue({
        previousCount: 6,
        newCount: 7,
        action: 'extended',
        freezeUsed: false,
        maxStreakUpdated: true,
      });
      streakRuleRepository.getReachedMilestone.mockReturnValue(milestone);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(userStreakRepository.updateLastMilestoneDay).toHaveBeenCalledWith(
        'streak-1',
        7,
      );
      expect(loyaltyLedgerRepository.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50,
          type: 'bonus',
          referenceType: 'streak_milestone',
        }),
      );
      expect(streakHistoryRepository.recordMilestone).toHaveBeenCalledWith(
        expect.objectContaining({
          milestoneDay: 7,
          xpAwarded: 50,
        }),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'streak.milestone_reached',
          properties: expect.objectContaining({
            milestoneDay: 7,
            rewardXp: 50,
          }),
        }),
      );
    });

    it('should skip if userId is missing', async () => {
      await handler.handle({
        projectId: 'project-1',
        userId: undefined as unknown as string,
        event: 'daily_login',
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
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(streakRuleRepository.findByEventType).not.toHaveBeenCalled();
    });

    it('should not emit event for same_day action', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      streakRuleRepository.findByEventType.mockResolvedValue([mockStreakRule]);
      userStreakRepository.findOrCreate.mockResolvedValue(mockUserStreak);
      userStreakRepository.processActivity.mockResolvedValue({
        previousCount: 5,
        newCount: 5,
        action: 'same_day',
        freezeUsed: false,
        maxStreakUpdated: false,
      });

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'daily_login',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(kafkaClient.emit).not.toHaveBeenCalled();
    });
  });
});
