import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { projects } from '../schema';

export interface ProjectRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProjectRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Find project by ID
   */
  async findById(projectId: string): Promise<ProjectRecord | null> {
    const result = await this.db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });
    return result || null;
  }

  /**
   * Find project by ID and verify organization ownership
   * Returns null if project doesn't exist or doesn't belong to organization
   */
  async findByIdAndOrganization(
    projectId: string,
    organizationId: string,
  ): Promise<ProjectRecord | null> {
    const result = await this.db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
      ),
    });
    return result || null;
  }

  /**
   * List all projects for an organization
   */
  async findByOrganizationId(organizationId: string): Promise<ProjectRecord[]> {
    return this.db.query.projects.findMany({
      where: eq(projects.organizationId, organizationId),
    });
  }

  /**
   * Create a new project
   */
  async create(data: {
    organizationId: string;
    name: string;
    description?: string;
  }): Promise<{ id: string }> {
    const result = await this.db
      .insert(projects)
      .values({
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
      })
      .returning({ id: projects.id });

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to insert project');
    }
    return inserted;
  }
}
