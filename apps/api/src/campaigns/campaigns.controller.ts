import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard, CurrentProjectId } from '@boost/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/create-campaign.dto';
import { CreateRuleDto, UpdateRuleDto } from './dto/create-rule.dto';

@Controller('campaigns')
@UseGuards(ApiKeyGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ============================================
  // Campaign CRUD
  // ============================================

  /**
   * POST /campaigns
   * Create a new campaign
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.createCampaign(projectId, dto);
  }

  /**
   * GET /campaigns
   * List all campaigns for the project
   */
  @Get()
  async listCampaigns(@CurrentProjectId() projectId: string) {
    return this.campaignsService.listCampaigns(projectId);
  }

  /**
   * GET /campaigns/:id
   * Get a specific campaign with its rules
   */
  @Get(':id')
  async getCampaign(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.campaignsService.getCampaign(projectId, id);
  }

  /**
   * PUT /campaigns/:id
   * Update a campaign
   */
  @Put(':id')
  async updateCampaign(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.updateCampaign(projectId, id, dto);
  }

  /**
   * DELETE /campaigns/:id
   * Delete a campaign
   */
  @Delete(':id')
  async deleteCampaign(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.campaignsService.deleteCampaign(projectId, id);
    return { success: true };
  }

  // ============================================
  // Rule CRUD (nested under campaigns)
  // ============================================

  /**
   * POST /campaigns/:campaignId/rules
   * Create a new rule in a campaign
   */
  @Post(':campaignId/rules')
  @HttpCode(HttpStatus.CREATED)
  async createRule(
    @CurrentProjectId() projectId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateRuleDto,
  ) {
    return this.campaignsService.createRule(projectId, campaignId, dto);
  }

  /**
   * GET /campaigns/:campaignId/rules
   * List all rules in a campaign
   */
  @Get(':campaignId/rules')
  async listRules(
    @CurrentProjectId() projectId: string,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignsService.listRules(projectId, campaignId);
  }

  /**
   * GET /campaigns/:campaignId/rules/:ruleId
   * Get a specific rule
   */
  @Get(':campaignId/rules/:ruleId')
  async getRule(
    @CurrentProjectId() projectId: string,
    @Param('campaignId') campaignId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.campaignsService.getRule(projectId, campaignId, ruleId);
  }

  /**
   * PUT /campaigns/:campaignId/rules/:ruleId
   * Update a rule
   */
  @Put(':campaignId/rules/:ruleId')
  async updateRule(
    @CurrentProjectId() projectId: string,
    @Param('campaignId') campaignId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateRuleDto,
  ) {
    return this.campaignsService.updateRule(projectId, campaignId, ruleId, dto);
  }

  /**
   * DELETE /campaigns/:campaignId/rules/:ruleId
   * Delete a rule
   */
  @Delete(':campaignId/rules/:ruleId')
  async deleteRule(
    @CurrentProjectId() projectId: string,
    @Param('campaignId') campaignId: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.campaignsService.deleteRule(projectId, campaignId, ruleId);
    return { success: true };
  }
}
