import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '@boost/database';
import {
  AuthModule,
  BetterAuthModule,
  AppConfigModule,
  AppConfig,
  CorrelationIdMiddleware,
} from '@boost/common';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { AuthController } from './auth/auth.controller';
import { BetterAuthController } from './better-auth/better-auth.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
// Issue #13: Rule Engine
import { AttributesModule } from './attributes/attributes.module';
import { CampaignsModule } from './campaigns/campaigns.module';
// Issue #14: Promotion Toolkit
import { SessionsModule } from './sessions/sessions.module';
import { CouponsModule } from './coupons/coupons.module';
// Issue #15: Loyalty
import { LoyaltyModule } from './loyalty/loyalty.module';
// Issue #25-28: Quest Engine
import { QuestsModule } from './quests/quests.module';
// Issue #34: Rewards Store
import { RewardsModule } from './rewards/rewards.module';

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
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) =>
        config.get('DATABASE_URL', { infer: true })!,
    }),
    AuthModule,
    BetterAuthModule,
    HealthModule,
    OrganizationsModule,
    ProjectsModule,
    // Issue #13: Rule Engine
    AttributesModule,
    CampaignsModule,
    // Issue #14: Promotion Toolkit
    SessionsModule,
    CouponsModule,
    // Issue #15: Loyalty
    LoyaltyModule,
    // Issue #25-28: Quest Engine
    QuestsModule,
    // Issue #34: Rewards Store
    RewardsModule,
  ],
  controllers: [AppController, EventsController, AuthController, BetterAuthController],
  providers: [AppService, EventsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
