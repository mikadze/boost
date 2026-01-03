import { Module } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { AffiliatesController, CustomerAffiliateController } from './affiliates.controller';
import { AffiliatesService } from './affiliates.service';

@Module({
  imports: [AuthModule],
  controllers: [AffiliatesController, CustomerAffiliateController],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}
