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

export interface AffiliateProfile {
  userId: string;
  referralCode: string | null;
  commissionPlan: {
    id: string;
    name: string;
    type: string;
    value: number;
  } | null;
  stats: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    referralCount: number;
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

  async getAffiliateProfile(
    projectId: string,
    userId: string,
  ): Promise<AffiliateProfile> {
    // Find or create end user
    const endUser = await this.endUserRepository.findOrCreate(projectId, userId);

    // Get commission plan if assigned
    let commissionPlan: CommissionPlan | null = null;
    if (endUser.commissionPlanId) {
      commissionPlan = await this.commissionPlanRepository.findById(endUser.commissionPlanId);
    } else {
      // Use default plan if available
      commissionPlan = await this.commissionPlanRepository.findDefaultForProject(projectId);
    }

    // Get commission summary
    const summary = await this.commissionLedgerRepository.getSummaryByEndUser(endUser.id);

    // Get referral count
    const referralCount = await this.referralTrackingRepository.countByReferrerId(endUser.id);

    return {
      userId,
      referralCode: endUser.referralCode,
      commissionPlan: commissionPlan
        ? {
            id: commissionPlan.id,
            name: commissionPlan.name,
            type: commissionPlan.type,
            value: commissionPlan.value,
          }
        : null,
      stats: {
        totalEarned: summary.totalEarned,
        totalPending: summary.totalPending,
        totalPaid: summary.totalPaid,
        referralCount,
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
}
