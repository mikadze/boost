import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiKeyGuard, ApiKeyService, CurrentProjectId } from '@boost/common';

@Controller('auth/api-keys')
@UseGuards(ApiKeyGuard)
export class AuthController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  async createKey(
    @CurrentProjectId() projectId: string,
    @Body() body: { scopes?: string[] },
  ) {
    const rawKey = await this.apiKeyService.createKey(
      projectId,
      body.scopes || [],
    );
    return {
      key: rawKey,
      prefix: rawKey.substring(0, 12),
      message: 'Store this key safely. You will not be able to see it again.',
    };
  }

  @Get()
  async listKeys(@CurrentProjectId() projectId: string) {
    return this.apiKeyService.listKeys(projectId);
  }

  @Delete(':id')
  async revokeKey(
    @Param('id') keyId: string,
    @CurrentProjectId() projectId: string,
  ) {
    await this.apiKeyService.revokeKey(keyId);
    return { message: 'API Key revoked successfully' };
  }
}
