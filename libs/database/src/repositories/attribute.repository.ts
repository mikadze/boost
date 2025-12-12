import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { attributes, Attribute, NewAttribute } from '../schema';

export interface CreateAttributeData {
  projectId: string;
  name: string;
  displayName?: string;
  type: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAttributeData {
  displayName?: string;
  type?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AttributeRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateAttributeData): Promise<{ id: string }> {
    const result = await this.db
      .insert(attributes)
      .values({
        projectId: data.projectId,
        name: data.name,
        displayName: data.displayName,
        type: data.type,
        description: data.description,
        metadata: data.metadata,
      })
      .returning({ id: attributes.id });

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to insert attribute');
    }
    return inserted;
  }

  async findById(id: string): Promise<Attribute | null> {
    const result = await this.db.query.attributes.findFirst({
      where: eq(attributes.id, id),
    });
    return result ?? null;
  }

  async findByName(projectId: string, name: string): Promise<Attribute | null> {
    const result = await this.db.query.attributes.findFirst({
      where: and(eq(attributes.projectId, projectId), eq(attributes.name, name)),
    });
    return result ?? null;
  }

  async findByProjectId(projectId: string): Promise<Attribute[]> {
    const result = await this.db
      .select()
      .from(attributes)
      .where(eq(attributes.projectId, projectId))
      .orderBy(attributes.name);

    return result;
  }

  async update(id: string, data: UpdateAttributeData): Promise<void> {
    await this.db
      .update(attributes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(attributes.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(attributes).where(eq(attributes.id, id));
  }
}
