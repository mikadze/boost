import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { apiKeys, NewApiKey } from '../schema';

export interface ApiKeyRecord {
  id: string;
  projectId: string;
  keyHash: string;
  prefix: string;
  scopes: unknown;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyListItem {
  id: string;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

@Injectable()
export class ApiKeyRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: {
    projectId: string;
    keyHash: string;
    prefix: string;
    scopes: string[];
  }): Promise<void> {
    await this.db.insert(apiKeys).values({
      projectId: data.projectId,
      keyHash: data.keyHash,
      prefix: data.prefix,
      scopes: data.scopes,
    });
  }

  async findByHash(keyHash: string): Promise<{ projectId: string } | null> {
    const result = await this.db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
      columns: { projectId: true },
    });
    return result || null;
  }

  async findById(keyId: string): Promise<{ projectId: string } | null> {
    const result = await this.db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, keyId),
      columns: { projectId: true },
    });
    return result || null;
  }

  async deleteById(keyId: string): Promise<void> {
    await this.db.delete(apiKeys).where(eq(apiKeys.id, keyId));
  }

  async findByProjectId(projectId: string): Promise<ApiKeyListItem[]> {
    const result = await this.db.query.apiKeys.findMany({
      where: eq(apiKeys.projectId, projectId),
      columns: {
        id: true,
        prefix: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    return result;
  }

  async updateLastUsed(keyHash: string): Promise<void> {
    await this.db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.keyHash, keyHash));
  }
}
