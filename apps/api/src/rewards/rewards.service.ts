import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  RewardItemRepository,
  RedemptionTransactionRepository,
  EndUserRepository,
  RewardItem,
  RedemptionTransaction,
  RewardFulfillmentType,
} from '@boost/database';
import {
  CreateRewardItemDto,
  UpdateRewardItemDto,
  RedeemRewardDto,
} from './dto/rewards.dto';
import * as crypto from 'crypto';

export interface StoreItem extends RewardItem {
  availability: {
    available: boolean;
    reason?: 'out_of_stock' | 'insufficient_points' | 'missing_badge' | 'inactive';
    pointsNeeded?: number;
    requiredBadgeId?: string;
  };
}

export interface CustomerStore {
  userId: string;
  balance: number;
  items: StoreItem[];
}

export interface RedemptionResult {
  success: boolean;
  transaction?: RedemptionTransaction;
  fulfillmentData?: Record<string, unknown>;
  newBalance?: number;
  error?: string;
}

export interface WebhookPayload {
  event: 'redemption.success';
  redemptionId: string;
  userId: string;
  rewardId: string;
  rewardSku: string | null;
  rewardName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly rewardItemRepository: RewardItemRepository,
    private readonly redemptionRepository: RedemptionTransactionRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  // ============================================
  // Reward Item Management (Admin)
  // ============================================

  async createRewardItem(
    projectId: string,
    dto: CreateRewardItemDto,
  ): Promise<RewardItem> {
    // Check for duplicate SKU if provided
    if (dto.sku) {
      const existing = await this.rewardItemRepository.findBySku(projectId, dto.sku);
      if (existing) {
        throw new ConflictException(`Reward item with SKU "${dto.sku}" already exists`);
      }
    }

    const { id } = await this.rewardItemRepository.create({
      projectId,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      sku: dto.sku,
      costPoints: dto.costPoints,
      stockQuantity: dto.stockQuantity,
      prerequisiteBadgeId: dto.prerequisiteBadgeId,
      fulfillmentType: dto.fulfillmentType as RewardFulfillmentType,
      fulfillmentConfig: dto.fulfillmentConfig,
      active: dto.active,
      displayOrder: dto.displayOrder,
      metadata: dto.metadata,
    });

    const item = await this.rewardItemRepository.findById(id);
    if (!item) {
      throw new Error('Failed to create reward item');
    }

    return item;
  }

  async listRewardItems(
    projectId: string,
    options: { activeOnly?: boolean; limit?: number; offset?: number } = {},
  ): Promise<RewardItem[]> {
    return this.rewardItemRepository.findByProjectId(projectId, options);
  }

  async getRewardItem(projectId: string, id: string): Promise<RewardItem> {
    const item = await this.rewardItemRepository.findById(id);

    if (!item) {
      throw new NotFoundException('Reward item not found');
    }

    if (item.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return item;
  }

  async updateRewardItem(
    projectId: string,
    id: string,
    dto: UpdateRewardItemDto,
  ): Promise<RewardItem> {
    const item = await this.getRewardItem(projectId, id);

    // Check for duplicate SKU if changing
    if (dto.sku && dto.sku !== item.sku) {
      const existing = await this.rewardItemRepository.findBySku(projectId, dto.sku);
      if (existing) {
        throw new ConflictException(`Reward item with SKU "${dto.sku}" already exists`);
      }
    }

    await this.rewardItemRepository.update(item.id, {
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      sku: dto.sku,
      costPoints: dto.costPoints,
      stockQuantity: dto.stockQuantity,
      prerequisiteBadgeId: dto.prerequisiteBadgeId,
      fulfillmentType: dto.fulfillmentType as RewardFulfillmentType | undefined,
      fulfillmentConfig: dto.fulfillmentConfig,
      active: dto.active,
      displayOrder: dto.displayOrder,
      metadata: dto.metadata,
    });

    const updated = await this.rewardItemRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to update reward item');
    }

    return updated;
  }

  async deleteRewardItem(projectId: string, id: string): Promise<void> {
    const item = await this.getRewardItem(projectId, id);
    await this.rewardItemRepository.delete(item.id);
  }

  // ============================================
  // Customer Store (Public API)
  // ============================================

  async getCustomerStore(
    projectId: string,
    userId: string,
    userBadges: string[] = [],
  ): Promise<CustomerStore> {
    // Get or create end user
    const endUser = await this.endUserRepository.findOrCreate(projectId, userId);

    // Get available items
    const items = await this.rewardItemRepository.findAvailableItems(projectId);

    // Map items with availability status
    const storeItems: StoreItem[] = items.map((item) => ({
      ...item,
      availability: this.checkItemAvailability(item, endUser.loyaltyPoints, userBadges),
    }));

    return {
      userId,
      balance: endUser.loyaltyPoints,
      items: storeItems,
    };
  }

  private checkItemAvailability(
    item: RewardItem,
    userPoints: number,
    userBadges: string[],
  ): StoreItem['availability'] {
    if (!item.active) {
      return { available: false, reason: 'inactive' };
    }

    if (item.stockQuantity !== null && item.stockQuantity <= 0) {
      return { available: false, reason: 'out_of_stock' };
    }

    if (userPoints < item.costPoints) {
      return {
        available: false,
        reason: 'insufficient_points',
        pointsNeeded: item.costPoints - userPoints,
      };
    }

    if (item.prerequisiteBadgeId && !userBadges.includes(item.prerequisiteBadgeId)) {
      return {
        available: false,
        reason: 'missing_badge',
        requiredBadgeId: item.prerequisiteBadgeId,
      };
    }

    return { available: true };
  }

  // ============================================
  // Redemption Processing (Atomic Transaction)
  // ============================================

  async redeemReward(
    projectId: string,
    dto: RedeemRewardDto,
    userBadges: string[] = [],
  ): Promise<RedemptionResult> {
    // Get the reward item
    const item = await this.rewardItemRepository.findById(dto.rewardItemId);
    if (!item) {
      throw new NotFoundException('Reward item not found');
    }

    if (item.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    // Get or create end user
    const endUser = await this.endUserRepository.findOrCreate(projectId, dto.userId);

    // Check availability
    const availability = this.checkItemAvailability(item, endUser.loyaltyPoints, userBadges);
    if (!availability.available) {
      throw new BadRequestException(this.getAvailabilityErrorMessage(availability));
    }

    // Execute atomic redemption
    const result = await this.redemptionRepository.createAtomicRedemption({
      projectId,
      endUserId: endUser.id,
      rewardItemId: item.id,
      costAtTime: item.costPoints,
      metadata: dto.metadata,
    });

    if (!result.success) {
      throw new BadRequestException(result.error || 'Redemption failed');
    }

    // Process fulfillment asynchronously (don't block the response)
    this.processFulfillment(result.transaction!, item).catch((err) => {
      this.logger.error(`Fulfillment failed for transaction ${result.transaction!.id}: ${err.message}`);
    });

    // Get new balance
    const updatedUser = await this.endUserRepository.findById(endUser.id);

    return {
      success: true,
      transaction: result.transaction,
      newBalance: updatedUser?.loyaltyPoints ?? 0,
    };
  }

  private getAvailabilityErrorMessage(
    availability: StoreItem['availability'],
  ): string {
    switch (availability.reason) {
      case 'inactive':
        return 'This reward is no longer available';
      case 'out_of_stock':
        return 'This reward is out of stock';
      case 'insufficient_points':
        return `Insufficient points. You need ${availability.pointsNeeded} more points`;
      case 'missing_badge':
        return `This reward requires badge: ${availability.requiredBadgeId}`;
      default:
        return 'Redemption not available';
    }
  }

  // ============================================
  // Fulfillment Processing
  // ============================================

  private async processFulfillment(
    transaction: RedemptionTransaction,
    item: RewardItem,
  ): Promise<void> {
    try {
      const fulfillmentType = item.fulfillmentType as RewardFulfillmentType;
      const config = item.fulfillmentConfig as Record<string, unknown>;

      switch (fulfillmentType) {
        case 'PROMO_CODE':
          await this.processPromoCodeFulfillment(transaction, config);
          break;
        case 'WEBHOOK':
          await this.processWebhookFulfillment(transaction, item, config);
          break;
        case 'MANUAL':
          // Manual fulfillment - just mark as processing, admin will handle
          this.logger.log(`Manual fulfillment required for transaction ${transaction.id}`);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Fulfillment error for ${transaction.id}: ${errorMessage}`);
      await this.redemptionRepository.markFailed(transaction.id, errorMessage);
    }
  }

  private async processPromoCodeFulfillment(
    transaction: RedemptionTransaction,
    config: Record<string, unknown>,
  ): Promise<void> {
    const codes = config.codes as string[] | undefined;
    if (!codes || codes.length === 0) {
      throw new Error('No promo codes available');
    }

    // Get a code from the pool (simple round-robin or random)
    const codeIndex = Math.floor(Math.random() * codes.length);
    const code = codes[codeIndex];

    await this.redemptionRepository.markCompleted(transaction.id, {
      promoCode: code,
      deliveredAt: new Date().toISOString(),
    });
  }

  private async processWebhookFulfillment(
    transaction: RedemptionTransaction,
    item: RewardItem,
    config: Record<string, unknown>,
  ): Promise<void> {
    const webhookUrl = config.url as string;
    const webhookSecret = config.secret as string | undefined;

    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const payload: WebhookPayload = {
      event: 'redemption.success',
      redemptionId: transaction.id,
      userId: transaction.endUserId,
      rewardId: item.id,
      rewardSku: item.sku,
      rewardName: item.name,
      timestamp: new Date().toISOString(),
      metadata: transaction.metadata as Record<string, unknown> | undefined,
    };

    const signature = webhookSecret
      ? this.generateHmacSignature(JSON.stringify(payload), webhookSecret)
      : undefined;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers as Record<string, string> | undefined),
    };

    if (signature) {
      headers['X-Boost-Signature'] = signature;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const retries = transaction.webhookRetries;
      if (retries < 3) {
        await this.redemptionRepository.incrementWebhookRetry(transaction.id);
        throw new Error(`Webhook failed with status ${response.status}`);
      } else {
        await this.redemptionRepository.markFailed(
          transaction.id,
          `Webhook failed after ${retries + 1} attempts: ${response.status}`,
        );
      }
      return;
    }

    await this.redemptionRepository.markCompleted(transaction.id, {
      webhookStatus: response.status,
      deliveredAt: new Date().toISOString(),
    });
  }

  private generateHmacSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // ============================================
  // Redemption History
  // ============================================

  async getRedemptions(
    projectId: string,
    options: { status?: 'PROCESSING' | 'COMPLETED' | 'FAILED'; limit?: number; offset?: number } = {},
  ): Promise<RedemptionTransaction[]> {
    return this.redemptionRepository.findByProjectId(projectId, {
      status: options.status,
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    });
  }

  async getRedemption(projectId: string, id: string): Promise<RedemptionTransaction> {
    const transaction = await this.redemptionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException('Redemption not found');
    }

    if (transaction.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return transaction;
  }

  async getCustomerRedemptions(
    projectId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ redemptions: RedemptionTransaction[]; total: number }> {
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);

    if (!endUser) {
      return { redemptions: [], total: 0 };
    }

    const redemptions = await this.redemptionRepository.findByEndUserId(
      endUser.id,
      limit,
      offset,
    );

    const stats = await this.redemptionRepository.getRedemptionStats(projectId);

    return {
      redemptions,
      total: stats.total,
    };
  }

  async getRedemptionStats(projectId: string): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
  }> {
    return this.redemptionRepository.getRedemptionStats(projectId);
  }

  // ============================================
  // Manual Fulfillment (Admin)
  // ============================================

  async markRedemptionCompleted(
    projectId: string,
    id: string,
    fulfillmentData?: Record<string, unknown>,
  ): Promise<RedemptionTransaction> {
    const transaction = await this.getRedemption(projectId, id);

    if (transaction.status === 'COMPLETED') {
      throw new BadRequestException('Redemption already completed');
    }

    await this.redemptionRepository.markCompleted(id, fulfillmentData);

    const updated = await this.redemptionRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to update redemption');
    }

    return updated;
  }

  async markRedemptionFailed(
    projectId: string,
    id: string,
    errorMessage: string,
  ): Promise<RedemptionTransaction> {
    const transaction = await this.getRedemption(projectId, id);

    if (transaction.status === 'COMPLETED') {
      throw new BadRequestException('Cannot fail a completed redemption');
    }

    await this.redemptionRepository.markFailed(id, errorMessage);

    const updated = await this.redemptionRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to update redemption');
    }

    return updated;
  }
}
