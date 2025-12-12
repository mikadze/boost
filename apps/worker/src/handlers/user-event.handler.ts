import { Injectable, Logger } from '@nestjs/common';
import { RawEventMessage } from '@boost/common';
import { EventHandler } from './event-handler.interface';

/**
 * Handles user events: user_signup, user_login
 */
@Injectable()
export class UserEventHandler implements EventHandler {
  private readonly logger = new Logger(UserEventHandler.name);

  getSupportedTypes(): string[] {
    return ['user_signup', 'user_login'];
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Processing user event: ${event.event}`);

    // TODO: Implement user-specific logic
    // Examples: user profile updates, welcome emails, engagement tracking
  }
}
