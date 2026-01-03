import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard, CurrentProjectId } from '@boost/common';
import { AffiliatesService } from './affiliates.service';
import {
  CreateCommissionPlanDto,
  UpdateCommissionPlanDto,
  CreateReferralDto,
  RecordCommissionDto,
  UpdateCommissionStatusDto,
  CommissionQueryDto,
  CustomerAffiliateQueryDto,
} from './dto/affiliate.dto';
import { CommissionStatus } from '@boost/database';

@Controller('affiliates')
@UseGuards(ApiKeyGuard)
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  // ============================================
  // Commission Plan Management
  // ============================================

  /**
   * POST /affiliates/plans
   * Create a new commission plan
   */
  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateCommissionPlanDto,
  ) {
    return this.affiliatesService.createPlan(projectId, dto);
  }

  /**
   * GET /affiliates/plans
   * List all commission plans
   */
  @Get('plans')
  async listPlans(@CurrentProjectId() projectId: string) {
    return this.affiliatesService.listPlans(projectId);
  }

  /**
   * GET /affiliates/plans/active
   * List active commission plans only
   */
  @Get('plans/active')
  async listActivePlans(@CurrentProjectId() projectId: string) {
    return this.affiliatesService.listActivePlans(projectId);
  }

  /**
   * GET /affiliates/plans/:id
   * Get a specific commission plan
   */
  @Get('plans/:id')
  async getPlan(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.affiliatesService.getPlan(projectId, id);
  }

  /**
   * PUT /affiliates/plans/:id
   * Update a commission plan
   */
  @Put('plans/:id')
  async updatePlan(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommissionPlanDto,
  ) {
    return this.affiliatesService.updatePlan(projectId, id, dto);
  }

  /**
   * DELETE /affiliates/plans/:id
   * Delete a commission plan
   */
  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePlan(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.affiliatesService.deletePlan(projectId, id);
  }

  /**
   * POST /affiliates/plans/:id/set-default
   * Set a plan as the project default
   */
  @Post('plans/:id/set-default')
  async setDefaultPlan(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.affiliatesService.setDefaultPlan(projectId, id);
  }

  // ============================================
  // Referral Tracking
  // ============================================

  /**
   * POST /affiliates/referrals
   * Record a new referral
   */
  @Post('referrals')
  @HttpCode(HttpStatus.CREATED)
  async createReferral(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateReferralDto,
  ) {
    return this.affiliatesService.createReferral(projectId, dto);
  }

  /**
   * GET /affiliates/referrals
   * List all referrals for the project
   */
  @Get('referrals')
  async listReferrals(
    @CurrentProjectId() projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.affiliatesService.listReferrals(
      projectId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /**
   * GET /affiliates/referrals/by-referrer/:userId
   * Get referrals by a specific referrer
   */
  @Get('referrals/by-referrer/:userId')
  async getReferralsByReferrer(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.affiliatesService.getReferralsByReferrer(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  // ============================================
  // Commission Management
  // ============================================

  /**
   * POST /affiliates/commissions
   * Record a new commission
   */
  @Post('commissions')
  @HttpCode(HttpStatus.CREATED)
  async recordCommission(
    @CurrentProjectId() projectId: string,
    @Body() dto: RecordCommissionDto,
  ) {
    return this.affiliatesService.recordCommission(projectId, dto);
  }

  /**
   * GET /affiliates/commissions
   * List all commissions (optionally filtered by status)
   */
  @Get('commissions')
  async listCommissions(
    @CurrentProjectId() projectId: string,
    @Query() query: CommissionQueryDto,
  ) {
    return this.affiliatesService.listCommissions(
      projectId,
      query.status as CommissionStatus | undefined,
      query.limit ? parseInt(query.limit, 10) : 100,
      query.offset ? parseInt(query.offset, 10) : 0,
    );
  }

  /**
   * GET /affiliates/commissions/by-user/:userId
   * Get commissions for a specific user
   */
  @Get('commissions/by-user/:userId')
  async getCommissionsByUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.affiliatesService.getCommissionsByUser(
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  /**
   * POST /affiliates/commissions/:id/pay
   * Mark a commission as paid
   */
  @Post('commissions/:id/pay')
  async markCommissionPaid(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommissionStatusDto,
  ) {
    return this.affiliatesService.markCommissionPaid(projectId, id, dto.notes);
  }

  /**
   * POST /affiliates/commissions/:id/reject
   * Reject a commission
   */
  @Post('commissions/:id/reject')
  async rejectCommission(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommissionStatusDto,
  ) {
    return this.affiliatesService.rejectCommission(projectId, id, dto.notes);
  }
}

/**
 * Public-facing customer API (v1/customer/affiliate)
 * These endpoints are meant to be called by the SDK
 */
@Controller('v1/customer/affiliate')
@UseGuards(ApiKeyGuard)
export class CustomerAffiliateController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  /**
   * GET /v1/customer/affiliate/profile
   * Get affiliate profile and stats
   */
  @Get('profile')
  async getProfile(
    @CurrentProjectId() projectId: string,
    @Query() query: CustomerAffiliateQueryDto,
  ) {
    return this.affiliatesService.getAffiliateProfile(projectId, query.userId);
  }

  /**
   * GET /v1/customer/affiliate/referrals
   * Get user's referrals
   */
  @Get('referrals')
  async getReferrals(
    @CurrentProjectId() projectId: string,
    @Query() query: CustomerAffiliateQueryDto,
  ) {
    return this.affiliatesService.getCustomerReferrals(
      projectId,
      query.userId,
      query.limit ? parseInt(query.limit, 10) : 50,
      query.offset ? parseInt(query.offset, 10) : 0,
    );
  }

  /**
   * GET /v1/customer/affiliate/commissions
   * Get user's commission history
   */
  @Get('commissions')
  async getCommissions(
    @CurrentProjectId() projectId: string,
    @Query() query: CustomerAffiliateQueryDto,
  ) {
    return this.affiliatesService.getCustomerCommissions(
      projectId,
      query.userId,
      query.limit ? parseInt(query.limit, 10) : 50,
      query.offset ? parseInt(query.offset, 10) : 0,
    );
  }
}
