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
import { StreaksService } from './streaks.service';
import {
  CreateStreakRuleDto,
  UpdateStreakRuleDto,
  CustomerStreakQueryDto,
  UseFreezeDto,
} from './dto/streak.dto';

/**
 * Admin Streak Management Controller
 * All endpoints require API key authentication
 */
@Controller('streaks')
@UseGuards(ApiKeyGuard)
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  // ============================================
  // Streak Rule CRUD Endpoints
  // ============================================

  /**
   * POST /streaks/rules
   * Create a new streak rule
   */
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  async createStreakRule(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateStreakRuleDto,
  ) {
    return this.streaksService.createStreakRule(projectId, dto);
  }

  /**
   * GET /streaks/rules
   * List all streak rules for the project
   */
  @Get('rules')
  async listStreakRules(@CurrentProjectId() projectId: string) {
    return this.streaksService.listStreakRules(projectId);
  }

  /**
   * GET /streaks/rules/active
   * List only active streak rules
   */
  @Get('rules/active')
  async listActiveStreakRules(@CurrentProjectId() projectId: string) {
    return this.streaksService.listActiveStreakRules(projectId);
  }

  /**
   * GET /streaks/rules/:id
   * Get a specific streak rule
   */
  @Get('rules/:id')
  async getStreakRule(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.streaksService.getStreakRule(projectId, id);
  }

  /**
   * PUT /streaks/rules/:id
   * Update a streak rule
   */
  @Put('rules/:id')
  async updateStreakRule(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStreakRuleDto,
  ) {
    return this.streaksService.updateStreakRule(projectId, id, dto);
  }

  /**
   * DELETE /streaks/rules/:id
   * Delete a streak rule
   */
  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStreakRule(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.streaksService.deleteStreakRule(projectId, id);
  }
}

/**
 * Public-facing customer API (v1/customer/streaks)
 * These endpoints are meant to be called by the SDK for StreakFlame
 */
@Controller('v1/customer/streaks')
@UseGuards(ApiKeyGuard)
export class CustomerStreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  /**
   * GET /v1/customer/streaks
   * Get user's active streaks with progress
   * Used by useStreaks() hook and <StreakFlame/> component
   */
  @Get()
  async getUserStreaks(
    @CurrentProjectId() projectId: string,
    @Query() query: CustomerStreakQueryDto,
  ) {
    return this.streaksService.getUserStreaks(projectId, query.userId);
  }

  /**
   * POST /v1/customer/streaks/:ruleId/freeze
   * Use a freeze token to protect a streak
   */
  @Post(':ruleId/freeze')
  async useFreeze(
    @CurrentProjectId() projectId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UseFreezeDto,
  ) {
    return this.streaksService.useFreeze(projectId, dto.userId, ruleId);
  }
}
