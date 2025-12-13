import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseEventHandler } from './purchase-event.handler';
import type { RawEventMessage } from '@boost/common';

// Use jest.mock to avoid ESM issues with better-auth
jest.mock('@boost/common', () => ({
  CommissionService: jest.fn().mockImplementation(() => ({
    calculate: jest.fn(),
    formatCurrency: jest.fn(),
    dollarsToCents: jest.fn(),
  })),
  RawEventMessage: jest.fn(),
}));

jest.mock('@boost/database', () => ({
  CommissionPlanRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    findDefaultForProject: jest.fn(),
  })),
  CommissionLedgerRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  })),
  ReferralTrackingRepository: jest.fn().mockImplementation(() => ({
    findByReferredExternalId: jest.fn(),
  })),
  EndUserRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
  })),
}));

// Import after mocking
const { CommissionService } = require('@boost/common');
const {
  CommissionPlanRepository,
  CommissionLedgerRepository,
  ReferralTrackingRepository,
  EndUserRepository,
} = require('@boost/database');

describe('PurchaseEventHandler', () => {
  let handler: PurchaseEventHandler;
  let kafkaClient: any;
  let commissionService: any;
  let commissionPlanRepository: any;
  let commissionLedgerRepository: any;
  let referralTrackingRepository: any;
  let endUserRepository: any;

  const mockEndUser = {
    id: 'enduser-1',
    projectId: 'project-1',
    externalId: 'referrer-1',
    metadata: null,
    loyaltyPoints: 0,
    tierId: null,
    commissionPlanId: 'plan-1',
    referralCode: 'REF123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCommissionPlan = {
    id: 'plan-1',
    projectId: 'project-1',
    name: 'Default Plan',
    description: null,
    type: 'PERCENTAGE',
    value: 1000, // 10%
    currency: 'USD',
    isDefault: true,
    active: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReferral = {
    id: 'referral-1',
    projectId: 'project-1',
    referrerId: 'enduser-1',
    referredExternalId: 'purchaser-1',
    referralCode: 'REF123',
    source: 'url_param',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockKafkaClient = {
      emit: jest.fn(),
    };

    const mockCommissionServiceInstance = {
      calculate: jest.fn(),
      formatCurrency: jest.fn(),
      dollarsToCents: jest.fn(),
    };

    const mockCommissionPlanRepositoryInstance = {
      findById: jest.fn(),
      findDefaultForProject: jest.fn(),
    };

    const mockCommissionLedgerRepositoryInstance = {
      create: jest.fn(),
    };

    const mockReferralTrackingRepositoryInstance = {
      findByReferredExternalId: jest.fn(),
    };

    const mockEndUserRepositoryInstance = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseEventHandler,
        {
          provide: 'KAFKA_SERVICE',
          useValue: mockKafkaClient,
        },
        {
          provide: CommissionService,
          useValue: mockCommissionServiceInstance,
        },
        {
          provide: CommissionPlanRepository,
          useValue: mockCommissionPlanRepositoryInstance,
        },
        {
          provide: CommissionLedgerRepository,
          useValue: mockCommissionLedgerRepositoryInstance,
        },
        {
          provide: ReferralTrackingRepository,
          useValue: mockReferralTrackingRepositoryInstance,
        },
        {
          provide: EndUserRepository,
          useValue: mockEndUserRepositoryInstance,
        },
      ],
    }).compile();

    handler = module.get<PurchaseEventHandler>(PurchaseEventHandler);
    kafkaClient = module.get('KAFKA_SERVICE');
    commissionService = module.get(CommissionService);
    commissionPlanRepository = module.get(CommissionPlanRepository);
    commissionLedgerRepository = module.get(CommissionLedgerRepository);
    referralTrackingRepository = module.get(ReferralTrackingRepository);
    endUserRepository = module.get(EndUserRepository);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('getSupportedTypes', () => {
    it('should return purchase and checkout_success event types', () => {
      expect(handler.getSupportedTypes()).toEqual(['purchase', 'checkout_success']);
    });
  });

  describe('handle', () => {
    it('should create commission ledger entry for referred purchase', async () => {
      referralTrackingRepository.findByReferredExternalId.mockResolvedValue(mockReferral);
      endUserRepository.findById.mockResolvedValue(mockEndUser);
      commissionPlanRepository.findById.mockResolvedValue(mockCommissionPlan);
      commissionService.calculate.mockReturnValue({
        amount: 500,
        sourceAmount: 5000,
        planType: 'PERCENTAGE',
        planValue: 1000,
      });
      commissionService.formatCurrency.mockReturnValue('$5.00');
      commissionLedgerRepository.create.mockResolvedValue({
        id: 'ledger-1',
        projectId: 'project-1',
        endUserId: 'enduser-1',
        commissionPlanId: 'plan-1',
        amount: 500,
        sourceAmount: 5000,
        status: 'PENDING',
        sourceEventId: null,
        orderId: 'order-123',
        referredUserId: 'purchaser-1',
        currency: 'USD',
        notes: null,
        metadata: null,
        paidAt: null,
        createdAt: new Date(),
      });

      await handler.handle({
        projectId: 'project-1',
        userId: 'purchaser-1',
        event: 'purchase',
        properties: {
          amount: 5000,
          orderId: 'order-123',
        },
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      } as RawEventMessage);

      expect(referralTrackingRepository.findByReferredExternalId).toHaveBeenCalledWith(
        'project-1',
        'purchaser-1'
      );
      expect(commissionLedgerRepository.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        endUserId: 'enduser-1',
        commissionPlanId: 'plan-1',
        amount: 500,
        sourceAmount: 5000,
        sourceEventId: undefined,
        orderId: 'order-123',
        referredUserId: 'purchaser-1',
        currency: 'USD',
      });

      // Verify commission.created event was emitted to Kafka
      expect(kafkaClient.emit).toHaveBeenCalledWith('raw-events', expect.objectContaining({
        projectId: 'project-1',
        userId: 'referrer-1',
        event: 'commission.created',
        properties: expect.objectContaining({
          commissionId: 'ledger-1',
          amount: 500,
          sourceAmount: 5000,
        }),
      }));
    });

    it('should skip if no amount in event', async () => {
      await handler.handle({
        projectId: 'project-1',
        userId: 'purchaser-1',
        event: 'purchase',
        properties: {},
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      } as RawEventMessage);

      expect(referralTrackingRepository.findByReferredExternalId).not.toHaveBeenCalled();
    });

    it('should skip if no userId in event', async () => {
      await handler.handle({
        projectId: 'project-1',
        userId: undefined as unknown as string,
        event: 'purchase',
        properties: { amount: 5000 },
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      } as RawEventMessage);

      expect(referralTrackingRepository.findByReferredExternalId).not.toHaveBeenCalled();
    });

    it('should skip if no referral found', async () => {
      referralTrackingRepository.findByReferredExternalId.mockResolvedValue(null);

      await handler.handle({
        projectId: 'project-1',
        userId: 'purchaser-1',
        event: 'purchase',
        properties: { amount: 5000 },
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      } as RawEventMessage);

      expect(commissionLedgerRepository.create).not.toHaveBeenCalled();
    });

    it('should use default plan if referrer has no specific plan', async () => {
      referralTrackingRepository.findByReferredExternalId.mockResolvedValue(mockReferral);
      endUserRepository.findById.mockResolvedValue({
        ...mockEndUser,
        commissionPlanId: null,
      });
      commissionPlanRepository.findById.mockResolvedValue(null);
      commissionPlanRepository.findDefaultForProject.mockResolvedValue(mockCommissionPlan);
      commissionService.calculate.mockReturnValue({
        amount: 500,
        sourceAmount: 5000,
        planType: 'PERCENTAGE',
        planValue: 1000,
      });
      commissionService.formatCurrency.mockReturnValue('$5.00');
      commissionLedgerRepository.create.mockResolvedValue({} as any);

      await handler.handle({
        projectId: 'project-1',
        userId: 'purchaser-1',
        event: 'purchase',
        properties: { amount: 5000 },
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      } as RawEventMessage);

      expect(commissionPlanRepository.findDefaultForProject).toHaveBeenCalledWith('project-1');
      expect(commissionLedgerRepository.create).toHaveBeenCalled();
    });

    it('should handle dollar amounts with decimals and convert to cents', async () => {
      referralTrackingRepository.findByReferredExternalId.mockResolvedValue(mockReferral);
      endUserRepository.findById.mockResolvedValue(mockEndUser);
      commissionPlanRepository.findById.mockResolvedValue(mockCommissionPlan);
      commissionService.dollarsToCents.mockReturnValue(5099);
      commissionService.calculate.mockReturnValue({
        amount: 509,
        sourceAmount: 5099,
        planType: 'PERCENTAGE',
        planValue: 1000,
      });
      commissionService.formatCurrency.mockReturnValue('$5.09');
      commissionLedgerRepository.create.mockResolvedValue({} as any);

      await handler.handle({
        projectId: 'project-1',
        userId: 'purchaser-1',
        event: 'purchase',
        properties: { amount: 50.99 }, // Dollar amount with non-zero decimal
        timestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
      } as RawEventMessage);

      // When amount has decimal, dollarsToCents is called
      expect(commissionService.dollarsToCents).toHaveBeenCalledWith(50.99);
    });
  });
});
