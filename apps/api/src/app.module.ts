import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule, initializePool } from '@boost/database';
import { AuthModule } from '@boost/common';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { AuthController } from './auth/auth.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds default
    }),
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-producer',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          producer: {
            // API only sends events, doesn't consume
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController, EventsController, AuthController],
  providers: [AppService, EventsService],
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
