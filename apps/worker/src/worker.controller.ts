import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { WorkerService } from './worker.service';

@Controller()
export class WorkerController {
  constructor(private workerService: WorkerService) {}

  @EventPattern('events.raw')
  async handleEvent(@Payload() data: any) {
    await this.workerService.processEvent(data.value);
  }
}
