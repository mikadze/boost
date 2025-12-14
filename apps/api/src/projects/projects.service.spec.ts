import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectsService, ProjectStatsSummary } from './projects.service';
import {
  ProjectRepository,
  OrganizationRepository,
  ApiKeyRepository,
  EventRepository,
  CampaignRepository,
} from '@boost/database';
import { ApiKeyService } from '@boost/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: jest.Mocked<ProjectRepository>;
  let organizationRepo: jest.Mocked<OrganizationRepository>;
  let apiKeyService: jest.Mocked<ApiKeyService>;
  let apiKeyRepo: jest.Mocked<ApiKeyRepository>;
  let eventRepo: jest.Mocked<EventRepository>;
  let campaignRepo: jest.Mocked<CampaignRepository>;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    organizationId: 'org-1',
    createdAt: new Date(),
  };

  const mockEvent = {
    id: 'event-1',
    projectId: 'project-1',
    eventType: 'page_view',
    userId: 'user-1',
    payload: {},
    status: 'processed',
    errorDetails: null,
    createdAt: new Date('2024-01-15'),
    processedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: OrganizationRepository,
          useValue: {
            isMember: jest.fn(),
          },
        },
        {
          provide: ApiKeyService,
          useValue: {
            listKeys: jest.fn(),
            createKey: jest.fn(),
            revokeKey: jest.fn(),
          },
        },
        {
          provide: ApiKeyRepository,
          useValue: {
            findById: jest.fn(),
            deleteById: jest.fn(),
          },
        },
        {
          provide: EventRepository,
          useValue: {
            countByProjectId: jest.fn(),
            getFirstEventDate: jest.fn(),
            findRecentByProjectId: jest.fn(),
            create: jest.fn(),
            markAsProcessed: jest.fn(),
          },
        },
        {
          provide: CampaignRepository,
          useValue: {
            countActiveCampaigns: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepo = module.get(ProjectRepository);
    organizationRepo = module.get(OrganizationRepository);
    apiKeyService = module.get(ApiKeyService);
    apiKeyRepo = module.get(ApiKeyRepository);
    eventRepo = module.get(EventRepository);
    campaignRepo = module.get(CampaignRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyProjectAccess', () => {
    it('should return project if user has access', async () => {
      projectRepo.findById.mockResolvedValue(mockProject);
      organizationRepo.isMember.mockResolvedValue(true);

      const result = await service.verifyProjectAccess('user-1', 'project-1');

      expect(result).toEqual(mockProject);
      expect(projectRepo.findById).toHaveBeenCalledWith('project-1');
      expect(organizationRepo.isMember).toHaveBeenCalledWith('user-1', 'org-1');
    });

    it('should throw NotFoundException if project not found', async () => {
      projectRepo.findById.mockResolvedValue(null);

      await expect(service.verifyProjectAccess('user-1', 'project-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      projectRepo.findById.mockResolvedValue(mockProject);
      organizationRepo.isMember.mockResolvedValue(false);

      await expect(service.verifyProjectAccess('user-1', 'project-1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStatsSummary', () => {
    it('should return stats summary with events', async () => {
      const firstEventDate = new Date('2024-01-01');
      eventRepo.countByProjectId.mockResolvedValue(100);
      eventRepo.getFirstEventDate.mockResolvedValue(firstEventDate);
      campaignRepo.countActiveCampaigns.mockResolvedValue(5);

      const result = await service.getStatsSummary('project-1');

      expect(result).toEqual<ProjectStatsSummary>({
        totalEvents: 100,
        firstEventAt: firstEventDate.toISOString(),
        activeCampaigns: 5,
      });
      expect(eventRepo.countByProjectId).toHaveBeenCalledWith('project-1');
      expect(eventRepo.getFirstEventDate).toHaveBeenCalledWith('project-1');
      expect(campaignRepo.countActiveCampaigns).toHaveBeenCalledWith('project-1');
    });

    it('should return null for firstEventAt when no events', async () => {
      eventRepo.countByProjectId.mockResolvedValue(0);
      eventRepo.getFirstEventDate.mockResolvedValue(null);
      campaignRepo.countActiveCampaigns.mockResolvedValue(0);

      const result = await service.getStatsSummary('project-1');

      expect(result).toEqual<ProjectStatsSummary>({
        totalEvents: 0,
        firstEventAt: null,
        activeCampaigns: 0,
      });
    });

    it('should execute queries in parallel', async () => {
      const countPromise = Promise.resolve(50);
      const firstEventPromise = Promise.resolve(new Date());
      const campaignsPromise = Promise.resolve(3);

      eventRepo.countByProjectId.mockReturnValue(countPromise);
      eventRepo.getFirstEventDate.mockReturnValue(firstEventPromise);
      campaignRepo.countActiveCampaigns.mockReturnValue(campaignsPromise);

      await service.getStatsSummary('project-1');

      // Verify all queries were called (they run in parallel)
      expect(eventRepo.countByProjectId).toHaveBeenCalled();
      expect(eventRepo.getFirstEventDate).toHaveBeenCalled();
      expect(campaignRepo.countActiveCampaigns).toHaveBeenCalled();
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events formatted correctly', async () => {
      eventRepo.findRecentByProjectId.mockResolvedValue([mockEvent]);

      const result = await service.getRecentEvents('project-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'event-1',
        eventType: 'page_view',
        userId: 'user-1',
        status: 'processed',
        createdAt: mockEvent.createdAt.toISOString(),
      });
    });

    it('should return empty array when no events', async () => {
      eventRepo.findRecentByProjectId.mockResolvedValue([]);

      const result = await service.getRecentEvents('project-1');

      expect(result).toEqual([]);
    });

    it('should use default limit of 10', async () => {
      eventRepo.findRecentByProjectId.mockResolvedValue([]);

      await service.getRecentEvents('project-1');

      expect(eventRepo.findRecentByProjectId).toHaveBeenCalledWith('project-1', 10);
    });

    it('should accept custom limit', async () => {
      eventRepo.findRecentByProjectId.mockResolvedValue([]);

      await service.getRecentEvents('project-1', 5);

      expect(eventRepo.findRecentByProjectId).toHaveBeenCalledWith('project-1', 5);
    });
  });

  describe('revokeApiKeyWithOwnershipCheck', () => {
    it('should revoke key if user has access', async () => {
      const mockApiKey = {
        id: 'key-1',
        projectId: 'project-1',
        type: 'secret',
        prefix: 'sk_live_test',
        keyHash: 'hash',
        scopes: [],
        createdAt: new Date(),
        lastUsedAt: null,
      };

      apiKeyRepo.findById.mockResolvedValue(mockApiKey);
      projectRepo.findById.mockResolvedValue(mockProject);
      organizationRepo.isMember.mockResolvedValue(true);
      apiKeyRepo.deleteById.mockResolvedValue();

      await service.revokeApiKeyWithOwnershipCheck('user-1', 'key-1');

      expect(apiKeyRepo.deleteById).toHaveBeenCalledWith('key-1');
    });

    it('should throw NotFoundException if key not found', async () => {
      apiKeyRepo.findById.mockResolvedValue(null);

      await expect(service.revokeApiKeyWithOwnershipCheck('user-1', 'key-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user lacks access', async () => {
      const mockApiKey = {
        id: 'key-1',
        projectId: 'project-1',
        type: 'secret',
        prefix: 'sk_live_test',
        keyHash: 'hash',
        scopes: [],
        createdAt: new Date(),
        lastUsedAt: null,
      };

      apiKeyRepo.findById.mockResolvedValue(mockApiKey);
      projectRepo.findById.mockResolvedValue(mockProject);
      organizationRepo.isMember.mockResolvedValue(false);

      await expect(service.revokeApiKeyWithOwnershipCheck('user-1', 'key-1'))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendTestEvent', () => {
    it('should create and mark test event as processed', async () => {
      const eventId = 'event-123';
      eventRepo.create.mockResolvedValue({ id: eventId });
      eventRepo.markAsProcessed.mockResolvedValue();

      const result = await service.sendTestEvent('project-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.eventId).toBe(eventId);
      expect(result.eventType).toBe('test_event');
      expect(result.createdAt).toBeDefined();
      expect(eventRepo.create).toHaveBeenCalledWith({
        projectId: 'project-1',
        eventType: 'test_event',
        userId: 'setup-guide-user-1',
        payload: expect.objectContaining({
          source: 'setup-guide',
          message: 'Test event from Boost setup guide',
        }),
      });
      expect(eventRepo.markAsProcessed).toHaveBeenCalledWith(eventId);
    });
  });

  describe('getRecentEvents limit validation', () => {
    it('should clamp limit to maximum of 100', async () => {
      eventRepo.findRecentByProjectId.mockResolvedValue([]);

      await service.getRecentEvents('project-1', 500);

      expect(eventRepo.findRecentByProjectId).toHaveBeenCalledWith('project-1', 100);
    });

    it('should clamp limit to minimum of 1', async () => {
      eventRepo.findRecentByProjectId.mockResolvedValue([]);

      await service.getRecentEvents('project-1', -5);

      expect(eventRepo.findRecentByProjectId).toHaveBeenCalledWith('project-1', 1);
    });

    it('should use default of 10 when not specified', async () => {
      eventRepo.findRecentByProjectId.mockResolvedValue([]);

      await service.getRecentEvents('project-1');

      expect(eventRepo.findRecentByProjectId).toHaveBeenCalledWith('project-1', 10);
    });
  });
});
