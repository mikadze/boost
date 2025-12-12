import { Injectable } from '@nestjs/common';
import { ApiKeyRepository } from '@boost/database';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  /**
   * Generate a new API key for a project
   * Returns the raw key (only shown once to user)
   * Stores the SHA-256 hash in the database
   */
  async createKey(projectId: string, scopes: string[] = []): Promise<string> {
    // Generate 32-byte random hex string
    const randomBytes = crypto.randomBytes(32).toString('hex');

    // Format: pk_live_<random>
    const rawKey = `pk_live_${randomBytes}`;

    // Create SHA-256 hash
    const keyHash = this.hashKey(rawKey);

    // Extract prefix (first 12 chars of full key for display)
    const prefix = rawKey.substring(0, 12);

    // Save to database via repository
    await this.apiKeyRepository.create({
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
    const keyHash = this.hashKey(rawKey);
    return this.apiKeyRepository.findByHash(keyHash);
  }

  /**
   * Revoke an API key by its ID
   * Requires projectId to verify ownership before deletion
   * Returns true if key was deleted, false if not found or not owned by project
   */
  async revokeKey(keyId: string, projectId: string): Promise<boolean> {
    // Verify ownership before deletion - prevents unauthorized key revocation
    const existingKey = await this.apiKeyRepository.findById(keyId);

    if (!existingKey || existingKey.projectId !== projectId) {
      return false;
    }

    await this.apiKeyRepository.deleteById(keyId);
    return true;
  }

  /**
   * List keys for a project (only show prefix, dates, no hash)
   */
  async listKeys(projectId: string) {
    return this.apiKeyRepository.findByProjectId(projectId);
  }

  /**
   * Update last used timestamp for a key
   */
  async updateLastUsed(keyHash: string): Promise<void> {
    await this.apiKeyRepository.updateLastUsed(keyHash);
  }

  /**
   * Hash a raw API key using SHA-256
   */
  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }
}
