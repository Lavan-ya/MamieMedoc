import { Module } from '@nestjs/common';
import { CurrentPatientPipe } from './current-patient.decorator';
import { PatientController } from './patient.controller';

@Module({
  controllers: [PatientController],
  providers: [CurrentPatientPipe],
})
export class PatientModule {}
