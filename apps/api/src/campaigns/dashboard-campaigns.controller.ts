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
  ForbiddenException,
} from '@nestjs/common';
import { SessionGuard, CurrentUser } from '@boost/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/create-campaign.dto';
import { CreateRuleDto, UpdateRuleDto } from './dto/create-rule.dto';
import { ProjectsService } from '../projects/projects.service';

/**
 * Dashboard campaigns controller - uses session authentication
 * Routes: /dashboard/projects/:projectId/campaigns
 */
@Controller('dashboard/projects/:projectId/campaigns')
@UseGuards(SessionGuard)
export class DashboardCampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly projectsService: ProjectsService,
  ) {}

  private async verifyAccess(userId: string, projectId: string): Promise<void> {
    const hasAccess = await this.projectsService.verifyProjectAccess(userId, projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this project');
    }
  }

  // ============================================
  // Campaign CRUD
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.createCampaign(projectId, dto);
  }

  @Get()
  async listCampaigns(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.listCampaigns(projectId);
  }

  @Get(':campaignId')
  async getCampaign(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.getCampaign(projectId, campaignId);
  }

  @Put(':campaignId')
  async updateCampaign(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.updateCampaign(projectId, campaignId, dto);
  }

  @Delete(':campaignId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCampaign(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
  ) {
    await this.verifyAccess(user.id, projectId);
    await this.campaignsService.deleteCampaign(projectId, campaignId);
  }

  // ============================================
  // Rule CRUD
  // ============================================

  @Post(':campaignId/rules')
  @HttpCode(HttpStatus.CREATED)
  async createRule(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateRuleDto,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.createRule(projectId, campaignId, dto);
  }

  @Get(':campaignId/rules')
  async listRules(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.listRules(projectId, campaignId);
  }

  @Get(':campaignId/rules/:ruleId')
  async getRule(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.getRule(projectId, campaignId, ruleId);
  }

  @Put(':campaignId/rules/:ruleId')
  async updateRule(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateRuleDto,
  ) {
    await this.verifyAccess(user.id, projectId);
    return this.campaignsService.updateRule(projectId, campaignId, ruleId, dto);
  }

  @Delete(':campaignId/rules/:ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRule(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('campaignId') campaignId: string,
    @Param('ruleId') ruleId: string,
  ) {
    await this.verifyAccess(user.id, projectId);
    await this.campaignsService.deleteRule(projectId, campaignId, ruleId);
  }
}
