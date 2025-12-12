import { Injectable, Logger } from '@nestjs/common';
import { CouponRepository, Coupon, CustomerSession } from '@boost/database';
import { RuleEffect } from '@boost/common';
import { CartItemDto } from './dto/create-session.dto';

export interface SessionEffectContext {
  session: CustomerSession;
  items: CartItemDto[];
  subtotal: number;
  coupons: string[];
  projectId: string;
  userId: string;
}

export interface SessionEffectResult {
  items: CartItemDto[];
  discount: number;
  appliedEffects: AppliedEffect[];
  rejectedCoupons: string[];
}

export interface AppliedEffect {
  type: string;
  ruleId?: string;
  params: Record<string, unknown>;
  discountAmount?: number;
}

@Injectable()
export class SessionEffectExecutorService {
  private readonly logger = new Logger(SessionEffectExecutorService.name);

  constructor(private readonly couponRepository: CouponRepository) {}

  /**
   * Execute session-specific effects synchronously
   */
  async executeEffects(
    context: SessionEffectContext,
    effects: RuleEffect[],
  ): Promise<SessionEffectResult> {
    let items = [...context.items];
    let totalDiscount = 0;
    const appliedEffects: AppliedEffect[] = [];
    const rejectedCoupons: string[] = [];

    for (const effect of effects) {
      try {
        const result = await this.executeEffect(context, effect, items, totalDiscount);
        items = result.items;
        totalDiscount = result.totalDiscount;
        if (result.appliedEffect) {
          appliedEffects.push(result.appliedEffect);
        }
        if (result.rejectedCoupon) {
          rejectedCoupons.push(result.rejectedCoupon);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to execute effect ${effect.type}: ${errorMessage}`);
      }
    }

    return {
      items,
      discount: totalDiscount,
      appliedEffects,
      rejectedCoupons,
    };
  }

  private async executeEffect(
    context: SessionEffectContext,
    effect: RuleEffect,
    currentItems: CartItemDto[],
    currentDiscount: number,
  ): Promise<{
    items: CartItemDto[];
    totalDiscount: number;
    appliedEffect?: AppliedEffect;
    rejectedCoupon?: string;
  }> {
    switch (effect.type) {
      case 'apply_discount':
        return this.applyDiscount(context, effect, currentItems, currentDiscount);

      case 'add_item':
        return this.addItem(effect, currentItems, currentDiscount);

      case 'remove_item':
        return this.removeItem(effect, currentItems, currentDiscount);

      case 'set_shipping':
        return this.setShipping(effect, currentItems, currentDiscount);

      case 'apply_coupon':
        return this.applyCoupon(context, effect, currentItems, currentDiscount);

      case 'reject_coupon':
        return this.rejectCoupon(effect, currentItems, currentDiscount);

      default:
        this.logger.debug(`Effect ${effect.type} not handled in session context`);
        return { items: currentItems, totalDiscount: currentDiscount };
    }
  }

  private async applyDiscount(
    context: SessionEffectContext,
    effect: RuleEffect,
    items: CartItemDto[],
    currentDiscount: number,
  ): Promise<{
    items: CartItemDto[];
    totalDiscount: number;
    appliedEffect?: AppliedEffect;
  }> {
    const { discountType, discountValue, maxDiscount, category } = effect.params as {
      discountType: 'percentage' | 'fixed_amount';
      discountValue: number;
      maxDiscount?: number;
      category?: string;
    };

    let discountAmount = 0;
    let applicableSubtotal = context.subtotal;

    // If category specified, only apply to matching items
    if (category) {
      const matchingItems = items.filter((item) => item.category === category);
      applicableSubtotal = matchingItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
    }

    if (discountType === 'percentage') {
      discountAmount = Math.floor((applicableSubtotal * discountValue) / 100);
      if (maxDiscount !== undefined && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = discountValue;
    }

    // Don't exceed subtotal
    discountAmount = Math.min(discountAmount, context.subtotal - currentDiscount);

    this.logger.debug(`Applied discount: ${discountAmount} (${discountType}: ${discountValue})`);

    return {
      items,
      totalDiscount: currentDiscount + discountAmount,
      appliedEffect: {
        type: 'apply_discount',
        params: effect.params,
        discountAmount,
      },
    };
  }

  private async addItem(
    effect: RuleEffect,
    items: CartItemDto[],
    currentDiscount: number,
  ): Promise<{
    items: CartItemDto[];
    totalDiscount: number;
    appliedEffect?: AppliedEffect;
  }> {
    const { sku, name, quantity, unitPrice, category, metadata } = effect.params as {
      sku: string;
      name: string;
      quantity: number;
      unitPrice: number;
      category?: string;
      metadata?: Record<string, unknown>;
    };

    const newItem: CartItemDto = {
      sku,
      name,
      quantity: quantity || 1,
      unitPrice: unitPrice || 0, // Free items have 0 price
      category,
      metadata: {
        ...metadata,
        addedByRule: true,
      },
    };

    this.logger.debug(`Added item: ${sku} (${name})`);

    return {
      items: [...items, newItem],
      totalDiscount: currentDiscount,
      appliedEffect: {
        type: 'add_item',
        params: effect.params,
      },
    };
  }

  private async removeItem(
    effect: RuleEffect,
    items: CartItemDto[],
    currentDiscount: number,
  ): Promise<{
    items: CartItemDto[];
    totalDiscount: number;
    appliedEffect?: AppliedEffect;
  }> {
    const { sku } = effect.params as { sku: string };

    const filteredItems = items.filter((item) => item.sku !== sku);

    if (filteredItems.length < items.length) {
      this.logger.debug(`Removed item: ${sku}`);
    }

    return {
      items: filteredItems,
      totalDiscount: currentDiscount,
      appliedEffect: {
        type: 'remove_item',
        params: effect.params,
      },
    };
  }

  private async setShipping(
    effect: RuleEffect,
    items: CartItemDto[],
    currentDiscount: number,
  ): Promise<{
    items: CartItemDto[];
    totalDiscount: number;
    appliedEffect?: AppliedEffect;
  }> {
    const { shippingCost } = effect.params as { shippingCost: number };

    this.logger.debug(`Set shipping: ${shippingCost}`);

    return {
      items,
      totalDiscount: currentDiscount,
      appliedEffect: {
        type: 'set_shipping',
        params: { shippingCost },
      },
    };
  }

  private async applyCoupon(
    context: SessionEffectContext,
    effect: RuleEffect,
    items: CartItemDto[],
    currentDiscount: number,
  ): Promise<{
    items: CartItemDto[];
    totalDiscount: number;
    appliedEffect?: AppliedEffect;
  }> {
    const { code } = effect.params as { code: string };

    const validation = await this.couponRepository.validateCoupon(
      context.projectId,
      code,
      context.userId,
      context.subtotal,
    );

    if (!validation.valid || !validation.coupon) {
      this.logger.debug(`Coupon ${code} invalid: ${validation.error}`);
      return { items, totalDiscount: currentDiscount };
    }

    const discountAmount = await this.couponRepository.calculateDiscount(
      validation.coupon,
      context.subtotal - currentDiscount,
    );

    this.logger.debug(`Applied coupon ${code}: discount ${discountAmount}`);

    return {
      items,
      totalDiscount: currentDiscount + discountAmount,
      appliedEffect: {
        type: 'apply_coupon',
        params: { code, couponId: validation.coupon.id },
        discountAmount,
      },
    };
  }

  private async rejectCoupon(
    effect: RuleEffect,
    items: CartItemDto[],
    currentDiscount: number,
  ): Promise<{
    items: CartItemDto[];
    totalDiscount: number;
    rejectedCoupon?: string;
  }> {
    const { code, reason } = effect.params as { code: string; reason?: string };

    this.logger.debug(`Rejected coupon ${code}: ${reason || 'rule rejection'}`);

    return {
      items,
      totalDiscount: currentDiscount,
      rejectedCoupon: code,
    };
  }
}
