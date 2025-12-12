import { z } from 'zod';

// Base schema defining the shape of configuration
const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database - required
  DATABASE_URL: z.string().url(),

  // Kafka - required
  KAFKA_BROKER: z.string().min(1),
  KAFKA_CLIENT_ID: z.string().optional(),

  // Redis - required
  REDIS_URL: z.string().min(1),

  // Cache TTL in milliseconds
  CACHE_TTL_MS: z.coerce.number().default(60000),
});

// Development schema - allows localhost defaults
const developmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/boost'),
  KAFKA_BROKER: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CACHE_TTL_MS: z.coerce.number().default(60000),
});

// Production schema - strict validation, no localhost allowed
const productionSchema = z.object({
  NODE_ENV: z.literal('production'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .refine((val) => !val.includes('localhost'), {
      message: 'DATABASE_URL must not use localhost in production',
    }),
  KAFKA_BROKER: z.string().min(1).refine((val) => !val.includes('localhost'), {
    message: 'KAFKA_BROKER must not use localhost in production',
  }),
  KAFKA_CLIENT_ID: z.string().optional(),
  REDIS_URL: z.string().min(1).refine((val) => !val.includes('localhost'), {
    message: 'REDIS_URL must not use localhost in production',
  }),
  CACHE_TTL_MS: z.coerce.number().default(60000),
});

export type AppConfig = z.infer<typeof baseSchema>;

export function validateConfig(config: Record<string, unknown>): AppConfig {
  const env = config.NODE_ENV || 'development';

  // Use appropriate schema based on environment
  const schema = env === 'production' ? productionSchema : developmentSchema;

  const result = schema.safeParse(config);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }
  return result.data;
}

// Export schemas for testing
export { developmentSchema, productionSchema };
