import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RawEventMessage } from '@boost/common';
import { WorkerService } from './worker.service';

@Controller()
export class WorkerController {
  private readonly logger = new Logger(WorkerController.name);

  constructor(private workerService: WorkerService) {}

  @EventPattern('events.raw')
  async handleEvent(@Payload() data: RawEventMessage) {
    this.logger.debug(`Received event: ${data.event} for project ${data.projectId}`);
    await this.workerService.processEvent(data);
  }
}
