import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
   */
  @Post(':projectId/api-keys')
  async createApiKey(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    // Verify user has access to this project
    await this.projectsService.verifyProjectAccess(user.id, projectId);
    return this.projectsService.createApiKey(projectId, dto.name, dto.scopes);
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
