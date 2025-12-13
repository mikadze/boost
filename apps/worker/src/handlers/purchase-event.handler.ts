import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RawEventMessage, CommissionService } from '@boost/common';
import {
  CommissionPlanRepository,
  CommissionLedgerRepository,
  ReferralTrackingRepository,
  EndUserRepository,
} from '@boost/database';
import { EventHandler } from './event-handler.interface';

/**
 * Purchase Event Handler
 *
 * Processes purchase/checkout events to calculate affiliate commissions:
 * 1. Listens for "purchase" or "checkout_success" events
 * 2. Extracts transaction amount from event properties
 * 3. Locates referrer via referral tracking table
 * 4. Fetches referrer's current commission plan
 * 5. Calculates commission amount
 * 6. Inserts ledger entry with PENDING status
 */
@Injectable()
export class PurchaseEventHandler implements EventHandler {
  private readonly logger = new Logger(PurchaseEventHandler.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly commissionService: CommissionService,
    private readonly commissionPlanRepository: CommissionPlanRepository,
    private readonly commissionLedgerRepository: CommissionLedgerRepository,
    private readonly referralTrackingRepository: ReferralTrackingRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  /**
   * Event types this handler processes
   */
  getSupportedTypes(): string[] {
    return ['purchase', 'checkout_success'];
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Processing purchase event: ${event.event}`);

    // SECURITY: Defense-in-depth validation
    // Purchase events should only be accepted from server-side (secret key)
    // The API controller already blocks this, but we double-check here
    if (event._source === 'client') {
      this.logger.warn(
        `Rejected client-sourced purchase event for user ${event.userId}. ` +
          `Purchase events must be sent from server with secret key (sk_live_*).`,
      );
      return;
    }

    const properties = event.properties as Record<string, unknown> | undefined;

    // Extract transaction amount from event properties
    const amountCents = this.extractAmountCents(properties);
    if (amountCents === null || amountCents <= 0) {
      this.logger.debug('No valid amount in purchase event, skipping commission calculation');
      return;
    }

    // Get the user who made the purchase
    const purchaserUserId = event.userId;
    if (!purchaserUserId) {
      this.logger.debug('No userId in purchase event, skipping commission calculation');
      return;
    }

    // Find if this user was referred by someone
    const referral = await this.referralTrackingRepository.findByReferredExternalId(
      event.projectId,
      purchaserUserId,
    );

    if (!referral) {
      this.logger.debug(`No referral found for user ${purchaserUserId}, skipping commission`);
      return;
    }

    // Get the referrer's end user record
    const referrer = await this.endUserRepository.findById(referral.referrerId);
    if (!referrer) {
      this.logger.warn(`Referrer ${referral.referrerId} not found, skipping commission`);
      return;
    }

    // Get the referrer's commission plan (or project default)
    let commissionPlan;
    if (referrer.commissionPlanId) {
      commissionPlan = await this.commissionPlanRepository.findById(referrer.commissionPlanId);
    }

    // Fallback to project default plan if no specific plan assigned
    if (!commissionPlan) {
      commissionPlan = await this.commissionPlanRepository.findDefaultForProject(event.projectId);
    }

    if (!commissionPlan) {
      this.logger.warn(`No commission plan found for project ${event.projectId}, skipping commission`);
      return;
    }

    // Calculate commission using safe integer math
    const calculation = this.commissionService.calculate(
      { type: commissionPlan.type as 'PERCENTAGE' | 'FIXED', value: commissionPlan.value },
      amountCents,
    );

    if (calculation.amount <= 0) {
      this.logger.debug('Commission amount is zero, skipping ledger entry');
      return;
    }

    // Create commission ledger entry
    const orderId = this.extractOrderId(properties);

    const ledgerEntry = await this.commissionLedgerRepository.create({
      projectId: event.projectId,
      endUserId: referrer.id,
      commissionPlanId: commissionPlan.id,
      amount: calculation.amount,
      sourceAmount: amountCents,
      sourceEventId: (properties?.eventId as string) ?? undefined,
      orderId: orderId ?? undefined,
      referredUserId: purchaserUserId,
      currency: commissionPlan.currency,
    });

    this.logger.log(
      `Commission created: ${this.commissionService.formatCurrency(calculation.amount)} ` +
      `for referrer ${referrer.externalId} (${calculation.planType} plan: ${commissionPlan.name})`,
    );

    // Emit commission.created event to trigger progression evaluation
    // This ensures progression stats include this commission before evaluation
    const commissionCreatedEvent = {
      projectId: event.projectId,
      userId: referrer.externalId,
      event: 'commission.created',
      properties: {
        commissionId: ledgerEntry.id,
        amount: calculation.amount,
        sourceAmount: amountCents,
        planId: commissionPlan.id,
        planName: commissionPlan.name,
        referredUserId: purchaserUserId,
        orderId,
      },
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.kafkaClient.emit('raw-events', commissionCreatedEvent);
    this.logger.debug('Emitted commission.created event for progression evaluation');
  }

  /**
   * Extract amount in cents from event properties
   * Handles various property formats
   */
  private extractAmountCents(properties: Record<string, unknown> | undefined): number | null {
    if (!properties) {
      return null;
    }

    // Try common property names for amount
    const amountFields = [
      'amount',
      'total',
      'revenue',
      'value',
      'order_total',
      'orderTotal',
      'transaction_amount',
      'transactionAmount',
    ];

    for (const field of amountFields) {
      const value = properties[field];
      if (typeof value === 'number' && value > 0) {
        // Check if value looks like it's in cents (no decimal) or dollars (has decimal)
        // If the value is less than 100, assume it's in dollars and convert
        // This is a heuristic - ideally the format should be explicit
        if (Number.isInteger(value)) {
          return value;
        } else {
          // Convert dollars to cents
          return this.commissionService.dollarsToCents(value);
        }
      }
    }

    // Try nested properties (e.g., properties.transaction.amount)
    const transaction = properties['transaction'] as Record<string, unknown> | undefined;
    if (transaction?.['amount']) {
      const value = transaction['amount'];
      if (typeof value === 'number' && value > 0) {
        return Number.isInteger(value) ? value : this.commissionService.dollarsToCents(value);
      }
    }

    return null;
  }

  /**
   * Extract order ID from event properties
   */
  private extractOrderId(properties: Record<string, unknown> | undefined): string | null {
    if (!properties) {
      return null;
    }

    const orderFields = ['orderId', 'order_id', 'transactionId', 'transaction_id', 'id'];

    for (const field of orderFields) {
      const value = properties[field];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return null;
  }
}
