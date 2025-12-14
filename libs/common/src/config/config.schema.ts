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

  // Better-Auth - human authentication
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  TRUSTED_ORIGINS: z.string().transform((val) => val.split(',').map((s) => s.trim())),

  // OpenRouter AI - optional
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  OPENROUTER_MAX_TOKENS: z.coerce.number().optional(),
});

// Development schema - allows localhost defaults
const developmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/boost'),
  KAFKA_BROKER: z.string().default('localhost:9093'),
  KAFKA_CLIENT_ID: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CACHE_TTL_MS: z.coerce.number().default(60000),
  BETTER_AUTH_SECRET: z.string().min(32).default('development-secret-key-min-32-chars!!'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  TRUSTED_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001,http://localhost:3002')
    .transform((val) => val.split(',').map((s) => s.trim())),
  // OpenRouter AI - optional
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  OPENROUTER_MAX_TOKENS: z.coerce.number().optional(),
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
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().refine((val) => !val.includes('localhost'), {
    message: 'BETTER_AUTH_URL must not use localhost in production',
  }),
  TRUSTED_ORIGINS: z.string().transform((val) => val.split(',').map((s) => s.trim())),
  // OpenRouter AI - optional
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  OPENROUTER_MAX_TOKENS: z.coerce.number().optional(),
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
