import { Injectable } from '@nestjs/common';
import { CommissionPlanType } from '@boost/database';

/**
 * Commission calculation result
 */
export interface CommissionCalculationResult {
  /** Commission amount in cents */
  amount: number;
  /** Original source amount in cents */
  sourceAmount: number;
  /** Plan type used for calculation */
  planType: CommissionPlanType;
  /** Plan value (basis points for percentage, cents for fixed) */
  planValue: number;
}

/**
 * Commission plan data for calculation
 */
export interface CommissionPlanData {
  type: CommissionPlanType;
  value: number;
}

/**
 * Commission calculation service with safe integer math
 *
 * Uses banker's rounding (round half to even) for fair distribution
 * All amounts are in cents to avoid floating-point precision issues
 *
 * For percentage plans:
 * - Value is stored in basis points (1000 = 10.00%)
 * - Calculation: amount * (value / 10000)
 *
 * For fixed plans:
 * - Value is stored in cents (1000 = $10.00)
 * - Returns the fixed value directly
 */
@Injectable()
export class CommissionService {
  /**
   * Calculate commission amount for a given transaction
   *
   * @param plan - Commission plan configuration
   * @param sourceAmountCents - Transaction amount in cents
   * @returns Commission calculation result
   *
   * @example
   * // 10% commission on $50.00 purchase
   * const result = service.calculate(
   *   { type: 'PERCENTAGE', value: 1000 }, // 1000 basis points = 10%
   *   5000 // $50.00 in cents
   * );
   * // result.amount = 500 ($5.00)
   *
   * @example
   * // Fixed $5.00 commission
   * const result = service.calculate(
   *   { type: 'FIXED', value: 500 }, // 500 cents = $5.00
   *   10000 // $100.00 in cents
   * );
   * // result.amount = 500 ($5.00)
   */
  calculate(plan: CommissionPlanData, sourceAmountCents: number): CommissionCalculationResult {
    // Validate inputs
    if (sourceAmountCents < 0) {
      throw new Error('Source amount cannot be negative');
    }
    if (plan.value < 0) {
      throw new Error('Commission value cannot be negative');
    }

    let amount: number;

    if (plan.type === 'FIXED') {
      // Fixed commission: return the value directly (already in cents)
      amount = plan.value;
    } else {
      // Percentage commission: amount * (basis_points / 10000)
      // Use BigInt for safe integer math to avoid floating-point errors
      amount = this.calculatePercentage(sourceAmountCents, plan.value);
    }

    return {
      amount,
      sourceAmount: sourceAmountCents,
      planType: plan.type,
      planValue: plan.value,
    };
  }

  /**
   * Calculate percentage using safe integer math with banker's rounding
   *
   * @param amountCents - Amount in cents
   * @param basisPoints - Percentage in basis points (1000 = 10%)
   * @returns Commission amount in cents
   */
  private calculatePercentage(amountCents: number, basisPoints: number): number {
    // Use BigInt for precise calculation
    // Formula: (amount * basisPoints) / 10000
    const amountBig = BigInt(amountCents);
    const basisBig = BigInt(basisPoints);
    const divisor = BigInt(10000);

    // Calculate with extra precision for rounding
    // Multiply by 2 to get the doubled value for banker's rounding
    const numerator = amountBig * basisBig * BigInt(2);
    const doubled = numerator / divisor;

    // Banker's rounding: round half to even
    // If the doubled value is odd, we need to round
    // If the remainder is exactly half (doubled ends in 1), round to even
    const quotient = doubled / BigInt(2);
    const remainder = doubled % BigInt(2);

    let result: bigint;
    if (remainder === BigInt(0)) {
      result = quotient;
    } else {
      // Check if we should round up or down (banker's rounding)
      // If quotient is even, round down; if odd, round up
      if (quotient % BigInt(2) === BigInt(0)) {
        result = quotient;
      } else {
        result = quotient + BigInt(1);
      }
    }

    // Convert back to number (safe since we're dealing with cents)
    return Number(result);
  }

  /**
   * Format cents to currency string for display
   *
   * @param cents - Amount in cents
   * @param currency - Currency code (default: USD)
   * @returns Formatted currency string
   */
  formatCurrency(cents: number, currency: string = 'USD'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Convert dollars to cents
   *
   * @param dollars - Amount in dollars
   * @returns Amount in cents
   */
  dollarsToCents(dollars: number): number {
    return Math.round(dollars * 100);
  }

  /**
   * Convert cents to dollars
   *
   * @param cents - Amount in cents
   * @returns Amount in dollars
   */
  centsToDollars(cents: number): number {
    return cents / 100;
  }

  /**
   * Convert percentage to basis points
   *
   * @param percentage - Percentage value (e.g., 10 for 10%)
   * @returns Basis points (e.g., 1000 for 10%)
   */
  percentageToBasisPoints(percentage: number): number {
    return Math.round(percentage * 100);
  }

  /**
   * Convert basis points to percentage
   *
   * @param basisPoints - Basis points (e.g., 1000 for 10%)
   * @returns Percentage value (e.g., 10 for 10%)
   */
  basisPointsToPercentage(basisPoints: number): number {
    return basisPoints / 100;
  }
}
