import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SessionGuard } from '@boost/common';
import { AiService } from './ai.service';

interface GenerateRuleDto {
  prompt: string;
  context?: {
    campaignName?: string;
  };
}

@Controller('ai')
@UseGuards(SessionGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-rule')
  @HttpCode(HttpStatus.OK)
  async generateRule(@Body() dto: GenerateRuleDto) {
    if (!dto.prompt || typeof dto.prompt !== 'string' || dto.prompt.trim().length === 0) {
      throw new BadRequestException('Prompt is required');
    }

    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException('AI service is temporarily unavailable');
    }

    const result = await this.aiService.generateRule(dto);

    if ('error' in result) {
      throw new BadRequestException(result.error);
    }

    return result;
  }
}
