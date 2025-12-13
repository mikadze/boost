import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '@boost/database';
import { AppConfigModule, AppConfig, CommissionService } from '@boost/common';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import {
  EVENT_HANDLERS,
  EventHandlerRegistry,
  TrackingEventHandler,
  UserEventHandler,
  DefaultEventHandler,
  RuleEngineEventHandler,
  // Issue #20 & #21: New handlers
  PurchaseEventHandler,
  ProgressionEventHandler,
} from './handlers';
import { SweeperService } from './sweeper';
import { RuleEngineService, EffectExecutorService } from './engine';

@Module({
  imports: [
    AppConfigModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds default TTL
    }),
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
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) =>
        config.get('DATABASE_URL', { infer: true })!,
    }),
  ],
  controllers: [WorkerController],
  providers: [
    WorkerService,
    // Rule Engine (Issue #13)
    RuleEngineService,
    EffectExecutorService,
    // Issue #20: Commission Service
    CommissionService,
    // Event handlers
    TrackingEventHandler,
    UserEventHandler,
    DefaultEventHandler,
    RuleEngineEventHandler,
    // Issue #20: Purchase handler for commission calculation
    PurchaseEventHandler,
    // Issue #21: Progression handler for level-up logic
    ProgressionEventHandler,
    // Handler registry with multi-provider injection
    {
      provide: EVENT_HANDLERS,
      useFactory: (
        trackingHandler: TrackingEventHandler,
        userHandler: UserEventHandler,
        ruleEngineHandler: RuleEngineEventHandler,
        purchaseHandler: PurchaseEventHandler,
        progressionHandler: ProgressionEventHandler,
      ) => [
        trackingHandler,
        userHandler,
        ruleEngineHandler,
        purchaseHandler,
        progressionHandler,
      ],
      inject: [
        TrackingEventHandler,
        UserEventHandler,
        RuleEngineEventHandler,
        PurchaseEventHandler,
        ProgressionEventHandler,
      ],
    },
    EventHandlerRegistry,
    // Sweeper job for stuck pending events
    SweeperService,
  ],
})
export class AppModule {}
