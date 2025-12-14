import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { CampaignsController } from './campaigns.controller';
import { DashboardCampaignsController } from './dashboard-campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [AuthModule, forwardRef(() => ProjectsModule)],
  controllers: [CampaignsController, DashboardCampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
