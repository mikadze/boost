import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import * as schema from '@boost/database';
import { randomUUID } from 'crypto';

/**
 * Better-Auth Configuration
 * Handles human authentication for dashboard access
 * Uses Drizzle adapter with PostgreSQL
 */

let authInstance: ReturnType<typeof betterAuth> | null = null;

export interface BetterAuthConfig {
  secret: string;
  baseURL: string;
  db: unknown; // Drizzle client instance
  trustedOrigins?: string[];
}

/**
 * Initialize or get the Better-Auth instance
 * Receives the database client from the module to ensure proper initialization order
 */
export function getBetterAuth(config: BetterAuthConfig) {
  if (!authInstance) {
    authInstance = betterAuth({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      database: drizzleAdapter(config.db as any, {
        provider: 'pg',
        schema: {
          user: schema.users,
          session: schema.sessions,
          account: schema.accounts,
          verification: schema.verifications,
          organization: schema.organizations,
          member: schema.members,
          invitation: schema.invitations,
        },
      }),
      secret: config.secret,
      baseURL: config.baseURL,
      trustedOrigins: config.trustedOrigins,
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Can enable later with email service
      },
      session: {
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5, // 5 minutes cache
        },
      },
      plugins: [
        organization({
          allowUserToCreateOrganization: true,
        }),
      ],
      advanced: {
        database: {
          generateId: () => randomUUID(),
        },
      },
    });
  }

  return authInstance;
}

/**
 * Reset auth instance (useful for testing)
 */
export function resetBetterAuth() {
  authInstance = null;
}
