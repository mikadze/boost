import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard, CurrentUser } from '@boost/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, CreateProjectDto } from './dto/create-organization.dto';

@Controller('organizations')
@UseGuards(SessionGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * GET /organizations
   * List all organizations for the current user
   */
  @Get()
  async listOrganizations(@CurrentUser() user: { id: string }) {
    return this.organizationsService.findByUserId(user.id);
  }

  /**
   * POST /organizations
   * Create a new organization (user becomes owner)
   */
  @Post()
  async createOrganization(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(dto, user.id);
  }

  /**
   * GET /organizations/:orgId/projects
   * List all projects in an organization
   */
  @Get(':orgId/projects')
  async listProjects(
    @CurrentUser() user: { id: string },
    @Param('orgId') orgId: string,
  ) {
    // Verify user is a member of the organization
    await this.organizationsService.verifyMembership(user.id, orgId);
    return this.organizationsService.listProjects(orgId);
  }

  /**
   * POST /organizations/:orgId/projects
   * Create a new project in an organization
   */
  @Post(':orgId/projects')
  async createProject(
    @CurrentUser() user: { id: string },
    @Param('orgId') orgId: string,
    @Body() dto: CreateProjectDto,
  ) {
    // Verify user is a member of the organization
    await this.organizationsService.verifyMembership(user.id, orgId);
    return this.organizationsService.createProject(orgId, dto);
  }
}
