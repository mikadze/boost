import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ForbiddenException,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  ApiKeyGuard,
  CurrentProjectId,
  CurrentApiKeyType,
  isTrustedEvent,
  getEventSource,
  EventSource,
} from '@boost/common';
import { ApiKeyType } from '@boost/database';
import { EventsService } from './events.service';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * Events Ingestion Controller
 * High-throughput endpoint for machine-to-machine event ingestion
 * Protected by ApiKeyGuard (API key authentication)
 *
 * Event Security:
 * - Publishable keys (pk_live_*): Can only send untrusted events (behavioral/analytics)
 * - Secret keys (sk_live_*): Can send all events including trusted events (financial)
 */
@Controller('events')
@UseGuards(ApiKeyGuard)
@UsePipes(ZodValidationPipe)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  /**
   * Track an event
   * Immediately queues to Kafka without synchronous DB writes
   * Returns 202 Accepted for fast response times (<50ms target)
   *
   * Security: Trusted events (purchase, commission.created, etc.) require a secret key
   */
  @Post('track')
  @HttpCode(HttpStatus.ACCEPTED)
  async track(
    @Body() trackEventDto: TrackEventDto,
    @CurrentProjectId() projectId: string,
    @CurrentApiKeyType() keyType: ApiKeyType,
  ) {
    // Block trusted events from publishable keys
    if (keyType === 'publishable' && isTrustedEvent(trackEventDto.event)) {
      throw new ForbiddenException(
        `Event "${trackEventDto.event}" requires a secret key (sk_live_*). ` +
          `Publishable keys can only send behavioral events like page_view, click, cart_update, etc.`,
      );
    }

    // Determine event source based on key type
    const source: EventSource = getEventSource(keyType);

    await this.eventsService.trackEvent(projectId, trackEventDto, source);
    return { status: 'accepted' };
  }

  /**
   * Batch track events
   * Process multiple events in a single request for SDK efficiency
   */
  @Post('batch')
  @HttpCode(HttpStatus.ACCEPTED)
  async batch(
    @Body() batchDto: { events: TrackEventDto[] },
    @CurrentProjectId() projectId: string,
    @CurrentApiKeyType() keyType: ApiKeyType,
  ) {
    const source: EventSource = getEventSource(keyType);

    // Process each event, blocking trusted events from publishable keys
    const results = await Promise.allSettled(
      batchDto.events.map(async (event) => {
        if (keyType === 'publishable' && isTrustedEvent(event.event)) {
          throw new ForbiddenException(
            `Event "${event.event}" requires a secret key`,
          );
        }
        await this.eventsService.trackEvent(projectId, event, source);
      }),
    );

    const accepted = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected').length;

    return { status: 'accepted', accepted, rejected };
  }
}
