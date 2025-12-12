import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { getDrizzleClient } from '@boost/database';
import * as schema from '@boost/database';

/**
 * Better-Auth Configuration
 * Handles human authentication for dashboard access
 * Uses Drizzle adapter with PostgreSQL
 */

let authInstance: ReturnType<typeof betterAuth> | null = null;

export interface BetterAuthConfig {
  secret: string;
  baseURL: string;
}

/**
 * Initialize or get the Better-Auth instance
 * Lazy initialization to ensure database is ready
 */
export function getBetterAuth(config: BetterAuthConfig) {
  if (!authInstance) {
    const db = getDrizzleClient();

    authInstance = betterAuth({
      database: drizzleAdapter(db, {
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
