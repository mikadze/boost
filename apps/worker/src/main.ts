import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { validateConfig } from '@boost/common';

async function bootstrap() {
  // Validate config at startup to fail fast
  const config = validateConfig(process.env);
  const brokers = [config.KAFKA_BROKER];

  // Build microservice options with optional SASL for cloud providers
  let microserviceOptions: MicroserviceOptions;

  if (config.KAFKA_API_KEY && config.KAFKA_API_SECRET) {
    // Confluent Cloud / managed Kafka with SASL auth
    microserviceOptions = {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'worker-consumer',
          brokers,
          ssl: true,
          sasl: {
            mechanism: 'plain' as const,
            username: config.KAFKA_API_KEY,
            password: config.KAFKA_API_SECRET,
          },
        },
        consumer: {
          groupId: 'boost-worker-group',
          allowAutoTopicCreation: true,
        },
      },
    };
  } else {
    // Local Kafka without auth
    microserviceOptions = {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'worker-consumer',
          brokers,
        },
        consumer: {
          groupId: 'boost-worker-group',
          allowAutoTopicCreation: true,
        },
      },
    };
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    microserviceOptions,
  );

  await app.listen();
  console.log('Boost Worker listening for Kafka events');
}

bootstrap().catch((err) => {
  console.error('Failed to start Worker:', err);
  process.exit(1);
});
