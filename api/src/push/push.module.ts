import { Module } from '@nestjs/common';
import { CareCircleModule } from '../care-circle/care-circle.module';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { ReminderSchedulerService } from './reminder-scheduler.service';

@Module({
  imports: [CareCircleModule],
  controllers: [PushController],
  providers: [PushService, ReminderSchedulerService],
})
export class PushModule {}
