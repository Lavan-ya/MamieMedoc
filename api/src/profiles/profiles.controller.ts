import { Body, Controller, Get, Post } from '@nestjs/common';
import type { Patient } from '@prisma/client';
import { CurrentPatient } from '../patient/current-patient.decorator';
import { ProfilesService } from './profiles.service';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('profiles')
  list(@CurrentPatient() patient: Patient) {
    return this.profilesService.list(patient);
  }

  @Post('family')
  addFamilyMember(@CurrentPatient() patient: Patient, @Body() body: unknown) {
    return this.profilesService.addFamilyMember(patient, body);
  }
}
