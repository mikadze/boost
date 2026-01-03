import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBetterAuth } from './better-auth';
import { AppConfig } from '../config/config.schema';

export const BETTER_AUTH = 'BETTER_AUTH';

@Global()
@Module({
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [ConfigService, 'DRIZZLE_CONNECTION'],
      useFactory: async (config: ConfigService<AppConfig>, db: unknown) => {
        return await getBetterAuth({
          secret: config.get('BETTER_AUTH_SECRET', { infer: true })!,
          baseURL: config.get('BETTER_AUTH_URL', { infer: true })!,
          trustedOrigins: config.get('TRUSTED_ORIGINS', { infer: true })!,
          db,
        });
      },
    },
  ],
  exports: [BETTER_AUTH],
})
export class BetterAuthModule {}
