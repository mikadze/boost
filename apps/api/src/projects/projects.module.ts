import { Module } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { ProjectsController, ApiKeysController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, ApiKeysController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
