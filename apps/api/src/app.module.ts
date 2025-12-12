import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule, initializePool } from '@boost/database';
import {
  AuthModule,
  AppConfigModule,
  AppConfig,
  CorrelationIdMiddleware,
} from '@boost/common';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { AuthController } from './auth/auth.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => ({
        ttl: config.get('CACHE_TTL_MS', { infer: true }),
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService<AppConfig>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'api-producer',
              brokers: [config.get('KAFKA_BROKER', { infer: true })!],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
    DatabaseModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [AppController, EventsController, AuthController],
  providers: [AppService, EventsService],
})
export class AppModule implements NestModule {
  constructor(private config: ConfigService<AppConfig>) {
    // Initialize database pool on app startup using validated config
    initializePool(config.get('DATABASE_URL', { infer: true })!);
  }

  configure(consumer: MiddlewareConsumer) {
    // Apply correlation ID middleware to all routes
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
