import { Injectable } from '@nestjs/common';
import { getDrizzleClient, events } from '@boost/database';
import { eq } from 'drizzle-orm';

export interface RawEvent {
  id: string;
  projectId: string;
  eventType: string;
  userId?: string;
  payload: Record<string, any>;
}

@Injectable()
export class WorkerService {
  async processEvent(rawEvent: RawEvent) {
    const db = getDrizzleClient();

    try {
      console.log(`[Worker] Processing event: ${rawEvent.id} (${rawEvent.eventType})`);

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update event status to processed
      await db
        .update(events)
        .set({
          status: 'processed',
          processedAt: new Date(),
        })
        .where(eq(events.id, rawEvent.id));

      console.log(`[Worker] Event ${rawEvent.id} processed successfully`);
    } catch (error) {
      console.error(`[Worker] Error processing event ${rawEvent.id}:`, error);

      // Update event status to failed with error details
      await db
        .update(events)
        .set({
          status: 'failed',
          errorDetails: error instanceof Error ? error.message : String(error),
        })
        .where(eq(events.id, rawEvent.id));

      throw error;
    }
  }
}
