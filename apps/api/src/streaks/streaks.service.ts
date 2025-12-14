import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import {
  StreakRuleRepository,
  UserStreakRepository,
  StreakHistoryRepository,
  EndUserRepository,
  StreakRule,
  UserStreak,
  UserStreakWithRule,
} from '@boost/database';
import { CreateStreakRuleDto, UpdateStreakRuleDto } from './dto/streak.dto';

export interface StreakWithProgress {
  id: string;
  name: string;
  description: string | null;
  eventType: string;
  frequency: string;
  currentCount: number;
  maxStreak: number;
  status: string;
  lastActivityDate: string | null;
  freezeInventory: number;
  freezeUsedToday: boolean;
  nextMilestone: {
    day: number;
    rewardXp: number;
    badgeId?: string;
  } | null;
  milestones: Array<{
    day: number;
    rewardXp: number;
    badgeId?: string;
    reached: boolean;
  }>;
}

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  constructor(
    private readonly streakRuleRepository: StreakRuleRepository,
    private readonly userStreakRepository: UserStreakRepository,
    private readonly streakHistoryRepository: StreakHistoryRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  // ============================================
  // Streak Rule CRUD Operations (Admin)
  // ============================================

  async createStreakRule(projectId: string, dto: CreateStreakRuleDto): Promise<StreakRule> {
    this.logger.log(`Creating streak rule: ${dto.name} for project: ${projectId}`);

    const rule = await this.streakRuleRepository.create({
      projectId,
      name: dto.name,
      description: dto.description,
      eventType: dto.eventType,
      frequency: dto.frequency ?? 'daily',
      milestones: dto.milestones ?? [],
      defaultFreezeCount: dto.defaultFreezeCount ?? 0,
      active: dto.active ?? true,
      timezoneOffsetMinutes: dto.timezoneOffsetMinutes ?? 0,
      metadata: dto.metadata,
    });

    return rule;
  }

  async listStreakRules(projectId: string): Promise<StreakRule[]> {
    return this.streakRuleRepository.findByProjectId(projectId);
  }

  async listActiveStreakRules(projectId: string): Promise<StreakRule[]> {
    return this.streakRuleRepository.findActiveByProjectId(projectId);
  }

  async getStreakRule(projectId: string, ruleId: string): Promise<StreakRule> {
    const rule = await this.streakRuleRepository.findById(ruleId);

    if (!rule) {
      throw new NotFoundException(`Streak rule ${ruleId} not found`);
    }

    if (rule.projectId !== projectId) {
      throw new NotFoundException(`Streak rule ${ruleId} not found`);
    }

    return rule;
  }

  async updateStreakRule(
    projectId: string,
    ruleId: string,
    dto: UpdateStreakRuleDto,
  ): Promise<StreakRule> {
    const rule = await this.streakRuleRepository.findById(ruleId);

    if (!rule) {
      throw new NotFoundException(`Streak rule ${ruleId} not found`);
    }

    if (rule.projectId !== projectId) {
      throw new NotFoundException(`Streak rule ${ruleId} not found`);
    }

    await this.streakRuleRepository.update(ruleId, dto);

    const updated = await this.streakRuleRepository.findById(ruleId);
    if (!updated) {
      throw new Error('Failed to update streak rule');
    }

    this.logger.log(`Updated streak rule: ${ruleId}`);
    return updated;
  }

  async deleteStreakRule(projectId: string, ruleId: string): Promise<void> {
    const rule = await this.streakRuleRepository.findById(ruleId);

    if (!rule) {
      throw new NotFoundException(`Streak rule ${ruleId} not found`);
    }

    if (rule.projectId !== projectId) {
      throw new NotFoundException(`Streak rule ${ruleId} not found`);
    }

    await this.streakRuleRepository.delete(ruleId);
    this.logger.log(`Deleted streak rule: ${ruleId}`);
  }

  // ============================================
  // SDK/Customer Methods (StreakFlame component)
  // ============================================

  /**
   * Get user's active streaks with progress
   * Used by useStreaks() hook and <StreakFlame/> component
   */
  async getUserStreaks(projectId: string, userId: string): Promise<{
    streaks: StreakWithProgress[];
    stats: {
      totalActive: number;
      longestCurrent: number;
      longestEver: number;
    };
  }> {
    // Find end user
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);

    if (!endUser) {
      // No user found - return empty streaks but list available rules
      const rules = await this.streakRuleRepository.findActiveByProjectId(projectId);
      return {
        streaks: rules.map(rule => this.formatEmptyStreak(rule)),
        stats: {
          totalActive: 0,
          longestCurrent: 0,
          longestEver: 0,
        },
      };
    }

    // Get user's streaks with rule details
    const userStreaks = await this.userStreakRepository.findByEndUserIdWithRules(endUser.id);

    // Get all active rules to include rules user hasn't started yet
    const allRules = await this.streakRuleRepository.findActiveByProjectId(projectId);
    const userStreakRuleIds = new Set(userStreaks.map(s => s.streakRuleId));

    // Build response combining existing streaks and available rules
    const streaks: StreakWithProgress[] = [];

    // Add existing user streaks
    for (const userStreak of userStreaks) {
      if (userStreak.streakRule) {
        streaks.push(this.formatStreakWithProgress(userStreak, userStreak.streakRule));
      }
    }

    // Add rules user hasn't started yet
    for (const rule of allRules) {
      if (!userStreakRuleIds.has(rule.id)) {
        streaks.push(this.formatEmptyStreak(rule));
      }
    }

    // Calculate stats
    const activeStreaks = userStreaks.filter(s => s.status === 'active' || s.status === 'frozen');
    const stats = {
      totalActive: activeStreaks.length,
      longestCurrent: Math.max(0, ...userStreaks.map(s => s.currentCount)),
      longestEver: Math.max(0, ...userStreaks.map(s => s.maxStreak)),
    };

    return { streaks, stats };
  }

  /**
   * Use a freeze token to protect a streak
   */
  async useFreeze(
    projectId: string,
    userId: string,
    ruleId: string,
  ): Promise<{ success: boolean; remainingFreezes: number; message: string }> {
    // Find end user
    const endUser = await this.endUserRepository.findByExternalId(projectId, userId);
    if (!endUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Find the streak rule
    const rule = await this.streakRuleRepository.findById(ruleId);
    if (!rule || rule.projectId !== projectId) {
      throw new NotFoundException(`Streak rule ${ruleId} not found`);
    }

    // Find user's streak for this rule
    const userStreak = await this.userStreakRepository.findByUserAndRule(endUser.id, ruleId);
    if (!userStreak) {
      throw new BadRequestException('User has no active streak for this rule');
    }

    // Check if already frozen today
    if (userStreak.freezeUsedToday) {
      return {
        success: false,
        remainingFreezes: userStreak.freezeInventory,
        message: 'Already used a freeze today',
      };
    }

    // Check if has freeze tokens
    if (userStreak.freezeInventory <= 0) {
      return {
        success: false,
        remainingFreezes: 0,
        message: 'No freeze tokens available',
      };
    }

    // Check if streak is at risk (hasn't logged today)
    if (userStreak.status !== 'at_risk' && userStreak.status !== 'active') {
      return {
        success: false,
        remainingFreezes: userStreak.freezeInventory,
        message: 'Streak is not at risk',
      };
    }

    // Use the freeze - this is handled by processActivity normally,
    // but we can also allow manual freeze usage
    await this.userStreakRepository.addFreezeTokens(userStreak.id, -1);

    // Record in history
    await this.streakHistoryRepository.recordFrozen({
      projectId,
      endUserId: endUser.id,
      streakRuleId: ruleId,
      userStreakId: userStreak.id,
      streakCount: userStreak.currentCount,
    });

    this.logger.log(`User ${userId} used freeze token for streak rule ${ruleId}`);

    return {
      success: true,
      remainingFreezes: userStreak.freezeInventory - 1,
      message: 'Freeze token used successfully',
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private formatStreakWithProgress(
    userStreak: UserStreak,
    rule: StreakRule,
  ): StreakWithProgress {
    const milestones = this.streakRuleRepository.getMilestones(rule);
    const nextMilestone = this.streakRuleRepository.getNextMilestone(rule, userStreak.currentCount);

    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      eventType: rule.eventType,
      frequency: rule.frequency,
      currentCount: userStreak.currentCount,
      maxStreak: userStreak.maxStreak,
      status: userStreak.status,
      lastActivityDate: userStreak.lastActivityDate?.toISOString() ?? null,
      freezeInventory: userStreak.freezeInventory,
      freezeUsedToday: userStreak.freezeUsedToday,
      nextMilestone: nextMilestone ? {
        day: nextMilestone.day,
        rewardXp: nextMilestone.rewardXp,
        badgeId: nextMilestone.badgeId,
      } : null,
      milestones: milestones.map(m => ({
        day: m.day,
        rewardXp: m.rewardXp,
        badgeId: m.badgeId,
        reached: userStreak.currentCount >= m.day || (userStreak.lastMilestoneDay ?? 0) >= m.day,
      })),
    };
  }

  private formatEmptyStreak(rule: StreakRule): StreakWithProgress {
    const milestones = this.streakRuleRepository.getMilestones(rule);
    const nextMilestone = milestones.length > 0 ? milestones[0] : null;

    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      eventType: rule.eventType,
      frequency: rule.frequency,
      currentCount: 0,
      maxStreak: 0,
      status: 'inactive',
      lastActivityDate: null,
      freezeInventory: rule.defaultFreezeCount,
      freezeUsedToday: false,
      nextMilestone: nextMilestone ? {
        day: nextMilestone.day,
        rewardXp: nextMilestone.rewardXp,
        badgeId: nextMilestone.badgeId,
      } : null,
      milestones: milestones.map(m => ({
        day: m.day,
        rewardXp: m.rewardXp,
        badgeId: m.badgeId,
        reached: false,
      })),
    };
  }
}
