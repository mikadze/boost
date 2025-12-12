import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getBetterAuth, BetterAuthConfig } from './better-auth';
import { AppConfig } from '../config/config.schema';

export const BETTER_AUTH = 'BETTER_AUTH';

@Global()
@Module({
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        const authConfig: BetterAuthConfig = {
          secret: config.get('BETTER_AUTH_SECRET', { infer: true })!,
          baseURL: config.get('BETTER_AUTH_URL', { infer: true })!,
        };
        return getBetterAuth(authConfig);
      },
    },
  ],
  exports: [BETTER_AUTH],
})
export class BetterAuthModule {}
