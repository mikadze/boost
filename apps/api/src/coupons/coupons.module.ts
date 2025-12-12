import { Module } from '@nestjs/common';
import { DatabaseModule } from '@boost/database';
import { AuthModule } from '@boost/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
