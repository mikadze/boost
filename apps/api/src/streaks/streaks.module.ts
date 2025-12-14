import { Module } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { StreaksController, CustomerStreaksController } from './streaks.controller';
import { StreaksService } from './streaks.service';

@Module({
  imports: [AuthModule],
  controllers: [StreaksController, CustomerStreaksController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
