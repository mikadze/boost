import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule, initializePool } from '@boost/database';
import { AppConfigModule, AppConfig } from '@boost/common';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

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
  providers: [WorkerService],
})
export class AppModule {
  constructor(private config: ConfigService<AppConfig>) {
    // Initialize database pool on app startup using validated config
    initializePool(config.get('DATABASE_URL', { infer: true })!);
  }
}
