import { Injectable, Inject } from '@nestjs/common';
import { getDrizzleClient, apiKeys } from '@boost/database';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  /**
   * Generate a new API key for a project
   * Returns the raw key (only shown once to user)
   * Stores the SHA-256 hash in the database
   */
  async createKey(projectId: string, scopes: string[] = []): Promise<string> {
    const db = getDrizzleClient();
    
    // Generate 32-byte random hex string
    const randomBytes = crypto.randomBytes(32).toString('hex');
    
    // Format: pk_live_<random>
    const rawKey = `pk_live_${randomBytes}`;
    
    // Create SHA-256 hash
    const keyHash = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');
    
    // Extract prefix (first 12 chars of full key for display)
    const prefix = rawKey.substring(0, 12);
    
    // Save to database
    await db.insert(apiKeys).values({
      projectId,
      keyHash,
      prefix,
      scopes,
    });
    
    // Return the raw key (only time it's shown)
    return rawKey;
  }

  /**
   * Validate an API key by hashing and comparing to stored hash
   */
  async validateKey(rawKey: string): Promise<{ projectId: string } | null> {
    const db = getDrizzleClient();
    
    const keyHash = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');
    
    const result = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.keyHash, keyHash),
      columns: { projectId: true },
    });
    
    return result || null;
  }

  /**
   * Revoke an API key by its ID
   * Requires projectId to verify ownership before deletion
   * Returns true if key was deleted, false if not found or not owned by project
   */
  async revokeKey(keyId: string, projectId: string): Promise<boolean> {
    const db = getDrizzleClient();

    // Verify ownership before deletion - prevents unauthorized key revocation
    const existingKey = await db.query.apiKeys.findFirst({
      where: eq(apiKeys.id, keyId),
      columns: { projectId: true },
    });

    if (!existingKey || existingKey.projectId !== projectId) {
      return false;
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
    return true;
  }

  /**
   * List keys for a project (only show prefix, dates, no hash)
   */
  async listKeys(projectId: string) {
    const db = getDrizzleClient();
    
    const result = await db.query.apiKeys.findMany({
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

  /**
   * Update last used timestamp for a key
   */
  async updateLastUsed(keyHash: string): Promise<void> {
    const db = getDrizzleClient();
    
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.keyHash, keyHash));
  }
}
