import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RuleEngineService } from './rule-engine.service';
import { CampaignRepository, RuleRepository } from '@boost/database';

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let campaignRepository: jest.Mocked<CampaignRepository>;
  let ruleRepository: jest.Mocked<RuleRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        {
          provide: CampaignRepository,
          useValue: {
            findActiveCampaigns: jest.fn(),
          },
        },
        {
          provide: RuleRepository,
          useValue: {
            findActiveRulesForEventType: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
    campaignRepository = module.get(CampaignRepository);
    ruleRepository = module.get(RuleRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluate', () => {
    it('should return empty array when no active campaigns', async () => {
      campaignRepository.findActiveCampaigns.mockResolvedValue([]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'purchase',
        userId: 'user-1',
        properties: {},
        timestamp: Date.now(),
      });

      expect(result).toEqual([]);
    });

    it('should match rules with equals condition', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        projectId: 'project-1',
        name: 'Test Campaign',
        active: true,
        priority: 1,
        schedule: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            campaignId: 'campaign-1',
            projectId: 'project-1',
            name: 'Test Rule',
            description: null,
            active: true,
            priority: 1,
            eventTypes: ['purchase'],
            conditions: {
              logic: 'and',
              conditions: [
                { field: 'event', operator: 'equals', value: 'purchase' },
              ],
            },
            effects: [{ type: 'add_loyalty_points', params: { amount: 100 } }],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      campaignRepository.findActiveCampaigns.mockResolvedValue([mockCampaign as any]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'purchase',
        userId: 'user-1',
        properties: { amount: 150 },
        timestamp: Date.now(),
      });

      expect(result).toHaveLength(1);
      expect(result[0].ruleId).toBe('rule-1');
      expect(result[0].effects).toHaveLength(1);
      expect(result[0].effects[0].type).toBe('add_loyalty_points');
    });

    it('should match rules with greater_than condition', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        projectId: 'project-1',
        name: 'Test Campaign',
        active: true,
        priority: 1,
        schedule: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            campaignId: 'campaign-1',
            projectId: 'project-1',
            name: 'Big Purchase Rule',
            description: null,
            active: true,
            priority: 1,
            eventTypes: ['purchase'],
            conditions: {
              logic: 'and',
              conditions: [
                { field: 'properties.amount', operator: 'greater_than', value: 100 },
              ],
            },
            effects: [{ type: 'apply_discount', params: { percentage: 10 } }],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      campaignRepository.findActiveCampaigns.mockResolvedValue([mockCampaign as any]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'purchase',
        userId: 'user-1',
        properties: { amount: 150 },
        timestamp: Date.now(),
      });

      expect(result).toHaveLength(1);
      expect(result[0].effects[0].type).toBe('apply_discount');
    });

    it('should NOT match rules when condition fails', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        projectId: 'project-1',
        name: 'Test Campaign',
        active: true,
        priority: 1,
        schedule: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            campaignId: 'campaign-1',
            projectId: 'project-1',
            name: 'Big Purchase Rule',
            description: null,
            active: true,
            priority: 1,
            eventTypes: ['purchase'],
            conditions: {
              logic: 'and',
              conditions: [
                { field: 'properties.amount', operator: 'greater_than', value: 200 },
              ],
            },
            effects: [{ type: 'apply_discount', params: { percentage: 10 } }],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      campaignRepository.findActiveCampaigns.mockResolvedValue([mockCampaign as any]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'purchase',
        userId: 'user-1',
        properties: { amount: 150 },
        timestamp: Date.now(),
      });

      expect(result).toHaveLength(0);
    });

    it('should match with OR logic when one condition passes', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        projectId: 'project-1',
        name: 'Test Campaign',
        active: true,
        priority: 1,
        schedule: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            campaignId: 'campaign-1',
            projectId: 'project-1',
            name: 'Flexible Rule',
            description: null,
            active: true,
            priority: 1,
            eventTypes: ['purchase'],
            conditions: {
              logic: 'or',
              conditions: [
                { field: 'properties.amount', operator: 'greater_than', value: 200 },
                { field: 'properties.category', operator: 'equals', value: 'premium' },
              ],
            },
            effects: [{ type: 'add_loyalty_points', params: { amount: 50 } }],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      campaignRepository.findActiveCampaigns.mockResolvedValue([mockCampaign as any]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'purchase',
        userId: 'user-1',
        properties: { amount: 50, category: 'premium' },
        timestamp: Date.now(),
      });

      expect(result).toHaveLength(1);
    });

    it('should NOT match with AND logic when one condition fails', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        projectId: 'project-1',
        name: 'Test Campaign',
        active: true,
        priority: 1,
        schedule: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            campaignId: 'campaign-1',
            projectId: 'project-1',
            name: 'Strict Rule',
            description: null,
            active: true,
            priority: 1,
            eventTypes: ['purchase'],
            conditions: {
              logic: 'and',
              conditions: [
                { field: 'properties.amount', operator: 'greater_than', value: 200 },
                { field: 'properties.category', operator: 'equals', value: 'premium' },
              ],
            },
            effects: [{ type: 'add_loyalty_points', params: { amount: 50 } }],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      campaignRepository.findActiveCampaigns.mockResolvedValue([mockCampaign as any]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'purchase',
        userId: 'user-1',
        properties: { amount: 50, category: 'premium' },
        timestamp: Date.now(),
      });

      expect(result).toHaveLength(0);
    });

    it('should filter by event type', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        projectId: 'project-1',
        name: 'Test Campaign',
        active: true,
        priority: 1,
        schedule: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            campaignId: 'campaign-1',
            projectId: 'project-1',
            name: 'Purchase Only Rule',
            description: null,
            active: true,
            priority: 1,
            eventTypes: ['purchase'],
            conditions: {
              logic: 'and',
              conditions: [],
            },
            effects: [{ type: 'add_loyalty_points', params: { amount: 10 } }],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      campaignRepository.findActiveCampaigns.mockResolvedValue([mockCampaign as any]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'page_view', // Different event type
        userId: 'user-1',
        properties: {},
        timestamp: Date.now(),
      });

      expect(result).toHaveLength(0);
    });

    it('should skip inactive rules', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        projectId: 'project-1',
        name: 'Test Campaign',
        active: true,
        priority: 1,
        schedule: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        rules: [
          {
            id: 'rule-1',
            campaignId: 'campaign-1',
            projectId: 'project-1',
            name: 'Inactive Rule',
            description: null,
            active: false, // Inactive
            priority: 1,
            eventTypes: ['purchase'],
            conditions: {
              logic: 'and',
              conditions: [],
            },
            effects: [{ type: 'add_loyalty_points', params: { amount: 10 } }],
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      campaignRepository.findActiveCampaigns.mockResolvedValue([mockCampaign as any]);

      const result = await service.evaluate({
        eventId: '123',
        projectId: 'project-1',
        event: 'purchase',
        userId: 'user-1',
        properties: {},
        timestamp: Date.now(),
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific project', () => {
      expect(() => service.clearCache('project-1')).not.toThrow();
    });
  });

  describe('clearAllCaches', () => {
    it('should clear all caches', () => {
      expect(() => service.clearAllCaches()).not.toThrow();
    });
  });
});
