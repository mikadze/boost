import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CouponRepository, Coupon } from '@boost/database';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto';

export interface CouponValidationResponse {
  valid: boolean;
  error?: string;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
    estimatedDiscount?: number;
  };
}

@Injectable()
export class CouponsService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async create(projectId: string, dto: CreateCouponDto): Promise<Coupon> {
    // Check for duplicate code
    const existing = await this.couponRepository.findByCode(
      projectId,
      dto.code,
    );
    if (existing) {
      throw new ConflictException(`Coupon "${dto.code}" already exists`);
    }

    const { id } = await this.couponRepository.create({
      projectId,
      code: dto.code,
      description: dto.description,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minimumValue: dto.minimumValue,
      maximumDiscount: dto.maximumDiscount,
      maxUses: dto.maxUses,
      maxUsesPerUser: dto.maxUsesPerUser,
      active: dto.active,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      metadata: dto.metadata,
    });

    const coupon = await this.couponRepository.findById(id);
    if (!coupon) {
      throw new Error('Failed to create coupon');
    }

    return coupon;
  }

  async list(projectId: string): Promise<Coupon[]> {
    return this.couponRepository.findByProjectId(projectId);
  }

  async findOne(projectId: string, id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (coupon.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return coupon;
  }

  async validate(
    projectId: string,
    code: string,
    userId: string,
    cartTotal: number,
  ): Promise<CouponValidationResponse> {
    const validation = await this.couponRepository.validateCoupon(
      projectId,
      code,
      userId,
      cartTotal,
    );

    if (!validation.valid || !validation.coupon) {
      return {
        valid: false,
        error: validation.error,
      };
    }

    const estimatedDiscount = await this.couponRepository.calculateDiscount(
      validation.coupon,
      cartTotal,
    );

    return {
      valid: true,
      coupon: {
        code: validation.coupon.code,
        discountType: validation.coupon.discountType,
        discountValue: validation.coupon.discountValue,
        estimatedDiscount,
      },
    };
  }

  async update(
    projectId: string,
    id: string,
    dto: UpdateCouponDto,
  ): Promise<Coupon> {
    const coupon = await this.findOne(projectId, id);

    await this.couponRepository.update(coupon.id, {
      description: dto.description,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      minimumValue: dto.minimumValue,
      maximumDiscount: dto.maximumDiscount,
      maxUses: dto.maxUses,
      maxUsesPerUser: dto.maxUsesPerUser,
      active: dto.active,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      metadata: dto.metadata,
    });

    const updated = await this.couponRepository.findById(id);
    if (!updated) {
      throw new Error('Failed to update coupon');
    }

    return updated;
  }

  async delete(projectId: string, id: string): Promise<void> {
    const coupon = await this.findOne(projectId, id);
    await this.couponRepository.delete(coupon.id);
  }
}
