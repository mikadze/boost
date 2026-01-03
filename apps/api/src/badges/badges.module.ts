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
        useFactory: (configService: ConfigService) => {
          const kafkaApiKey = configService.get<string>('KAFKA_API_KEY');
          const kafkaApiSecret = configService.get<string>('KAFKA_API_SECRET');
          const brokers = [configService.get<string>('KAFKA_BROKER', 'localhost:9092')];

          // Add SSL + SASL if credentials are provided (Confluent Cloud, etc.)
          if (kafkaApiKey && kafkaApiSecret) {
            return {
              transport: Transport.KAFKA,
              options: {
                client: {
                  clientId: 'badges-producer',
                  brokers,
                  ssl: true,
                  sasl: {
                    mechanism: 'plain' as const,
                    username: kafkaApiKey,
                    password: kafkaApiSecret,
                  },
                },
                producer: {
                  allowAutoTopicCreation: true,
                },
              },
            };
          }

          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'badges-producer',
                brokers,
              },
              producer: {
                allowAutoTopicCreation: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [BadgesController, CustomerBadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
