import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard, CurrentProjectId } from '@boost/common';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';

@Controller('attributes')
@UseGuards(ApiKeyGuard)
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  /**
   * POST /attributes
   * Create a new attribute
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateAttributeDto,
  ) {
    return this.attributesService.create(projectId, dto);
  }

  /**
   * GET /attributes
   * List all attributes for the project
   */
  @Get()
  async list(@CurrentProjectId() projectId: string) {
    return this.attributesService.list(projectId);
  }

  /**
   * GET /attributes/:id
   * Get a specific attribute
   */
  @Get(':id')
  async findOne(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.attributesService.findOne(projectId, id);
  }

  /**
   * DELETE /attributes/:id
   * Delete an attribute
   */
  @Delete(':id')
  async delete(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.attributesService.delete(projectId, id);
    return { success: true };
  }
}
