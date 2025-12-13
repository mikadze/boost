import { Module } from '@nestjs/common';
import { AuthModule } from '@boost/common';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';

@Module({
  imports: [AuthModule],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}
