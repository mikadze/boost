import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard, CurrentProjectId } from '@boost/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto';

@Controller('coupons')
@UseGuards(ApiKeyGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /**
   * POST /coupons
   * Create a new coupon
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateCouponDto,
  ) {
    return this.couponsService.create(projectId, dto);
  }

  /**
   * GET /coupons
   * List all coupons for the project
   */
  @Get()
  async list(@CurrentProjectId() projectId: string) {
    return this.couponsService.list(projectId);
  }

  /**
   * GET /coupons/:id
   * Get a specific coupon
   */
  @Get(':id')
  async findOne(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    return this.couponsService.findOne(projectId, id);
  }

  /**
   * GET /coupons/validate/:code
   * Validate a coupon code
   */
  @Get('validate/:code')
  async validate(
    @CurrentProjectId() projectId: string,
    @Param('code') code: string,
    @Query('userId') userId: string,
    @Query('cartTotal') cartTotal: string,
  ) {
    return this.couponsService.validate(
      projectId,
      code,
      userId,
      parseInt(cartTotal, 10) || 0,
    );
  }

  /**
   * PUT /coupons/:id
   * Update a coupon
   */
  @Put(':id')
  async update(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(projectId, id, dto);
  }

  /**
   * DELETE /coupons/:id
   * Delete a coupon
   */
  @Delete(':id')
  async delete(
    @CurrentProjectId() projectId: string,
    @Param('id') id: string,
  ) {
    await this.couponsService.delete(projectId, id);
    return { success: true };
  }
}
