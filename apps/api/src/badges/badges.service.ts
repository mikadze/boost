import { Injectable, NotFoundException, Logger, Inject, ConflictException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError, throwError } from 'rxjs';
import {
  BadgeDefinitionRepository,
  UserBadgeRepository,
  EndUserRepository,
  BadgeDefinition,
  UserBadge,
  UserBadgeWithDetails,
} from '@boost/database';
import { CreateBadgeDto, UpdateBadgeDto, AwardBadgeDto } from './dto/badge.dto';

export interface BadgeUnlockedEvent {
  projectId: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  rarity: string;
  visibility: string;
  unlockedAt: string;
  awardSource: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    private readonly badgeDefinitionRepository: BadgeDefinitionRepository,
    private readonly userBadgeRepository: UserBadgeRepository,
    private readonly endUserRepository: EndUserRepository,
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
  ) {}

  // ============================================
  // Badge Definition CRUD Operations
  // ============================================

  async createBadge(projectId: string, dto: CreateBadgeDto): Promise<BadgeDefinition> {
    this.logger.log(`Creating badge: ${dto.name} for project: ${projectId}`);

    const badge = await this.badgeDefinitionRepository.create({
      projectId,
      name: dto.name,
      description: dto.description,
      iconUrl: dto.iconUrl,
      imageUrl: dto.imageUrl,
      rarity: dto.rarity ?? 'COMMON',
      visibility: dto.visibility ?? 'PUBLIC',
      category: dto.category,
      ruleType: dto.ruleType ?? 'METRIC_THRESHOLD',
      triggerMetric: dto.triggerMetric,
      threshold: dto.threshold,
      active: dto.active ?? true,
      metadata: dto.metadata,
    });

    return badge;
  }

  async listBadges(projectId: string): Promise<BadgeDefinition[]> {
    return this.badgeDefinitionRepository.findByProjectId(projectId);
  }

  async listActiveBadges(projectId: string): Promise<BadgeDefinition[]> {
    return this.badgeDefinitionRepository.findActiveByProjectId(projectId);
  }

  async getBadge(projectId: string, badgeId: string): Promise<BadgeDefinition> {
    const badge = await this.badgeDefinitionRepository.findById(badgeId);

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    if (badge.projectId !== projectId) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    return badge;
  }

  async updateBadge(
    projectId: string,
    badgeId: string,
    dto: UpdateBadgeDto,
  ): Promise<BadgeDefinition> {
    const badge = await this.badgeDefinitionRepository.findById(badgeId);

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    if (badge.projectId !== projectId) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    const updated = await this.badgeDefinitionRepository.update(badgeId, dto);
    if (!updated) {
      throw new Error('Failed to update badge');
    }

    return updated;
  }

  async deleteBadge(projectId: string, badgeId: string): Promise<void> {
    const badge = await this.badgeDefinitionRepository.findById(badgeId);

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    if (badge.projectId !== projectId) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    await this.badgeDefinitionRepository.delete(badgeId);
    this.logger.log(`Deleted badge: ${badgeId}`);
  }

  async activateBadge(projectId: string, badgeId: string): Promise<BadgeDefinition> {
    const badge = await this.badgeDefinitionRepository.findById(badgeId);

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    if (badge.projectId !== projectId) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    const activated = await this.badgeDefinitionRepository.activate(badgeId);
    if (!activated) {
      throw new Error('Failed to activate badge');
    }

    this.logger.log(`Activated badge: ${badgeId}`);
    return activated;
  }

  async deactivateBadge(projectId: string, badgeId: string): Promise<BadgeDefinition> {
    const badge = await this.badgeDefinitionRepository.findById(badgeId);

    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    if (badge.projectId !== projectId) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    const deactivated = await this.badgeDefinitionRepository.deactivate(badgeId);
    if (!deactivated) {
      throw new Error('Failed to deactivate badge');
    }

    this.logger.log(`Deactivated badge: ${badgeId}`);
    return deactivated;
  }

  // ============================================
  // Badge Award Operations
  // ============================================

  /**
   * Manually award a badge to a user (Admin Grant Tool - Story 3.6)
   */
  async awardBadge(
    projectId: string,
    badgeId: string,
    dto: AwardBadgeDto,
  ): Promise<UserBadge> {
    // Verify badge exists and belongs to project
    const badge = await this.badgeDefinitionRepository.findById(badgeId);
    if (!badge) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }
    if (badge.projectId !== projectId) {
      throw new NotFoundException(`Badge ${badgeId} not found`);
    }

    // Find or create end user
    let endUser = await this.endUserRepository.findByExternalId(projectId, dto.userId);
    if (!endUser) {
      endUser = await this.endUserRepository.create({
        projectId,
        externalId: dto.userId,
      });
    }

    // Award badge (idempotent - returns null if already awarded)
    const userBadge = await this.userBadgeRepository.awardBadge({
      projectId,
      endUserId: endUser.id,
      badgeId,
      awardSource: 'MANUAL',
      awardedBy: dto.awardedBy,
      metadata: {
        ...dto.metadata,
        badgeSnapshot: {
          name: badge.name,
          rarity: badge.rarity,
          category: badge.category,
        },
      },
    });

    if (!userBadge) {
      throw new ConflictException('User already has this badge');
    }

    // Emit badge.unlocked event for notifications (Story 3.5)
    await this.emitBadgeUnlockedEvent(projectId, dto.userId, badge, userBadge, 'MANUAL');

    this.logger.log(`Manually awarded badge ${badgeId} to user ${dto.userId}`);
    return userBadge;
  }

  /**
   * Emit badge.unlocked event to Kafka for downstream processing
   * (notifications, unlock moment toast, etc.)
   */
  private async emitBadgeUnlockedEvent(
    projectId: string,
    userId: string,
    badge: BadgeDefinition,
    userBadge: UserBadge,
    awardSource: string,
  ): Promise<void> {
    const event: BadgeUnlockedEvent = {
      projectId,
      userId,
      badgeId: badge.id,
      badgeName: badge.name,
      rarity: badge.rarity,
      visibility: badge.visibility,
      unlockedAt: userBadge.unlockedAt.toISOString(),
      awardSource,
      metadata: userBadge.metadata as Record<string, unknown> | undefined,
    };

    try {
      await lastValueFrom(
        this.kafkaClient
          .emit('badge.unlocked', {
            key: projectId,
            value: event,
          })
          .pipe(
            timeout(3000),
            catchError((err) => {
              this.logger.error(`Failed to emit badge.unlocked event:`, err);
              return throwError(() => err);
            }),
          ),
      );
      this.logger.debug(`Emitted badge.unlocked event for badge ${badge.id}`);
    } catch {
      // Don't fail the award if Kafka emit fails
      this.logger.warn(`Badge.unlocked event failed to emit, but badge was awarded`);
    }
  }

  // ============================================
  // SDK/Customer Methods (Story 3.4: BadgeGrid)
  // ============================================

  /**
   * Get user's badge collection (Trophy Case)
   * Returns all badges with unlocked status for badge grid display
   */
  async getUserBadges(projectId: string, userId: string, category?: string): Promise<{
    badges: Array<{
      id: string;
      name: string;
      description: string | null;
      iconUrl: string | null;
      imageUrl: string | null;
      rarity: string;
      visibility: string;
      category: string | null;
      isUnlocked: boolean;
      unlockedAt: string | null;
    }>;
    stats: {
      total: number;
      unlocked: number;
      byRarity: Record<string, { total: number; unlocked: number }>;
    };
  }> {
    // Get all active badges for project (optionally filtered by category)
    let allBadges: BadgeDefinition[];
    if (category) {
      allBadges = await this.badgeDefinitionRepository.findByCategory(projectId, category);
      // Filter to only active
      allBadges = allBadges.filter(b => b.active);
    } else {
      allBadges = await this.badgeDefinitionRepository.findActiveByProjectId(projectId);
    }

    // Find end user and their badges
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);
    let userBadges: UserBadgeWithDetails[] = [];

    if (endUser) {
      userBadges = await this.userBadgeRepository.findByEndUserIdWithDetails(endUser.id);
    }

    // Create map of unlocked badges
    const unlockedMap = new Map(userBadges.map(ub => [ub.badgeId, ub]));

    // Build response with visibility rules:
    // - PUBLIC: always shown (grayscale if locked)
    // - HIDDEN: only shown if unlocked (silhouette/?? if locked)
    const badges = allBadges.map(badge => {
      const unlockedBadge = unlockedMap.get(badge.id);
      const isUnlocked = !!unlockedBadge;

      return {
        id: badge.id,
        name: badge.visibility === 'HIDDEN' && !isUnlocked ? '???' : badge.name,
        description: badge.visibility === 'HIDDEN' && !isUnlocked ? null : badge.description,
        iconUrl: badge.iconUrl,
        imageUrl: badge.imageUrl,
        rarity: badge.rarity,
        visibility: badge.visibility,
        category: badge.category,
        isUnlocked,
        unlockedAt: unlockedBadge?.unlockedAt.toISOString() ?? null,
      };
    });

    // Calculate stats
    const stats = {
      total: allBadges.length,
      unlocked: userBadges.filter(ub => allBadges.some(b => b.id === ub.badgeId)).length,
      byRarity: {} as Record<string, { total: number; unlocked: number }>,
    };

    // Calculate by rarity
    for (const badge of allBadges) {
      if (!stats.byRarity[badge.rarity]) {
        stats.byRarity[badge.rarity] = { total: 0, unlocked: 0 };
      }
      const rarityStats = stats.byRarity[badge.rarity]!;
      rarityStats.total++;
      if (unlockedMap.has(badge.id)) {
        rarityStats.unlocked++;
      }
    }

    return { badges, stats };
  }

  /**
   * Get categories for filtering
   */
  async getCategories(projectId: string): Promise<string[]> {
    return this.badgeDefinitionRepository.getDistinctCategories(projectId);
  }

  /**
   * Get recent badge awards (admin dashboard)
   */
  async getRecentAwards(projectId: string, limit: number = 10): Promise<UserBadgeWithDetails[]> {
    return this.userBadgeRepository.getRecentAwards(projectId, limit);
  }

  // ============================================
  // Module Lifecycle
  // ============================================

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log('BadgesService: Kafka client connected');
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
    this.logger.log('BadgesService: Kafka client disconnected');
  }
}
