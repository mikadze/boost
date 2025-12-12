import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponRepository } from '@boost/database';

describe('CouponsService', () => {
  let service: CouponsService;
  let couponRepository: jest.Mocked<CouponRepository>;

  const mockCoupon = {
    id: 'coupon-1',
    projectId: 'project-1',
    code: 'SAVE20',
    description: '20% off',
    discountType: 'percentage' as const,
    discountValue: 20,
    minimumValue: 50,
    maximumDiscount: 100,
    maxUses: 1000,
    maxUsesPerUser: 1,
    usageCount: 0,
    active: true,
    validFrom: null,
    validUntil: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: CouponRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            findByProjectId: jest.fn(),
            validateCoupon: jest.fn(),
            calculateDiscount: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    couponRepository = module.get(CouponRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new coupon', async () => {
      couponRepository.findByCode.mockResolvedValue(null);
      couponRepository.create.mockResolvedValue({ id: 'coupon-1' });
      couponRepository.findById.mockResolvedValue(mockCoupon);

      const result = await service.create('project-1', {
        code: 'SAVE20',
        discountType: 'percentage',
        discountValue: 20,
        description: '20% off',
        minimumValue: 50,
        maximumDiscount: 100,
      });

      expect(result).toEqual(mockCoupon);
      expect(couponRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-1',
          code: 'SAVE20',
          discountType: 'percentage',
          discountValue: 20,
        }),
      );
    });

    it('should throw ConflictException if coupon code exists', async () => {
      couponRepository.findByCode.mockResolvedValue(mockCoupon);

      await expect(
        service.create('project-1', {
          code: 'SAVE20',
          discountType: 'percentage',
          discountValue: 20,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return coupon if found', async () => {
      couponRepository.findById.mockResolvedValue(mockCoupon);

      const result = await service.findOne('project-1', 'coupon-1');

      expect(result).toEqual(mockCoupon);
    });

    it('should throw NotFoundException if coupon not found', async () => {
      couponRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('project-1', 'coupon-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if coupon belongs to different project', async () => {
      couponRepository.findById.mockResolvedValue({
        ...mockCoupon,
        projectId: 'other-project',
      });

      await expect(service.findOne('project-1', 'coupon-1')).rejects.toThrow(
        'Access denied',
      );
    });
  });

  describe('validate', () => {
    it('should validate coupon successfully', async () => {
      couponRepository.validateCoupon.mockResolvedValue({
        valid: true,
        coupon: mockCoupon,
      });
      couponRepository.calculateDiscount.mockResolvedValue(20);

      const result = await service.validate('project-1', 'SAVE20', 'user-1', 100);

      expect(result.valid).toBe(true);
      expect(result.coupon?.code).toBe('SAVE20');
      expect(result.coupon?.estimatedDiscount).toBe(20);
    });

    it('should return invalid result for expired coupon', async () => {
      couponRepository.validateCoupon.mockResolvedValue({
        valid: false,
        error: 'Coupon has expired',
      });

      const result = await service.validate('project-1', 'EXPIRED', 'user-1', 100);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has expired');
    });

    it('should return invalid result for minimum not met', async () => {
      couponRepository.validateCoupon.mockResolvedValue({
        valid: false,
        error: 'Minimum purchase amount not met',
      });

      const result = await service.validate('project-1', 'SAVE20', 'user-1', 30);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Minimum purchase amount not met');
    });
  });

  describe('update', () => {
    it('should update coupon', async () => {
      const updatedCoupon = { ...mockCoupon, discountValue: 25 };
      couponRepository.findById.mockResolvedValueOnce(mockCoupon);
      couponRepository.update.mockResolvedValue(undefined);
      couponRepository.findById.mockResolvedValueOnce(updatedCoupon);

      const result = await service.update('project-1', 'coupon-1', {
        discountValue: 25,
      });

      expect(result.discountValue).toBe(25);
      expect(couponRepository.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete coupon', async () => {
      couponRepository.findById.mockResolvedValue(mockCoupon);
      couponRepository.delete.mockResolvedValue(undefined);

      await expect(
        service.delete('project-1', 'coupon-1'),
      ).resolves.toBeUndefined();
      expect(couponRepository.delete).toHaveBeenCalledWith('coupon-1');
    });
  });
});
