import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RawEventMessage } from '@boost/common';
import { WorkerService } from './worker.service';

interface KafkaMessage<T> {
  key: string;
  value: T;
}

@Controller()
export class WorkerController {
  private readonly logger = new Logger(WorkerController.name);

  constructor(private workerService: WorkerService) {}

  @EventPattern('events.raw')
  async handleEvent(@Payload() data: KafkaMessage<RawEventMessage>) {
    this.logger.debug(`Received event: ${data.value.id}`);
    await this.workerService.processEvent(data.value);
  }
}
