import { Module, Global, DynamicModule } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { EventRepository } from './repositories/event.repository';
import { OrganizationRepository } from './repositories/organization.repository';
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

export function getPool() {
  return pool;
}

export function getDrizzleClient() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool first.');
  }
  return drizzle(pool, { schema });
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(connectionString: string): DynamicModule {
    initializePool(connectionString);

    return {
      module: DatabaseModule,
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
        OrganizationRepository,
        ProjectRepository,
      ],
      exports: ['DRIZZLE_CONNECTION', 'DB_POOL', ApiKeyRepository, EventRepository, OrganizationRepository, ProjectRepository],
    };
  }

  static forRootAsync(options: {
    inject: any[];
    useFactory: (...args: any[]) => string | Promise<string>;
  }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DRIZZLE_CONNECTION',
          inject: options.inject,
          useFactory: async (...args: any[]) => {
            const connectionString = await options.useFactory(...args);
            initializePool(connectionString);
            return getDrizzleClient();
          },
        },
        {
          provide: 'DB_POOL',
          inject: ['DRIZZLE_CONNECTION'],
          useFactory: () => pool,
        },
        ApiKeyRepository,
        EventRepository,
        OrganizationRepository,
        ProjectRepository,
      ],
      exports: ['DRIZZLE_CONNECTION', 'DB_POOL', ApiKeyRepository, EventRepository, OrganizationRepository, ProjectRepository],
    };
  }
}
