import { Module } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { LoyaltyController, CustomerLoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';

@Module({
  imports: [AuthModule],
  controllers: [LoyaltyController, CustomerLoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
