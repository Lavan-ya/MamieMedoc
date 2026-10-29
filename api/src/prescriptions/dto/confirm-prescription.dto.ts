import { TimeOfDay } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class ConfirmedSlotDto {
  @IsEnum(TimeOfDay)
  timeOfDay: TimeOfDay;

  // Defaults to DEFAULT_SLOT_TIMES[timeOfDay] when omitted.
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:MM' })
  time?: string;
}

export class ConfirmedMedicationDto {
  @IsInt()
  id: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'choose at least one intake time' })
  @ArrayUnique((slot: ConfirmedSlotDto) => slot.timeOfDay)
  @ValidateNested({ each: true })
  @Type(() => ConfirmedSlotDto)
  schedule: ConfirmedSlotDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stockDoses?: number;

  @IsOptional()
  @IsBoolean()
  lowStockAlert?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  lowStockThresholdDays?: number;
}

export class ConfirmPrescriptionDto {
  // Draft medications left out of this list are discarded.
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfirmedMedicationDto)
  medications: ConfirmedMedicationDto[];
}
