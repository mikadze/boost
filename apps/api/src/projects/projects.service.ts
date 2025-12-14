import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  ProjectRepository,
  OrganizationRepository,
  ApiKeyRepository,
  ApiKeyType,
  EventRepository,
  CampaignRepository,
} from '@boost/database';
import { ApiKeyService } from '@boost/common';

export interface ProjectStatsSummary {
  totalEvents: number;
  firstEventAt: string | null;
  activeCampaigns: number;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly organizationRepo: OrganizationRepository,
    private readonly apiKeyService: ApiKeyService,
    private readonly apiKeyRepo: ApiKeyRepository,
    private readonly eventRepo: EventRepository,
    private readonly campaignRepo: CampaignRepository,
  ) {}

  /**
   * Verify user has access to a project (through organization membership)
   */
  async verifyProjectAccess(userId: string, projectId: string) {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.organizationRepo.isMember(userId, project.organizationId);
    if (!member) {
      throw new ForbiddenException('Not authorized to access this project');
    }

    return project;
  }

  /**
   * List API keys for a project
   */
  async listApiKeys(projectId: string) {
    const keys = await this.apiKeyService.listKeys(projectId);
    // Map to expected frontend format
    return keys.map((key) => ({
      id: key.id,
      name: key.prefix, // Using prefix as display name
      projectId: projectId, // Use the parameter since we queried by project
      keyPrefix: key.prefix,
      type: key.type, // publishable or secret
      createdAt: key.createdAt.toISOString(),
      lastUsedAt: key.lastUsedAt?.toISOString(),
    }));
  }

  /**
   * Create a new API key for a project
   *
   * @param projectId - Project to create the key for
   * @param name - Display name for the key
   * @param scopes - Optional scopes for the key
   * @param type - Key type: 'publishable' for client-side, 'secret' for server-side
   */
  async createApiKey(
    projectId: string,
    name: string,
    scopes: string[] = [],
    type: ApiKeyType = 'secret',
  ) {
    const rawKey = await this.apiKeyService.createKey(projectId, scopes, type);
    const keys = await this.apiKeyService.listKeys(projectId);
    const newKey = keys[keys.length - 1]; // Get the just-created key

    return {
      key: {
        id: newKey?.id,
        name: name,
        projectId: projectId,
        keyPrefix: rawKey.substring(0, 12),
        type: type,
        createdAt: new Date().toISOString(),
      },
      secret: rawKey, // Only returned once!
    };
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string, projectId: string) {
    const success = await this.apiKeyService.revokeKey(keyId, projectId);
    if (!success) {
      throw new NotFoundException('API key not found or not owned by this project');
    }
  }

  /**
   * Revoke an API key with ownership verification
   * Used when we only have keyId and need to verify user has access
   */
  async revokeApiKeyWithOwnershipCheck(userId: string, keyId: string) {
    // Find the API key to get its project
    const apiKey = await this.apiKeyRepo.findById(keyId);
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    // Verify user has access to the project
    await this.verifyProjectAccess(userId, apiKey.projectId);

    // Delete the key
    await this.apiKeyRepo.deleteById(keyId);
  }

  /**
   * Get stats summary for a project.
   * Used by the dashboard to determine whether to show the setup guide or analytics.
   */
  async getStatsSummary(projectId: string): Promise<ProjectStatsSummary> {
    const [totalEvents, firstEventAt, activeCampaigns] = await Promise.all([
      this.eventRepo.countByProjectId(projectId),
      this.eventRepo.getFirstEventDate(projectId),
      this.campaignRepo.countActiveCampaigns(projectId),
    ]);

    return {
      totalEvents,
      firstEventAt: firstEventAt ? firstEventAt.toISOString() : null,
      activeCampaigns,
    };
  }

  /**
   * Get recent events for a project.
   * Used by the setup guide to verify event ingestion.
   */
  async getRecentEvents(projectId: string, limit: number = 10) {
    const events = await this.eventRepo.findRecentByProjectId(projectId, limit);
    return events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      userId: event.userId,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
    }));
  }
}
