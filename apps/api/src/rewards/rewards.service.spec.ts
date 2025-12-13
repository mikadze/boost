import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import {
  RewardItemRepository,
  RedemptionTransactionRepository,
  EndUserRepository,
} from '@boost/database';

describe('RewardsService', () => {
  let service: RewardsService;
  let rewardItemRepository: jest.Mocked<RewardItemRepository>;
  let redemptionRepository: jest.Mocked<RedemptionTransactionRepository>;
  let endUserRepository: jest.Mocked<EndUserRepository>;

  const mockRewardItem = {
    id: 'reward-1',
    projectId: 'project-1',
    name: '$10 Store Credit',
    description: 'Get $10 credit to your account',
    imageUrl: 'https://example.com/image.png',
    sku: 'CREDIT-10',
    costPoints: 1000,
    stockQuantity: 100,
    prerequisiteBadgeId: null,
    fulfillmentType: 'PROMO_CODE',
    fulfillmentConfig: { codes: ['CODE1', 'CODE2', 'CODE3'] },
    active: true,
    displayOrder: 0,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEndUser = {
    id: 'enduser-1',
    projectId: 'project-1',
    externalId: 'user-1',
    metadata: null,
    loyaltyPoints: 1500,
    tierId: null,
    commissionPlanId: null,
    referralCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRedemption = {
    id: 'redemption-1',
    projectId: 'project-1',
    endUserId: 'enduser-1',
    rewardItemId: 'reward-1',
    costAtTime: 1000,
    status: 'PROCESSING',
    errorMessage: null,
    fulfillmentData: null,
    webhookRetries: 0,
    fulfilledAt: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        {
          provide: RewardItemRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByProjectId: jest.fn(),
            findBySku: jest.fn(),
            findAvailableItems: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            decrementStock: jest.fn(),
            checkAvailability: jest.fn(),
          },
        },
        {
          provide: RedemptionTransactionRepository,
          useValue: {
            createAtomicRedemption: jest.fn(),
            findById: jest.fn(),
            findByEndUserId: jest.fn(),
            findByProjectId: jest.fn(),
            getRedemptionStats: jest.fn(),
            markCompleted: jest.fn(),
            markFailed: jest.fn(),
            incrementWebhookRetry: jest.fn(),
          },
        },
        {
          provide: EndUserRepository,
          useValue: {
            findOrCreate: jest.fn(),
            findById: jest.fn(),
            findByExternalId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    rewardItemRepository = module.get(RewardItemRepository);
    redemptionRepository = module.get(RedemptionTransactionRepository);
    endUserRepository = module.get(EndUserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Reward Item Management', () => {
    describe('createRewardItem', () => {
      it('should create a new reward item', async () => {
        rewardItemRepository.findBySku.mockResolvedValue(null);
        rewardItemRepository.create.mockResolvedValue({ id: 'reward-1' });
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);

        const result = await service.createRewardItem('project-1', {
          name: '$10 Store Credit',
          costPoints: 1000,
          fulfillmentType: 'PROMO_CODE',
          sku: 'CREDIT-10',
          fulfillmentConfig: { codes: ['CODE1', 'CODE2', 'CODE3'] },
        });

        expect(result).toEqual(mockRewardItem);
        expect(rewardItemRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: 'project-1',
            name: '$10 Store Credit',
            costPoints: 1000,
          }),
        );
      });

      it('should throw ConflictException if SKU already exists', async () => {
        rewardItemRepository.findBySku.mockResolvedValue(mockRewardItem);

        await expect(
          service.createRewardItem('project-1', {
            name: 'Another Credit',
            costPoints: 500,
            fulfillmentType: 'PROMO_CODE',
            sku: 'CREDIT-10',
          }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('getRewardItem', () => {
      it('should return reward item if found', async () => {
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);

        const result = await service.getRewardItem('project-1', 'reward-1');

        expect(result).toEqual(mockRewardItem);
      });

      it('should throw NotFoundException if item not found', async () => {
        rewardItemRepository.findById.mockResolvedValue(null);

        await expect(
          service.getRewardItem('project-1', 'reward-1'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if item belongs to different project', async () => {
        rewardItemRepository.findById.mockResolvedValue({
          ...mockRewardItem,
          projectId: 'other-project',
        });

        await expect(
          service.getRewardItem('project-1', 'reward-1'),
        ).rejects.toThrow('Access denied');
      });
    });

    describe('updateRewardItem', () => {
      it('should update reward item', async () => {
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);
        rewardItemRepository.update.mockResolvedValue(undefined);

        const updated = { ...mockRewardItem, costPoints: 1500 };
        rewardItemRepository.findById
          .mockResolvedValueOnce(mockRewardItem)
          .mockResolvedValueOnce(updated);

        const result = await service.updateRewardItem('project-1', 'reward-1', {
          costPoints: 1500,
        });

        expect(result.costPoints).toBe(1500);
      });

      it('should throw ConflictException if changing to existing SKU', async () => {
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);
        rewardItemRepository.findBySku.mockResolvedValue({
          ...mockRewardItem,
          id: 'other-reward',
        });

        await expect(
          service.updateRewardItem('project-1', 'reward-1', {
            sku: 'EXISTING-SKU',
          }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('deleteRewardItem', () => {
      it('should delete reward item', async () => {
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);
        rewardItemRepository.delete.mockResolvedValue(undefined);

        await service.deleteRewardItem('project-1', 'reward-1');

        expect(rewardItemRepository.delete).toHaveBeenCalledWith('reward-1');
      });
    });
  });

  describe('Customer Store', () => {
    describe('getCustomerStore', () => {
      it('should return store with item availability', async () => {
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        rewardItemRepository.findAvailableItems.mockResolvedValue([
          mockRewardItem,
        ]);

        const result = await service.getCustomerStore('project-1', 'user-1');

        expect(result.userId).toBe('user-1');
        expect(result.balance).toBe(1500);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].availability.available).toBe(true);
      });

      it('should mark items as unavailable due to insufficient points', async () => {
        const userWithLowPoints = { ...mockEndUser, loyaltyPoints: 500 };
        endUserRepository.findOrCreate.mockResolvedValue(userWithLowPoints);
        rewardItemRepository.findAvailableItems.mockResolvedValue([
          mockRewardItem,
        ]);

        const result = await service.getCustomerStore('project-1', 'user-1');

        expect(result.items[0].availability.available).toBe(false);
        expect(result.items[0].availability.reason).toBe('insufficient_points');
        expect(result.items[0].availability.pointsNeeded).toBe(500);
      });

      it('should mark items as unavailable due to missing badge', async () => {
        const gatedItem = {
          ...mockRewardItem,
          prerequisiteBadgeId: 'vip-badge',
        };
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        rewardItemRepository.findAvailableItems.mockResolvedValue([gatedItem]);

        const result = await service.getCustomerStore('project-1', 'user-1');

        expect(result.items[0].availability.available).toBe(false);
        expect(result.items[0].availability.reason).toBe('missing_badge');
      });

      it('should allow items when user has required badge', async () => {
        const gatedItem = {
          ...mockRewardItem,
          prerequisiteBadgeId: 'vip-badge',
        };
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        rewardItemRepository.findAvailableItems.mockResolvedValue([gatedItem]);

        const result = await service.getCustomerStore('project-1', 'user-1', [
          'vip-badge',
        ]);

        expect(result.items[0].availability.available).toBe(true);
      });

      it('should mark out of stock items as unavailable', async () => {
        const outOfStockItem = { ...mockRewardItem, stockQuantity: 0 };
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        rewardItemRepository.findAvailableItems.mockResolvedValue([
          outOfStockItem,
        ]);

        const result = await service.getCustomerStore('project-1', 'user-1');

        expect(result.items[0].availability.available).toBe(false);
        expect(result.items[0].availability.reason).toBe('out_of_stock');
      });
    });
  });

  describe('Redemption Processing', () => {
    describe('redeemReward', () => {
      it('should successfully redeem a reward', async () => {
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        redemptionRepository.createAtomicRedemption.mockResolvedValue({
          success: true,
          transaction: mockRedemption,
        });
        endUserRepository.findById.mockResolvedValue({
          ...mockEndUser,
          loyaltyPoints: 500,
        });

        const result = await service.redeemReward('project-1', {
          userId: 'user-1',
          rewardItemId: 'reward-1',
        });

        expect(result.success).toBe(true);
        expect(result.transaction).toEqual(mockRedemption);
        expect(result.newBalance).toBe(500);
      });

      it('should throw NotFoundException if reward item not found', async () => {
        rewardItemRepository.findById.mockResolvedValue(null);

        await expect(
          service.redeemReward('project-1', {
            userId: 'user-1',
            rewardItemId: 'nonexistent',
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if item belongs to different project', async () => {
        rewardItemRepository.findById.mockResolvedValue({
          ...mockRewardItem,
          projectId: 'other-project',
        });

        await expect(
          service.redeemReward('project-1', {
            userId: 'user-1',
            rewardItemId: 'reward-1',
          }),
        ).rejects.toThrow('Access denied');
      });

      it('should throw BadRequestException for insufficient points', async () => {
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);
        endUserRepository.findOrCreate.mockResolvedValue({
          ...mockEndUser,
          loyaltyPoints: 100,
        });

        await expect(
          service.redeemReward('project-1', {
            userId: 'user-1',
            rewardItemId: 'reward-1',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for out of stock item', async () => {
        const outOfStockItem = { ...mockRewardItem, stockQuantity: 0 };
        rewardItemRepository.findById.mockResolvedValue(outOfStockItem);
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);

        await expect(
          service.redeemReward('project-1', {
            userId: 'user-1',
            rewardItemId: 'reward-1',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for inactive item', async () => {
        const inactiveItem = { ...mockRewardItem, active: false };
        rewardItemRepository.findById.mockResolvedValue(inactiveItem);
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);

        await expect(
          service.redeemReward('project-1', {
            userId: 'user-1',
            rewardItemId: 'reward-1',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException for missing badge requirement', async () => {
        const gatedItem = {
          ...mockRewardItem,
          prerequisiteBadgeId: 'vip-badge',
        };
        rewardItemRepository.findById.mockResolvedValue(gatedItem);
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);

        await expect(
          service.redeemReward('project-1', {
            userId: 'user-1',
            rewardItemId: 'reward-1',
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should handle atomic redemption failure', async () => {
        rewardItemRepository.findById.mockResolvedValue(mockRewardItem);
        endUserRepository.findOrCreate.mockResolvedValue(mockEndUser);
        redemptionRepository.createAtomicRedemption.mockResolvedValue({
          success: false,
          error: 'Concurrent modification detected',
        });

        await expect(
          service.redeemReward('project-1', {
            userId: 'user-1',
            rewardItemId: 'reward-1',
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('Redemption History', () => {
    describe('getRedemptions', () => {
      it('should return all redemptions for project', async () => {
        redemptionRepository.findByProjectId.mockResolvedValue([mockRedemption]);

        const result = await service.getRedemptions('project-1');

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockRedemption);
      });

      it('should filter by status', async () => {
        redemptionRepository.findByProjectId.mockResolvedValue([mockRedemption]);

        await service.getRedemptions('project-1', { status: 'PROCESSING' });

        expect(redemptionRepository.findByProjectId).toHaveBeenCalledWith(
          'project-1',
          expect.objectContaining({ status: 'PROCESSING' }),
        );
      });
    });

    describe('getRedemption', () => {
      it('should return single redemption', async () => {
        redemptionRepository.findById.mockResolvedValue(mockRedemption);

        const result = await service.getRedemption('project-1', 'redemption-1');

        expect(result).toEqual(mockRedemption);
      });

      it('should throw NotFoundException if redemption not found', async () => {
        redemptionRepository.findById.mockResolvedValue(null);

        await expect(
          service.getRedemption('project-1', 'nonexistent'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if redemption belongs to different project', async () => {
        redemptionRepository.findById.mockResolvedValue({
          ...mockRedemption,
          projectId: 'other-project',
        });

        await expect(
          service.getRedemption('project-1', 'redemption-1'),
        ).rejects.toThrow('Access denied');
      });
    });

    describe('getCustomerRedemptions', () => {
      it('should return customer redemption history', async () => {
        endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
        redemptionRepository.findByEndUserId.mockResolvedValue([mockRedemption]);
        redemptionRepository.getRedemptionStats.mockResolvedValue({
          total: 1,
          completed: 0,
          processing: 1,
          failed: 0,
        });

        const result = await service.getCustomerRedemptions(
          'project-1',
          'user-1',
        );

        expect(result.redemptions).toHaveLength(1);
        expect(result.total).toBe(1);
      });

      it('should return empty array for unknown user', async () => {
        endUserRepository.findByExternalId.mockResolvedValue(null);

        const result = await service.getCustomerRedemptions(
          'project-1',
          'unknown-user',
        );

        expect(result.redemptions).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    describe('getRedemptionStats', () => {
      it('should return redemption statistics', async () => {
        redemptionRepository.getRedemptionStats.mockResolvedValue({
          total: 100,
          completed: 80,
          processing: 15,
          failed: 5,
        });

        const result = await service.getRedemptionStats('project-1');

        expect(result.total).toBe(100);
        expect(result.completed).toBe(80);
        expect(result.processing).toBe(15);
        expect(result.failed).toBe(5);
      });
    });
  });

  describe('Manual Fulfillment', () => {
    describe('markRedemptionCompleted', () => {
      it('should mark redemption as completed', async () => {
        redemptionRepository.findById.mockResolvedValue(mockRedemption);
        redemptionRepository.markCompleted.mockResolvedValue(undefined);
        const completedRedemption = {
          ...mockRedemption,
          status: 'COMPLETED',
          fulfilledAt: new Date(),
        };
        redemptionRepository.findById
          .mockResolvedValueOnce(mockRedemption)
          .mockResolvedValueOnce(completedRedemption);

        const result = await service.markRedemptionCompleted(
          'project-1',
          'redemption-1',
          { note: 'Manually fulfilled' },
        );

        expect(result.status).toBe('COMPLETED');
        expect(redemptionRepository.markCompleted).toHaveBeenCalledWith(
          'redemption-1',
          { note: 'Manually fulfilled' },
        );
      });

      it('should throw BadRequestException if already completed', async () => {
        redemptionRepository.findById.mockResolvedValue({
          ...mockRedemption,
          status: 'COMPLETED',
        });

        await expect(
          service.markRedemptionCompleted('project-1', 'redemption-1'),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('markRedemptionFailed', () => {
      it('should mark redemption as failed', async () => {
        redemptionRepository.findById.mockResolvedValue(mockRedemption);
        redemptionRepository.markFailed.mockResolvedValue(undefined);
        const failedRedemption = {
          ...mockRedemption,
          status: 'FAILED',
          errorMessage: 'Out of stock',
        };
        redemptionRepository.findById
          .mockResolvedValueOnce(mockRedemption)
          .mockResolvedValueOnce(failedRedemption);

        const result = await service.markRedemptionFailed(
          'project-1',
          'redemption-1',
          'Out of stock',
        );

        expect(result.status).toBe('FAILED');
        expect(result.errorMessage).toBe('Out of stock');
      });

      it('should throw BadRequestException if already completed', async () => {
        redemptionRepository.findById.mockResolvedValue({
          ...mockRedemption,
          status: 'COMPLETED',
        });

        await expect(
          service.markRedemptionFailed(
            'project-1',
            'redemption-1',
            'Some error',
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
