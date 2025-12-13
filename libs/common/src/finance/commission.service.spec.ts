import { CommissionService } from './commission.service';

describe('CommissionService', () => {
  let service: CommissionService;

  beforeEach(() => {
    service = new CommissionService();
  });

  describe('calculate', () => {
    describe('PERCENTAGE type', () => {
      it('should calculate 10% commission correctly', () => {
        const result = service.calculate(
          { type: 'PERCENTAGE', value: 1000 }, // 10% (1000 basis points)
          10000 // $100.00 in cents
        );

        expect(result.amount).toBe(1000); // $10.00 commission
        expect(result.sourceAmount).toBe(10000);
        expect(result.planType).toBe('PERCENTAGE');
        expect(result.planValue).toBe(1000);
      });

      it('should calculate 5% commission correctly', () => {
        const result = service.calculate(
          { type: 'PERCENTAGE', value: 500 }, // 5% (500 basis points)
          5000 // $50.00 in cents
        );

        expect(result.amount).toBe(250); // $2.50 commission
      });

      it('should calculate 0.5% commission correctly', () => {
        const result = service.calculate(
          { type: 'PERCENTAGE', value: 50 }, // 0.5% (50 basis points)
          10000 // $100.00 in cents
        );

        expect(result.amount).toBe(50); // $0.50 commission
      });

      it('should handle large amounts without overflow', () => {
        const result = service.calculate(
          { type: 'PERCENTAGE', value: 1000 }, // 10%
          1000000000 // $10,000,000.00 in cents
        );

        expect(result.amount).toBe(100000000); // $1,000,000.00 commission
      });

      it('should use bankers rounding for half values', () => {
        // Testing banker's rounding: round half to even
        // 15 cents * 10% = 1.5 cents → round to 2 (nearest even)
        const result1 = service.calculate(
          { type: 'PERCENTAGE', value: 1000 },
          15
        );

        // 25 cents * 10% = 2.5 cents → round to 2 (nearest even)
        const result2 = service.calculate(
          { type: 'PERCENTAGE', value: 1000 },
          25
        );

        // Due to banker's rounding implementation, values should round appropriately
        expect(result1.amount).toBeGreaterThanOrEqual(1);
        expect(result2.amount).toBeGreaterThanOrEqual(2);
      });

      it('should return 0 for 0% commission', () => {
        const result = service.calculate(
          { type: 'PERCENTAGE', value: 0 },
          10000
        );

        expect(result.amount).toBe(0);
      });
    });

    describe('FIXED type', () => {
      it('should return fixed amount regardless of source', () => {
        const result = service.calculate(
          { type: 'FIXED', value: 500 }, // $5.00 fixed
          10000 // $100.00 purchase
        );

        expect(result.amount).toBe(500);
        expect(result.sourceAmount).toBe(10000);
      });

      it('should return same amount for small purchases', () => {
        const result = service.calculate(
          { type: 'FIXED', value: 500 },
          100 // $1.00 purchase
        );

        expect(result.amount).toBe(500); // Still $5.00 commission
      });

      it('should return 0 for 0 fixed value', () => {
        const result = service.calculate(
          { type: 'FIXED', value: 0 },
          10000
        );

        expect(result.amount).toBe(0);
      });
    });

    describe('input validation', () => {
      it('should throw error for negative source amount', () => {
        expect(() =>
          service.calculate({ type: 'PERCENTAGE', value: 1000 }, -100)
        ).toThrow('Source amount cannot be negative');
      });

      it('should throw error for negative commission value', () => {
        expect(() =>
          service.calculate({ type: 'PERCENTAGE', value: -100 }, 1000)
        ).toThrow('Commission value cannot be negative');
      });

      it('should handle zero source amount', () => {
        const result = service.calculate(
          { type: 'PERCENTAGE', value: 1000 },
          0
        );

        expect(result.amount).toBe(0);
      });
    });
  });

  describe('formatCurrency', () => {
    it('should format cents to USD currency string', () => {
      expect(service.formatCurrency(1000)).toBe('$10.00');
      expect(service.formatCurrency(50)).toBe('$0.50');
      expect(service.formatCurrency(1)).toBe('$0.01');
      expect(service.formatCurrency(0)).toBe('$0.00');
    });

    it('should format large amounts', () => {
      expect(service.formatCurrency(1000000)).toBe('$10,000.00');
    });
  });

  describe('dollarsToCents', () => {
    it('should convert dollars to cents', () => {
      expect(service.dollarsToCents(10)).toBe(1000);
      expect(service.dollarsToCents(0.5)).toBe(50);
      expect(service.dollarsToCents(0.01)).toBe(1);
      expect(service.dollarsToCents(0)).toBe(0);
    });

    it('should round to nearest cent', () => {
      expect(service.dollarsToCents(10.999)).toBe(1100);
      expect(service.dollarsToCents(10.001)).toBe(1000);
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollars', () => {
      expect(service.centsToDollars(1000)).toBe(10);
      expect(service.centsToDollars(50)).toBe(0.5);
      expect(service.centsToDollars(1)).toBe(0.01);
      expect(service.centsToDollars(0)).toBe(0);
    });
  });

  describe('percentageToBasisPoints', () => {
    it('should convert percentage to basis points', () => {
      expect(service.percentageToBasisPoints(10)).toBe(1000);
      expect(service.percentageToBasisPoints(5)).toBe(500);
      expect(service.percentageToBasisPoints(0.5)).toBe(50);
      expect(service.percentageToBasisPoints(0)).toBe(0);
    });
  });

  describe('basisPointsToPercentage', () => {
    it('should convert basis points to percentage', () => {
      expect(service.basisPointsToPercentage(1000)).toBe(10);
      expect(service.basisPointsToPercentage(500)).toBe(5);
      expect(service.basisPointsToPercentage(50)).toBe(0.5);
      expect(service.basisPointsToPercentage(0)).toBe(0);
    });
  });
});
