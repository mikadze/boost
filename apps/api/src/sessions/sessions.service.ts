import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  CustomerSessionRepository,
  CouponRepository,
  CampaignRepository,
  CustomerSession,
  Rule,
} from '@boost/database';
import {
  RuleConditionGroup,
  RuleEffect,
  ComparisonOperator,
} from '@boost/common';
import {
  CreateSessionDto,
  UpdateSessionDto,
  CartItemDto,
} from './dto/create-session.dto';
import { SessionEffectExecutorService, AppliedEffect } from './session-effect-executor.service';

export interface SessionResponse {
  sessionToken: string;
  items: CartItemDto[];
  subtotal: number;
  discount: number;
  total: number;
  coupons: string[];
  appliedEffects: AppliedEffect[];
  rejectedCoupons?: string[];
  currency: string;
  status: string;
}

interface CampaignWithRules {
  id: string;
  active: boolean;
  priority: number;
  rules: Rule[];
}

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly sessionRepository: CustomerSessionRepository,
    private readonly couponRepository: CouponRepository,
    private readonly campaignRepository: CampaignRepository,
    private readonly effectExecutor: SessionEffectExecutorService,
  ) {}

  async createOrUpdate(
    projectId: string,
    dto: CreateSessionDto,
  ): Promise<SessionResponse> {
    // Check for existing active session
    let session = await this.sessionRepository.findActiveByUserId(
      projectId,
      dto.userId,
    );

    if (session) {
      // Update existing session
      return this.processSession(projectId, session, dto.items, dto.coupons || []);
    }

    // Create new session
    session = await this.sessionRepository.create({
      projectId,
      userId: dto.userId,
      items: dto.items,
      coupons: dto.coupons || [],
      currency: dto.currency,
    });

    return this.processSession(projectId, session, dto.items, dto.coupons || []);
  }

  async getByToken(
    projectId: string,
    token: string,
  ): Promise<SessionResponse> {
    const session = await this.verifySessionAccess(projectId, token);

    return {
      sessionToken: session.sessionToken,
      items: session.items as CartItemDto[],
      subtotal: session.subtotal,
      discount: session.discount,
      total: session.total,
      coupons: session.coupons as string[],
      appliedEffects: session.appliedEffects as AppliedEffect[],
      currency: session.currency,
      status: session.status,
    };
  }

  async update(
    projectId: string,
    token: string,
    dto: UpdateSessionDto,
  ): Promise<SessionResponse> {
    const session = await this.verifySessionAccess(projectId, token);

    if (session.status !== 'active') {
      throw new BadRequestException('Cannot update a completed or abandoned session');
    }

    const items = dto.items || (session.items as CartItemDto[]);
    const coupons = dto.coupons || (session.coupons as string[]);

    return this.processSession(projectId, session, items, coupons);
  }

  async applyCoupon(
    projectId: string,
    token: string,
    code: string,
  ): Promise<SessionResponse> {
    const session = await this.verifySessionAccess(projectId, token);

    if (session.status !== 'active') {
      throw new BadRequestException('Cannot modify a completed or abandoned session');
    }

    const items = session.items as CartItemDto[];
    const subtotal = this.calculateSubtotal(items);

    // Validate coupon
    const validation = await this.couponRepository.validateCoupon(
      projectId,
      code,
      session.userId,
      subtotal,
    );

    if (!validation.valid) {
      throw new BadRequestException(validation.error || 'Invalid coupon');
    }

    // Add coupon to session
    const currentCoupons = session.coupons as string[];
    if (currentCoupons.includes(code.toUpperCase())) {
      throw new BadRequestException('Coupon already applied');
    }

    const coupons = [...currentCoupons, code.toUpperCase()];

    return this.processSession(projectId, session, items, coupons);
  }

  async complete(projectId: string, token: string): Promise<SessionResponse> {
    const session = await this.verifySessionAccess(projectId, token);

    if (session.status !== 'active') {
      throw new BadRequestException('Session is not active');
    }

    // Record coupon usages
    const coupons = session.coupons as string[];
    for (const code of coupons) {
      const coupon = await this.couponRepository.findByCode(projectId, code);
      if (coupon) {
        await this.couponRepository.recordUsage({
          couponId: coupon.id,
          projectId,
          userId: session.userId,
          sessionId: session.id,
        });
      }
    }

    // Mark session as completed
    await this.sessionRepository.complete(session.id);

    const completedSession = await this.sessionRepository.findById(session.id);
    if (!completedSession) {
      throw new Error('Session not found after completion');
    }

    return {
      sessionToken: completedSession.sessionToken,
      items: completedSession.items as CartItemDto[],
      subtotal: completedSession.subtotal,
      discount: completedSession.discount,
      total: completedSession.total,
      coupons: completedSession.coupons as string[],
      appliedEffects: completedSession.appliedEffects as AppliedEffect[],
      currency: completedSession.currency,
      status: completedSession.status,
    };
  }

  private async processSession(
    projectId: string,
    session: CustomerSession,
    items: CartItemDto[],
    coupons: string[],
  ): Promise<SessionResponse> {
    const subtotal = this.calculateSubtotal(items);

    // Load active campaigns and rules
    const campaigns = await this.campaignRepository.findActiveCampaigns(projectId);

    // Evaluate rules and collect effects
    const effects: RuleEffect[] = [];

    for (const campaign of campaigns as CampaignWithRules[]) {
      for (const rule of campaign.rules) {
        if (!rule.active) continue;

        const conditions = rule.conditions as RuleConditionGroup;
        const eventData = this.buildEventData(session, items, subtotal, coupons);
        const matched = this.evaluateConditions(conditions, eventData);

        if (matched) {
          const ruleEffects = rule.effects as RuleEffect[];
          effects.push(...ruleEffects);
          this.logger.debug(`Rule "${rule.name}" matched`);
        }
      }
    }

    // Apply coupon discounts
    for (const code of coupons) {
      const coupon = await this.couponRepository.findByCode(projectId, code);
      if (coupon && coupon.active) {
        effects.push({
          type: 'apply_coupon',
          params: { code, couponId: coupon.id },
        });
      }
    }

    // Execute effects
    const result = await this.effectExecutor.executeEffects(
      {
        session,
        items,
        subtotal,
        coupons,
        projectId,
        userId: session.userId,
      },
      effects,
    );

    // Calculate final total
    const total = Math.max(0, subtotal - result.discount);

    // Update session in database
    await this.sessionRepository.update(session.id, {
      items: result.items,
      coupons,
      subtotal,
      discount: result.discount,
      total,
      appliedEffects: result.appliedEffects,
    });

    // Filter out rejected coupons
    const validCoupons = coupons.filter(
      (c) => !result.rejectedCoupons.includes(c),
    );

    return {
      sessionToken: session.sessionToken,
      items: result.items,
      subtotal,
      discount: result.discount,
      total,
      coupons: validCoupons,
      appliedEffects: result.appliedEffects,
      rejectedCoupons: result.rejectedCoupons.length > 0 ? result.rejectedCoupons : undefined,
      currency: session.currency,
      status: session.status,
    };
  }

  private calculateSubtotal(items: CartItemDto[]): number {
    return items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  }

  private buildEventData(
    session: CustomerSession,
    items: CartItemDto[],
    subtotal: number,
    coupons: string[],
  ): Record<string, unknown> {
    return this.flattenObject({
      sessionId: session.id,
      userId: session.userId,
      items,
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      categories: [...new Set(items.map((i) => i.category).filter(Boolean))],
      coupons,
      hasCoupons: coupons.length > 0,
    });
  }

  private evaluateConditions(
    group: RuleConditionGroup,
    data: Record<string, unknown>,
  ): boolean {
    if (!group.conditions || group.conditions.length === 0) {
      return true;
    }

    const { logic, conditions } = group;

    if (logic === 'and') {
      return conditions.every((condition) =>
        this.compareValues(
          data[condition.field],
          condition.operator as ComparisonOperator,
          condition.value,
        ),
      );
    } else {
      return conditions.some((condition) =>
        this.compareValues(
          data[condition.field],
          condition.operator as ComparisonOperator,
          condition.value,
        ),
      );
    }
  }

  private compareValues(
    actual: unknown,
    operator: ComparisonOperator,
    expected: unknown,
  ): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case 'greater_than_or_equal':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      case 'less_than':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case 'less_than_or_equal':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      case 'contains':
        if (Array.isArray(actual)) return actual.includes(expected);
        if (typeof actual === 'string' && typeof expected === 'string')
          return actual.includes(expected);
        return false;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'not_exists':
        return actual === undefined || actual === null;
      default:
        return false;
    }
  }

  private flattenObject(
    obj: Record<string, unknown>,
    prefix = '',
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = value;
      } else if (Array.isArray(value)) {
        result[newKey] = value;
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.assign(
              result,
              this.flattenObject(item as Record<string, unknown>, `${newKey}.${index}`),
            );
          } else {
            result[`${newKey}.${index}`] = item;
          }
        });
      } else if (typeof value === 'object') {
        Object.assign(
          result,
          this.flattenObject(value as Record<string, unknown>, newKey),
        );
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  private async verifySessionAccess(
    projectId: string,
    token: string,
  ): Promise<CustomerSession> {
    const session = await this.sessionRepository.findByToken(token);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return session;
  }
}
