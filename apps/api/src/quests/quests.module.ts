import { Module } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { QuestsController, CustomerQuestsController } from './quests.controller';
import { QuestsService } from './quests.service';

@Module({
  imports: [AuthModule],
  controllers: [QuestsController, CustomerQuestsController],
  providers: [QuestsService],
  exports: [QuestsService],
})
export class QuestsModule {}
