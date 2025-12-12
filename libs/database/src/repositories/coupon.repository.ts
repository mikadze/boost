import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  coupons,
  couponUsages,
  Coupon,
  CouponUsage,
  CouponDiscountType,
} from '../schema';

export interface CreateCouponData {
  projectId: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumValue?: number;
  maximumDiscount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  active?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdateCouponData {
  description?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minimumValue?: number;
  maximumDiscount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  active?: boolean;
  validFrom?: Date;
  validUntil?: Date;
  metadata?: Record<string, unknown>;
}

export interface CouponValidation {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
}

@Injectable()
export class CouponRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateCouponData): Promise<{ id: string }> {
    const result = await this.db
      .insert(coupons)
      .values({
        projectId: data.projectId,
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumValue: data.minimumValue ?? 0,
        maximumDiscount: data.maximumDiscount,
        maxUses: data.maxUses ?? -1,
        maxUsesPerUser: data.maxUsesPerUser ?? -1,
        active: data.active ?? true,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        metadata: data.metadata,
      })
      .returning({ id: coupons.id });

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to create coupon');
    }
    return inserted;
  }

  async findById(id: string): Promise<Coupon | null> {
    const result = await this.db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    });
    return result ?? null;
  }

  async findByCode(projectId: string, code: string): Promise<Coupon | null> {
    const result = await this.db.query.coupons.findFirst({
      where: and(
        eq(coupons.projectId, projectId),
        eq(coupons.code, code.toUpperCase()),
      ),
    });
    return result ?? null;
  }

  async findByProjectId(projectId: string): Promise<Coupon[]> {
    const result = await this.db
      .select()
      .from(coupons)
      .where(eq(coupons.projectId, projectId))
      .orderBy(coupons.createdAt);

    return result;
  }

  async validateCoupon(
    projectId: string,
    code: string,
    userId: string,
    cartTotal: number,
  ): Promise<CouponValidation> {
    const coupon = await this.findByCode(projectId, code);

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    if (!coupon.active) {
      return { valid: false, error: 'Coupon is inactive' };
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return { valid: false, error: 'Coupon is not yet valid' };
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (coupon.maxUses !== -1 && coupon.usageCount >= coupon.maxUses) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    if (cartTotal < coupon.minimumValue) {
      return {
        valid: false,
        error: `Minimum cart value of ${coupon.minimumValue} required`,
      };
    }

    // Check per-user usage limit
    if (coupon.maxUsesPerUser !== -1) {
      const userUsages = await this.getUserUsageCount(coupon.id, userId);
      if (userUsages >= coupon.maxUsesPerUser) {
        return { valid: false, error: 'You have already used this coupon' };
      }
    }

    return { valid: true, coupon };
  }

  async getUserUsageCount(couponId: string, userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(couponUsages)
      .where(
        and(eq(couponUsages.couponId, couponId), eq(couponUsages.userId, userId)),
      );

    return result[0]?.count ?? 0;
  }

  async recordUsage(data: {
    couponId: string;
    projectId: string;
    userId: string;
    sessionId?: string;
    orderId?: string;
  }): Promise<{ id: string }> {
    // Record the usage
    const usageResult = await this.db
      .insert(couponUsages)
      .values({
        couponId: data.couponId,
        projectId: data.projectId,
        userId: data.userId,
        sessionId: data.sessionId,
        orderId: data.orderId,
      })
      .returning({ id: couponUsages.id });

    // Increment the usage count on the coupon
    await this.db
      .update(coupons)
      .set({
        usageCount: sql`${coupons.usageCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, data.couponId));

    const inserted = usageResult[0];
    if (!inserted) {
      throw new Error('Failed to record coupon usage');
    }
    return inserted;
  }

  async update(id: string, data: UpdateCouponData): Promise<void> {
    await this.db
      .update(coupons)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(coupons).where(eq(coupons.id, id));
  }

  async calculateDiscount(coupon: Coupon, cartTotal: number): Promise<number> {
    let discount: number;

    if (coupon.discountType === 'percentage') {
      discount = Math.floor((cartTotal * coupon.discountValue) / 100);
      // Apply maximum discount cap if set
      if (coupon.maximumDiscount !== null && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    } else {
      // Fixed amount discount
      discount = coupon.discountValue;
    }

    // Don't allow discount to exceed cart total
    return Math.min(discount, cartTotal);
  }
}
