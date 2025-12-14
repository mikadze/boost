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
import { BadgesService } from './badges.service';
import {
  CreateBadgeDto,
  UpdateBadgeDto,
  AwardBadgeDto,
  CustomerBadgeQueryDto,
} from './dto/badge.dto';

/**
 * Admin Badge Management Controller
 * All endpoints require API key authentication
 */
@Controller('badges')
@UseGuards(ApiKeyGuard)
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // ============================================
  // Badge Definition CRUD Endpoints
  // ============================================

  /**
   * POST /badges
   * Create a new badge definition (Story 3.3: Badge Builder)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBadge(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateBadgeDto,
  ) {
    return this.badgesService.createBadge(projectId, dto);
  }

  /**
   * GET /badges
   * List all badges for the project
   */
  @Get()
  async listBadges(@CurrentProjectId() projectId: string) {
    return this.badgesService.listBadges(projectId);
  }

  /**
   * GET /badges/active
   * List all active badges
   */
  @Get('active')
  async listActiveBadges(@CurrentProjectId() projectId: string) {
    return this.badgesService.listActiveBadges(projectId);
  }

  /**
   * GET /badges/categories
   * Get all distinct badge categories
   */
  @Get('categories')
  async getCategories(@CurrentProjectId() projectId: string) {
    return this.badgesService.getCategories(projectId);
  }

  /**
   * GET /badges/recent-awards
   * Get recent badge awards (admin dashboard)
   */
  @Get('recent-awards')
  async getRecentAwards(
    @CurrentProjectId() projectId: string,
    @Query('limit') limit?: string,
  ) {
    return this.badgesService.getRecentAwards(projectId, limit ? parseInt(limit, 10) : 10);
  }

  /**
   * GET /badges/:id
   * Get a specific badge
   */
  @Get(':id')
  async getBadge(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.badgesService.getBadge(projectId, id);
  }

  /**
   * PUT /badges/:id
   * Update a badge
   */
  @Put(':id')
  async updateBadge(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBadgeDto,
  ) {
    return this.badgesService.updateBadge(projectId, id, dto);
  }

  /**
   * DELETE /badges/:id
   * Delete a badge
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBadge(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.badgesService.deleteBadge(projectId, id);
  }

  /**
   * POST /badges/:id/activate
   * Activate a badge
   */
  @Post(':id/activate')
  async activateBadge(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.badgesService.activateBadge(projectId, id);
  }

  /**
   * POST /badges/:id/deactivate
   * Deactivate a badge
   */
  @Post(':id/deactivate')
  async deactivateBadge(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.badgesService.deactivateBadge(projectId, id);
  }

  /**
   * POST /badges/:id/award
   * Manually award a badge to a user (Story 3.6: Admin Grant Tool)
   */
  @Post(':id/award')
  @HttpCode(HttpStatus.CREATED)
  async awardBadge(
    @CurrentProjectId() projectId: string,
    @Param('id') badgeId: string,
    @Body() dto: AwardBadgeDto,
  ) {
    return this.badgesService.awardBadge(projectId, badgeId, dto);
  }
}

/**
 * Public-facing customer API (v1/customer/badges)
 * These endpoints are meant to be called by the SDK for BadgeGrid
 * Story 3.4: SDK Component (BadgeGrid)
 */
@Controller('v1/customer/badges')
@UseGuards(ApiKeyGuard)
export class CustomerBadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  /**
   * GET /v1/customer/badges
   * Get user's badge collection (Trophy Case)
   * Used by useBadges() hook and <BadgeGrid/>
   */
  @Get()
  async getUserBadges(
    @CurrentProjectId() projectId: string,
    @Query() query: CustomerBadgeQueryDto,
  ) {
    return this.badgesService.getUserBadges(projectId, query.userId, query.category);
  }

  /**
   * GET /v1/customer/badges/categories
   * Get available badge categories for filtering
   */
  @Get('categories')
  async getCategories(@CurrentProjectId() projectId: string) {
    return this.badgesService.getCategories(projectId);
  }
}
