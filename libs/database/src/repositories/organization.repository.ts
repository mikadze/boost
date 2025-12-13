import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { organizations, members, Organization, Member } from '../schema';

export interface OrganizationWithRole extends Organization {
  role: string;
}

@Injectable()
export class OrganizationRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Find all organizations where user is a member
   */
  async findByUserId(userId: string): Promise<OrganizationWithRole[]> {
    const results = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        metadata: organizations.metadata,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        role: members.role,
      })
      .from(organizations)
      .innerJoin(members, eq(members.organizationId, organizations.id))
      .where(eq(members.userId, userId));

    return results;
  }

  /**
   * Find organization by ID
   */
  async findById(orgId: string): Promise<Organization | null> {
    const result = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
    return result || null;
  }

  /**
   * Check if user is a member of organization
   */
  async isMember(userId: string, orgId: string): Promise<Member | null> {
    const [member] = await this.db
      .select()
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.organizationId, orgId)))
      .limit(1);

    return member || null;
  }

  /**
   * Create organization and add creator as owner
   */
  async create(
    data: { name: string; slug?: string },
    ownerId: string,
  ): Promise<Organization> {
    const slug = data.slug || this.generateSlug(data.name);

    return this.db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: data.name,
          slug,
        })
        .returning();

      if (!org) {
        throw new Error('Failed to create organization');
      }

      await tx.insert(members).values({
        organizationId: org.id,
        userId: ownerId,
        role: 'owner',
      });

      return org;
    });
  }

  /**
   * Generate URL-safe slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}
