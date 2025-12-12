import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule, initializePool } from '@boost/database';
import { AuthModule } from '@boost/common';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'worker-consumer',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          consumer: {
            groupId: 'boost-worker-group',
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class AppModule {
  constructor() {
    // Initialize database pool on app startup
    const dbUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/boost';
    initializePool(dbUrl);
  }
}
