import { PrescriptionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class ListPrescriptionsQuery {
  @Type(() => Number)
  @IsInt()
  patientId: number;

  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;
}

export class ScanPrescriptionBody {
  // Sent as a multipart form field, so it arrives as a string.
  @Type(() => Number)
  @IsInt()
  patientId: number;
}
