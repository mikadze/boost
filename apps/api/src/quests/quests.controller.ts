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
import { QuestsService } from './quests.service';
import {
  CreateQuestDto,
  UpdateQuestDto,
  CreateQuestStepDto,
  UpdateQuestStepDto,
} from './dto/quest.dto';

@Controller('quests')
@UseGuards(ApiKeyGuard)
export class QuestsController {
  constructor(private readonly questsService: QuestsService) {}

  // ============================================
  // Quest CRUD Endpoints
  // ============================================

  /**
   * POST /quests
   * Create a new quest with optional steps
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createQuest(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateQuestDto,
  ) {
    return this.questsService.createQuest(projectId, dto);
  }

  /**
   * GET /quests
   * List all quests for the project
   */
  @Get()
  async listQuests(@CurrentProjectId() projectId: string) {
    return this.questsService.listQuests(projectId);
  }

  /**
   * GET /quests/active
   * List all active (published) quests
   */
  @Get('active')
  async listActiveQuests(@CurrentProjectId() projectId: string) {
    return this.questsService.listActiveQuests(projectId);
  }

  /**
   * GET /quests/:id
   * Get a specific quest with its steps
   */
  @Get(':id')
  async getQuest(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.questsService.getQuest(projectId, id);
  }

  /**
   * PUT /quests/:id
   * Update a quest
   */
  @Put(':id')
  async updateQuest(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestDto,
  ) {
    return this.questsService.updateQuest(projectId, id, dto);
  }

  /**
   * DELETE /quests/:id
   * Delete a quest
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuest(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.questsService.deleteQuest(projectId, id);
  }

  /**
   * POST /quests/:id/publish
   * Publish a quest (make it active)
   */
  @Post(':id/publish')
  async publishQuest(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.questsService.publishQuest(projectId, id);
  }

  /**
   * POST /quests/:id/unpublish
   * Unpublish a quest (make it inactive)
   */
  @Post(':id/unpublish')
  async unpublishQuest(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.questsService.unpublishQuest(projectId, id);
  }

  // ============================================
  // Quest Step Endpoints
  // ============================================

  /**
   * GET /quests/:id/steps
   * Get all steps for a quest
   */
  @Get(':id/steps')
  async getSteps(
    @CurrentProjectId() projectId: string,
    @Param('id') questId: string,
  ) {
    return this.questsService.getSteps(projectId, questId);
  }

  /**
   * POST /quests/:id/steps
   * Add a step to a quest
   */
  @Post(':id/steps')
  @HttpCode(HttpStatus.CREATED)
  async addStep(
    @CurrentProjectId() projectId: string,
    @Param('id') questId: string,
    @Body() dto: CreateQuestStepDto,
  ) {
    return this.questsService.addStep(projectId, questId, dto);
  }

  /**
   * PUT /quests/:questId/steps/:stepId
   * Update a step
   */
  @Put(':questId/steps/:stepId')
  async updateStep(
    @CurrentProjectId() projectId: string,
    @Param('questId') questId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateQuestStepDto,
  ) {
    return this.questsService.updateStep(projectId, questId, stepId, dto);
  }

  /**
   * DELETE /quests/:questId/steps/:stepId
   * Delete a step
   */
  @Delete(':questId/steps/:stepId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStep(
    @CurrentProjectId() projectId: string,
    @Param('questId') questId: string,
    @Param('stepId') stepId: string,
  ) {
    await this.questsService.deleteStep(projectId, questId, stepId);
  }
}

/**
 * Public-facing customer API (v1/customer/quests)
 * These endpoints are meant to be called by the SDK for QuestWidget
 * Issue #28: SDK Component (<QuestWidget />)
 */
@Controller('v1/customer/quests')
@UseGuards(ApiKeyGuard)
export class CustomerQuestsController {
  constructor(private readonly questsService: QuestsService) {}

  /**
   * GET /v1/customer/quests
   * Get all active quests with user progress
   * Used by useQuest() hook and <QuestWidget/>
   */
  @Get()
  async getUserQuests(
    @CurrentProjectId() projectId: string,
    @Query('userId') userId: string,
  ) {
    return this.questsService.getUserQuests(projectId, userId);
  }

  /**
   * GET /v1/customer/quests/:questId
   * Get progress for a specific quest
   */
  @Get(':questId')
  async getUserQuestProgress(
    @CurrentProjectId() projectId: string,
    @Query('userId') userId: string,
    @Param('questId') questId: string,
  ) {
    return this.questsService.getUserQuestProgress(projectId, userId, questId);
  }
}
