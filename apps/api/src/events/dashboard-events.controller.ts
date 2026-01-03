import {
  Controller,
  Get,
  Param,
  Query,
  Sse,
  UseGuards,
  ForbiddenException,
  MessageEvent,
} from '@nestjs/common';
import { Observable, interval, switchMap, startWith, from, of } from 'rxjs';
import { SessionGuard, CurrentUser } from '@boost/common';
import { EventRepository } from '@boost/database';
import { ProjectsService } from '../projects/projects.service';

/**
 * Dashboard Events Controller - SSE streaming for debugger
 * Uses session authentication for dashboard access
 * Routes: /dashboard/projects/:projectId/events
 */
@Controller('dashboard/projects/:projectId/events')
@UseGuards(SessionGuard)
export class DashboardEventsController {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly projectsService: ProjectsService,
  ) {}

  private async verifyAccess(userId: string, projectId: string): Promise<void> {
    const hasAccess = await this.projectsService.verifyProjectAccess(userId, projectId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this project');
    }
  }

  /**
   * Get recent events for the project
   */
  @Get()
  async getRecentEvents(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    await this.verifyAccess(user.id, projectId);
    const events = await this.eventRepository.findRecentByProjectId(
      projectId,
      limit ? parseInt(limit, 10) : 50,
    );
    return events;
  }

  /**
   * SSE endpoint for real-time event streaming
   * Polls every 2 seconds and sends new events
   */
  @Sse('stream')
  streamEvents(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ): Observable<MessageEvent> {
    let lastEventId: string | null = null;

    // Poll every 2 seconds for new events
    return interval(2000).pipe(
      startWith(0),
      switchMap(() =>
        from(
          (async (): Promise<MessageEvent> => {
            // Verify access on each poll (session could expire)
            try {
              await this.verifyAccess(user.id, projectId);
            } catch {
              return { data: JSON.stringify({ error: 'Access denied' }) };
            }

            // Fetch recent events
            const events = await this.eventRepository.findRecentByProjectId(projectId, 20);

            // On first poll, send all events
            if (lastEventId === null) {
              lastEventId = events[0]?.id ?? null;
              return { data: JSON.stringify({ events, isInitial: true }) };
            }

            // On subsequent polls, only send new events
            const newEvents = [];
            for (const event of events) {
              if (event.id === lastEventId) break;
              newEvents.push(event);
            }

            if (newEvents.length > 0) {
              lastEventId = newEvents[0]?.id ?? lastEventId;
              return { data: JSON.stringify({ events: newEvents, isInitial: false }) };
            }

            // No new events - send heartbeat
            return { data: JSON.stringify({ events: [], isInitial: false }) };
          })(),
        ),
      ),
    );
  }
}
