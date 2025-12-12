import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppConfig, validateConfig } from '@boost/common';

async function bootstrap() {
  // Validate config at startup to fail fast
  const config = validateConfig(process.env);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'worker-consumer',
          brokers: [config.KAFKA_BROKER],
        },
        consumer: {
          groupId: 'boost-worker-group',
          allowAutoTopicCreation: true,
        },
      },
    },
  );

  await app.listen();
  console.log('Boost Worker listening for Kafka events');
}

bootstrap().catch((err) => {
  console.error('Failed to start Worker:', err);
  process.exit(1);
});
