import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  LoyaltyTierRepository,
  LoyaltyLedgerRepository,
  EndUserRepository,
  LoyaltyTier,
  LoyaltyLedgerEntry,
  EndUser,
} from '@boost/database';
import {
  CreateLoyaltyTierDto,
  UpdateLoyaltyTierDto,
  AddPointsDto,
  RedeemPointsDto,
} from './dto/loyalty.dto';

export interface CustomerProfile {
  userId: string;
  points: number;
  tier: {
    id: string;
    name: string;
    level: number;
    benefits: Record<string, unknown>;
    color?: string | null;
    iconUrl?: string | null;
  } | null;
  nextTier: {
    id: string;
    name: string;
    minPoints: number;
    pointsNeeded: number;
  } | null;
  summary: {
    totalEarned: number;
    totalRedeemed: number;
    transactionCount: number;
  };
}

export interface TransactionResult {
  success: boolean;
  entry: LoyaltyLedgerEntry;
  newBalance: number;
  tierUpgraded?: boolean;
  newTier?: {
    id: string;
    name: string;
    level: number;
  };
}

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly tierRepository: LoyaltyTierRepository,
    private readonly ledgerRepository: LoyaltyLedgerRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  // ============================================
  // Tier Management
  // ============================================

  async createTier(
    projectId: string,
    dto: CreateLoyaltyTierDto,
  ): Promise<LoyaltyTier> {
    // Check for duplicate name
    const tiers = await this.tierRepository.findByProjectId(projectId);
    const existing = tiers.find(
      (t) => t.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (existing) {
      throw new ConflictException(`Tier "${dto.name}" already exists`);
    }

    const { id } = await this.tierRepository.create({
      projectId,
      name: dto.name,
      minPoints: dto.minPoints,
      benefits: dto.benefits,
      level: dto.level,
      color: dto.color,
      iconUrl: dto.iconUrl,
      metadata: dto.metadata,
    });

    const tier = await this.tierRepository.findById(id);
    if (!tier) {
      throw new Error('Failed to create tier');
    }

    return tier;
  }

  async listTiers(projectId: string): Promise<LoyaltyTier[]> {
    return this.tierRepository.findByProjectId(projectId);
  }

  async getTier(projectId: string, id: string): Promise<LoyaltyTier> {
    const tier = await this.tierRepository.findById(id);

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    if (tier.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return tier;
  }

  async updateTier(
    projectId: string,
    id: string,
    dto: UpdateLoyaltyTierDto,
  ): Promise<LoyaltyTier> {
    const tier = await this.getTier(projectId, id);

    await this.tierRepository.update(tier.id, {
      name: dto.name,
      minPoints: dto.minPoints,
      benefits: dto.benefits,
      level: dto.level,
      color: dto.color,
      iconUrl: dto.iconUrl,
      metadata: dto.metadata,
    });

    const updated = await this.tierRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to update tier');
    }

    return updated;
  }

  async deleteTier(projectId: string, id: string): Promise<void> {
    const tier = await this.getTier(projectId, id);
    await this.tierRepository.delete(tier.id);
  }

  // ============================================
  // Points Management
  // ============================================

  async addPoints(
    projectId: string,
    dto: AddPointsDto,
  ): Promise<TransactionResult> {
    // Find or create end user
    const endUser = await this.endUserRepository.findOrCreate(
      projectId,
      dto.userId,
    );

    // Determine amount (positive for earn, negative for redeem)
    let amount = dto.amount;
    if (dto.type === 'redeem') {
      amount = -Math.abs(amount);
    }

    // Add transaction
    const entry = await this.ledgerRepository.addTransaction({
      projectId,
      endUserId: endUser.id,
      amount,
      type: dto.type,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      description: dto.description,
      metadata: dto.metadata,
    });

    // Check for tier upgrade
    const tierResult = await this.evaluateAndUpdateTier(projectId, endUser.id);

    return {
      success: true,
      entry,
      newBalance: entry.balance,
      ...tierResult,
    };
  }

  async redeemPoints(
    projectId: string,
    dto: RedeemPointsDto,
  ): Promise<TransactionResult> {
    // Find end user
    const endUser = await this.endUserRepository.findByExternalId(
      projectId,
      dto.userId,
    );

    if (!endUser) {
      throw new NotFoundException('User not found');
    }

    // Check balance
    if (endUser.loyaltyPoints < dto.amount) {
      throw new BadRequestException('Insufficient points balance');
    }

    // Add redemption transaction
    const entry = await this.ledgerRepository.addTransaction({
      projectId,
      endUserId: endUser.id,
      amount: -Math.abs(dto.amount),
      type: 'redeem',
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      description: dto.description || 'Points redemption',
    });

    return {
      success: true,
      entry,
      newBalance: entry.balance,
    };
  }

  // ============================================
  // Customer Profile
  // ============================================

  async getCustomerProfile(
    projectId: string,
    userId: string,
  ): Promise<CustomerProfile> {
    // Find or create end user
    const endUser = await this.endUserRepository.findOrCreate(
      projectId,
      userId,
    );

    // Get current tier
    let currentTier: LoyaltyTier | null = null;
    if (endUser.tierId) {
      currentTier = await this.tierRepository.findById(endUser.tierId);
    } else {
      // Auto-assign tier based on points
      currentTier = await this.tierRepository.findTierForPoints(
        projectId,
        endUser.loyaltyPoints,
      );
      if (currentTier) {
        await this.endUserRepository.updateTier(endUser.id, currentTier.id);
      }
    }

    // Get next tier
    const nextTier = await this.tierRepository.findNextTier(
      projectId,
      endUser.loyaltyPoints,
    );

    // Get summary
    const summary = await this.ledgerRepository.getSummary(endUser.id);

    return {
      userId,
      points: endUser.loyaltyPoints,
      tier: currentTier
        ? {
            id: currentTier.id,
            name: currentTier.name,
            level: currentTier.level,
            benefits: currentTier.benefits as Record<string, unknown>,
            color: currentTier.color,
            iconUrl: currentTier.iconUrl,
          }
        : null,
      nextTier: nextTier
        ? {
            id: nextTier.id,
            name: nextTier.name,
            minPoints: nextTier.minPoints,
            pointsNeeded: nextTier.minPoints - endUser.loyaltyPoints,
          }
        : null,
      summary: {
        totalEarned: summary.totalEarned,
        totalRedeemed: summary.totalRedeemed,
        transactionCount: summary.transactionCount,
      },
    };
  }

  async getCustomerHistory(
    projectId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    transactions: LoyaltyLedgerEntry[];
    total: number;
  }> {
    const endUser = await this.endUserRepository.findByExternalId(
      projectId,
      userId,
    );

    if (!endUser) {
      return { transactions: [], total: 0 };
    }

    const transactions = await this.ledgerRepository.findByEndUserId(
      endUser.id,
      limit,
      offset,
    );

    const summary = await this.ledgerRepository.getSummary(endUser.id);

    return {
      transactions,
      total: summary.transactionCount,
    };
  }

  // ============================================
  // Private Helpers
  // ============================================

  private async evaluateAndUpdateTier(
    projectId: string,
    endUserId: string,
  ): Promise<{
    tierUpgraded?: boolean;
    newTier?: { id: string; name: string; level: number };
  }> {
    const endUser = await this.endUserRepository.findById(endUserId);
    if (!endUser) {
      return {};
    }

    const qualifiedTier = await this.tierRepository.findTierForPoints(
      projectId,
      endUser.loyaltyPoints,
    );

    if (qualifiedTier && qualifiedTier.id !== endUser.tierId) {
      await this.endUserRepository.updateTier(endUserId, qualifiedTier.id);

      return {
        tierUpgraded: true,
        newTier: {
          id: qualifiedTier.id,
          name: qualifiedTier.name,
          level: qualifiedTier.level,
        },
      };
    }

    return {};
  }
}
