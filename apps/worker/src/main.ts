import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AppConfig, validateConfig } from '@boost/common';

async function bootstrap() {
  // Validate config at startup to fail fast
  const config = validateConfig(process.env);

  // Build Kafka client config with optional SASL for cloud providers
  const kafkaClientConfig: Record<string, unknown> = {
    clientId: 'worker-consumer',
    brokers: [config.KAFKA_BROKER],
  };

  // Add SSL + SASL if credentials are provided (Confluent Cloud, etc.)
  if (config.KAFKA_API_KEY && config.KAFKA_API_SECRET) {
    kafkaClientConfig.ssl = true;
    kafkaClientConfig.sasl = {
      mechanism: 'plain',
      username: config.KAFKA_API_KEY,
      password: config.KAFKA_API_SECRET,
    };
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: kafkaClientConfig,
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
