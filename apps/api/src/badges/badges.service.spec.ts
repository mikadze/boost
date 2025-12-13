import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { of } from 'rxjs';
import { BadgesService } from './badges.service';
import {
  BadgeDefinitionRepository,
  UserBadgeRepository,
  EndUserRepository,
} from '@boost/database';

describe('BadgesService', () => {
  let service: BadgesService;
  let badgeDefinitionRepository: jest.Mocked<BadgeDefinitionRepository>;
  let userBadgeRepository: jest.Mocked<UserBadgeRepository>;
  let endUserRepository: jest.Mocked<EndUserRepository>;
  let kafkaClient: jest.Mocked<ClientKafka>;

  const mockBadge = {
    id: 'badge-1',
    projectId: 'project-1',
    name: 'Bug Hunter',
    description: 'Found 10 bugs',
    iconUrl: 'https://example.com/icon.png',
    imageUrl: 'https://example.com/image.png',
    rarity: 'RARE',
    visibility: 'PUBLIC',
    category: 'achievements',
    ruleType: 'METRIC_THRESHOLD',
    triggerMetric: 'bugs_found',
    threshold: 10,
    active: true,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHiddenBadge = {
    ...mockBadge,
    id: 'badge-2',
    name: 'Secret Badge',
    visibility: 'HIDDEN',
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
    awardSource: 'MANUAL',
    awardedBy: 'admin-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        {
          provide: BadgeDefinitionRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByProjectId: jest.fn(),
            findActiveByProjectId: jest.fn(),
            findByCategory: jest.fn(),
            findByTriggerMetric: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            activate: jest.fn(),
            deactivate: jest.fn(),
            getDistinctCategories: jest.fn(),
          },
        },
        {
          provide: UserBadgeRepository,
          useValue: {
            awardBadge: jest.fn(),
            findByUserAndBadge: jest.fn(),
            hasBadge: jest.fn(),
            findByEndUserId: jest.fn(),
            findByEndUserIdWithDetails: jest.fn(),
            getRecentAwards: jest.fn(),
          },
        },
        {
          provide: EndUserRepository,
          useValue: {
            findByExternalId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: 'KAFKA_SERVICE',
          useValue: {
            emit: jest.fn(() => of(null)),
            connect: jest.fn(),
            close: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
    badgeDefinitionRepository = module.get(BadgeDefinitionRepository);
    userBadgeRepository = module.get(UserBadgeRepository);
    endUserRepository = module.get(EndUserRepository);
    kafkaClient = module.get('KAFKA_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBadge', () => {
    it('should create a badge', async () => {
      badgeDefinitionRepository.create.mockResolvedValue(mockBadge);

      const result = await service.createBadge('project-1', {
        name: 'Bug Hunter',
        description: 'Found 10 bugs',
        rarity: 'RARE',
        visibility: 'PUBLIC',
        category: 'achievements',
        ruleType: 'METRIC_THRESHOLD',
        triggerMetric: 'bugs_found',
        threshold: 10,
      });

      expect(result.id).toBe('badge-1');
      expect(result.name).toBe('Bug Hunter');
      expect(result.rarity).toBe('RARE');
      expect(badgeDefinitionRepository.create).toHaveBeenCalled();
    });

    it('should create a badge with default values', async () => {
      const minimalBadge = { ...mockBadge, rarity: 'COMMON', visibility: 'PUBLIC' };
      badgeDefinitionRepository.create.mockResolvedValue(minimalBadge);

      const result = await service.createBadge('project-1', {
        name: 'First Steps',
      });

      expect(result.name).toBe('Bug Hunter');
      expect(badgeDefinitionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rarity: 'COMMON',
          visibility: 'PUBLIC',
          active: true,
        }),
      );
    });
  });

  describe('getBadge', () => {
    it('should return a badge', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(mockBadge);

      const result = await service.getBadge('project-1', 'badge-1');

      expect(result.id).toBe('badge-1');
      expect(result.name).toBe('Bug Hunter');
    });

    it('should throw NotFoundException if badge not found', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(null);

      await expect(service.getBadge('project-1', 'badge-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if badge belongs to different project', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue({
        ...mockBadge,
        projectId: 'other-project',
      });

      await expect(service.getBadge('project-1', 'badge-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateBadge', () => {
    it('should update a badge', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(mockBadge);
      badgeDefinitionRepository.update.mockResolvedValue({
        ...mockBadge,
        name: 'Super Bug Hunter',
        threshold: 20,
      });

      const result = await service.updateBadge('project-1', 'badge-1', {
        name: 'Super Bug Hunter',
        threshold: 20,
      });

      expect(result.name).toBe('Super Bug Hunter');
      expect(result.threshold).toBe(20);
    });

    it('should throw NotFoundException if badge not found', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateBadge('project-1', 'badge-1', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBadge', () => {
    it('should delete a badge', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(mockBadge);
      badgeDefinitionRepository.delete.mockResolvedValue(true);

      await service.deleteBadge('project-1', 'badge-1');

      expect(badgeDefinitionRepository.delete).toHaveBeenCalledWith('badge-1');
    });

    it('should throw NotFoundException if badge not found', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(null);

      await expect(service.deleteBadge('project-1', 'badge-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activateBadge', () => {
    it('should activate a badge', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue({
        ...mockBadge,
        active: false,
      });
      badgeDefinitionRepository.activate.mockResolvedValue({
        ...mockBadge,
        active: true,
      });

      const result = await service.activateBadge('project-1', 'badge-1');

      expect(result.active).toBe(true);
      expect(badgeDefinitionRepository.activate).toHaveBeenCalledWith('badge-1');
    });
  });

  describe('deactivateBadge', () => {
    it('should deactivate a badge', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(mockBadge);
      badgeDefinitionRepository.deactivate.mockResolvedValue({
        ...mockBadge,
        active: false,
      });

      const result = await service.deactivateBadge('project-1', 'badge-1');

      expect(result.active).toBe(false);
      expect(badgeDefinitionRepository.deactivate).toHaveBeenCalledWith('badge-1');
    });
  });

  describe('awardBadge', () => {
    it('should award a badge to a user', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(mockBadge);
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      userBadgeRepository.awardBadge.mockResolvedValue(mockUserBadge);

      const result = await service.awardBadge('project-1', 'badge-1', {
        userId: 'user-1',
        awardedBy: 'admin-1',
      });

      expect(result.id).toBe('user-badge-1');
      expect(result.badgeId).toBe('badge-1');
      expect(userBadgeRepository.awardBadge).toHaveBeenCalledWith(
        expect.objectContaining({
          awardSource: 'MANUAL',
          awardedBy: 'admin-1',
        }),
      );
      expect(kafkaClient.emit).toHaveBeenCalledWith(
        'badge.unlocked',
        expect.any(Object),
      );
    });

    it('should create end user if not exists', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(mockBadge);
      endUserRepository.findByExternalId.mockResolvedValue(null);
      endUserRepository.create.mockResolvedValue(mockEndUser);
      userBadgeRepository.awardBadge.mockResolvedValue(mockUserBadge);

      await service.awardBadge('project-1', 'badge-1', {
        userId: 'new-user',
      });

      expect(endUserRepository.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        externalId: 'new-user',
      });
    });

    it('should throw ConflictException if user already has badge', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(mockBadge);
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      userBadgeRepository.awardBadge.mockResolvedValue(null); // Already has badge

      await expect(
        service.awardBadge('project-1', 'badge-1', { userId: 'user-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if badge not found', async () => {
      badgeDefinitionRepository.findById.mockResolvedValue(null);

      await expect(
        service.awardBadge('project-1', 'badge-1', { userId: 'user-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserBadges (Trophy Case)', () => {
    it('should return badges with unlocked status for user', async () => {
      badgeDefinitionRepository.findActiveByProjectId.mockResolvedValue([
        mockBadge,
        mockHiddenBadge,
      ]);
      endUserRepository.findByExternalId.mockResolvedValue(mockEndUser);
      userBadgeRepository.findByEndUserIdWithDetails.mockResolvedValue([
        {
          ...mockUserBadge,
          badge: mockBadge,
        },
      ]);

      const result = await service.getUserBadges('project-1', 'user-1');

      expect(result.badges).toHaveLength(2);

      // First badge (PUBLIC, unlocked)
      expect(result.badges[0].isUnlocked).toBe(true);
      expect(result.badges[0].name).toBe('Bug Hunter');

      // Second badge (HIDDEN, locked)
      expect(result.badges[1].isUnlocked).toBe(false);
      expect(result.badges[1].name).toBe('???'); // Hidden badge shows ???

      // Stats
      expect(result.stats.total).toBe(2);
      expect(result.stats.unlocked).toBe(1);
      expect(result.stats.byRarity['RARE'].total).toBe(2);
      expect(result.stats.byRarity['RARE'].unlocked).toBe(1);
    });

    it('should return badges with no unlocks for new user', async () => {
      badgeDefinitionRepository.findActiveByProjectId.mockResolvedValue([mockBadge]);
      endUserRepository.findByExternalId.mockResolvedValue(null);

      const result = await service.getUserBadges('project-1', 'new-user');

      expect(result.badges).toHaveLength(1);
      expect(result.badges[0].isUnlocked).toBe(false);
      expect(result.stats.unlocked).toBe(0);
    });

    it('should filter badges by category', async () => {
      badgeDefinitionRepository.findByCategory.mockResolvedValue([mockBadge]);
      endUserRepository.findByExternalId.mockResolvedValue(null);

      const result = await service.getUserBadges('project-1', 'user-1', 'achievements');

      expect(badgeDefinitionRepository.findByCategory).toHaveBeenCalledWith(
        'project-1',
        'achievements',
      );
      expect(result.badges).toHaveLength(1);
    });
  });

  describe('getCategories', () => {
    it('should return distinct categories', async () => {
      badgeDefinitionRepository.getDistinctCategories.mockResolvedValue([
        'achievements',
        'milestones',
        'social',
      ]);

      const result = await service.getCategories('project-1');

      expect(result).toEqual(['achievements', 'milestones', 'social']);
    });
  });

  describe('getRecentAwards', () => {
    it('should return recent badge awards', async () => {
      userBadgeRepository.getRecentAwards.mockResolvedValue([
        {
          ...mockUserBadge,
          badge: mockBadge,
        },
      ]);

      const result = await service.getRecentAwards('project-1', 5);

      expect(result).toHaveLength(1);
      expect(result[0].badge.name).toBe('Bug Hunter');
      expect(userBadgeRepository.getRecentAwards).toHaveBeenCalledWith('project-1', 5);
    });
  });
});
