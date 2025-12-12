import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

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
  ],
  exports: ['DRIZZLE_CONNECTION', 'DB_POOL'],
})
export class DatabaseModule {}
