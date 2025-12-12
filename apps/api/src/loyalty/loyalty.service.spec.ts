import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import {
  LoyaltyTierRepository,
  LoyaltyLedgerRepository,
  EndUserRepository,
} from '@boost/database';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  let tierRepository: jest.Mocked<LoyaltyTierRepository>;
  let ledgerRepository: jest.Mocked<LoyaltyLedgerRepository>;
  let endUserRepository: jest.Mocked<EndUserRepository>;

  const mockTier = {
    id: 'tier-1',
    projectId: 'project-1',
    name: 'Gold',
    minPoints: 1000,
    level: 2,
    benefits: { discount: 10 },
    color: '#FFD700',
    iconUrl: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEndUser = {
    id: 'enduser-1',
    projectId: 'project-1',
    externalId: 'user-1',
    traits: null,
    loyaltyPoints: 500,
    tierId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLedgerEntry = {
    id: 'entry-1',
    projectId: 'project-1',
    endUserId: 'enduser-1',
    amount: 100,
    balance: 600,
    type: 'earn',
    referenceId: 'order-123',
    referenceType: 'purchase',
    description: 'Purchase reward',
    metadata: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: LoyaltyTierRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByProjectId: jest.fn(),
            findTierForPoints: jest.fn(),
            findNextTier: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: LoyaltyLedgerRepository,
          useValue: {
            addTransaction: jest.fn(),
            findByEndUserId: jest.fn(),
            getSummary: jest.fn(),
          },
        },
        {
          provide: EndUserRepository,
          useValue: {
            findOrCreate: jest.fn(),
            findById: jest.fn(),
            findByExternalId: jest.fn(),
            updateTier: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    tierRepository = module.get(LoyaltyTierRepository);
    ledgerRepository = module.get(LoyaltyLedgerRepository);
    endUserRepository = module.get(EndUserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Tier Management', () => {
    describe('createTier', () => {
      it('should create a new tier', async () => {
        tierRepository.findByProjectId.mockResolvedValue([]);
        tierRepository.create.mockResolvedValue({ id: 'tier-1' });
        tierRepository.findById.mockResolvedValue(mockTier);

        const result = await service.createTier('project-1', {
          name: 'Gold',
          minPoints: 1000,
          level: 2,
          benefits: { discount: 10 },
        });

        expect(result).toEqual(mockTier);
        expect(tierRepository.create).toHaveBeenCalledWith({
          projectId: 'project-1',
          name: 'Gold',
          minPoints: 1000,
          level: 2,
          benefits: { discount: 10 },
          color: undefined,
          iconUrl: undefined,
          metadata: undefined,
        });
      });

      it('should throw ConflictException if tier name exists', async () => {
        tierRepository.findByProjectId.mockResolvedValue([mockTier]);

        await expect(
          service.createTier('project-1', {
            name: 'Gold',
            minPoints: 1000,
            level: 2,
            benefits: {},
          }),
        ).rejects.toThrow('Tier "Gold" already exists');
      });
    });

    describe('getTier', () => {
      it('should return tier if found', async () => {
        tierRepository.findById.mockResolvedValue(mockTier);

        const result = await service.getTier('project-1', 'tier-1');

        expect(result).toEqual(mockTier);
      });

      it('should throw NotFoundException if tier not found', async () => {
        tierRepository.findById.mockResolvedValue(null);

        await expect(service.getTier('project-1', 'tier-1')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw ForbiddenException if tier belongs to different project', async () => {
        tierRepository.findById.mockResolvedValue({
          ...mockTier,
          projectId: 'other-project',
        });

        await expect(service.getTier('project-1', 'tier-1')).rejects.toThrow(
          'Access denied',
        );
      });
    });
  });

  describe('Points Management', () => {
    describe('addPoints', () => {
      it('should add points and return transaction result', async () => {
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        ledgerRepository.addTransaction.mockResolvedValue(mockLedgerEntry);
        endUserRepository.findById.mockResolvedValue(mockEndUser);
        tierRepository.findTierForPoints.mockResolvedValue(null);

        const result = await service.addPoints('project-1', {
          userId: 'user-1',
          amount: 100,
          type: 'earn',
          referenceId: 'order-123',
          referenceType: 'purchase',
          description: 'Purchase reward',
        });

        expect(result.success).toBe(true);
        expect(result.entry).toEqual(mockLedgerEntry);
        expect(result.newBalance).toBe(600);
      });

      it('should detect tier upgrade after adding points', async () => {
        const userWithMorePoints = { ...mockEndUser, loyaltyPoints: 1200 };
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        ledgerRepository.addTransaction.mockResolvedValue({
          ...mockLedgerEntry,
          balance: 1200,
        });
        endUserRepository.findById.mockResolvedValue(userWithMorePoints);
        tierRepository.findTierForPoints.mockResolvedValue(mockTier);
        endUserRepository.updateTier.mockResolvedValue(undefined);

        const result = await service.addPoints('project-1', {
          userId: 'user-1',
          amount: 700,
          type: 'earn',
          referenceId: 'order-123',
          referenceType: 'purchase',
        });

        expect(result.tierUpgraded).toBe(true);
        expect(result.newTier?.name).toBe('Gold');
      });
    });

    describe('redeemPoints', () => {
      it('should redeem points successfully', async () => {
        endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
        ledgerRepository.addTransaction.mockResolvedValue({
          ...mockLedgerEntry,
          amount: -100,
          balance: 400,
          type: 'redeem',
        });

        const result = await service.redeemPoints('project-1', {
          userId: 'user-1',
          amount: 100,
        });

        expect(result.success).toBe(true);
        expect(result.newBalance).toBe(400);
      });

      it('should throw NotFoundException if user not found', async () => {
        endUserRepository.findByExternalId.mockResolvedValue(null);

        await expect(
          service.redeemPoints('project-1', {
            userId: 'user-1',
            amount: 100,
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw BadRequestException for insufficient balance', async () => {
        endUserRepository.findByExternalId.mockResolvedValue({
          ...mockEndUser,
          loyaltyPoints: 50,
        });

        await expect(
          service.redeemPoints('project-1', {
            userId: 'user-1',
            amount: 100,
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Customer Profile', () => {
    describe('getCustomerProfile', () => {
      it('should return customer profile with tier info', async () => {
        endUserRepository.findOrCreate.mockResolvedValue({
          ...mockEndUser,
          tierId: 'tier-1',
        });
        tierRepository.findById.mockResolvedValue(mockTier);
        tierRepository.findNextTier.mockResolvedValue({
          ...mockTier,
          id: 'tier-2',
          name: 'Platinum',
          minPoints: 2000,
          level: 3,
        });
        ledgerRepository.getSummary.mockResolvedValue({
          totalEarned: 1000,
          totalRedeemed: 500,
          transactionCount: 10,
        });

        const result = await service.getCustomerProfile('project-1', 'user-1');

        expect(result.userId).toBe('user-1');
        expect(result.points).toBe(500);
        expect(result.tier?.name).toBe('Gold');
        expect(result.nextTier?.name).toBe('Platinum');
        expect(result.summary.totalEarned).toBe(1000);
      });

      it('should auto-assign tier based on points', async () => {
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser); // No tierId
        tierRepository.findById.mockResolvedValue(null);
        tierRepository.findTierForPoints.mockResolvedValue(mockTier);
        tierRepository.findNextTier.mockResolvedValue(null);
        ledgerRepository.getSummary.mockResolvedValue({
          totalEarned: 500,
          totalRedeemed: 0,
          transactionCount: 5,
        });
        endUserRepository.updateTier.mockResolvedValue(undefined);

        const result = await service.getCustomerProfile('project-1', 'user-1');

        expect(endUserRepository.updateTier).toHaveBeenCalled();
        expect(result.tier?.name).toBe('Gold');
      });
    });
  });
});
