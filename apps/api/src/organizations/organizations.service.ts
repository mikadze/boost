import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { OrganizationRepository, ProjectRepository, ProjectSeederService } from '@boost/database';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly projectSeeder: ProjectSeederService,
  ) {}

  /**
   * List all organizations for a user
   */
  async findByUserId(userId: string) {
    this.logger.debug(`Finding organizations for userId=${userId}`);
    const orgs = await this.organizationRepo.findByUserId(userId);
    this.logger.debug(`Found ${orgs.length} orgs: ${JSON.stringify(orgs.map(o => ({ id: o.id, name: o.name })))}`);
    return orgs;
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
    this.logger.debug(`Checking membership: userId=${userId}, orgId=${orgId}`);
    const member = await this.organizationRepo.isMember(userId, orgId);
    this.logger.debug(`Membership result: ${JSON.stringify(member)}`);
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
    const project = await this.projectRepo.create({
      organizationId: orgId,
      name: data.name,
      description: data.description,
    });

    // Seed sample data for new project
    this.logger.log(`Seeding sample data for new project ${project.id}`);
    await this.projectSeeder.seedProject(project.id);

    return project;
  }
}
