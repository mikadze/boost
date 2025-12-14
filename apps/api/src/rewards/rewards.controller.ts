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
import { RewardsService } from './rewards.service';
import {
  CreateRewardItemDto,
  UpdateRewardItemDto,
  RedeemRewardDto,
  QueryRedemptionsDto,
  CompleteRedemptionDto,
  FailRedemptionDto,
} from './dto/rewards.dto';

@Controller('rewards')
@UseGuards(ApiKeyGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // ============================================
  // Reward Item Management (Admin)
  // ============================================

  /**
   * POST /rewards/items
   * Create a new reward item
   */
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async createRewardItem(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateRewardItemDto,
  ) {
    return this.rewardsService.createRewardItem(projectId, dto);
  }

  /**
   * GET /rewards/items
   * List all reward items
   */
  @Get('items')
  async listRewardItems(
    @CurrentProjectId() projectId: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.rewardsService.listRewardItems(projectId, {
      activeOnly: activeOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * GET /rewards/items/:id
   * Get a specific reward item
   */
  @Get('items/:id')
  async getRewardItem(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.rewardsService.getRewardItem(projectId, id);
  }

  /**
   * PUT /rewards/items/:id
   * Update a reward item
   */
  @Put('items/:id')
  async updateRewardItem(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRewardItemDto,
  ) {
    return this.rewardsService.updateRewardItem(projectId, id, dto);
  }

  /**
   * DELETE /rewards/items/:id
   * Delete a reward item
   */
  @Delete('items/:id')
  async deleteRewardItem(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.rewardsService.deleteRewardItem(projectId, id);
    return { success: true };
  }

  // ============================================
  // Redemption Management (Admin)
  // ============================================

  /**
   * POST /rewards/redeem
   * Redeem a reward (admin endpoint)
   */
  @Post('redeem')
  @HttpCode(HttpStatus.CREATED)
  async redeemReward(
    @CurrentProjectId() projectId: string,
    @Body() dto: RedeemRewardDto,
  ) {
    return this.rewardsService.redeemReward(projectId, dto);
  }

  /**
   * GET /rewards/redemptions
   * List all redemptions
   */
  @Get('redemptions')
  async listRedemptions(
    @CurrentProjectId() projectId: string,
    @Query() query: QueryRedemptionsDto,
  ) {
    return this.rewardsService.getRedemptions(projectId, {
      status: query.status,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      offset: query.offset ? parseInt(query.offset, 10) : undefined,
    });
  }

  /**
   * GET /rewards/redemptions/stats
   * Get redemption statistics
   */
  @Get('redemptions/stats')
  async getRedemptionStats(@CurrentProjectId() projectId: string) {
    return this.rewardsService.getRedemptionStats(projectId);
  }

  /**
   * GET /rewards/redemptions/:id
   * Get a specific redemption
   */
  @Get('redemptions/:id')
  async getRedemption(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.rewardsService.getRedemption(projectId, id);
  }

  /**
   * POST /rewards/redemptions/:id/complete
   * Manually mark a redemption as completed (for MANUAL fulfillment)
   */
  @Post('redemptions/:id/complete')
  async completeRedemption(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: CompleteRedemptionDto,
  ) {
    return this.rewardsService.markRedemptionCompleted(
      projectId,
      id,
      dto.fulfillmentData,
    );
  }

  /**
   * POST /rewards/redemptions/:id/fail
   * Manually mark a redemption as failed
   */
  @Post('redemptions/:id/fail')
  async failRedemption(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: FailRedemptionDto,
  ) {
    return this.rewardsService.markRedemptionFailed(projectId, id, dto.errorMessage);
  }
}

/**
 * Public-facing customer API for Rewards Store (v1/customer)
 * These endpoints are meant to be called by the SDK
 */
@Controller('v1/customer')
@UseGuards(ApiKeyGuard)
export class CustomerRewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * GET /v1/customer/store
   * Get the rewards store with availability for the current user
   */
  @Get('store')
  async getStore(
    @CurrentProjectId() projectId: string,
    @Query('userId') userId: string,
    @Query('badges') badges?: string, // Comma-separated badge IDs
  ) {
    const userBadges = badges ? badges.split(',').map((b) => b.trim()) : [];
    return this.rewardsService.getCustomerStore(projectId, userId, userBadges);
  }

  /**
   * POST /v1/customer/store/redeem
   * Redeem a reward from the store
   */
  @Post('store/redeem')
  @HttpCode(HttpStatus.CREATED)
  async redeemReward(
    @CurrentProjectId() projectId: string,
    @Body() dto: RedeemRewardDto,
    @Query('badges') badges?: string, // Comma-separated badge IDs for validation
  ) {
    const userBadges = badges ? badges.split(',').map((b) => b.trim()) : [];
    return this.rewardsService.redeemReward(projectId, dto, userBadges);
  }

  /**
   * GET /v1/customer/redemptions
   * Get current user's redemption history
   */
  @Get('redemptions')
  async getRedemptions(
    @CurrentProjectId() projectId: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.rewardsService.getCustomerRedemptions(
      projectId,
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
