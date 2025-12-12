import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { ApiKeyGuard, CurrentProjectId } from '@boost/common';
import { EventsService } from './events.service';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * Events Ingestion Controller
 * High-throughput endpoint for machine-to-machine event ingestion
 * Protected by ApiKeyGuard (API key authentication)
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
   */
  @Post('track')
  @HttpCode(HttpStatus.ACCEPTED)
  async track(
    @Body() trackEventDto: TrackEventDto,
    @CurrentProjectId() projectId: string,
  ) {
    await this.eventsService.trackEvent(projectId, trackEventDto);
    return { status: 'accepted' };
  }
}
