import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard, CurrentUser } from '@boost/common';
import { ProjectsService } from './projects.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('projects')
@UseGuards(SessionGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * GET /projects/:projectId/stats/summary
   * Get project stats summary (total events, first event date, active campaigns)
   * Used by dashboard to determine whether to show setup guide or analytics
   */
  @Get(':projectId/stats/summary')
  async getStatsSummary(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    await this.projectsService.verifyProjectAccess(user.id, projectId);
    return this.projectsService.getStatsSummary(projectId);
  }

  /**
   * GET /projects/:projectId/events/recent
   * Get recent events for a project
   * Used by setup guide to verify event ingestion
   */
  @Get(':projectId/events/recent')
  async getRecentEvents(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    await this.projectsService.verifyProjectAccess(user.id, projectId);
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    // Validate limit is a valid number between 1 and 100
    const eventLimit = Number.isNaN(parsedLimit) ? 10 : Math.min(Math.max(1, parsedLimit), 100);
    return this.projectsService.getRecentEvents(projectId, eventLimit);
  }

  /**
   * POST /projects/:projectId/events/test
   * Send a test event for a project (session-authenticated)
   * Used by setup guide to verify integration without requiring an API key
   */
  @Post(':projectId/events/test')
  async sendTestEvent(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    await this.projectsService.verifyProjectAccess(user.id, projectId);
    return this.projectsService.sendTestEvent(projectId, user.id);
  }

  /**
   * GET /projects/:projectId/api-keys
   * List all API keys for a project
   */
  @Get(':projectId/api-keys')
  async listApiKeys(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    // Verify user has access to this project
    await this.projectsService.verifyProjectAccess(user.id, projectId);
    return this.projectsService.listApiKeys(projectId);
  }

  /**
   * POST /projects/:projectId/api-keys
   * Create a new API key for a project
   *
   * Key types:
   * - 'publishable' (pk_live_*): Client-side SDK, can only send behavioral events
   * - 'secret' (sk_live_*): Server-side SDK, can send all events including financial
   */
  @Post(':projectId/api-keys')
  async createApiKey(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    // Verify user has access to this project
    await this.projectsService.verifyProjectAccess(user.id, projectId);
    return this.projectsService.createApiKey(projectId, dto.name, dto.scopes, dto.type);
  }
}

@Controller('api-keys')
@UseGuards(SessionGuard)
export class ApiKeysController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * DELETE /api-keys/:keyId
   * Revoke an API key
   */
  @Delete(':keyId')
  async revokeApiKey(
    @CurrentUser() user: { id: string },
    @Param('keyId') keyId: string,
  ) {
    await this.projectsService.revokeApiKeyWithOwnershipCheck(user.id, keyId);
    return { success: true };
  }
}
