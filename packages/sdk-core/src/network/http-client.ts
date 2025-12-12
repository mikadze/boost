import type { GamifyEvent, ApiResponse } from '../types.js';

/**
 * HTTP client for sending events to the API
 * Uses fetch with keepalive for reliable delivery during page unload
 */
export class HttpClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly debug: boolean;

  constructor(endpoint: string, apiKey: string, debug: boolean = false) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.debug = debug;
  }

  /**
   * Log debug messages
   */
  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[Gamify] ${message}`, data ?? '');
    }
  }

  /**
   * Send a batch of events to the API
   */
  async sendEvents(events: GamifyEvent[]): Promise<ApiResponse> {
    if (events.length === 0) {
      return { success: true };
    }

    this.log(`Sending ${events.length} events`, events);

    try {
      const response = await fetch(`${this.endpoint}/events/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({ events }),
        keepalive: true,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log(`API error: ${response.status}`, errorText);
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }

      this.log('Events sent successfully');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.log('Network error', message);
      return { success: false, error: message };
    }
  }

  /**
   * Send a single event using beacon API (for page unload)
   * Falls back to fetch if beacon is not available
   */
  sendBeacon(events: GamifyEvent[]): boolean {
    if (events.length === 0) {
      return true;
    }

    this.log(`Sending ${events.length} events via beacon`);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob(
        [JSON.stringify({ events, apiKey: this.apiKey })],
        { type: 'application/json' }
      );
      return navigator.sendBeacon(`${this.endpoint}/events/batch`, blob);
    }

    // Fallback: fire-and-forget fetch with keepalive
    fetch(`${this.endpoint}/events/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({ events }),
      keepalive: true,
    }).catch(() => {
      // Ignore errors during unload
    });

    return true;
  }
}
