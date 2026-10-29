import { Global, Module } from '@nestjs/common';
import { CareEventsService } from './care-events.service';

// Global so every feature module can announce changes without importing it.
@Global()
@Module({
  providers: [CareEventsService],
  exports: [CareEventsService],
})
export class EventsModule {}
