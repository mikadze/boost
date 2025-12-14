import { Module } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { RewardsController, CustomerRewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

@Module({
  imports: [AuthModule],
  controllers: [RewardsController, CustomerRewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
