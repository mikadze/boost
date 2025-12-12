import { Injectable, ForbiddenException } from '@nestjs/common';
import { OrganizationRepository, ProjectRepository } from '@boost/database';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
  ) {}

  /**
   * List all organizations for a user
   */
  async findByUserId(userId: string) {
    return this.organizationRepo.findByUserId(userId);
  }

  /**
   * Create organization with user as owner
   */
  async create(data: { name: string; slug?: string }, ownerId: string) {
    return this.organizationRepo.create(data, ownerId);
  }

  /**
   * Verify user is a member of organization
   */
  async verifyMembership(userId: string, orgId: string) {
    const member = await this.organizationRepo.isMember(userId, orgId);
    if (!member) {
      throw new ForbiddenException('Not a member of this organization');
    }
    return member;
  }

  /**
   * List projects for an organization
   */
  async listProjects(orgId: string) {
    return this.projectRepo.findByOrganizationId(orgId);
  }

  /**
   * Create a project in an organization
   */
  async createProject(orgId: string, data: { name: string; description?: string }) {
    return this.projectRepo.create({
      organizationId: orgId,
      name: data.name,
      description: data.description,
    });
  }
}
