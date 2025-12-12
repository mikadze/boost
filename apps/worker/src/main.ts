import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
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
  );

  await app.listen();
  console.log('✅ Boost Worker listening for Kafka events');
}

bootstrap().catch((err) => {
  console.error('Failed to start Worker:', err);
  process.exit(1);
});
