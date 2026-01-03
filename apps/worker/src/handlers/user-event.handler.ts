import { Injectable, Logger } from '@nestjs/common';
import { RawEventMessage } from '@boost/common';
import { EndUserRepository } from '@boost/database';
import { EventHandler } from './event-handler.interface';

/**
 * Generate a unique referral code
 * Format: 6 characters alphanumeric (e.g., "ABC123")
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Handles user events: $identify, user_signup, user_login
 */
@Injectable()
export class UserEventHandler implements EventHandler {
  private readonly logger = new Logger(UserEventHandler.name);

  constructor(private readonly endUserRepository: EndUserRepository) {}

  getSupportedTypes(): string[] {
    return ['$identify', 'user_signup', 'user_login'];
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Processing user event: ${event.event}`);

    const { projectId, userId } = event;

    if (!userId) {
      this.logger.debug('No userId in event, skipping');
      return;
    }

    // Find or create the end user
    const endUser = await this.endUserRepository.findOrCreate(projectId, userId);

    // Auto-generate referral code if not set
    if (!endUser.referralCode) {
      const referralCode = await this.generateUniqueReferralCode(projectId);
      await this.endUserRepository.update(endUser.id, { referralCode });
      this.logger.log(`Generated referral code ${referralCode} for user ${userId}`);
    }

    // Handle specific event types
    if (event.event === '$identify') {
      // Update user traits/metadata if provided
      const traits = event.properties?.traits as Record<string, unknown> | undefined;
      if (traits && Object.keys(traits).length > 0) {
        const existingMetadata = (endUser.metadata as Record<string, unknown>) || {};
        await this.endUserRepository.update(endUser.id, {
          metadata: { ...existingMetadata, ...traits },
        });
      }
    }
  }

  /**
   * Generate a unique referral code, retrying if collision
   */
  private async generateUniqueReferralCode(projectId: string, maxAttempts = 5): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = generateReferralCode();
      const existing = await this.endUserRepository.findByReferralCode(projectId, code);
      if (!existing) {
        return code;
      }
      this.logger.debug(`Referral code collision: ${code}, retrying...`);
    }
    // Fallback: use timestamp-based code
    return `${generateReferralCode()}${Date.now().toString(36).slice(-2).toUpperCase()}`;
  }
}
