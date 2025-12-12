import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiKeyGuard, CurrentProjectId } from '@boost/common';
import { EventsService } from './events.service';
import { CreateEventDto } from '../dto/create-event.dto';

@Controller('events')
@UseGuards(ApiKeyGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentProjectId() projectId: string,
  ) {
    return this.eventsService.createEvent(projectId, createEventDto);
  }
}
