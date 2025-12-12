import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CampaignRepository,
  RuleRepository,
  Campaign,
  Rule,
} from '@boost/database';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/create-campaign.dto';
import { CreateRuleDto, UpdateRuleDto } from './dto/create-rule.dto';

export interface CampaignWithRules extends Campaign {
  rules: Rule[];
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly ruleRepository: RuleRepository,
  ) {}

  // ============================================
  // Campaign Operations
  // ============================================

  async createCampaign(
    projectId: string,
    dto: CreateCampaignDto,
  ): Promise<Campaign> {
    const { id } = await this.campaignRepository.create({
      projectId,
      name: dto.name,
      description: dto.description,
      active: dto.active,
      priority: dto.priority,
      schedule: dto.schedule as Record<string, unknown> | undefined,
      metadata: dto.metadata,
    });

    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error('Failed to create campaign');
    }

    return campaign;
  }

  async listCampaigns(projectId: string): Promise<Campaign[]> {
    return this.campaignRepository.findByProjectId(projectId);
  }

  async getCampaign(
    projectId: string,
    id: string,
  ): Promise<CampaignWithRules> {
    const campaign = await this.campaignRepository.findByIdWithRules(id);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return campaign;
  }

  async updateCampaign(
    projectId: string,
    id: string,
    dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.verifyCampaignAccess(projectId, id);

    await this.campaignRepository.update(campaign.id, {
      name: dto.name,
      description: dto.description,
      active: dto.active,
      priority: dto.priority,
      schedule: dto.schedule as Record<string, unknown> | undefined,
      metadata: dto.metadata,
    });

    const updated = await this.campaignRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to update campaign');
    }

    return updated;
  }

  async deleteCampaign(projectId: string, id: string): Promise<void> {
    const campaign = await this.verifyCampaignAccess(projectId, id);
    await this.campaignRepository.delete(campaign.id);
  }

  // ============================================
  // Rule Operations
  // ============================================

  async createRule(
    projectId: string,
    campaignId: string,
    dto: CreateRuleDto,
  ): Promise<Rule> {
    // Verify campaign access
    await this.verifyCampaignAccess(projectId, campaignId);

    const { id } = await this.ruleRepository.create({
      campaignId,
      projectId,
      name: dto.name,
      description: dto.description,
      active: dto.active,
      priority: dto.priority,
      eventTypes: dto.eventTypes,
      conditions: dto.conditions as unknown as Record<string, unknown>,
      effects: dto.effects as unknown as Record<string, unknown>[],
    });

    const rule = await this.ruleRepository.findById(id);
    if (!rule) {
      throw new Error('Failed to create rule');
    }

    return rule;
  }

  async listRules(projectId: string, campaignId: string): Promise<Rule[]> {
    await this.verifyCampaignAccess(projectId, campaignId);
    return this.ruleRepository.findByCampaignId(campaignId);
  }

  async getRule(
    projectId: string,
    campaignId: string,
    ruleId: string,
  ): Promise<Rule> {
    await this.verifyCampaignAccess(projectId, campaignId);
    return this.verifyRuleAccess(projectId, campaignId, ruleId);
  }

  async updateRule(
    projectId: string,
    campaignId: string,
    ruleId: string,
    dto: UpdateRuleDto,
  ): Promise<Rule> {
    await this.verifyCampaignAccess(projectId, campaignId);
    const rule = await this.verifyRuleAccess(projectId, campaignId, ruleId);

    await this.ruleRepository.update(rule.id, {
      name: dto.name,
      description: dto.description,
      active: dto.active,
      priority: dto.priority,
      eventTypes: dto.eventTypes,
      conditions: dto.conditions as Record<string, unknown> | undefined,
      effects: dto.effects as Record<string, unknown>[] | undefined,
    });

    const updated = await this.ruleRepository.findById(ruleId);
    if (!updated) {
      throw new Error('Failed to update rule');
    }

    return updated;
  }

  async deleteRule(
    projectId: string,
    campaignId: string,
    ruleId: string,
  ): Promise<void> {
    await this.verifyCampaignAccess(projectId, campaignId);
    const rule = await this.verifyRuleAccess(projectId, campaignId, ruleId);
    await this.ruleRepository.delete(rule.id);
  }

  // ============================================
  // Access Verification
  // ============================================

  private async verifyCampaignAccess(
    projectId: string,
    campaignId: string,
  ): Promise<Campaign> {
    const campaign = await this.campaignRepository.findById(campaignId);

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return campaign;
  }

  private async verifyRuleAccess(
    projectId: string,
    campaignId: string,
    ruleId: string,
  ): Promise<Rule> {
    const rule = await this.ruleRepository.findById(ruleId);

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    if (rule.projectId !== projectId || rule.campaignId !== campaignId) {
      throw new ForbiddenException('Access denied');
    }

    return rule;
  }
}
