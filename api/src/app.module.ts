import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CareCircleModule } from './care-circle/care-circle.module';
import { DosesModule } from './doses/doses.module';
import { EventsModule } from './events/events.module';
import { MedicationsModule } from './medications/medications.module';
import { PrismaModule } from './prisma/prisma.module';
import { PushModule } from './push/push.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    PrescriptionsModule,
    CareCircleModule,
    MedicationsModule,
    DosesModule,
    PushModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
