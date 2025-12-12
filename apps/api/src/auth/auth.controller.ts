import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  SessionGuard,
  ApiKeyService,
  CurrentOrganizationId,
} from '@boost/common';
import { ProjectRepository } from '@boost/database';

/**
 * API Key Management Controller
 * Protected by SessionGuard (human authentication)
 * Used by dashboard to manage API keys for projects
 */
@Controller('auth/api-keys')
@UseGuards(SessionGuard)
export class AuthController {
  constructor(
    private apiKeyService: ApiKeyService,
    private projectRepository: ProjectRepository,
  ) {}

  /**
   * Verify that a project belongs to the user's organization
   */
  private async verifyProjectAccess(
    projectId: string,
    organizationId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findByIdAndOrganization(
      projectId,
      organizationId,
    );
    if (!project) {
      throw new ForbiddenException(
        'Project not found or does not belong to your organization',
      );
    }
  }

  @Post()
  async createKey(
    @CurrentOrganizationId() organizationId: string,
    @Body() body: { projectId: string; scopes?: string[] },
  ) {
    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }

    // Verify the user has access to this project via their organization
    await this.verifyProjectAccess(body.projectId, organizationId);

    const rawKey = await this.apiKeyService.createKey(
      body.projectId,
      body.scopes || [],
    );
    return {
      key: rawKey,
      prefix: rawKey.substring(0, 12),
      message: 'Store this key safely. You will not be able to see it again.',
    };
  }

  @Get(':projectId')
  async listKeys(
    @Param('projectId') projectId: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
    // Verify the user has access to this project via their organization
    await this.verifyProjectAccess(projectId, organizationId);

    return this.apiKeyService.listKeys(projectId);
  }

  @Delete(':projectId/:keyId')
  async revokeKey(
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
    @CurrentOrganizationId() organizationId: string,
  ) {
    // Verify the user has access to this project via their organization
    await this.verifyProjectAccess(projectId, organizationId);

    const deleted = await this.apiKeyService.revokeKey(keyId, projectId);
    if (!deleted) {
      throw new NotFoundException('API Key not found or not owned by this project');
    }
    return { message: 'API Key revoked successfully' };
  }
}
