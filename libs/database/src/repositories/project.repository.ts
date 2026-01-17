import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { projects, ProjectSettings } from '../schema';

export interface ProjectRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  settings: ProjectSettings;
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
    if (!result) return null;
    return {
      ...result,
      settings: (result.settings as ProjectSettings) || {},
    };
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
    if (!result) return null;
    return {
      ...result,
      settings: (result.settings as ProjectSettings) || {},
    };
  }

  /**
   * List all projects for an organization
   */
  async findByOrganizationId(organizationId: string): Promise<ProjectRecord[]> {
    const results = await this.db.query.projects.findMany({
      where: eq(projects.organizationId, organizationId),
    });
    return results.map((result) => ({
      ...result,
      settings: (result.settings as ProjectSettings) || {},
    }));
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

  /**
   * Get project settings
   */
  async getSettings(projectId: string): Promise<ProjectSettings> {
    const result = await this.db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { settings: true },
    });
    return (result?.settings as ProjectSettings) || {};
  }

  /**
   * Update project settings (deep merge)
   */
  async updateSettings(
    projectId: string,
    settings: Partial<ProjectSettings>,
  ): Promise<ProjectSettings> {
    // First get current settings
    const current = await this.getSettings(projectId);

    // Deep merge the settings
    const merged: ProjectSettings = {
      ...current,
      ...settings,
      // Explicitly merge nested objects
      referral: settings.referral
        ? { ...current.referral, ...settings.referral }
        : current.referral,
      incentive: settings.incentive
        ? { ...current.incentive, ...settings.incentive }
        : current.incentive,
    };

    // Update in database
    await this.db
      .update(projects)
      .set({
        settings: merged,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    return merged;
  }
}
