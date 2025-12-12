import { Module } from '@nestjs/common';
import { DatabaseModule } from '@boost/database';
import { AuthModule } from '@boost/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionEffectExecutorService } from './session-effect-executor.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionEffectExecutorService],
  exports: [SessionsService],
})
export class SessionsModule {}
