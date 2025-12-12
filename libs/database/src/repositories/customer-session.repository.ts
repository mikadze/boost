import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { customerSessions, CustomerSession, CustomerSessionStatus } from '../schema';
import { randomBytes } from 'crypto';

export interface CreateSessionData {
  projectId: string;
  userId: string;
  items?: unknown[];
  coupons?: string[];
  subtotal?: number;
  discount?: number;
  total?: number;
  currency?: string;
  expiresAt?: Date;
}

export interface UpdateSessionData {
  items?: unknown[];
  coupons?: string[];
  subtotal?: number;
  discount?: number;
  total?: number;
  appliedEffects?: unknown[];
  status?: CustomerSessionStatus;
}

@Injectable()
export class CustomerSessionRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  async create(data: CreateSessionData): Promise<CustomerSession> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = data.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default

    const result = await this.db
      .insert(customerSessions)
      .values({
        projectId: data.projectId,
        userId: data.userId,
        sessionToken,
        items: data.items ?? [],
        coupons: data.coupons ?? [],
        subtotal: data.subtotal ?? 0,
        discount: data.discount ?? 0,
        total: data.total ?? 0,
        currency: data.currency ?? 'USD',
        expiresAt,
        appliedEffects: [],
        status: 'active',
      })
      .returning();

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to create customer session');
    }
    return inserted;
  }

  async findById(id: string): Promise<CustomerSession | null> {
    const result = await this.db.query.customerSessions.findFirst({
      where: eq(customerSessions.id, id),
    });
    return result ?? null;
  }

  async findByToken(sessionToken: string): Promise<CustomerSession | null> {
    const result = await this.db.query.customerSessions.findFirst({
      where: eq(customerSessions.sessionToken, sessionToken),
    });
    return result ?? null;
  }

  async findActiveByUserId(
    projectId: string,
    userId: string,
  ): Promise<CustomerSession | null> {
    const result = await this.db.query.customerSessions.findFirst({
      where: and(
        eq(customerSessions.projectId, projectId),
        eq(customerSessions.userId, userId),
        eq(customerSessions.status, 'active'),
      ),
    });
    return result ?? null;
  }

  async update(id: string, data: UpdateSessionData): Promise<void> {
    await this.db
      .update(customerSessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerSessions.id, id));
  }

  async updateByToken(sessionToken: string, data: UpdateSessionData): Promise<void> {
    await this.db
      .update(customerSessions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerSessions.sessionToken, sessionToken));
  }

  async complete(id: string): Promise<void> {
    await this.update(id, { status: 'completed' });
  }

  async abandon(id: string): Promise<void> {
    await this.update(id, { status: 'abandoned' });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(customerSessions).where(eq(customerSessions.id, id));
  }
}
