import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import {
  CommissionPlanRepository,
  CommissionLedgerRepository,
  ReferralTrackingRepository,
  EndUserRepository,
  CommissionPlan,
  CommissionLedgerEntry,
  ReferralTracking,
  CommissionStatus,
} from '@boost/database';
import {
  CreateCommissionPlanDto,
  UpdateCommissionPlanDto,
  CreateReferralDto,
  RecordCommissionDto,
} from './dto/affiliate.dto';

/**
 * SDK-compatible affiliate stats response
 * Matches @gamifyio/core AffiliateStatsResponse type
 */
export interface AffiliateStatsResponse {
  stats: {
    userId: string;
    referralCode: string | null;
    referralCount: number;
    earnings: {
      totalEarned: number;
      totalPending: number;
      totalPaid: number;
      transactionCount: number;
      currency: string;
    };
    tier: {
      id: string;
      name: string;
      type: 'PERCENTAGE' | 'FIXED';
      value: number;
    } | null;
  };
}

@Injectable()
export class AffiliatesService {
  constructor(
    private readonly commissionPlanRepository: CommissionPlanRepository,
    private readonly commissionLedgerRepository: CommissionLedgerRepository,
    private readonly referralTrackingRepository: ReferralTrackingRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  // ============================================
  // Commission Plan Management
  // ============================================

  async createPlan(
    projectId: string,
    dto: CreateCommissionPlanDto,
  ): Promise<CommissionPlan> {
    // Check for duplicate name
    const plans = await this.commissionPlanRepository.findByProjectId(projectId);
    const existing = plans.find(
      (p) => p.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (existing) {
      throw new ConflictException(`Plan "${dto.name}" already exists`);
    }

    return this.commissionPlanRepository.create({
      projectId,
      name: dto.name,
      description: dto.description,
      type: dto.type,
      value: dto.value,
      currency: dto.currency,
      isDefault: dto.isDefault,
      active: dto.active,
      metadata: dto.metadata,
    });
  }

  async listPlans(projectId: string): Promise<CommissionPlan[]> {
    return this.commissionPlanRepository.findByProjectId(projectId);
  }

  async listActivePlans(projectId: string): Promise<CommissionPlan[]> {
    return this.commissionPlanRepository.findActiveByProjectId(projectId);
  }

  async getPlan(projectId: string, id: string): Promise<CommissionPlan> {
    const plan = await this.commissionPlanRepository.findById(id);

    if (!plan) {
      throw new NotFoundException('Commission plan not found');
    }

    if (plan.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return plan;
  }

  async updatePlan(
    projectId: string,
    id: string,
    dto: UpdateCommissionPlanDto,
  ): Promise<CommissionPlan> {
    const plan = await this.getPlan(projectId, id);

    const updated = await this.commissionPlanRepository.update(plan.id, {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      value: dto.value,
      currency: dto.currency,
      isDefault: dto.isDefault,
      active: dto.active,
      metadata: dto.metadata,
    });

    if (!updated) {
      throw new Error('Failed to update commission plan');
    }

    return updated;
  }

  async deletePlan(projectId: string, id: string): Promise<void> {
    const plan = await this.getPlan(projectId, id);
    await this.commissionPlanRepository.delete(plan.id);
  }

  async setDefaultPlan(projectId: string, id: string): Promise<CommissionPlan> {
    const plan = await this.getPlan(projectId, id);

    const updated = await this.commissionPlanRepository.update(plan.id, {
      isDefault: true,
    });

    if (!updated) {
      throw new Error('Failed to set default plan');
    }

    return updated;
  }

  // ============================================
  // Referral Tracking
  // ============================================

  async createReferral(
    projectId: string,
    dto: CreateReferralDto,
  ): Promise<ReferralTracking> {
    // Check if referral already exists for this referred user
    const existing = await this.referralTrackingRepository.exists(
      projectId,
      dto.referredExternalId,
    );

    if (existing) {
      throw new ConflictException('Referral already exists for this user');
    }

    // Verify referrer exists
    const referrer = await this.endUserRepository.findById(dto.referrerId);
    if (!referrer || referrer.projectId !== projectId) {
      throw new NotFoundException('Referrer not found');
    }

    return this.referralTrackingRepository.create({
      projectId,
      referrerId: dto.referrerId,
      referredExternalId: dto.referredExternalId,
      referralCode: dto.referralCode,
      source: dto.source,
    });
  }

  async listReferrals(
    projectId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ReferralTracking[]> {
    return this.referralTrackingRepository.findByProjectId(projectId, limit, offset);
  }

  async getReferralsByReferrer(
    referrerId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ReferralTracking[]> {
    return this.referralTrackingRepository.findByReferrerId(referrerId, limit, offset);
  }

  async countReferralsByReferrer(referrerId: string): Promise<number> {
    return this.referralTrackingRepository.countByReferrerId(referrerId);
  }

  // ============================================
  // Commission Management
  // ============================================

  async recordCommission(
    projectId: string,
    dto: RecordCommissionDto,
  ): Promise<CommissionLedgerEntry> {
    // Find or create end user
    const endUser = await this.endUserRepository.findOrCreate(
      projectId,
      dto.userId,
    );

    // Verify commission plan exists
    const plan = await this.getPlan(projectId, dto.commissionPlanId);

    return this.commissionLedgerRepository.create({
      projectId,
      endUserId: endUser.id,
      commissionPlanId: plan.id,
      amount: dto.amount,
      sourceAmount: dto.sourceAmount,
      sourceEventId: dto.sourceEventId,
      orderId: dto.orderId,
      referredUserId: dto.referredUserId,
      currency: dto.currency,
      notes: dto.notes,
      metadata: dto.metadata,
    });
  }

  async listCommissions(
    projectId: string,
    status?: CommissionStatus,
    limit: number = 100,
    offset: number = 0,
  ): Promise<CommissionLedgerEntry[]> {
    if (status) {
      return this.commissionLedgerRepository.findByStatus(projectId, status, limit, offset);
    }
    return this.commissionLedgerRepository.findByProjectId(projectId, limit, offset);
  }

  async getCommissionsByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<CommissionLedgerEntry[]> {
    return this.commissionLedgerRepository.findByEndUserId(userId, limit, offset);
  }

  async markCommissionPaid(
    projectId: string,
    id: string,
    notes?: string,
  ): Promise<CommissionLedgerEntry> {
    const commission = await this.commissionLedgerRepository.findById(id);

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    if (commission.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.commissionLedgerRepository.updateStatus(id, 'PAID', notes);

    if (!updated) {
      throw new Error('Failed to update commission status');
    }

    return updated;
  }

  async rejectCommission(
    projectId: string,
    id: string,
    notes?: string,
  ): Promise<CommissionLedgerEntry> {
    const commission = await this.commissionLedgerRepository.findById(id);

    if (!commission) {
      throw new NotFoundException('Commission not found');
    }

    if (commission.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    const updated = await this.commissionLedgerRepository.updateStatus(id, 'REJECTED', notes);

    if (!updated) {
      throw new Error('Failed to update commission status');
    }

    return updated;
  }

  // ============================================
  // Customer/SDK Endpoints
  // ============================================

  /**
   * Generate a unique referral code
   * Format: 6 characters alphanumeric (e.g., "ABC123")
   */
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I, O, 0, 1
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a unique referral code, retrying if collision
   */
  private async generateUniqueReferralCode(projectId: string, maxAttempts = 5): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateReferralCode();
      const existing = await this.endUserRepository.findByReferralCode(projectId, code);
      if (!existing) {
        return code;
      }
    }
    // Fallback: use timestamp-based code
    return `${this.generateReferralCode()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
  }

  async getAffiliateProfile(
    projectId: string,
    userId: string,
  ): Promise<AffiliateStatsResponse> {
    // Find or create end user
    const endUser = await this.endUserRepository.findOrCreate(projectId, userId);

    // Guard: Generate referral code if not set (fallback for users created before auto-gen)
    let referralCode = endUser.referralCode;
    if (!referralCode) {
      referralCode = await this.generateUniqueReferralCode(projectId);
      await this.endUserRepository.update(endUser.id, { referralCode });
    }

    // Get commission plan if assigned (used as tier)
    let commissionPlan: CommissionPlan | null = null;
    if (endUser.commissionPlanId) {
      commissionPlan = await this.commissionPlanRepository.findById(endUser.commissionPlanId);
    } else {
      // Use default plan if available
      commissionPlan = await this.commissionPlanRepository.findDefaultForProject(projectId);
    }

    // Get commission summary (includes transactionCount)
    const summary = await this.commissionLedgerRepository.getSummaryByEndUser(endUser.id);

    // Get referral count
    const referralCount = await this.referralTrackingRepository.countByReferrerId(endUser.id);

    // Return SDK-compatible format
    return {
      stats: {
        userId,
        referralCode,
        referralCount,
        earnings: {
          totalEarned: summary.totalEarned,
          totalPending: summary.totalPending,
          totalPaid: summary.totalPaid,
          transactionCount: summary.transactionCount,
          currency: 'USD', // Default currency
        },
        tier: commissionPlan
          ? {
              id: commissionPlan.id,
              name: commissionPlan.name,
              type: commissionPlan.type as 'PERCENTAGE' | 'FIXED',
              value: commissionPlan.value,
            }
          : null,
      },
    };
  }

  async getCustomerReferrals(
    projectId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    referrals: ReferralTracking[];
    total: number;
  }> {
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);

    if (!endUser) {
      return { referrals: [], total: 0 };
    }

    const referrals = await this.referralTrackingRepository.findByReferrerId(
      endUser.id,
      limit,
      offset,
    );

    const total = await this.referralTrackingRepository.countByReferrerId(endUser.id);

    return { referrals, total };
  }

  async getCustomerCommissions(
    projectId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    commissions: CommissionLedgerEntry[];
    total: number;
  }> {
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);

    if (!endUser) {
      return { commissions: [], total: 0 };
    }

    const commissions = await this.commissionLedgerRepository.findByEndUserId(
      endUser.id,
      limit,
      offset,
    );

    const count = await this.commissionLedgerRepository.countByEndUser(endUser.id);

    return { commissions, total: count };
  }

  async getLeaderboard(
    projectId: string,
    limit: number = 10,
  ): Promise<{
    entries: Array<{
      rank: number;
      referralCode: string | null;
      referralCount: number;
      totalEarned: number;
    }>;
  }> {
    // Get top affiliates by referral count
    const topAffiliates = await this.referralTrackingRepository.getTopReferrers(
      projectId,
      limit,
    );

    const entries = await Promise.all(
      topAffiliates.map(async (affiliate, index) => {
        const summary = await this.commissionLedgerRepository.getSummaryByEndUser(
          affiliate.referrerId,
        );

        const endUser = await this.endUserRepository.findById(affiliate.referrerId);

        return {
          rank: index + 1,
          referralCode: endUser?.referralCode ?? null,
          referralCount: affiliate.count,
          totalEarned: summary.totalEarned,
        };
      }),
    );

    return { entries };
  }
}
