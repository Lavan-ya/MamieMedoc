import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CareCircleModule } from './care-circle/care-circle.module';
import { DosesModule } from './doses/doses.module';
import { EventsModule } from './events/events.module';
import { MedicationsModule } from './medications/medications.module';
import { PatientModule } from './patient/patient.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PushModule } from './push/push.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    AuthModule,
    PatientModule,
    ProfilesModule,
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
