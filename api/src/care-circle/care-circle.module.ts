import { Module } from '@nestjs/common';
import { CareCircleController } from './care-circle.controller';
import { CareCircleService } from './care-circle.service';

@Module({
  controllers: [CareCircleController],
  providers: [CareCircleService],
  // Used by the push reminder scheduler
  exports: [CareCircleService],
})
export class CareCircleModule {}
