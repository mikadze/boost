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
import { LoyaltyService } from './loyalty.service';
import {
  CreateLoyaltyTierDto,
  UpdateLoyaltyTierDto,
  AddPointsDto,
  RedeemPointsDto,
} from './dto/loyalty.dto';

@Controller('loyalty')
@UseGuards(ApiKeyGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // ============================================
  // Tier Management
  // ============================================

  /**
   * POST /loyalty/tiers
   * Create a new loyalty tier
   */
  @Post('tiers')
  @HttpCode(HttpStatus.CREATED)
  async createTier(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateLoyaltyTierDto,
  ) {
    return this.loyaltyService.createTier(projectId, dto);
  }

  /**
   * GET /loyalty/tiers
   * List all loyalty tiers
   */
  @Get('tiers')
  async listTiers(@CurrentProjectId() projectId: string) {
    return this.loyaltyService.listTiers(projectId);
  }

  /**
   * GET /loyalty/tiers/:id
   * Get a specific tier
   */
  @Get('tiers/:id')
  async getTier(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.loyaltyService.getTier(projectId, id);
  }

  /**
   * PUT /loyalty/tiers/:id
   * Update a tier
   */
  @Put('tiers/:id')
  async updateTier(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLoyaltyTierDto,
  ) {
    return this.loyaltyService.updateTier(projectId, id, dto);
  }

  /**
   * DELETE /loyalty/tiers/:id
   * Delete a tier
   */
  @Delete('tiers/:id')
  async deleteTier(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.loyaltyService.deleteTier(projectId, id);
    return { success: true };
  }

  // ============================================
  // Points Management
  // ============================================

  /**
   * POST /loyalty/points
   * Add points to a user
   */
  @Post('points')
  @HttpCode(HttpStatus.CREATED)
  async addPoints(
    @CurrentProjectId() projectId: string,
    @Body() dto: AddPointsDto,
  ) {
    return this.loyaltyService.addPoints(projectId, dto);
  }

  /**
   * POST /loyalty/redeem
   * Redeem points from a user
   */
  @Post('redeem')
  async redeemPoints(
    @CurrentProjectId() projectId: string,
    @Body() dto: RedeemPointsDto,
  ) {
    return this.loyaltyService.redeemPoints(projectId, dto);
  }

  // ============================================
  // Customer Endpoints (Public API)
  // ============================================

  /**
   * GET /loyalty/customer/:userId/profile
   * Get customer loyalty profile
   */
  @Get('customer/:userId/profile')
  async getCustomerProfile(
    @CurrentProjectId() projectId: string,
    @Param('userId') userId: string,
  ) {
    return this.loyaltyService.getCustomerProfile(projectId, userId);
  }

  /**
   * GET /loyalty/customer/:userId/history
   * Get customer transaction history
   */
  @Get('customer/:userId/history')
  async getCustomerHistory(
    @CurrentProjectId() projectId: string,
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.loyaltyService.getCustomerHistory(
      projectId,
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}

/**
 * Public-facing customer API (v1/customer)
 * These endpoints are meant to be called by the SDK
 */
@Controller('v1/customer')
@UseGuards(ApiKeyGuard)
export class CustomerLoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * GET /v1/customer/profile
   * Get current user's loyalty profile
   */
  @Get('profile')
  async getProfile(
    @CurrentProjectId() projectId: string,
    @Query('userId') userId: string,
  ) {
    return this.loyaltyService.getCustomerProfile(projectId, userId);
  }

  /**
   * GET /v1/customer/history
   * Get current user's transaction history
   */
  @Get('history')
  async getHistory(
    @CurrentProjectId() projectId: string,
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.loyaltyService.getCustomerHistory(
      projectId,
      userId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
