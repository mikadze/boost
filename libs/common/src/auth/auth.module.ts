import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Module({
  imports: [CacheModule.register()],
  providers: [ApiKeyService, ApiKeyGuard],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class AuthModule {}
