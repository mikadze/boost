import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { RawEventMessage } from '@boost/common';
import { EventHandler, EVENT_HANDLERS } from './event-handler.interface';
import { DefaultEventHandler } from './default-event.handler';

/**
 * Registry that maps event types to their handlers.
 * Uses Strategy pattern to dispatch events to appropriate handlers.
 */
@Injectable()
export class EventHandlerRegistry implements OnModuleInit {
  private readonly logger = new Logger(EventHandlerRegistry.name);
  private readonly handlerMap = new Map<string, EventHandler>();

  constructor(
    @Inject(EVENT_HANDLERS)
    private readonly handlers: EventHandler[],
    private readonly defaultHandler: DefaultEventHandler,
  ) {}

  onModuleInit(): void {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    for (const handler of this.handlers) {
      const types = handler.getSupportedTypes();
      for (const type of types) {
        if (this.handlerMap.has(type)) {
          this.logger.warn(
            `Event type '${type}' already registered, overwriting`,
          );
        }
        this.handlerMap.set(type, handler);
        this.logger.log(`Registered handler for event type: ${type}`);
      }
    }

    this.logger.log(
      `Event handler registry initialized with ${this.handlerMap.size} event types`,
    );
  }

  /**
   * Get the handler for a specific event type.
   * Returns default handler if no specific handler is registered.
   */
  getHandler(eventType: string): EventHandler {
    return this.handlerMap.get(eventType) ?? this.defaultHandler;
  }

  /**
   * Dispatch event to appropriate handler
   */
  async dispatch(event: RawEventMessage): Promise<void> {
    const handler = this.getHandler(event.event);
    await handler.handle(event);
  }

  /**
   * Get all registered event types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlerMap.keys());
  }
}
