import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { EventRepository } from './repositories/event.repository';
import { ProjectRepository } from './repositories/project.repository';

let pool: Pool;

export function initializePool(connectionString: string) {
  if (!pool) {
    pool = new Pool({
      connectionString,
    });
  }
  return pool;
}

export function getDrizzleClient() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool first.');
  }
  return drizzle(pool, { schema });
}

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE_CONNECTION',
      useFactory: () => getDrizzleClient(),
    },
    {
      provide: 'DB_POOL',
      useFactory: () => pool,
    },
    ApiKeyRepository,
    EventRepository,
    ProjectRepository,
  ],
  exports: ['DRIZZLE_CONNECTION', 'DB_POOL', ApiKeyRepository, EventRepository, ProjectRepository],
})
export class DatabaseModule {}
