import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiKeyGuard, CurrentProjectId } from '@boost/common';
import { SessionsService } from './sessions.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  ApplyCouponDto,
} from './dto/create-session.dto';

@Controller('v1/sessions')
@UseGuards(ApiKeyGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * POST /v1/sessions
   * Create a new session with cart data
   * Evaluates rules and returns calculated discounts
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentProjectId() projectId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.createOrUpdate(projectId, dto);
  }

  /**
   * GET /v1/sessions/:token
   * Get session by token
   */
  @Get(':token')
  async getByToken(
    @CurrentProjectId() projectId: string,
    @Param('token') token: string,
  ) {
    return this.sessionsService.getByToken(projectId, token);
  }

  /**
   * PUT /v1/sessions/:token
   * Update session cart data
   * Re-evaluates rules and returns updated discounts
   */
  @Put(':token')
  async update(
    @CurrentProjectId() projectId: string,
    @Param('token') token: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(projectId, token, dto);
  }

  /**
   * POST /v1/sessions/:token/coupons
   * Apply a coupon to the session
   */
  @Post(':token/coupons')
  async applyCoupon(
    @CurrentProjectId() projectId: string,
    @Param('token') token: string,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.sessionsService.applyCoupon(projectId, token, dto.code);
  }

  /**
   * POST /v1/sessions/:token/complete
   * Complete the session (checkout)
   */
  @Post(':token/complete')
  async complete(
    @CurrentProjectId() projectId: string,
    @Param('token') token: string,
  ) {
    return this.sessionsService.complete(projectId, token);
  }
}
