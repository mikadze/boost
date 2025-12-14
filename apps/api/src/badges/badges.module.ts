import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '@boost/common';
import { BadgesController, CustomerBadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'badges-producer',
              brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [BadgesController, CustomerBadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
