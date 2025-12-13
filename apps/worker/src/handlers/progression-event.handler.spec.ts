import { Test, TestingModule } from '@nestjs/testing';
import { ProgressionEventHandler } from './progression-event.handler';
import { ClientKafka } from '@nestjs/microservices';
import {
  ProgressionRuleRepository,
  CommissionLedgerRepository,
  ReferralTrackingRepository,
  EndUserRepository,
  CommissionPlanRepository,
} from '@boost/database';

describe('ProgressionEventHandler', () => {
  let handler: ProgressionEventHandler;
  let kafkaClient: jest.Mocked<ClientKafka>;
  let progressionRuleRepository: jest.Mocked<ProgressionRuleRepository>;
  let commissionLedgerRepository: jest.Mocked<CommissionLedgerRepository>;
  let referralTrackingRepository: jest.Mocked<ReferralTrackingRepository>;
  let endUserRepository: jest.Mocked<EndUserRepository>;
  let commissionPlanRepository: jest.Mocked<CommissionPlanRepository>;

  const mockEndUser = {
    id: 'enduser-1',
    projectId: 'project-1',
    externalId: 'user-1',
    metadata: null,
    loyaltyPoints: 0,
    tierId: null,
    commissionPlanId: 'plan-1',
    referralCode: 'REF123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProgressionRule = {
    id: 'rule-1',
    projectId: 'project-1',
    name: 'Gold Affiliate',
    description: 'Upgrade to Gold tier at 10 referrals',
    triggerMetric: 'referral_count',
    threshold: 10,
    actionTargetPlanId: 'plan-gold',
    priority: 0,
    active: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTargetPlan = {
    id: 'plan-gold',
    projectId: 'project-1',
    name: 'Gold Plan',
    description: null,
    type: 'PERCENTAGE',
    value: 1500, // 15%
    currency: 'USD',
    isDefault: false,
    active: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressionEventHandler,
        {
          provide: 'KAFKA_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: ProgressionRuleRepository,
          useValue: {
            findActiveByProjectId: jest.fn(),
          },
        },
        {
          provide: CommissionLedgerRepository,
          useValue: {
            getSummaryByEndUser: jest.fn(),
          },
        },
        {
          provide: ReferralTrackingRepository,
          useValue: {
            countByReferrerId: jest.fn(),
          },
        },
        {
          provide: EndUserRepository,
          useValue: {
            findByExternalId: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CommissionPlanRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<ProgressionEventHandler>(ProgressionEventHandler);
    kafkaClient = module.get('KAFKA_SERVICE');
    progressionRuleRepository = module.get(ProgressionRuleRepository);
    commissionLedgerRepository = module.get(CommissionLedgerRepository);
    referralTrackingRepository = module.get(ReferralTrackingRepository);
    endUserRepository = module.get(EndUserRepository);
    commissionPlanRepository = module.get(CommissionPlanRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('getSupportedTypes', () => {
    it('should return supported event types', () => {
      const types = handler.getSupportedTypes();
      expect(types).toContain('user_signup');
      expect(types).toContain('referral_success');
      expect(types).toContain('commission.created');
      // Should NOT include purchase/checkout_success to avoid conflicts with PurchaseEventHandler
      expect(types).not.toContain('purchase');
      expect(types).not.toContain('checkout_success');
    });
  });

  describe('handle', () => {
    it('should upgrade user plan when threshold is met', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      progressionRuleRepository.findActiveByProjectId.mockResolvedValue([mockProgressionRule]);
      referralTrackingRepository.countByReferrerId.mockResolvedValue(15); // Above threshold
      commissionLedgerRepository.getSummaryByEndUser.mockResolvedValue({
        totalEarned: 10000,
        totalPending: 2000,
        totalPaid: 8000,
        totalRejected: 0,
        transactionCount: 5,
      });
      commissionPlanRepository.findById.mockResolvedValue(mockTargetPlan);
      endUserRepository.update.mockResolvedValue(undefined);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'referral_success',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(endUserRepository.update).toHaveBeenCalledWith('enduser-1', {
        commissionPlanId: 'plan-gold',
      });
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'raw-events',
        expect.objectContaining({
          event: 'user.leveled_up',
          projectId: 'project-1',
        })
      );
    });

    it('should skip upgrade if user already on target plan (idempotency)', async () => {
      endUserRepository.findByExternalId.mockResolvedValue({
        ...mockEndUser,
        commissionPlanId: 'plan-gold', // Already on target plan
      });
      progressionRuleRepository.findActiveByProjectId.mockResolvedValue([mockProgressionRule]);
      referralTrackingRepository.countByReferrerId.mockResolvedValue(15);
      commissionLedgerRepository.getSummaryByEndUser.mockResolvedValue({
        totalEarned: 10000,
        totalPending: 2000,
        totalPaid: 8000,
        totalRejected: 0,
        transactionCount: 5,
      });

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'referral_success',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(endUserRepository.update).not.toHaveBeenCalled();
    });

    it('should skip if threshold not met', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      progressionRuleRepository.findActiveByProjectId.mockResolvedValue([mockProgressionRule]);
      referralTrackingRepository.countByReferrerId.mockResolvedValue(5); // Below threshold
      commissionLedgerRepository.getSummaryByEndUser.mockResolvedValue({
        totalEarned: 1000,
        totalPending: 200,
        totalPaid: 800,
        totalRejected: 0,
        transactionCount: 2,
      });

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'referral_success',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(endUserRepository.update).not.toHaveBeenCalled();
    });

    it('should skip if no userId in event', async () => {
      await handler.handle({
        projectId: 'project-1',
        userId: undefined as unknown as string,
        event: 'referral_success',
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
        event: 'referral_success',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(progressionRuleRepository.findActiveByProjectId).not.toHaveBeenCalled();
    });

    it('should skip if no active progression rules', async () => {
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      progressionRuleRepository.findActiveByProjectId.mockResolvedValue([]);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'referral_success',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(endUserRepository.update).not.toHaveBeenCalled();
    });

    it('should select highest threshold rule when multiple match', async () => {
      const lowerRule = {
        ...mockProgressionRule,
        id: 'rule-lower',
        threshold: 5,
        actionTargetPlanId: 'plan-silver',
      };
      const higherRule = {
        ...mockProgressionRule,
        id: 'rule-higher',
        threshold: 10,
        actionTargetPlanId: 'plan-gold',
      };

      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      progressionRuleRepository.findActiveByProjectId.mockResolvedValue([lowerRule, higherRule]);
      referralTrackingRepository.countByReferrerId.mockResolvedValue(15); // Above both thresholds
      commissionLedgerRepository.getSummaryByEndUser.mockResolvedValue({
        totalEarned: 10000,
        totalPending: 2000,
        totalPaid: 8000,
        totalRejected: 0,
        transactionCount: 5,
      });
      commissionPlanRepository.findById.mockResolvedValue(mockTargetPlan);
      endUserRepository.update.mockResolvedValue(undefined);

      await handler.handle({
        projectId: 'project-1',
        userId: 'user-1',
        event: 'referral_success',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      });

      expect(endUserRepository.update).toHaveBeenCalledWith('enduser-1', {
        commissionPlanId: 'plan-gold', // Should use higher threshold rule
      });
    });
  });
});
