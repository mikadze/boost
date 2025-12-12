import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule, initializePool } from '@boost/database';
import { AppConfigModule, AppConfig } from '@boost/common';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import {
  EVENT_HANDLERS,
  EventHandlerRegistry,
  TrackingEventHandler,
  UserEventHandler,
  DefaultEventHandler,
} from './handlers';
import { SweeperService } from './sweeper';

@Module({
  imports: [
    AppConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService<AppConfig>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'worker-consumer',
              brokers: [config.get('KAFKA_BROKER', { infer: true })!],
            },
            consumer: {
              groupId: 'boost-worker-group',
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
    DatabaseModule,
  ],
  controllers: [WorkerController],
  providers: [
    WorkerService,
    // Event handlers
    TrackingEventHandler,
    UserEventHandler,
    DefaultEventHandler,
    // Handler registry with multi-provider injection
    {
      provide: EVENT_HANDLERS,
      useFactory: (
        trackingHandler: TrackingEventHandler,
        userHandler: UserEventHandler,
      ) => [trackingHandler, userHandler],
      inject: [TrackingEventHandler, UserEventHandler],
    },
    EventHandlerRegistry,
    // Sweeper job for stuck pending events
    SweeperService,
  ],
})
export class AppModule {
  constructor(private config: ConfigService<AppConfig>) {
    // Initialize database pool on app startup using validated config
    initializePool(config.get('DATABASE_URL', { infer: true })!);
  }
}
