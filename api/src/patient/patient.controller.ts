import { Controller, Get } from '@nestjs/common';
import type { Patient } from '@prisma/client';
import { CurrentPatient } from './current-patient.decorator';

@Controller('patients')
export class PatientController {
  @Get('current')
  getCurrent(@CurrentPatient() patient: Patient) {
    return patient;
  }
}
